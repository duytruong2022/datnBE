import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class AppController {
    @Get('/ping')
    pingAlive() {
        return 'pong pong';
    }
}
