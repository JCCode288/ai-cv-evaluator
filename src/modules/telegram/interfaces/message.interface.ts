import { User } from './user.interface';
import { Chat } from './chat.interface';
import { MessageEntity } from './message-entity.interface';
import { Audio } from './audio.interface';
import { Document } from './document.interface';
import { PhotoSize } from './photo-size.interface';
import { Video } from './video.interface';
import { Voice } from './voice.interface';
import { Contact } from './contact.interface';
import { Location } from './location.interface';
import { Venue } from './venue.interface';
import { Poll } from './poll.interface';
import { Dice } from './dice.interface';

export interface Message {
  message_id: number;
  from?: User;
  sender_chat?: Chat;
  date: number;
  chat: Chat;
  forward_from?: User;
  forward_from_chat?: Chat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_sender_name?: string;
  forward_date?: number;
  is_automatic_forward?: boolean;
  reply_to_message?: Message;
  via_bot?: User;
  edit_date?: number;
  has_protected_content?: boolean;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
  entities?: MessageEntity[];
  audio?: Audio;
  document?: Document;
  animation?: any; // Not implemented yet
  game?: any; // Not implemented yet
  photo?: PhotoSize[];
  sticker?: any; // Not implemented yet
  video?: Video;
  voice?: Voice;
  video_note?: any; // Not implemented yet
  caption?: string;
  caption_entities?: MessageEntity[];
  contact?: Contact;
  location?: Location;
  venue?: Venue;
  poll?: Poll;
  dice?: Dice;
  new_chat_members?: User[];
  left_chat_member?: User;
  new_chat_title?: string;
  new_chat_photo?: PhotoSize[];
  delete_chat_photo?: boolean;
  group_chat_created?: boolean;
  supergroup_chat_created?: boolean;
  channel_chat_created?: boolean;
  message_auto_delete_timer_changed?: any; // Not implemented yet
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: Message;
  invoice?: any; // Not implemented yet
  successful_payment?: any; // Not implemented yet
  connected_website?: string;
  passport_data?: any; // Not implemented yet
  proximity_alert_triggered?: any; // Not implemented yet
  video_chat_scheduled?: any; // Not implemented yet
  video_chat_started?: any; // Not implemented yet
  video_chat_ended?: any; // Not implemented yet
  video_chat_participants_invited?: any; // Not implemented yet
  web_app_data?: any; // Not implemented yet
  reply_markup?: any; // Not implemented yet
}
