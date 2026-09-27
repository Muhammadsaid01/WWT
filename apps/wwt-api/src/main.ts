import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { WsAdapter } from '@nestjs/platform-ws';
import * as express from 'express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import * as path from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors({ origin: true, credentials: true });

  app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFile: 10 }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.PORT_API ?? 3007);
}
bootstrap();
