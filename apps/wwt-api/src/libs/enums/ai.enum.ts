import { registerEnumType } from '@nestjs/graphql';

export enum AIMessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

registerEnumType(AIMessageRole, {
  name: 'AIMessageRole',
});
