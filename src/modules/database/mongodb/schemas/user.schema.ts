import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Chat } from './chat.schema';

@Schema({
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})
export class User extends Document {
    @Prop({ required: true, index: true })
    username: string;

    @Prop({ default: '' })
    summary: string;

    @Prop({ unique: true })
    email?: string;

    @Prop()
    password?: string;

    @Prop()
    hashedRefreshToken?: string;

    @Prop({ index: true })
    telegram_id?: number;

    @Prop({ required: true, default: new Date() })
    created_at: Date;

    @Prop({ required: true, default: new Date() })
    updated_at: Date;

    chats: Chat[];

    @Prop({ required: true, default: [] })
    weights: number[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('chats', {
    ref: 'Chat',
    localField: 'telegram_id',
    foreignField: 'chat_id',
});

UserSchema.index({ email: 1, username: 1 }, { unique: true });
