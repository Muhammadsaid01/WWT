/* Opt-in: MONGO_TRANSACTION_TEST_URI must point to a transaction-capable test server.
 * Uses a uniquely named disposable database; never writes to the URI's database.
 * Run from backend root: node apps/wwt-api/test/booking-transaction.integration.cjs
 */
require('ts-node/register');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { Logger } = require('@nestjs/common');
const { BookingService } = require('../src/components/booking/booking.service');
const { TravelerCreationService } = require('../src/components/traveler/traveler-creation.service');
const { CouponService } = require('../src/components/coupon/coupon.service');
const schema = (path) => require(`../src/schemas/${path}`).default;

async function main() {
  assert(process.env.MONGO_TRANSACTION_TEST_URI, 'Set MONGO_TRANSACTION_TEST_URI explicitly');
  const dbName = `wwt_tx_test_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
  const db = await mongoose.createConnection(process.env.MONGO_TRANSACTION_TEST_URI, { dbName, serverSelectionTimeoutMS: 10000, autoIndex: false }).asPromise();
  Logger.overrideLogger(false);
  try {
    const hello = await db.db.admin().command({ hello: 1 });
    assert(hello.setName || hello.msg === 'isdbgrid', 'Transactions require a replica set or mongos');
    const Booking = db.model('Booking', schema('bookings/Booking.schema'));
    const Member = db.model('Member', new mongoose.Schema({ memberDeletedAt: Date }));
    const Package = db.model('TravelPackage', schema('travel/Package.schema'));
    const Schedule = db.model('PackageSchedule', schema('travel/PackageSchedule.schema'));
    const Coupon = db.model('Coupon', schema('coupon/Coupon.schema'));
    const Traveler = db.model('Traveler', schema('bookings/Traveler.schema'));
    const Usage = db.model('CouponUsage', schema('coupon/CouponUsage.schema'));
    for (const model of [Booking, Member, Package, Schedule, Coupon, Usage, Traveler]) await model.init();
    // Existing schemas declare some indexes twice with conflicting options.
    // Reproduce the deployed uniqueness constraints without changing those schemas.
    await Booking.collection.createIndex({ bookingCode: 1 }, { unique: true });
    await Package.collection.createIndex({ packageSlug: 1 }, { unique: true });
    await Schedule.collection.createIndex({ packageId: 1, startDate: 1 }, { unique: true });
    await Coupon.collection.createIndex({ couponCode: 1 }, { unique: true });
    await Usage.collection.createIndex({ couponId: 1, memberId: 1, bookingId: 1 }, { unique: true });
    const coupons = new CouponService(Coupon, Usage);
    const notifications = { createNotification: async () => undefined };
    const points = { addMemberPoint: async () => undefined };
    const service = new BookingService(Booking, Member, Package, Schedule, {}, coupons, notifications, points, new TravelerCreationService(Traveler));

    const traveler = () => ({ firstName: 'Test', lastName: 'Traveler', dateOfBirth: '1990-01-01', gender: 'OTHER', nationality: 'Test', passportNumber: randomUUID(), passportExpireDate: '2030-01-01' });
    async function fixture(options = {}) {
      const member = await Member.create({});
      const pkg = await Package.create({ agentId: new mongoose.Types.ObjectId(), packageTitle: 'Transaction test', packageSlug: randomUUID(), packageDesc: 'Isolated test fixture', packageCategory: 'ADVENTURE', destinationCountry: 'Test', destinationCity: 'Test', packageDays: 1, packageNights: 0, packagePrice: 25, currency: 'USD', minPeople: options.min ?? 1, maxPeople: options.max ?? 4, packageImages: [], packageStatus: options.packageStatus ?? 'ACTIVE' });
      const schedule = await Schedule.create({ packageId: pkg._id, startDate: new Date(), endDate: new Date(), availableSeats: options.seats ?? 4, scheduleStatus: options.status ?? 'OPEN' });
      return { member, pkg, schedule, input: { packageId: String(pkg._id), scheduleId: String(schedule._id), adultCount: 1, childCount: 0, infantCount: 0, travelers: [traveler()], contactName: 'Test Member', contactPhone: '123' } };
    }
    async function unchanged(f, input, expected) {
      const beforeTravelers = await Traveler.countDocuments({});
      await assert.rejects(service.createBooking(f.member._id, input), expected);
      assert.equal(await Traveler.countDocuments({}), beforeTravelers);
      assert.equal(await Booking.countDocuments({ packageId: f.pkg._id }), 0);
      assert.equal((await Schedule.findById(f.schedule._id)).availableSeats, f.schedule.availableSeats);
    }
    async function couponFixture(extra = {}) {
      return Coupon.create({ couponCode: randomUUID(), couponTitle: 'Test', couponType: 'FIXED', couponValue: 5, minAmount: 0, usageLimit: 1, perUserLimit: 1, validFrom: new Date(Date.now() - 60000), validUntil: new Date(Date.now() + 60000), ...extra });
    }
    async function test(name, callback) { await callback(); console.log(`PASS ${name}`); }
    await test('valid booking and server-calculated totals', async () => {
      const f = await fixture(); const booking = await service.createBooking(f.member._id, { ...f.input, adultCount: 1, childCount: 1, infantCount: 1, travelers: [traveler(), traveler(), traveler()] });
      assert.equal(await Traveler.countDocuments({ bookingId: booking._id }), 3);
      assert.equal(booking.peopleCount, 3); assert.equal(booking.totalPrice, 75); assert.equal(booking.finalPrice, 75); assert.equal(booking.discountAmount, 0);
      assert.equal((await Schedule.findById(f.schedule._id)).availableSeats, 1);
      assert.match(booking.bookingCode, /^WWT-\d{8}-[A-F0-9]{6}$/);
    });
    for (const [name, options, change, expected] of [
      ['insufficient seats', { seats: 0 }, {}, /unavailable|seats/],
      ['below minimum', { min: 2 }, {}, /minimum/],
      ['above maximum', { max: 1 }, { adultCount: 2, travelers: [traveler(), traveler()] }, /maximum/],
      ['closed schedule', { status: 'CLOSED' }, {}, /unavailable/],
      ['inactive package', { packageStatus: 'HIDDEN' }, {}, /inactive/],
      ['negative counts', {}, { adultCount: -1 }, /nonnegative/],
      ['fractional counts', {}, { childCount: 0.5 }, /integers/],
      ['invalid coupon rollback', {}, { couponCode: 'DOES-NOT-EXIST' }, /Coupon/],
    ]) await test(name, async () => { const f = await fixture(options); await unchanged(f, { ...f.input, ...change }, expected); });
    await test('schedule belongs to another package', async () => {
      const f = await fixture(); const other = await fixture(); await unchanged(f, { ...f.input, scheduleId: String(other.schedule._id) }, /unavailable/);
      assert.equal((await Schedule.findById(other.schedule._id)).availableSeats, 4);
    });
    await test('failure creating booking rolls seats back', async () => {
      const f = await fixture(); const original = Booking.create;
      Booking.create = async () => { throw new Error('Injected booking failure'); };
      try { await unchanged(f, f.input); } finally { Booking.create = original; }
    });
    await test('coupon writes and booking roll back together', async () => {
      const f = await fixture(); const coupon = await couponFixture(); const original = coupons.increaseUsedCount.bind(coupons);
      coupons.increaseUsedCount = async (...args) => { await original(...args); throw new Error('Injected failure after coupon writes'); };
      try { await unchanged(f, { ...f.input, couponCode: coupon.couponCode }); } finally { coupons.increaseUsedCount = original; }
      assert.equal(await Usage.countDocuments({ couponId: coupon._id }), 0);
      assert.equal((await Coupon.findById(coupon._id)).usedCount, 0);
    });
    await test('concurrent last seat cannot overbook', async () => {
      const f = await fixture({ seats: 1 }); const results = await Promise.allSettled([service.createBooking(f.member._id, f.input), service.createBooking(f.member._id, f.input)]);
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal(await Booking.countDocuments({ packageId: f.pkg._id }), 1);
      assert.equal((await Schedule.findById(f.schedule._id)).availableSeats, 0);
    });
    await test('concurrent coupon global limit stays consistent', async () => {
      const a = await fixture(); const b = await fixture(); const coupon = await couponFixture();
      const results = await Promise.allSettled([service.createBooking(a.member._id, { ...a.input, couponCode: coupon.couponCode }), service.createBooking(b.member._id, { ...b.input, couponCode: coupon.couponCode })]);
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal((await Coupon.findById(coupon._id)).usedCount, 1);
      assert.equal(await Usage.countDocuments({ couponId: coupon._id }), 1);
    });
    await test('concurrent per-user coupon limit revalidates after conflict', async () => {
      const a = await fixture(); const b = await fixture(); const coupon = await couponFixture({ usageLimit: 0 });
      const results = await Promise.allSettled([service.createBooking(a.member._id, { ...a.input, couponCode: coupon.couponCode }), service.createBooking(a.member._id, { ...b.input, couponCode: coupon.couponCode })]);
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal(await Usage.countDocuments({ couponId: coupon._id }), 1);
      assert.equal((await Coupon.findById(coupon._id)).usedCount, 1);
    });
    await test('traveler count mismatch and missing travelers', async () => {
      const f = await fixture();
      await unchanged(f, { ...f.input, travelers: [] }, /count/);
      await unchanged(f, { ...f.input, travelers: undefined }, /count/);
    });
    await test('invalid second traveler rolls back booking seats and coupon writes', async () => {
      const f = await fixture(); const coupon = await couponFixture();
      await unchanged(f, { ...f.input, adultCount: 2, couponCode: coupon.couponCode, travelers: [traveler(), { ...traveler(), firstName: 'X' }] }, /Invalid traveler/);
      assert.equal(await Usage.countDocuments({ couponId: coupon._id }), 0);
      assert.equal((await Coupon.findById(coupon._id)).usedCount, 0);
    });
    await test('failure after first traveler insert rolls back everything', async () => {
      const f = await fixture(); const coupon = await couponFixture();
      const original = Traveler.create; let inserted = 0;
      Traveler.create = async function (...args) {
        const result = await original.apply(this, args);
        inserted += result.length;
        if (inserted === 1) throw new Error('Injected failure after traveler insert');
        return result;
      };
      try { await unchanged(f, { ...f.input, couponCode: coupon.couponCode }); }
      finally { Traveler.create = original; }
      assert.equal(inserted, 1);
      assert.equal(await Usage.countDocuments({ couponId: coupon._id }), 0);
      assert.equal((await Coupon.findById(coupon._id)).usedCount, 0);
    });
    await test('duplicate passport in booking rolls back travelers', async () => {
      const f = await fixture(); const first = traveler();
      await unchanged(f, { ...f.input, adultCount: 2, travelers: [first, { ...traveler(), passportNumber: first.passportNumber }] }, /passport already/);
    });
    await test('post-commit side-effect failure does not report booking failure', async () => {
      const f = await fixture(); notifications.createNotification = async () => { throw new Error('Notification offline'); };
      points.addMemberPoint = async () => { throw new Error('Points offline'); };
      const booking = await service.createBooking(f.member._id, f.input); assert(await Booking.findById(booking._id));
    });
  } finally {
    assert.equal(db.name, dbName);
    try { await db.dropDatabase(); } finally { await db.close(); }
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
