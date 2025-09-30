# flow-analysis-too-server: Flow-based traffic analysis tools

This project provides a tool for capturing live network traffic and aggregating it into flows (TCP/UDP/ICMP/QUIC) in real time.

Packets are captured using tshark and aggregated by the backend (NestJS), then streamed to the frontend (React) via WebSocket.

## Feature

- Packet capture using tshark
- Supports TCP, UDP, ICMP, and QUIC analysis
- 5-tuple based Flow Aggregation
  - Transmit/Receive bytes (txBytes, rxBytes)
  - Transmit/Receive packets (txPackets, rxPackets)
  - Throughput (throughputBps)
  - TCP retransmissions (retransmits)
- Real-time flow data streaming over WebSocket
- Start, stop, and session lifecycle management (startTest, stopTest, sessionEnded)

## Start

### 1. Requirement

This project was carried out in the following environment.

- **Node.js v23.11.1**
- **npm v10.9.2**

### 2. Install

1. **Clone this repository**
   ```bash
   git clone https://github.com/Three-Mini-Cats/flow-analysis-tool-server.git
   cd flow-analysis-tool-server
   ```

2. **Install dependancy**
   ```bash
   npm install
   ```

3. **Run production environment of Nest.js server**
    ```bash
    npm run start:prod
    ```

4. **Monit Nest.js with command below**
    ```bash
    npx pm2 monit
    ```

## Notes

- tshark must be installed on the server environment.
- Network capture permissions are required (on Linux, you may need sudo).