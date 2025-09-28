import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { INestApplication, Logger } from '@nestjs/common';
import morgan from 'morgan';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const DEFAULT_PORT: number = 3010;
  const logger: Logger = new Logger('Bootstrap');

  const app: INestApplication = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  if (process.env.NODE_ENV == 'production') {
    app.use(morgan('combined'));
  } else {
    app.use(morgan('dev'));
  }

  await app.listen(process.env.PORT || DEFAULT_PORT);
  logger.log(`${process.env.PORT || DEFAULT_PORT}번 포트에서 NestJS 서버 실행중!`);
}

bootstrap();
