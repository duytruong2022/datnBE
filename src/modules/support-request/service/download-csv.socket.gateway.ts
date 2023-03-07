import { WebSocketGateway } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { SocketEvents } from '../../../common/constants';
import { SocketGateway } from '../../../common/services/socket.gateway';
import { IExportCSVData } from 'src/common/interfaces';

@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class DownloadCSVGateway {
    constructor(
        private readonly configService: ConfigService,
        private readonly socketGateway: SocketGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `socket-onvif`,
        this.configService,
    );

    sendExportCSVData(body: IExportCSVData, room: string) {
        this.logger.info(
            'emit event WEB_APP_SUPPORT_REQUEST_DOWNLOAD with body = ',
            body,
        );
        this.socketGateway.server
            .to(room)
            .emit(SocketEvents.WEB_APP_SUPPORT_REQUEST_EXPORT_CSV, body);
    }
}
