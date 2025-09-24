import { Module } from '@nestjs/common';
import { QUICHttpReportController } from 'src/quic_http_report/quic_http_report.controller';
import { QUICHttpReportGateway } from 'src/quic_http_report/quic_http_report.gateway';
import { QUICHttpReportService } from 'src/quic_http_report/quic_http_report.service';

@Module({
    controllers: [QUICHttpReportController],
    providers: [QUICHttpReportService, QUICHttpReportGateway],
    exports: [QUICHttpReportService, QUICHttpReportGateway],
})
export class QUICHttpReportModule { }