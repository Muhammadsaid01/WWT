/* Opt-in: MONGO_TRANSACTION_TEST_URI must point to a transaction-capable test server.
 * Uses and drops only a uniquely named disposable database.
 * Run from backend root: node apps/wwt-api/test/travel-package-lifecycle.integration.cjs
 */
require('ts-node/register');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { Logger } = require('@nestjs/common');
const { AgentService } = require('../src/components/agent/agent.service');
const { TravelPackageService } = require('../src/components/travel-package/travel-package.service');

const schema = (path) => require(`../src/schemas/${path}`).default;

async function main() {
  assert(process.env.MONGO_TRANSACTION_TEST_URI, 'Set MONGO_TRANSACTION_TEST_URI explicitly');

  const dbName = `wwt_package_lifecycle_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
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

    const Agent = db.model('Agent', schema('accounts/Agent.schema'));
    const Member = db.model('Member', new mongoose.Schema({}));
    const Package = db.model('TravelPackage', schema('travel/Package.schema'));
    const Schedule = db.model('PackageSchedule', schema('travel/PackageSchedule.schema'));
    const Itinerary = db.model('Itinerary', schema('travel/Itinerary.schema'));
    const Include = db.model('PackageInclude', schema('travel/PackageInclude.schema'));
    const Exclude = db.model('PackageExclude', schema('travel/PackageExclude.schema'));
    const Tag = db.model('PackageTag', schema('travel/PackageTag.schema'));
    const Policy = db.model('PackagePolicy', schema('travel/PackagePolicy.schema'));

    for (const model of [Agent, Member, Package, Schedule, Itinerary, Include, Exclude, Tag, Policy]) {
      await model.createCollection();
    }

    const agentService = new AgentService(Agent, Member, {}, {});
    const service = new TravelPackageService(
      Package,
      Schedule,
      Itinerary,
      Include,
      Exclude,
      Tag,
      Policy,
      agentService,
      {},
      {},
      {},
      {},
    );

    const objectId = () => new mongoose.Types.ObjectId();
    const createAgent = async (agentPackageCount) => {
      const suffix = randomUUID();
      return Agent.create({
        memberId: objectId(),
        companyName: `Lifecycle Agency ${suffix}`,
        businessNumber: `BUS-${suffix}`,
        licenseNumber: `LIC-${suffix}`,
        agentPackageCount,
      });
    };
    const createPackage = async (agent, status = 'ACTIVE', extra = {}) =>
      Package.create({
        agentId: agent._id,
        packageTitle: 'Lifecycle package',
        packageSlug: randomUUID(),
        packageDesc: 'Package used for lifecycle regression coverage.',
        packageCategory: 'ADVENTURE',
        destinationCountry: 'Test Country',
        destinationCity: 'Test City',
        packageDays: 3,
        packageNights: 2,
        packagePrice: 100,
        currency: 'USD',
        maxPeople: 4,
        packageImages: [],
        packageStatus: status,
        ...extra,
      });
    const test = async (name, callback) => {
      await callback();
      console.log(`PASS ${name}`);
    };

    await test('unrelated and same-status ACTIVE updates preserve lifecycle fields', async () => {
      const agent = await createAgent(1);
      const target = await createPackage(agent);

      const updated = await service.updateTravelPackageByAdmin({
        _id: target._id,
        packageStatus: 'ACTIVE',
        packageTitle: 'Updated lifecycle package',
      });

      assert.equal(updated.packageTitle, 'Updated lifecycle package');
      assert.equal(updated.packageDesc, target.packageDesc);
      assert.equal(updated.soldAt, undefined);
      assert.equal(updated.deletedAt, undefined);
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 1);
    });

    await test('ACTIVE to SOLD sets soldAt once and decrements the counter once', async () => {
      const agent = await createAgent(1);
      const target = await createPackage(agent);
      const sold = await service.updateTravelPackageByAdmin({
        _id: target._id,
        packageStatus: 'SOLD',
      });
      const soldAt = sold.soldAt.getTime();

      assert.equal(sold.packageStatus, 'SOLD');
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
      await assert.rejects(
        service.updateTravelPackageByAdmin({ _id: target._id, packageStatus: 'SOLD' }),
        /Only ACTIVE packages/,
      );
      assert.equal((await Package.findById(target._id)).soldAt.getTime(), soldAt);
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
    });

    await test('status update rolls back when its counter decrement cannot be applied', async () => {
      const agent = await createAgent(0);
      const target = await createPackage(agent);

      await assert.rejects(
        service.updateTravelPackageByAdmin({ _id: target._id, packageStatus: 'SOLD' }),
      );

      const unchanged = await Package.findById(target._id);
      assert.equal(unchanged.packageStatus, 'ACTIVE');
      assert.equal(unchanged.soldAt, undefined);
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
    });

    await test('ACTIVE to DELETED sets deletedAt and terminal hard-delete does not decrement twice', async () => {
      const agent = await createAgent(1);
      const target = await createPackage(agent);
      const deletedStatus = await service.updateTravelPackageByAdmin({
        _id: target._id,
        packageStatus: 'DELETED',
      });

      assert(deletedStatus.deletedAt instanceof Date);
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
      await service.deleteTravelPackageByAdmin(target._id);
      assert.equal(await Package.countDocuments({ _id: target._id }), 0);
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
    });

    await test('HIDDEN remains counted until hard deletion', async () => {
      const agent = await createAgent(1);
      const target = await createPackage(agent);
      const hidden = await service.updateTravelPackageByAdmin({
        _id: target._id,
        packageStatus: 'HIDDEN',
      });

      assert.equal(hidden.packageStatus, 'HIDDEN');
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 1);
      await service.deleteTravelPackageByAdmin(target._id);
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
    });

    await test('hard deletion removes package children and decrements exactly once', async () => {
      const agent = await createAgent(2);
      const target = await createPackage(agent);
      const unaffected = await createPackage(agent, 'ACTIVE', { packageTitle: 'Unaffected package' });
      const startDate = new Date('2030-01-01T00:00:00.000Z');
      const endDate = new Date('2030-01-03T00:00:00.000Z');

      await Schedule.create({
        packageId: target._id,
        startDate,
        endDate,
        availableSeats: 4,
      });
      await Itinerary.create({
        packageId: target._id,
        dayNumber: 1,
        title: 'Day one',
        description: 'Test itinerary',
      });
      await Include.create({ packageId: target._id, content: 'Included item' });
      await Exclude.create({ packageId: target._id, title: 'Excluded item' });
      await Tag.create({ packageId: target._id, tagName: 'lifecycle' });
      await Policy.create({
        packageId: target._id,
        cancelPolicy: 'Cancellation policy',
        refundPolicy: 'Refund policy',
      });

      await service.deleteTravelPackageByAdmin(target._id);

      assert.equal(await Package.countDocuments({ _id: target._id }), 0);
      assert.equal(await Schedule.countDocuments({ packageId: target._id }), 0);
      assert.equal(await Itinerary.countDocuments({ packageId: target._id }), 0);
      assert.equal(await Include.countDocuments({ packageId: target._id }), 0);
      assert.equal(await Exclude.countDocuments({ packageId: target._id }), 0);
      assert.equal(await Tag.countDocuments({ packageId: target._id }), 0);
      assert.equal(await Policy.countDocuments({ packageId: target._id }), 0);
      assert(await Package.exists({ _id: unaffected._id, agentId: agent._id }));
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 1);
    });

    await test('concurrent hard delete has one winner and one counter decrement', async () => {
      const agent = await createAgent(1);
      const target = await createPackage(agent);
      const results = await Promise.allSettled([
        service.deleteTravelPackageByAdmin(target._id),
        service.deleteTravelPackageByAdmin(target._id),
      ]);

      assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
      assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
      assert.equal(await Package.countDocuments({ _id: target._id }), 0);
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
    });

    await test('counter failure rolls package and child deletion back without going negative', async () => {
      const agent = await createAgent(0);
      const target = await createPackage(agent);
      await Include.create({ packageId: target._id, content: 'Rollback sentinel' });

      await assert.rejects(service.deleteTravelPackageByAdmin(target._id));

      assert(await Package.exists({ _id: target._id }));
      assert(await Include.exists({ packageId: target._id }));
      assert.equal((await Agent.findById(agent._id)).agentPackageCount, 0);
    });

    console.log('Travel Package lifecycle integration checks passed.');
  } finally {
    await db.dropDatabase();
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
