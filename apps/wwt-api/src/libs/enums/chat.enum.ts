import { registerEnumType } from '@nestjs/graphql';

export enum PrivateMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

registerEnumType(PrivateMessageType, {
  name: 'PrivateMessageType',
});

export enum PrivateMessageStatus {
  SENT = 'SENT',
  READ = 'READ',
  DELETED = 'DELETED',
}

registerEnumType(PrivateMessageStatus, {
  name: 'PrivateMessageStatus',
});
