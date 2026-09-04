import { registerEnumType } from '@nestjs/graphql';

export enum NoticeStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

registerEnumType(NoticeStatus, {
  name: 'NoticeStatus',
});
