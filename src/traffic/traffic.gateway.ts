import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    SubscribeMessage,
    ConnectedSocket,
    OnGatewayDisconnect,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrafficService } from 'src/traffic/traffic.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: /\/ws\/traffic\/.+/,
})
export class TrafficGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(TrafficGateway.name);

    @WebSocketServer() server: Server;

    constructor(private readonly trafficService: TrafficService) { }

    @SubscribeMessage('startTest')
    async handleStartTest(@ConnectedSocket() client: Socket, @MessageBody() payload: any): Promise<void> {
        this.logger.log(`Traffic analysis started`);
        const { success, sessionId, message } = await this.trafficService.startSniffing(payload);
        client.emit('startTestResponse', {
            success,
            sessionId,
            message,
            wsUrl: `/ws/traffic/${sessionId}`,
        });
    }

    @SubscribeMessage('stopTest')
    async handleStopTest(@ConnectedSocket() client: Socket, @MessageBody() payload: any): Promise<void> {
        this.logger.log(`Traffic analysis stopped`);
        const { success, message } = await this.trafficService.stopSniffing(payload.sessionId);
        client.emit('stopTestResponse', {
            success,
            sessionId: payload.sessionId,
            message,
        });
    }

    afterInit() {
        this.logger.log('Websocket Gateway Initialized');
    }

    handleConnection(...args: any[]) {
        this.logger.log(`Client connected.`);
    }

    handleDisconnect() {
        this.logger.log(`Client disconnected.`);
    }
}