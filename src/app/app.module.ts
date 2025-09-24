import { Module } from '@nestjs/common';
import { AppController } from 'src/app/app.controller';
import { AppService } from 'src/app/app.service';
import { SpeedtestModule } from 'src/speedtest/speedtest.module';
import { QUICHTTPModule } from 'src/quic-http/quic-http.module';

@Module({
  imports: [SpeedtestModule, QUICHTTPModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
