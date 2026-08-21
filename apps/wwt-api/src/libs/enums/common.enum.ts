import { registerEnumType } from '@nestjs/graphql';

export enum Message {
  SOMETHING_WENT_WRONG = 'Something went wrong!',
  NO_DATA_FOUND = 'No data found!',
  CREATE_FAILED = 'Create failed!',
  UPDATE_FAILED = 'Update failed!',
  REMOVE_FAILED = 'Remove failed!',
  UPLOAD_FAILED = 'Upload failed!',
  DELETE_FAILED = 'Delete failed!',
  BAD_REQUEST = 'Bad Request',

  USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone!',
  NO_MEMBER_NICK = 'No member with that member nick!',
  BLOCKED_USER = 'You have been blocked!',
  WRONG_PASSWORD = 'Wrong password, try again!',
  NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
  TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
  ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
  NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
  PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
  SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',
  SENDED_REQUEST = 'You already have a pending agent request!',
  NOT_AUTHORIZED = 'You are not Authorized, please ask to admin first!',
}

export enum AIErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  MESSAGE_REQUIRED = 'MESSAGE_REQUIRED',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',

  AI_BUSY = 'AI_BUSY',
  RATE_LIMIT = 'RATE_LIMIT',

  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_UNAVAILABLE = 'AI_UNAVAILABLE',

  AI_ERROR = 'AI_ERROR',
}

export enum Direction {
  ASC = 1,
  DESC = -1,
}
registerEnumType(Direction, {
  name: 'Direction',
});

export enum MemberPointAction {
  BOOKING = 100,
  REVIEW = 30,
  COMMENT = 10,
  TRAVEL_MATE_POST = 20,
  LIKE = 2,
}
