import { NestFactory } from '@nestjs/core';
import { WwtBatchModule } from './wwt-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(WwtBatchModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
