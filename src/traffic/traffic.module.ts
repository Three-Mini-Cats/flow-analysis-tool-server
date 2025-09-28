import { Module } from '@nestjs/common';
import { TrafficGateway } from 'src/traffic/traffic.gateway';
import { TrafficService } from 'src/traffic/traffic.service';

@Module({
    providers: [TrafficGateway, TrafficService],
    exports: [TrafficGateway, TrafficService],
})
export class TrafficModule { }