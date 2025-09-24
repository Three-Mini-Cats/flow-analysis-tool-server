import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway(3006, {
    cors: {
        origin: '*',
    },
})
export class QUICHttpReportGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() wss: Server;

    afterInit(server: Server) {
        console.log('WebSocket server initialized.');
    }

    handleConnection(client: WebSocket, ...args: any[]) {
        console.log(`React client connected!`);
    }

    handleDisconnect(client: WebSocket) {
        console.log('Client disconnected.');
    }

    broadcastResult(result: any) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(result));
            }
        });
    }
}