import { registerEnumType } from '@nestjs/graphql';

export enum ReviewStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

registerEnumType(ReviewStatus, {
  name: 'ReviewStatus',
});
