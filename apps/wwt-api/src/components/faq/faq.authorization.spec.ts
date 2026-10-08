/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../../libs/config', () => ({
  shapeIntoMongoObjectId: (value: unknown) =>
    typeof value === 'string' ? new (require('mongoose').Types.ObjectId)(value) : value,
}));

import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { FaqCategory } from '../../libs/enums/faq.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FaqResolver } from './faq.resolver';

describe('FaqResolver authorization', () => {
  const service = {
    createFaq: jest.fn(),
    updateFaq: jest.fn(),
    deleteFaq: jest.fn(),
    getAllFaqsByAdmin: jest.fn(),
    getFaqByAdmin: jest.fn(),
  };
  const resolver = new FaqResolver(service as any);

  it.each(['getAllFaqsByAdmin', 'getFaqByAdmin', 'createFaq', 'updateFaq', 'deleteFaq'] as const)(
    'allows only ADMIN on %s',
    (method) => {
      expect(Reflect.getMetadata('roles', FaqResolver.prototype[method])).toEqual([
        MemberType.ADMIN,
      ]);
      expect(Reflect.getMetadata(GUARDS_METADATA, FaqResolver.prototype[method])).toContain(
        RolesGuard,
      );
    },
  );

  it('passes the authenticated admin identity into creation', async () => {
    const adminId = '507f1f77bcf86cd799439011';
    const input = {
      faqCategory: FaqCategory.GENERAL,
      faqQuestion: 'Question?',
      faqAnswer: 'Answer text.',
    };
    service.createFaq.mockResolvedValue({ _id: 'faq' });
    await resolver.createFaq(input, adminId as any);
    expect(service.createFaq).toHaveBeenCalledWith(adminId, input);
  });

  it.each([MemberType.USER, MemberType.AGENT])(
    'denies %s members at the ADMIN role guard',
    async (memberType) => {
      const guard = new RolesGuard(
        { get: jest.fn().mockReturnValue([MemberType.ADMIN]) } as unknown as Reflector,
        { verifyToken: jest.fn().mockResolvedValue({ memberType }) } as any,
      );
      const context = {
        contextType: 'graphql',
        getHandler: jest.fn(),
        getArgByIndex: jest.fn().mockReturnValue({
          req: { headers: { authorization: 'Bearer test-token' }, body: {} },
        }),
      };

      await expect(guard.canActivate(context as any)).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});
