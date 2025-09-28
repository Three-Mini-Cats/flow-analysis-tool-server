export interface TCPPacket {
    frame: {
        number: string;
        time_epoch: string;
        len: number;
    };
    ip: {
        src: string;
        dst: string;
        proto: string;
    };
    protocol: string;
    tcp: {
        srcport: string;
        dstport: string;
        retransmission: boolean;
    };
}

export type PacketList = (TCPPacket | null)[];