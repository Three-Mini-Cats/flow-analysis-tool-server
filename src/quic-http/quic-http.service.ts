import { Injectable } from '@nestjs/common';
import { QUICHTTPGateway } from 'src/quic-http/quic-http.gateway';

@Injectable()
export class QUICHTTPService {
  constructor(private readonly quicHttpGateway: QUICHTTPGateway) { }

  processResult(result: any) {
    this.quicHttpGateway.broadcastResult(result);
  }
}