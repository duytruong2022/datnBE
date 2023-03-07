import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { createWinstonLogger } from './winston.service';
@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class SocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    constructor(private readonly configService: ConfigService) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `socket-gateway`,
        this.configService,
    );
    @WebSocketServer()
    server: Server;

    wsClients = [];

    afterInit(server: Server) {
        this.logger.info('Init socket server', server);
    }

    handleDisconnect(client: Socket) {
        this.logger.info(`Client disconnected: ${client.id}`);
        for (let i = 0; i < this.wsClients.length; i += 1) {
            if (this.wsClients[i].id === client.id) {
                this.wsClients.splice(i, 1);
                break;
            }
        }
    }

    handleConnection(client: Socket) {
        this.logger.info(`Client connected: ${client.id}`);
        this.wsClients.push(client);
    }
}
