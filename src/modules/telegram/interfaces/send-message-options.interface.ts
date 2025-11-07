import { InlineKeyboardMarkup } from './inline-keyboard-markup.interface';

export interface SendMessageOptions {
    chat_id: number;
    text: string;
    parse_mode?: 'MarkdownV2' | 'HTML';
    reply_markup?: InlineKeyboardMarkup;
}
