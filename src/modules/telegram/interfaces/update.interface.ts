import { Message } from './message.interface';
import { CallbackQuery } from './callback-query.interface';
import { Poll } from './poll.interface';

export interface Update {
    update_id: number;
    message?: Message;
    edited_message?: Message;
    channel_post?: Message;
    edited_channel_post?: Message;
    inline_query?: any; // Not implemented yet
    chosen_inline_result?: any; // Not implemented yet
    callback_query?: CallbackQuery;
    shipping_query?: any; // Not implemented yet
    pre_checkout_query?: any; // Not implemented yet
    poll?: Poll;
    poll_answer?: any; // Not implemented yet
    my_chat_member?: any; // Not implemented yet
    chat_member?: any; // Not implemented yet
    chat_join_request?: any; // Not implemented yet
}
