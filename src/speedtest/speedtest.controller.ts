import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import express from 'express';
import { SpeedtestService } from './speedtest.service';

@Controller('speedtest')
export class SpeedtestController {
    constructor(private readonly speedtestService: SpeedtestService) { }

    @Post('upload')
    async uploadTest(@Req() req: express.Request): Promise<{ receivedBytes: number }> {
        return new Promise((resolve, reject) => {
            let received = 0;
            req.on('data', (chunk) => {
                received += chunk.length;
            });
            req.on('end', () => {
                resolve({ receivedBytes: received });
            });
            req.on('error', (err) => reject(err));
        });
    }

    @Get('ping')
    ping(): { timestamp: number } {
        return { timestamp: Date.now() };
    }

    @Get('download')
    async downloadTest(@Res() res: express.Response) {
        res.set({
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Content-Disposition': 'attachment; filename="dummy.bin"',
        });

        const stream = this.speedtestService.createDownloadStream(100 * 1024 * 1024);
        stream.pipe(res);
    }

}