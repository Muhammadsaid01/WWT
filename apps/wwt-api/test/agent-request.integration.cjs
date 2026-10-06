/* Opt-in: MONGO_TRANSACTION_TEST_URI must point to a transaction-capable test server.
 * Uses and drops only a uniquely named disposable database.
 * Run from backend root: node apps/wwt-api/test/agent-request.integration.cjs
 */
require('ts-node/register');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { Logger } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { AgentRequestService } = require('../src/components/agent-request/agent-request.service');
const { AgentRequestResolver } = require('../src/components/agent-request/agent-request.resolver');
const { RolesGuard } = require('../src/components/auth/guards/roles.guard');
const { MemberService } = require('../src/components/member/member.service');
const AgentRequestSchema = require('../src/schemas/accounts/Agent-request.schema').default;
const AgentSchema = require('../src/schemas/accounts/Agent.schema').default;
const MemberSchema = require('../src/schemas/accounts/Member.schema').default;

async function main() {
  assert(process.env.MONGO_TRANSACTION_TEST_URI, 'Set MONGO_TRANSACTION_TEST_URI explicitly');

  const dbName = `wwt_ar_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
  const db = await mongoose
    .createConnection(process.env.MONGO_TRANSACTION_TEST_URI, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      autoIndex: false,
    })
    .asPromise();

  Logger.overrideLogger(false);

  try {
    const hello = await db.db.admin().command({ hello: 1 });
    assert(
      hello.setName || hello.msg === 'isdbgrid',
      'Transactions require a replica set or mongos',
    );

    const AgentRequest = db.model('AgentRequest', AgentRequestSchema);
    const Agent = db.model('Agent', AgentSchema);
    const Member = db.model('Member', MemberSchema);

    const pendingIndex = AgentRequestSchema.indexes().find(
      ([keys, options]) =>
        keys.memberId === 1 &&
        keys.requestStatus === 1 &&
        options.unique === true &&
        options.partialFilterExpression?.requestStatus === 'PENDING',
    );
    assert(pendingIndex, 'AgentRequest schema must declare the partial unique PENDING index');

    await AgentRequest.collection.createIndex(
      { memberId: 1, requestStatus: 1 },
      {
        unique: true,
        partialFilterExpression: { requestStatus: 'PENDING' },
        name: 'unique_pending_agent_request_per_member',
      },
    );
    await Agent.collection.createIndex({ memberId: 1 }, { unique: true });
    await Agent.collection.createIndex({ businessNumber: 1 }, { unique: true });
    await Agent.collection.createIndex({ licenseNumber: 1 }, { unique: true });

    const notificationState = { fail: false, calls: 0 };
    const notificationService = {
      createNotification: async () => {
        notificationState.calls += 1;
        if (notificationState.fail) throw new Error('Notifications offline');
        return {};
      },
    };
    const service = new AgentRequestService(AgentRequest, Agent, Member, notificationService);
    const authService = { createToken: async () => 'test-token' };
    const memberService = new MemberService(Member, Agent, null, authService, null, null, null);

    const objectId = () => new mongoose.Types.ObjectId();
    const adminId = objectId();
    const requestInput = (label = randomUUID()) => ({
      companyName: `Agency ${label}`,
      businessNumber: `BUS-${label}`,
      licenseNumber: `LIC-${label}`,
      agentDescription: `Agent description for ${label}`,
    });
    const createUser = async (extra = {}) =>
      Member.create({
        memberNick: `user-${randomUUID()}`,
        memberFullName: 'Agent Request Test User',
        memberType: 'USER',
        memberStatus: 'ACTIVE',
        ...extra,
      });
    const test = async (name, callback) => {
      await callback();
      console.log(`PASS ${name}`);
    };

    await test('USER creates one PENDING request and a concurrent duplicate is refused', async () => {
      const member = await createUser();
      const input = requestInput('pending-race');
      const results = await Promise.allSettled([
        service.createAgentRequest(member._id, input),
        service.createAgentRequest(member._id, input),
      ]);

      assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
      assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
      assert.equal(
        await AgentRequest.countDocuments({
          memberId: member._id,
          requestStatus: 'PENDING',
        }),
        1,
      );
      await assert.rejects(
        service.createAgentRequest(member._id, requestInput('second-pending')),
        /pending agent request/i,
      );
    });

    await test('rejected USER can apply again and rejection stores audit state', async () => {
      const member = await createUser();
      const request = await service.createAgentRequest(member._id, requestInput('reapply'));
      const rejected = await service.rejectAgentRequestByAdmin(request._id.toString(), adminId, {
        rejectReason: 'Please provide clearer business information.',
      });

      assert.equal(rejected.requestStatus, 'REJECTED');
      assert.equal(rejected.rejectReason, 'Please provide clearer business information.');
      assert(rejected.reviewedAt instanceof Date);
      assert.equal(rejected.reviewedBy.toString(), adminId.toString());

      const next = await service.createAgentRequest(member._id, requestInput('reapply-next'));
      assert.equal(next.requestStatus, 'PENDING');
      assert.equal(await AgentRequest.countDocuments({ memberId: member._id }), 2);
    });

    await test('approval creates one Agent, maps agentDesc, promotes Member, and approves request', async () => {
      const member = await createUser();
      const input = requestInput('approval');
      const request = await service.createAgentRequest(member._id, input);
      const approved = await service.approveAgentRequestByAdmin(request._id.toString(), adminId);

      const agent = await Agent.findOne({ memberId: member._id }).lean();
      const promoted = await Member.findById(member._id).lean();
      assert(agent);
      assert.equal(agent.agentDesc, input.agentDescription);
      assert.equal(promoted.memberType, 'AGENT');
      assert.equal(approved.requestStatus, 'APPROVED');
      assert.equal(approved.reviewedBy.toString(), adminId.toString());
      assert(approved.reviewedAt instanceof Date);
      assert.equal(await Agent.countDocuments({ memberId: member._id }), 1);
    });

    await test('concurrent approval has one winner and cannot create duplicate Agents', async () => {
      const member = await createUser();
      const request = await service.createAgentRequest(member._id, requestInput('double-approval'));
      const results = await Promise.allSettled([
        service.approveAgentRequestByAdmin(request._id.toString(), adminId),
        service.approveAgentRequestByAdmin(request._id.toString(), objectId()),
      ]);

      assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
      assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
      assert.equal(await Agent.countDocuments({ memberId: member._id }), 1);
      assert.equal((await Member.findById(member._id)).memberType, 'AGENT');
      assert.equal((await AgentRequest.findById(request._id)).requestStatus, 'APPROVED');
    });

    await test('non-admin JWT roles cannot pass approve or reject guards', async () => {
      const guard = new RolesGuard(new Reflector(), {
        verifyToken: async () => ({
          _id: objectId(),
          memberType: 'USER',
          memberNick: 'user',
        }),
      });
      const context = (handler) => ({
        contextType: 'graphql',
        getHandler: () => handler,
        getArgByIndex: () => ({
          req: {
            headers: { authorization: 'Bearer test-token' },
            body: {},
          },
        }),
      });

      await assert.rejects(
        guard.canActivate(context(AgentRequestResolver.prototype.approveAgentRequestByAdmin)),
        /specific roles/i,
      );
      await assert.rejects(
        guard.canActivate(context(AgentRequestResolver.prototype.rejectAgentRequestByAdmin)),
        /specific roles/i,
      );
      assert.deepEqual(
        Reflect.getMetadata('roles', AgentRequestResolver.prototype.approveAgentRequestByAdmin),
        ['ADMIN'],
      );
      assert.deepEqual(
        Reflect.getMetadata('roles', AgentRequestResolver.prototype.rejectAgentRequestByAdmin),
        ['ADMIN'],
      );
    });

    await test('self update cannot inject memberType and admin cannot directly promote USER', async () => {
      const member = await createUser();
      await memberService.updateMember(member._id, {
        _id: member._id.toString(),
        memberFullName: 'Updated Safe Name',
        memberType: 'AGENT',
      });

      const selfUpdated = await Member.findById(member._id).lean();
      assert.equal(selfUpdated.memberFullName, 'Updated Safe Name');
      assert.equal(selfUpdated.memberType, 'USER');

      await assert.rejects(
        memberService.updateMemberByAdmin({
          memberId: member._id.toString(),
          memberType: 'AGENT',
        }),
        /Agent Request approval/i,
      );
      assert.equal((await Member.findById(member._id)).memberType, 'USER');
      assert.equal(await Agent.countDocuments({ memberId: member._id }), 0);
    });

    await test('stale USER token state cannot submit after database role became AGENT', async () => {
      const member = await createUser();
      await Member.updateOne({ _id: member._id }, { $set: { memberType: 'AGENT' } });

      await assert.rejects(
        service.createAgentRequest(member._id, requestInput('stale-user')),
        /Only active USER members/i,
      );
      assert.equal(await AgentRequest.countDocuments({ memberId: member._id }), 0);
    });

    await test('blocked and deleted members cannot submit requests', async () => {
      for (const status of ['BLOCKED', 'DELETED']) {
        const member = await createUser({ memberStatus: status });
        await assert.rejects(
          service.createAgentRequest(member._id, requestInput(`status-${status}`)),
          /Only active USER members/i,
        );
      }
    });

    await test('businessNumber and licenseNumber conflicts fail safely and roll back approval claim', async () => {
      const existingMember = await createUser({ memberType: 'AGENT' });
      await Agent.create({
        memberId: existingMember._id,
        companyName: 'Existing Agency',
        businessNumber: 'BUS-CONFLICT',
        licenseNumber: 'LIC-CONFLICT',
      });

      for (const [field, value, expected] of [
        ['businessNumber', 'BUS-CONFLICT', /business number/i],
        ['licenseNumber', 'LIC-CONFLICT', /license number/i],
      ]) {
        const member = await createUser();
        const input = requestInput(`conflict-${field}`);
        input[field] = value;
        const request = await service.createAgentRequest(member._id, input);

        await assert.rejects(
          service.approveAgentRequestByAdmin(request._id.toString(), adminId),
          expected,
        );
        assert.equal((await AgentRequest.findById(request._id)).requestStatus, 'PENDING');
        assert.equal((await Member.findById(member._id)).memberType, 'USER');
        assert.equal(await Agent.countDocuments({ memberId: member._id }), 0);
      }
    });

    await test('transaction failure rolls back Agent, Member, and AgentRequest writes', async () => {
      const member = await createUser();
      const request = await service.createAgentRequest(member._id, requestInput('rollback'));
      const originalCreate = Agent.create;

      Agent.create = async function (...args) {
        await originalCreate.apply(this, args);
        throw new Error('Injected failure after Agent insert');
      };

      try {
        await assert.rejects(
          service.approveAgentRequestByAdmin(request._id.toString(), adminId),
          /Update failed/i,
        );
      } finally {
        Agent.create = originalCreate;
      }

      assert.equal(await Agent.countDocuments({ memberId: member._id }), 0);
      assert.equal((await Member.findById(member._id)).memberType, 'USER');
      assert.equal((await AgentRequest.findById(request._id)).requestStatus, 'PENDING');
    });

    await test('notification failures do not reverse or report committed approval/rejection', async () => {
      notificationState.fail = true;
      try {
        const approvedMember = await createUser();
        const approveRequest = await service.createAgentRequest(
          approvedMember._id,
          requestInput('notification-approval'),
        );
        const approved = await service.approveAgentRequestByAdmin(
          approveRequest._id.toString(),
          adminId,
        );
        assert.equal(approved.requestStatus, 'APPROVED');
        assert.equal((await Member.findById(approvedMember._id)).memberType, 'AGENT');
        assert(await Agent.findOne({ memberId: approvedMember._id }));

        const rejectedMember = await createUser();
        const rejectRequest = await service.createAgentRequest(
          rejectedMember._id,
          requestInput('notification-rejection'),
        );
        const rejected = await service.rejectAgentRequestByAdmin(
          rejectRequest._id.toString(),
          adminId,
          { rejectReason: 'Not eligible yet.' },
        );
        assert.equal(rejected.requestStatus, 'REJECTED');
      } finally {
        notificationState.fail = false;
      }
    });

    await test('getMyAgentRequest returns null and admin inquiry clamps, escapes, and allowlists', async () => {
      const noRequestMember = await createUser();
      assert.equal(await service.getMyAgentRequest(noRequestMember._id), null);

      const literalSearchMember = await createUser();
      await service.createAgentRequest(literalSearchMember._id, {
        ...requestInput('literal-search'),
        companyName: 'Literal [ Agency',
      });

      const escaped = await service.getAllAgentRequestsByAdmin({
        page: 1,
        limit: 1000,
        sort: '$where',
        direction: -1,
        search: { text: '[' },
      });
      assert.equal(escaped.metaCounter[0].total, 1);
      assert.equal(escaped.list[0].companyName, 'Literal [ Agency');
    });
  } finally {
    assert.equal(db.name, dbName);
    try {
      await db.dropDatabase();
    } finally {
      await db.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
