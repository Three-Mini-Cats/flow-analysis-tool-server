import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { randomUUID, UUID } from 'crypto';
import { PROTOCOL_MAL } from 'src/constants/tshark_maps/protocol.map';
import { StartTestPayload } from 'src/interfaces/start-test-payload.interface';
import { TrafficGateway } from 'src/traffic/traffic.gateway';

@Injectable()
export class TrafficService {
    private readonly logger = new Logger(TrafficService.name);
    private snifferProcesses: Map<string, ChildProcessWithoutNullStreams> = new Map();
    private flows: Map<string, Map<string, any>> = new Map();
    private emitTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly emitIntervalMs = 500;

    constructor(
        @Inject(forwardRef(() => TrafficGateway))
        private readonly trafficGateway: TrafficGateway,
    ) {
    }

    private initializeTsharkArgs(payload: StartTestPayload): string[] {
        const args: string[] = [];

        args.push('-i', payload.interface);
        args.push('-l');
        args.push('-T', 'fields');

        const protocolKeyUpper: string = payload.protocol?.toUpperCase() || 'TCP';
        if (PROTOCOL_MAL[protocolKeyUpper]) {
            args.push(...PROTOCOL_MAL[protocolKeyUpper]);
        } else {
            this.logger.warn(`Unsupported protocol: ${payload.protocol}, falling back to TCP`);
            args.push(...PROTOCOL_MAL['TCP']);
        }

        if (payload.captureLimit && payload.captureLimit > 0) {
            args.push('-c', payload.captureLimit.toString());
        }

        const protocolKeyLower = protocolKeyUpper.toLowerCase();

        if (protocolKeyLower === 'tcp' || protocolKeyLower === 'udp' || protocolKeyLower === 'icmp') {
            args.push('-f', protocolKeyLower);
        } else if (protocolKeyLower === 'quic') {
            args.push('-Y', 'quic');
        }

        if (payload.bpfFilter) {
            args.push('-f', payload.bpfFilter);
        }

        args.push('-E', 'separator=,')

        return args;
    }

    private processTsharkOutput(data: string, protocolHint: string | undefined, sessionId: string): void {
        const lines: string[] = data.split('\n');

        for (const line of lines) {
            if (!line.trim()) continue;

            const fields: string[] = line.split(',');
            if (fields.length < 7) continue;

            const frameNoStr = fields[0];      // frame.number
            const tsStr = fields[1];           // frame.time_epoch
            const frameLenStr = fields[2];     // frame.len
            const srcIp = fields[3];           // ip.src
            const dstIp = fields[4];           // ip.dst
            const protoNumStr = fields[5];     // ip.proto
            const protoName = fields[6] || (protocolHint?.toUpperCase() || 'UNKNOWN');

            const ts = parseFloat(tsStr);
            const frameLen = parseInt(frameLenStr, 10);

            let flowId: string;
            let reverseFlowId: string;
            let srcPort = 0;
            let dstPort = 0;
            let isRetransmit = 0;
            let protocol = protoName;

            if (protocol.toUpperCase() === 'TCP') {
                srcPort = parseInt(fields[7] || '0', 10);
                dstPort = parseInt(fields[8] || '0', 10);
                const retransmitFlag = fields[9] || '';
                isRetransmit = retransmitFlag.trim() !== '' ? 1 : 0;

                flowId = `${srcIp}:${srcPort}->${dstIp}:${dstPort}/${protocol}`;
                reverseFlowId = `${dstIp}:${dstPort}->${srcIp}:${srcPort}/${protocol}`;

            } else if (protocol.toUpperCase() === 'UDP') {
                srcPort = parseInt(fields[7] || '0', 10);
                dstPort = parseInt(fields[8] || '0', 10);

                flowId = `${srcIp}:${srcPort}->${dstIp}:${dstPort}/${protocol}`;
                reverseFlowId = `${dstIp}:${dstPort}->${srcIp}:${srcPort}/${protocol}`;

            } else if (protocol.toUpperCase().startsWith('ICMP')) {
                const icmpType = fields[7] || '';
                const icmpCode = fields[8] || '';
                flowId = `${srcIp}->${dstIp}/ICMP-${icmpType}:${icmpCode}`;
                reverseFlowId = `${dstIp}->${srcIp}/ICMP-${icmpType}:${icmpCode}`;
                protocol = 'ICMP';
            } else {
                // QUIC, and others
                srcPort = parseInt(fields[7] || '0', 10);
                dstPort = parseInt(fields[8] || '0', 10);
                flowId = `${srcIp}->${dstIp}/${protocol}`;
                reverseFlowId = `${dstIp}->${srcIp}/${protocol}`;
            }

            this.updateFlow(sessionId, flowId, reverseFlowId, ts, frameLen, isRetransmit, srcIp, dstIp, srcPort, dstPort, protocol);
        }
    }

