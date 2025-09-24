import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import morgan from 'morgan';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV == 'production') {
    app.use(morgan('combined'));
  } else {
    app.use(morgan('dev'));
  }

  const DEFAULT_PORT = 4000;

  await app.listen(process.env.PORT || DEFAULT_PORT);
  logger.log(`${process.env.PORT || DEFAULT_PORT}번 포트에서 NestJS 서버 실행중!`);
}
bootstrap();
