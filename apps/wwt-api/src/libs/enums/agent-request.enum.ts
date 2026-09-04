import { registerEnumType } from '@nestjs/graphql';

export enum AgentRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(AgentRequestStatus, {
  name: 'AgentRequestStatus',
});
