import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AGENT = 'AGENT',
}

registerEnumType(MemberType, {
  name: 'MemberType',
});

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

registerEnumType(MemberStatus, {
  name: 'MemberStatus',
});

export enum MemberAuthType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  KAKAO = 'KAKAO',
  TELEGRAM = 'TELEGRAM',
  PHONE = 'PHONE',
}

registerEnumType(MemberAuthType, {
  name: 'MemberAuthType',
});

export enum MemberLanguage {
  ENGLISH = 'ENGLISH',
  KOREAN = 'KOREAN',
  CHINESE = 'CHINESE',
  RUSSIAN = 'RUSSIAN',
  ARABIC = 'ARABIC',
  UZBEK = 'UZBEK',
}

registerEnumType(MemberLanguage, {
  name: 'MemberLanguage',
});

export enum MemberRank {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

registerEnumType(MemberRank, {
  name: 'MemberRank',
});
