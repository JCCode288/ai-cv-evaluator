import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { CV } from './cv.schema';

@Schema()
export class Chat extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    user: User;

    @Prop({ required: true })
    update_id?: number;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true })
    type: "human" | "ai";

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: "CV" })
    context?: CV;

    @Prop({ required: true, default: new Date() })
    created_at: Date;

    @Prop({ require: true, default: new Date() })
    updated_at: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);