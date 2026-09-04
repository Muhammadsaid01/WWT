import { registerEnumType } from '@nestjs/graphql';

export enum ReportTargetType {
  MEMBER = 'MEMBER',
  ARTICLE = 'ARTICLE',
  COMMENT = 'COMMENT',
  REVIEW = 'REVIEW',
  TRAVEL_MATE_POST = 'TRAVEL_MATE_POST',
}

registerEnumType(ReportTargetType, {
  name: 'ReportTargetType',
});

export enum ReportType {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  HARASSMENT = 'HARASSMENT',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

registerEnumType(ReportType, {
  name: 'ReportType',
});

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  REJECTED = 'REJECTED',
  RESOLVED = 'RESOLVED',
}

registerEnumType(ReportStatus, {
  name: 'ReportStatus',
});
