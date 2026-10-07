/*
 * One-time CouponUsage index migration.
 *
 * Audit the configured development database without changing it:
 *   npm run migrate:coupon-usage-indexes
 *
 * Apply to an explicitly selected database:
 *   MONGO_MIGRATION_URI='<mongodb-uri>' npm run migrate:coupon-usage-indexes -- --apply
 */
require('dotenv').config();
const mongoose = require('mongoose');

const COLLECTION_NAME = 'couponUsages';
const LEGACY_KEY = { couponId: 1, memberId: 1 };
const INTENDED_KEY = { couponId: 1, memberId: 1, bookingId: 1 };
const INTENDED_INDEX_NAME = 'couponId_1_memberId_1_bookingId_1';

function sameKey(actual, expected) {
  const actualEntries = Object.entries(actual ?? {});
  const expectedEntries = Object.entries(expected);

  return (
    actualEntries.length === expectedEntries.length &&
    expectedEntries.every(([key, value], index) => {
      const [actualKey, actualValue] = actualEntries[index] ?? [];
      return actualKey === key && actualValue === value;
    })
  );
}

function summarize(index) {
  return {
    name: index.name,
    key: index.key,
    unique: index.unique === true,
  };
}

async function inspect(collection) {
  const indexes = await collection.indexes();
  const legacyIndexes = indexes.filter(
    (index) => sameKey(index.key, LEGACY_KEY) && index.unique === true,
  );
  const intendedIndexes = indexes.filter((index) => sameKey(index.key, INTENDED_KEY));
  const duplicateTriples = await collection
    .aggregate([
      {
        $group: {
          _id: {
            couponId: '$couponId',
            memberId: '$memberId',
            bookingId: '$bookingId',
          },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 5 },
    ])
    .toArray();

  return { indexes, legacyIndexes, intendedIndexes, duplicateTriples };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const explicitMigrationUri = process.env.MONGO_MIGRATION_URI;
  const uri = explicitMigrationUri ?? process.env.MONGO_DEV;

  if (!uri) {
    throw new Error(
      'No database URI found. Set MONGO_MIGRATION_URI explicitly, or configure MONGO_DEV for audit mode.',
    );
  }
  if (apply && !explicitMigrationUri) {
    throw new Error('Apply mode requires MONGO_MIGRATION_URI to be set explicitly.');
  }

  const connection = await mongoose
    .createConnection(uri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 10000,
    })
    .asPromise();

  try {
    const collections = await connection.db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length !== 1) {
      throw new Error(`Expected collection ${COLLECTION_NAME} to exist exactly once.`);
    }

    const collection = connection.db.collection(COLLECTION_NAME);
    const state = await inspect(collection);

    console.log('Current CouponUsage indexes:', state.indexes.map(summarize));
    console.log('Duplicate intended-key records:', state.duplicateTriples.length);

    if (state.legacyIndexes.length > 1) {
      throw new Error(
        'Multiple legacy unique couponId/memberId indexes were found; review manually.',
      );
    }
    if (state.intendedIndexes.length > 1) {
      throw new Error('Multiple couponId/memberId/bookingId indexes were found; review manually.');
    }
    if (state.duplicateTriples.length > 0) {
      throw new Error(
        'Duplicate couponId/memberId/bookingId records exist; the intended unique index cannot be created safely.',
      );
    }

    const intendedIndex = state.intendedIndexes[0];
    if (intendedIndex && intendedIndex.unique !== true) {
      throw new Error(
        'An index with the intended key exists but is not unique; review it manually before migration.',
      );
    }

    if (!apply) {
      console.log(
        state.legacyIndexes.length === 1
          ? `Audit only: ${state.legacyIndexes[0].name} is the exact legacy index that would be removed.`
          : 'Audit only: no legacy unique couponId/memberId index remains.',
      );
      console.log(
        intendedIndex
          ? `Audit only: intended index ${intendedIndex.name} already exists.`
          : `Audit only: intended index ${INTENDED_INDEX_NAME} would be created before legacy removal.`,
      );
      return;
    }

    if (!intendedIndex) {
      await collection.createIndex(INTENDED_KEY, {
        name: INTENDED_INDEX_NAME,
        unique: true,
      });
      console.log(`Created intended index ${INTENDED_INDEX_NAME}.`);
    }

    if (state.legacyIndexes.length === 1) {
      const legacyIndex = state.legacyIndexes[0];
      const currentIndexes = await collection.indexes();
      const currentLegacyIndex = currentIndexes.find((index) => index.name === legacyIndex.name);

      if (
        !currentLegacyIndex ||
        !sameKey(currentLegacyIndex.key, LEGACY_KEY) ||
        !currentLegacyIndex.unique
      ) {
        throw new Error('Legacy index changed after audit; refusing to drop it.');
      }

      await collection.dropIndex(legacyIndex.name);
      console.log(`Dropped exact legacy index ${legacyIndex.name}.`);
    }

    const finalState = await inspect(collection);
    if (
      finalState.legacyIndexes.length !== 0 ||
      finalState.intendedIndexes.length !== 1 ||
      finalState.intendedIndexes[0].unique !== true
    ) {
      throw new Error('Post-migration index verification failed.');
    }

    console.log('CouponUsage index migration completed and verified.');
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error(`CouponUsage index migration failed: ${error.message}`);
  process.exitCode = 1;
});
