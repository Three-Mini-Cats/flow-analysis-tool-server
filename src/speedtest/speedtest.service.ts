import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class SpeedtestService {
    createDownloadStream(size: number): Readable {
        const chunkSize = 64 * 1024;
        let sent = 0;

        return new Readable({
            read() {
                if (sent >= size) {
                    this.push(null); // 끝
                } else {
                    const chunk = Buffer.alloc(chunkSize, 'a'); // 더미 데이터
                    this.push(chunk);
                    sent += chunkSize;
                }
            },
        });
    }
}