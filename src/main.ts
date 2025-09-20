import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
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

  const port = 3000;

  await app.listen(port);
  logger.log(`${port}번 포트에서 NestJS 서버 실행중!`);
}
bootstrap();
