import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { Injectable } from '@nestjs/common';
import ConfigKey from 'src/common/config/config-key';

import sgMail, { MailService } from '@sendgrid/mail';

@Injectable()
export class SendGridService {
    constructor(private readonly configService: ConfigService) {
        this.sendGridClient = sgMail;
        this.sendGridClient.setApiKey(
            this.configService.get(ConfigKey.SENDGRID_API_KEY),
        );
    }
    private sendGridClient: MailService;
    private readonly logger = createWinstonLogger(
        'sendgrid',
        this.configService,
    );

    sendMail(data: sgMail.MailDataRequired | sgMail.MailDataRequired[]) {
        try {
            return this.sendGridClient.send(data);
        } catch (error) {
            this.logger.error('error in send email service');
            throw error;
        }
    }
}
