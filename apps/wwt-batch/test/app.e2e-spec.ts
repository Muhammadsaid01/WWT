import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { BatchModule } from '../src/batch.module';

describe('BatchController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BatchModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });
});
