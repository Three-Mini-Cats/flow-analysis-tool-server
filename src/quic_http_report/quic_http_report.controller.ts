import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { QUICHttpReportService } from 'src/quic_http_report/quic_http_report.service';

@Controller('results')
export class QUICHttpReportController {
    constructor(private readonly quicHttpReportService: QUICHttpReportService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    handleResult(@Body() result: any) {
        console.log('Received new test result:', result);
        this.quicHttpReportService.processResult(result);
        return { message: 'Result received' };
    }
}