import { Test, TestingModule } from '@nestjs/testing';
import { WwtBatchController } from './wwt-batch.controller';
import { WwtBatchService } from './wwt-batch.service';

describe('WwtBatchController', () => {
  let wwtBatchController: WwtBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WwtBatchController],
      providers: [WwtBatchService],
    }).compile();

    wwtBatchController = app.get<WwtBatchController>(WwtBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(wwtBatchController.getHello()).toBe('Hello World!');
    });
  });
});
