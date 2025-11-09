import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Chat } from './chat.schema';

@Schema()
export class User extends Document {
  @Prop({ required: true, index: true })
  username: string;

  @Prop({ default: "" })
  summary: string;

  @Prop({ unique: true })
  email?: string;

  @Prop()
  password?: string;

  @Prop()
  hashedRefreshToken?: string;

  @Prop({ index: true })
  telegram_id?: string;

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

UserSchema.index({ email: 1, username: 1 }, { unique: true });