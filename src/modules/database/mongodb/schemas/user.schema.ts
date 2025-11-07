import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Chat } from './chat.schema';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: "" })
  summary: string;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true, index: true })
  telegram_id: string;

  @Prop({ required: true, default: new Date() })
  created_at: Date;

  @Prop({ required: true, default: new Date() })
  updated_at: Date;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: "Chat", default: [] }])
  chats: Chat[];

  @Prop({ required: true, default: [] })
  weights: number[];
}

export const UserSchema = SchemaFactory.createForClass(User);
