import { Module } from '@nestjs/common';
import { SpeedtestService } from 'src/speedtest/speedtest.service';
import { SpeedtestController } from 'src/speedtest/speedtest.controller';

@Module({
    controllers: [
        SpeedtestController
    ],
    providers: [
        SpeedtestService,
    ],
    exports: [
        SpeedtestService,
    ],
})

export class SpeedtestModule { }