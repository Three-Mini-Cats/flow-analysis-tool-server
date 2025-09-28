export interface StartTestPayload {
    interface: string;
    protocol: string;
    duration: number;
    bpfFilter: string;
    captureLimit: number;
}
