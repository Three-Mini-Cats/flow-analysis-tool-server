import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class SpeedtestService {
    createDownloadStream(size: number): Readable {
        const chunkSize: number = 64 * 1024;
        let sent: number = 0;

        return new Readable({
            read() {
                if (sent >= size) {
                    this.push(null);
                } else {
                    const chunk = Buffer.alloc(chunkSize, 'a');
                    this.push(chunk);
                    sent += chunkSize;
                }
            },
        });
    }
}