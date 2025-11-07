import { ChatPhoto } from './chat-photo.interface';
import { ChatPermissions } from './chat-permissions.interface';
import { Message } from './message.interface';

export interface Chat {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo?: ChatPhoto;
    bio?: string;
    has_private_forwards?: boolean;
    join_to_send_messages?: boolean;
    join_by_request?: boolean;
    description?: string;
    invite_link?: string;
    pinned_message?: Message;
    permissions?: ChatPermissions;
    slow_mode_delay?: number;
    message_auto_delete_time?: number;
    has_protected_content?: boolean;
    sticker_set_name?: string;
    can_set_sticker_set?: boolean;
    linked_chat_id?: number;
    location?: any; // Not implemented yet
}
