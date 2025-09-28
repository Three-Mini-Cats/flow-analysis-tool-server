import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { randomUUID, UUID } from 'crypto';
import { TCP_MAP } from 'src/constants/tshark_maps/tcp.map';
import { StartTestPayload } from 'src/interfaces/start-test-payload.interface';
import { TrafficGateway } from 'src/traffic/traffic.gateway';

@Injectable()
export class TrafficService {
    private readonly logger = new Logger(TrafficService.name);
    private snifferProcesses: Map<string, ChildProcessWithoutNullStreams> = new Map();
    private flows: Map<string, any> = new Map();

    constructor(
        @Inject(forwardRef(() => TrafficGateway))
        private readonly trafficGateway: TrafficGateway,
    ) { }

    private initializeTsharkArgs(payload: StartTestPayload): string[] {
        const args: string[] = [];

        args.push('-i', payload.interface);
        args.push('-f', 'tcp');
        args.push('-l');
        args.push('-T', 'fields');
        args.push(...TCP_MAP.DEFAULT);

        if (payload.captureLimit && payload.captureLimit > 0) {
            args.push('-c', payload.captureLimit.toString());
        }
        if (payload.bpfFilter) {
            args.push('-f', payload.bpfFilter);
        }

        args.push('-E', 'separator=,')

        return args;
    }

    startSniffing(payload: StartTestPayload): { success: boolean, sessionId?: string, message: string } {
        const sessionId: UUID = randomUUID();
        const args: string[] = this.initializeTsharkArgs(payload);

        let durationTimer: NodeJS.Timeout | undefined = undefined;

        try {
            this.logger.log('Starting tshark sniffing process...');
            const tsharkProcess: ChildProcessWithoutNullStreams = spawn('tshark', args);
            this.snifferProcesses.set(sessionId, tsharkProcess);

            tsharkProcess.stdout.on('data', (data: Buffer) => {
                // this.logger.log(data.toString('utf8'));
                this.processTsharkOutput(data.toString('utf8'));
            });

            tsharkProcess.on('close', (code) => {
                this.logger.log(`Tshark process for session ${sessionId} closed with code ${code}`);
                this.snifferProcesses.delete(sessionId);
            });

            if (payload.duration && payload.duration > 0) {
                durationTimer = setTimeout(() => {
                    this.stopSniffing(sessionId);
                }, payload.duration * 1000);
            }

            this.logger.log('Traffic analysis started successfully');
            return { success: true, sessionId, message: 'Traffic analysis started successfully' };
        } catch (error) {
            this.logger.error(`Failed to start tshark: ${error.message}`);
            return { success: false, message: `Failed to start tshark: ${error.message}` };
        }
    }

    stopSniffing(sessionId: string): { success: boolean, message: string } {
        const process: ChildProcessWithoutNullStreams | undefined = this.snifferProcesses.get(sessionId);
        if (process) {
            process.kill('SIGTERM');
            this.logger.log('Traffic analysis stopped successfully');
            this.snifferProcesses.delete(sessionId);
            return { success: true, message: 'Traffic analysis stopped successfully' };
        } else {
            this.logger.warn(`No active sniffer process found for sessionId: ${sessionId}`);
            return { success: false, message: 'No active sniffer process found for given sessionId' };
        }
    }


    private processTsharkOutput(data: string): void {
        const lines: string[] = data.split('\n');
        const now: number = Date.now();

        for (const line of lines) {
            if (!line.trim()) continue;

            const fields: string[] = line.split(',');
            if (fields.length < 9) continue;

            const [
                frameNoStr,      // frame.number
                tsStr,           // frame.time_epoch
                frameLenStr,     // frame.len
                srcIp,           // ip.src
                dstIp,           // ip.dst
                protoNumStr,     // ip.proto
                protoName,       // _ws.col.Protocol
                srcPortStr,      // tcp.srcport
                dstPortStr,      // tcp.dstport
                retransmitFlag   // tcp.analysis.retransmission (optional)
            ]: string[] = fields;

            const ts = parseFloat(tsStr);
            const frameLen = parseInt(frameLenStr, 10);
            const srcPort = parseInt(srcPortStr, 10);
            const dstPort = parseInt(dstPortStr, 10);
            const isRetransmit = retransmitFlag && retransmitFlag.trim() !== '' ? 1 : 0;

            const protocol = protoName || 'TCP';
            const flowId = `${srcIp}:${srcPort}->${dstIp}:${dstPort}/${protocol}`;

            let flow = this.flows.get(flowId);
            if (!flow) {
                flow = {
                    flowId,
                    srcIp,
                    dstIp,
                    protocol,
                    startTs: ts,
                    durationSec: 0,
                    txBytes: 0,
                    rxBytes: 0,
                    txPackets: 0,
                    rxPackets: 0,
                    throughputBps: 0,
                    retransmits: 0,
                    status: 'ACTIVE',
                };
                this.flows.set(flowId, flow);
            }

            flow.txBytes += frameLen;
            flow.txPackets += 1;
            if (isRetransmit) {
                flow.retransmits += 1;
            }

            flow.durationSec = ts - flow.startTs;
            flow.throughputBps = flow.durationSec > 0 ? Math.round(flow.txBytes * 8 / flow.durationSec) : 0;
        }

        const flowsArr = Array.from(this.flows.values()).map(f => ({
            ...f
        }));
        this.trafficGateway.server.emit('trafficUpdate', {
            type: 'FLOW_UPDATE',
            timestamp: now,
            flows: flowsArr
        });
    }
}