import { InlineKeyboardMarkup } from './inline-keyboard-markup.interface';

export interface SendMessageOptions {
  chat_id: number;
  text: string;
  parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown';
  reply_markup?: InlineKeyboardMarkup;
}
