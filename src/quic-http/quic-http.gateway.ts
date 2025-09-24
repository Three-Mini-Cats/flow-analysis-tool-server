import { Logger } from '@nestjs/common';
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
export class QUICHTTPGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private logger: Logger;

    constructor() {
        this.logger = new Logger(QUICHTTPGateway.name);
    }

    @WebSocketServer() wss: Server;

    afterInit(server: Server) {
        this.logger.log('WebSocket server initialized.');
    }

    handleConnection(client: WebSocket, ...args: any[]) {
        this.logger.log(`React client connected!`);
    }

    handleDisconnect(client: WebSocket) {
        this.logger.log('Client disconnected.');
    }

    broadcastResult(result: any) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(result));
            }
        });
    }
}