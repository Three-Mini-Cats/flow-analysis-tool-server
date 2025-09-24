import { Module } from '@nestjs/common';
import { QUICHTTPGateway } from 'src/quic-http/quic-http.gateway';
import { QUICHTTPService } from 'src/quic-http/quic-http.service';
import { QUICHTTPController } from 'src/quic-http/quic-http.controller';

@Module({
    controllers: [QUICHTTPController],
    providers: [QUICHTTPService, QUICHTTPGateway],
    exports: [QUICHTTPService, QUICHTTPGateway],
})
export class QUICHTTPModule { }