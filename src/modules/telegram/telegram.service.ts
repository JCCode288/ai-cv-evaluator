import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Update, SendMessageOptions } from './interfaces';
import * as crypto from 'crypto';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN ?? "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
    private readonly botEndpoint = process.env.TELEGRAM_BOT_ENDPOINT ?? "https://api.telegram.org/bot";
    private readonly apiUrl = `${this.botEndpoint}${this.botToken}`;
    public secretToken?: string = process.env.SECRET_TOKEN;

    constructor(private readonly httpService: HttpService) {
    }

    async handleUpdate(update: Update) {
        try {
            this.logger.log('Received update from Telegram:', update);
            const message = update.message;

            if (!message || !message.text) return { status: "ok" };

            const chatId = message.chat.id;
            const text = message.text;

            await this.sendMessage({ chat_id: chatId, text: `You said: ${text}` });

            return { status: 'ok' };
        } catch (err) {
            this.logger.error("Failed to handle update from telegram:", err);
            throw err;
        }
    }

    async sendMessage(options: SendMessageOptions) {
        const url = `${this.apiUrl}/sendMessage`;
        try {
            const { data } = await firstValueFrom(this.httpService.post(url, options));
            return data;
        } catch (err) {
            this.logger.error('Error sending message to Telegram:', err?.response);
            throw err;
        }
    }

    async setWebhook(hostName: string) {
        const webhookUrl = `${hostName}/telegram/webhook`;
        try {
            let secretToken = this.secretToken;
            if (!secretToken) secretToken = this.generateSecretToken();

            const params = new URLSearchParams({
                url: webhookUrl,
                secret_token: secretToken
            });
            const url = `${this.apiUrl}/setWebhook?${params.toString()}`;

            const { data } = await firstValueFrom(this.httpService.post(url));
            return data;
        } catch (err) {
            this.logger.error("Error setting webhook", err?.response?.data);
            throw err;
        }
    }

    private generateSecretToken() {
        this.secretToken = crypto.randomBytes(32).toString('hex');
        return this.secretToken;
    }
}

