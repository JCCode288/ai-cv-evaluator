import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import type { SetPayload, Update } from './interfaces';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const TOKEN_HEADER = 'X-Telegram-Bot-Api-Secret-Token';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  webhook(@Body() update: Update, @Headers(TOKEN_HEADER) token: string) {
    if (!token) throw new UnauthorizedException('Invalid request');
    if (token !== this.telegramService.secretToken)
      throw new UnauthorizedException('Invalid request');

    return this.telegramService.handleUpdate(update);
  }

  @Post('setWebhook')
  @UseGuards(JwtAuthGuard) // ideally i would create RBAC for User. and make only admin/super admin can use this endpoint. however i refrain due to time limitation
  setWebhook(@Body() setPayload: SetPayload) {
    const hostname = setPayload?.hostname;

    if (!URL.canParse(hostname))
      throw new BadRequestException('Invalid hostname');
    if (!hostname) throw new BadRequestException('Invalid hostname');

    return this.telegramService.setWebhook(setPayload.hostname);
  }
}
