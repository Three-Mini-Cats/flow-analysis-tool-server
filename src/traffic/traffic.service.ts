import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { TCP_MAP } from 'src/constants/tshark_maps/tcp.map';
import { TCPMetrics } from 'src/interfaces/tcp-metrics.interface';
import { TCPPacket } from 'src/interfaces/tcp-packet.interface';
import { TrafficGateway } from 'src/traffic/traffic.gateway';

@Injectable()
export class TrafficService {
    private readonly logger = new Logger(TrafficService.name);
    private snifferProcess: ChildProcessWithoutNullStreams | null = null;

    constructor(
        @Inject(forwardRef(() => TrafficGateway))
        private readonly trafficGateway: TrafficGateway,
    ) { }

    private processTsharkOutput(rawOutput: string): void {
        try {
            const lines: string[] = rawOutput.trim().split('\n');
            const packets: TCPPacket[] = lines
                .map(line => {
                    const cols: string[] = line.split(',');
                    if (cols.length < 9) return null;

                    const packet: TCPPacket = {
                        frame: {
                            number: cols[0],
                            time_epoch: cols[1],
                            len: parseInt(cols[2] || '0', 10),
                        },
                        ip: {
                            src: cols[3],
                            dst: cols[4],
                            proto: cols[5],
                        },
                        protocol: cols[6],
                        tcp: {
                            srcport: cols[7],
                            dstport: cols[8],
                            retransmission: cols[9] === '1' || cols[9] === 'true',
                        },
                    };
                    return packet;
                })
                .filter((p): p is TCPPacket => p !== null);

            if (packets.length === 0) return;

            const metrics = this.calculatePerformanceMetrics(packets);
            this.trafficGateway.server.emit('trafficUpdate', metrics);
        } catch (error) {
            this.logger.error(`Error parsing tshark fields output: ${error.message}`);
        }
    }

    private calculatePerformanceMetrics(packets: TCPPacket[]): TCPMetrics {
        let totalBytes: number = 0;
        let tcpRetransmissionCount: number = 0;

        packets.forEach(p => {
            totalBytes += p.frame.len || 0;
            if (p.tcp.retransmission) {
                tcpRetransmissionCount++;
            }
        });

        // this.logger.log({
        //     timestamp: new Date().toISOString(),
        //     totalPackets: packets.length,
        //     totalBytes,
        //     tcpRetransmissions: tcpRetransmissionCount,
        //     avgPacketSize: packets.length > 0 ? (totalBytes / packets.length).toFixed(2) : 0,
        // });

        const result: TCPMetrics = {
            timestamp: new Date().toISOString(),
            totalPackets: packets.length,
            totalBytes,
            tcpRetransmissions: tcpRetransmissionCount,
            avgPacketSize: packets.length > 0 ? (totalBytes / packets.length).toFixed(2) : 0,
        }

        return result;
    }

    startSniffing(): boolean {
        if (this.snifferProcess) {
            this.logger.warn('Sniffing is already running.');
            return false;
        }

        this.logger.log('Starting tshark sniffing process...');

        this.snifferProcess = spawn(TCP_MAP.DEFAULT[0], TCP_MAP.DEFAULT.slice(1));

        this.snifferProcess.stdout.on('data', (data: Buffer) => {
            // this.logger.log(data.toString('utf8'));
            this.processTsharkOutput(data.toString('utf8'));
        });

        this.snifferProcess.on('close', (code) => {
            this.logger.log(`Tshark process closed with code ${code}`);
            this.snifferProcess = null;
        });

        return true;
    }

    stopSniffing() {
        if (this.snifferProcess) {
            this.snifferProcess.kill('SIGTERM');
            this.logger.log('Tshark process stopped.');
            this.snifferProcess = null;
            return true;
        }
        return false;
    }
}