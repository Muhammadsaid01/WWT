/* Opt-in: MONGO_JOIN_TEST_URI. Uses and drops only a uniquely named test database.
 * Run from backend root: node apps/wwt-api/test/incoming-travel-mate.integration.cjs
 */
require('ts-node/register');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { GUARDS_METADATA } = require('@nestjs/common/constants');
const { AuthGuard } = require('../src/components/auth/guards/auth.guard');
const {
  TravelMateJoinResolver,
} = require('../src/components/travel-mate-join/travel-mate-join.resolver');
const {
  TravelMateJoinService,
} = require('../src/components/travel-mate-join/travel-mate-join.service');
const JoinSchema = require('../src/schemas/community/TravelMateJoin.schema').default;

async function main() {
  assert(process.env.MONGO_JOIN_TEST_URI, 'Set MONGO_JOIN_TEST_URI explicitly');
  const dbName = `wwt_incoming_test_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
  const db = await mongoose
    .createConnection(process.env.MONGO_JOIN_TEST_URI, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    })
    .asPromise();
  try {
    const Join = db.model('TravelMateJoin', JoinSchema);
    const service = new TravelMateJoinService(Join, null, null, null);
    const resolver = new TravelMateJoinResolver(service);
    assert(
      Reflect.getMetadata(GUARDS_METADATA, resolver.getMyIncomingTravelMateJoinRequests).includes(
        AuthGuard,
      ),
    );
    const id = () => new mongoose.Types.ObjectId();
    const owner = id(),
      otherOwner = id(),
      stranger = id(),
      trip = id(),
      otherTrip = id();
    const requesters = [id(), id(), id(), id()];
    await db
      .collection('members')
      .insertMany(
        requesters.map((memberId, index) => ({ _id: memberId, memberNick: `Fixture ${index}` })),
      );
    await db.collection('travelMatePosts').insertMany([
      { _id: trip, memberId: owner, matePostTitle: 'Owner fixture' },
      { _id: otherTrip, memberId: otherOwner, matePostTitle: 'Other fixture' },
    ]);
    await Join.create(
      requesters.map((memberId, index) => ({
        travelMatePostId: index === 3 ? otherTrip : trip,
        memberId,
        joinStatus: index === 1 ? 'APPROVED' : 'PENDING',
        message: `Request ${index}`,
        createdAt: new Date(2026, 0, index + 1),
      })),
    );
    const query = (memberId, extra = {}) =>
      resolver.getMyIncomingTravelMateJoinRequests(
        { page: 1, limit: 10, sort: 'createdAt', direction: 1, ...extra },
        memberId,
      );
    const total = (result) => result.metaCounter[0]?.total ?? 0;
    const owned = await query(owner);
    assert.equal(total(owned), 3);
    assert(owned.list.every((item) => item.travelMatePostData.memberId.equals(owner)));
    assert(owned.list.every((item) => item.memberData._id.equals(item.memberId)));
    console.log('PASS owner requests and both member/post lookups');
    const participants = await resolver.getTravelMateParticipants({
      page: 1,
      limit: 10,
      search: { travelMatePostId: String(trip) },
    });
    assert.equal(total(participants), 1);
    assert.equal(participants.list[0].joinStatus, 'APPROVED');
    assert(participants.list[0].memberData._id.equals(participants.list[0].memberId));
    console.log('PASS approved participant member lookup uses TravelMateJoin.memberId');
    const other = await query(otherOwner);
    assert.equal(total(other), 1);
    assert(other.list.every((item) => !item.travelMatePostId.equals(trip)));
    assert.equal(
      total(
        await query(otherOwner, {
          search: { travelMatePostId: String(trip), memberId: String(owner) },
        }),
      ),
      0,
    );
    assert.equal(total(await query(stranger)), 0);
    console.log(
      'PASS owner isolation, foreign-post filter and client memberId cannot bypass ownership',
    );
    const pending = await query(owner, {
      search: { joinStatus: 'PENDING', travelMatePostId: String(trip) },
    });
    assert.equal(total(pending), 2);
    assert(pending.list.every((item) => item.joinStatus === 'PENDING'));
    console.log('PASS PENDING and post filters');
    const first = await query(owner, { limit: 1 });
    const second = await query(owner, { limit: 1, page: 2 });
    const last = await query(owner, { limit: 1, direction: -1 });
    assert.equal(total(first), 3);
    assert.equal(total(second), 3);
    assert.equal(first.list.length, 1);
    assert.equal(second.list.length, 1);
    assert(!first.list[0]._id.equals(second.list[0]._id));
    assert(first.list[0].createdAt < second.list[0].createdAt);
    assert(last.list[0].createdAt > second.list[0].createdAt);
    const emptyPage = await query(owner, { page: 4, limit: 1 });
    assert.equal(emptyPage.list.length, 0);
    assert.equal(total(emptyPage), 3);
    console.log('PASS pagination totals, page boundaries and sort directions');
  } finally {
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