    private updateFlow(
        sessionId: string,
        flowId: string,
        reverseFlowId: string,
        ts: number,
        frameLen: number,
        isRetransmit: number,
        srcIp: string,
        dstIp: string,
        srcPort: number,
        dstPort: number,
        protocol: string
    ): void {
        const sessionFlows = this.flows.get(sessionId);
        if (!sessionFlows) {
            return;
        }

        let flow = sessionFlows.get(flowId);
        let reverseFlow = sessionFlows.get(reverseFlowId);

        if (flow) {
            flow.txBytes += frameLen;
            flow.txPackets += 1;
            if (isRetransmit) flow.retransmits += 1;
            flow.durationSec = ts - flow.startTs;
            flow.throughputBps = flow.durationSec > 0 ? Math.round(flow.txBytes * 8 / flow.durationSec) : 0;
        } else if (reverseFlow) {
            reverseFlow.rxBytes += frameLen;
            reverseFlow.rxPackets += 1;
            reverseFlow.durationSec = ts - reverseFlow.startTs;
            reverseFlow.throughputBps = reverseFlow.durationSec > 0 ? Math.round((reverseFlow.txBytes + reverseFlow.rxBytes) * 8 / reverseFlow.durationSec) : 0;
        } else {
            flow = {
                flowId,
                srcIp,
                dstIp,
                srcPort,
                dstPort,
                protocol,
                startTs: ts,
                durationSec: 0,
                txBytes: frameLen,
                rxBytes: 0,
                txPackets: 1,
                rxPackets: 0,
                throughputBps: 0,
                retransmits: isRetransmit ? 1 : 0,
                status: 'ACTIVE',
            };
            sessionFlows.set(flowId, flow);
        }
    }

    // 현재까지 누적된 모든 플로우 객체 반환 for a session
    private emitFlowUpdates(sessionId: string): void {
        const now: number = Date.now();
        const sessionFlows = this.flows.get(sessionId);
        if (!sessionFlows) {
            return;
        }
        const flowsArr = Array.from(sessionFlows.values()).map(f => ({
            ...f
        }));
        this.trafficGateway.server.emit('trafficUpdate', {
            type: 'flowUpdate',
            timestamp: now,
            sessionId,
            flows: flowsArr
        });
    }

    startSniffing(payload: StartTestPayload): { success: boolean, sessionId?: string, message: string } {
        const sessionId: UUID = randomUUID();
        const args: string[] = this.initializeTsharkArgs(payload);

        let durationTimer: NodeJS.Timeout | undefined = undefined;

        try {
            this.logger.log('Starting tshark sniffing process...');
            const tsharkProcess: ChildProcessWithoutNullStreams = spawn('tshark', args);
            this.snifferProcesses.set(sessionId, tsharkProcess);
            this.flows.set(sessionId, new Map());

            tsharkProcess.stdout.on('data', (data: Buffer) => {
                this.processTsharkOutput(data.toString('utf8'), payload.protocol, sessionId);
            });

            // tsharkProcess.stderr.on('data', (data: Buffer) => {
            //     this.logger.error(data.toString('utf8'));
            // });

            tsharkProcess.on('close', (code) => {
                this.logger.log(`Tshark process for session ${sessionId} closed with code ${code}`);
                this.snifferProcesses.delete(sessionId);
                const timer = this.emitTimers.get(sessionId);
                if (timer) {
                    clearInterval(timer);
                    this.emitTimers.delete(sessionId);
                }
                this.flows.delete(sessionId);

                this.trafficGateway.server.emit('sessionEnded', {
                    type: 'SESSION_ENDED',
                    sessionId,
                    code,
                    message: 'Traffic analysis session has ended'
                });
            });

            const emitTimer = setInterval(() => {
                this.emitFlowUpdates(sessionId);
            }, this.emitIntervalMs);
            this.emitTimers.set(sessionId, emitTimer);

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
            const timer = this.emitTimers.get(sessionId);
            if (timer) {
                clearInterval(timer);
                this.emitTimers.delete(sessionId);
            }
            this.flows.delete(sessionId);
            return { success: true, message: 'Traffic analysis stopped successfully' };
        } else {
            this.logger.warn(`No active sniffer process found for sessionId: ${sessionId}`);
            return { success: false, message: 'No active sniffer process found for given sessionId' };
        }
    }
}