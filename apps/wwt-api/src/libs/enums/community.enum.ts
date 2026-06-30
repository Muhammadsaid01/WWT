import { registerEnumType } from '@nestjs/graphql';

export enum ArticleCategory {
  FREE = 'FREE',
  TRAVEL_TIP = 'TRAVEL_TIP',
  TRAVEL_REVIEW = 'TRAVEL_REVIEW',
  QUESTION = 'QUESTION',
  FIND_COMPANION = 'FIND_COMPANION',
  NOTICE = 'NOTICE',
}

registerEnumType(ArticleCategory, {
  name: 'ArticleCategory',
});
export enum ArticleStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

registerEnumType(ArticleStatus, {
  name: 'ArticleStatus',
});

//CommentENUM

export enum CommentStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

registerEnumType(CommentStatus, {
  name: 'CommentStatus',
});

//LikeENUM

export enum LikeTargetType {
  PACKAGE = 'PACKAGE',
  ARTICLE = 'ARTICLE',
  COMMENT = 'COMMENT',
  REVIEW = 'REVIEW',
}

registerEnumType(LikeTargetType, {
  name: 'LikeTargetType',
});

// Travel Mate
export enum TravelMatePostStatus {
  ACTIVE = 'ACTIVE',
  FULL = 'FULL',
  CLOSED = 'CLOSED',
  DELETED = 'DELETED',
}

registerEnumType(TravelMatePostStatus, {
  name: 'TravelMatePostStatus',
});

export enum TravelMateJoinStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(TravelMateJoinStatus, {
  name: 'TravelMateJoinStatus',
});

// View ENUM

export enum ViewTargetType {
  MEMBER = 'MEMBER',
  PACKAGE = 'PACKAGE',
  ARTICLE = 'ARTICLE',
}

registerEnumType(ViewTargetType, {
  name: 'ViewTargetType',
});
