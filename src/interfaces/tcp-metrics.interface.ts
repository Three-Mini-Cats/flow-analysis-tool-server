export interface TCPMetrics {
    timestamp: string;
    totalPackets: number;
    totalBytes: number;
    tcpRetransmissions: number;
    avgPacketSize: string | 0;
}