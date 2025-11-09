import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Update, SendMessageOptions } from './interfaces';
import * as crypto from 'crypto';
import { RagAgent } from '../agent/rag/rag.agent';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../database/mongodb/schemas';
import { Model } from 'mongoose';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN ?? "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11";
    private readonly botEndpoint = process.env.TELEGRAM_BOT_ENDPOINT ?? "https://api.telegram.org/bot";
    private readonly apiUrl = `${this.botEndpoint}${this.botToken}`;
    public secretToken?: string = process.env.SECRET_TOKEN;

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        private readonly httpService: HttpService,
        private readonly ragAgent: RagAgent
    ) { }

    async handleUpdate(update: Update) {
        try {
            this.logger.log('Received update from Telegram:', update);
            const message = update.message;

            if (!message || !message.text) return { status: "ok" };

            const chatId = message.chat.id;
            const messageId = message.message_id;
            const updateId = update.update_id;
            const parseMode = "Markdown";

            if (!message.from?.username)
                return await this.sendMessage({
                    chat_id: chatId,
                    text: "I am sorry, you have to set your user name before talking to me."
                });

            const user = await this.userModel.findOneAndUpdate(
                { telegram_id: chatId },
                {
                    $setOnInsert: {
                        telegram_id: chatId,
                        username: message.from.username,
                    },
                },
                { upsert: true, new: true },
            ).populate({ path: 'chats', options: { sort: { update_id: 1, type: -1 } } }).exec();

            const history = user?.chats;

            const input = message.text?.replaceAll('/', '');
            const text = await this.ragAgent.chat({
                chat_id: chatId,
                message_id: messageId,
                update_id: updateId,
                input,
                history
            });

            if (!text)
                return await this.sendMessage({
                    chat_id: chatId,
                    text: "I am sorry, there's something wrong with me. Please try again in 5 minutes",
                });

            await this.sendMessage({ chat_id: chatId, text, parse_mode: parseMode });

            return { status: 'ok' };
        } catch (err) {
            // this.logger.error("Failed to handle update from telegram:", err);
            return { status: 'failed' }
        }
    }

    async sendMessage(options: SendMessageOptions) {
        const url = `${this.apiUrl}/sendMessage`;
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(url, options)
            );

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

