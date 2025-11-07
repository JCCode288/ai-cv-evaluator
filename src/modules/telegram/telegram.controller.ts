import { Controller, Post, Body, BadRequestException, UnauthorizedException, Headers } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import type { SetPayload, Update } from './interfaces';

const TOKEN_HEADER = "X-Telegram-Bot-Api-Secret-Token";

@Controller('telegram')
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) { }

    @Post('webhook')
    webhook(@Body() update: Update, @Headers(TOKEN_HEADER) token: string) {
        if (!token) throw new UnauthorizedException("Invalid request");
        if (token !== this.telegramService.secretToken) throw new UnauthorizedException("Invalid request");

        return this.telegramService.handleUpdate(update);
    }

    @Post("setWebhook")
    setWebhook(@Body() setPayload: SetPayload) {
        const hostname = setPayload?.hostname;

        if (!hostname) throw new BadRequestException("Invalid hostname");
        if (!URL.canParse(hostname)) throw new BadRequestException("Invalid hostname");

        return this.telegramService.setWebhook(setPayload.hostname);
    }
}
