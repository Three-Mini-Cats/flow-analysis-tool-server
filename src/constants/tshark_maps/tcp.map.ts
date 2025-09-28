export const TCP_MAP: Record<string, string[]> = {
    DEFAULT: [
        'tshark',
        '-i', 'enp70s0',
        '-f', 'tcp',
        '-l',
        '-T', 'fields',
        '-e', 'frame.number',
        '-e', 'frame.time_epoch',
        '-e', 'frame.len',
        '-e', 'ip.src',
        '-e', 'ip.dst',
        '-e', 'ip.proto',
        '-e', '_ws.col.Protocol',
        '-e', 'tcp.srcport',
        '-e', 'tcp.dstport',
        '-e', 'tcp.analysis.retransmission',
        '-E', 'separator=,',
    ],
} as const;
// export const TCP_MAP: Record<string, string[]> = {
//     DEFAULT: [
//         'tshark',
//         '-i', 'enp70s0',
//         '-f', 'tcp',
//         '-l',
//         '-T', 'json',
//     ],
// } as const;