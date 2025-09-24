import { Injectable } from '@nestjs/common';
import { QUICHttpReportGateway } from 'src/quic_http_report/quic_http_report.gateway';

@Injectable()
export class QUICHttpReportService {
  constructor(private readonly quicHttpReportGateway: QUICHttpReportGateway) { }

  /**
   * 수신된 결과를 웹소켓을 통해 브로드캐스트합니다.
   * @param result 처리할 결과 데이터
   */
  processResult(result: any) {
    this.quicHttpReportGateway.broadcastResult(result);
  }
}