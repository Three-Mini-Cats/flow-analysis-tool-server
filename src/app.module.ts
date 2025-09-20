import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpeedtestModule } from './speedtest/speedtest.module';

@Module({
  imports: [SpeedtestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
