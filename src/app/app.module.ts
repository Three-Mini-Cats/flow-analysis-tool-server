import { Module } from '@nestjs/common';
import { AppController } from 'src/app/app.controller';
import { AppService } from 'src/app/app.service';
import { SpeedtestModule } from 'src/speedtest/speedtest.module';
import { QUICHttpReportModule } from 'src/quic_http_report/quic_http_report.module';

@Module({
  imports: [SpeedtestModule, QUICHttpReportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
