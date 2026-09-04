import { registerEnumType } from '@nestjs/graphql';

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

registerEnumType(AgentStatus, {
  name: 'AgentStatus',
});

export enum AgentVerificationStatus {
  APPROVED = 'APPROVED',
  REVOKED = 'REVOKED',
}

registerEnumType(AgentVerificationStatus, {
  name: 'AgentVerificationStatus',
});
