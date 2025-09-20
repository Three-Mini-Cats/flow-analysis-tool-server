import { Module } from '@nestjs/common';
import { SpeedtestService } from './speedtest.service';
import { SpeedtestController } from './speedtest.controller';

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