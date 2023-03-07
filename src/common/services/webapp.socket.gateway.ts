import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { SocketEvents } from '../constants';
import { SocketGateway } from './socket.gateway';
import { ISocketWepAppLogin } from '../interfaces';
import { Socket } from 'socket.io';

@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class WebAppGateway {
    constructor(
        private readonly configService: ConfigService,
        private readonly socketGateway: SocketGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `socket-web-app`,
        this.configService,
    );

    @SubscribeMessage(SocketEvents.WEB_APP_USER_LOGIN)
    onWebAppLogin(client: Socket, payload: ISocketWepAppLogin) {
        // listen the event when a user login to web app
        this.logger.info('receive event WEB_APP_USER_LOGIN: ', payload);
        if (payload.senderId) {
            // each user will join to one room
            client.join(`${client.id}_${payload.senderId}`);
        }
    }
}
