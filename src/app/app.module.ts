import { Module } from '@nestjs/common';
import { TrafficModule } from 'src/traffic/traffic.module';

@Module({
  imports: [TrafficModule],
})
export class AppModule { }
