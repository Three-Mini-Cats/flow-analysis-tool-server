import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { QUICHTTPService } from 'src/quic-http/quic-http.service';

@Controller('quic-http')
export class QUICHTTPController {
    private logger: Logger;
    constructor(private readonly quicHttpService: QUICHTTPService) {
        this.logger = new Logger(QUICHTTPController.name);
    }

    @Post('report')
    @HttpCode(HttpStatus.OK)
    handleResult(@Body() result: any) {
        this.logger.log('Received new test result:', result);
        this.quicHttpService.processResult(result);

        return { message: 'Result received' };
    }
}