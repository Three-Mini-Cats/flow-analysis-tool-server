import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    SubscribeMessage,
    ConnectedSocket,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrafficService } from 'src/traffic/traffic.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class TrafficGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(TrafficGateway.name);

    @WebSocketServer() server: Server;

    constructor(private readonly trafficService: TrafficService) { }

    @SubscribeMessage('startTest')
    handleStartTest(@ConnectedSocket() client: Socket): void {
        this.logger.log(`Client requested Start Test.`);
        const success = this.trafficService.startSniffing();

        client.emit('status', {
            running: true,
            state: success ? 'started' : 'already_active'
        });
    }

    @SubscribeMessage('stopTest')
    handleStopTest(@ConnectedSocket() client: Socket): void {
        this.logger.log(`Client requested STOP Test.`);
        const success = this.trafficService.stopSniffing();

        client.emit('status', {
            running: true,
            state: success ? 'stopped' : 'already_active'
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