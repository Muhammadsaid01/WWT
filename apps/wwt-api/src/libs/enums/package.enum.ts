import { registerEnumType } from '@nestjs/graphql';

export enum PackageType {
  TOUR = 'TOUR',
  ACTIVITY = 'ACTIVITY',
  CRUISE = 'CRUISE',
}

registerEnumType(PackageType, {
  name: 'PackageType',
});

export enum PackageCategory {
  ADVENTURE = 'ADVENTURE',
  FAMILY = 'FAMILY',
  HONEYMOON = 'HONEYMOON',
  CULTURE = 'CULTURE',
  FOOD = 'FOOD',
  NATURE = 'NATURE',
  BUSINESS = 'BUSINESS',
  LUXURY = 'LUXURY',
}

registerEnumType(PackageCategory, {
  name: 'PackageCategory',
});

export enum PackageLevel {
  BUDGET = 'BUDGET',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  LUXURY = 'LUXURY',
}

registerEnumType(PackageLevel, {
  name: 'PackageLevel',
});

export enum TransportType {
  BUS = 'BUS',
  TRAIN = 'TRAIN',
  FLIGHT = 'FLIGHT',
  SHIP = 'SHIP',
  MIXED = 'MIXED',
}

registerEnumType(TransportType, {
  name: 'TransportType',
});

export enum PackageStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  HIDDEN = 'HIDDEN',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
}

registerEnumType(PackageStatus, {
  name: 'PackageStatus',
});

export enum ScheduleStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FINISHED = 'FINISHED',
}

registerEnumType(ScheduleStatus, {
  name: 'ScheduleStatus',
});
