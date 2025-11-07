import { User } from './user.interface';
import { Message } from './message.interface';

export interface CallbackQuery {
    id: string;
    from: User;
    message?: Message;
    inline_message_id?: string;
    chat_instance: string;
    data?: string;
}
