import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { CVResult } from './cv-result.schema';
import { JobDescription } from './job-description.schema';

@Schema()
export class Chat extends Document {
    @Prop({ required: true })
    update_id: number;

    @Prop({ required: true })
    chat_id: number;

    @Prop({ required: true })
    message_id: number;

    @Prop({ required: true })
    content: string;

    @Prop({ required: true })
    type: "human" | "ai" | "system";

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: "CVResult" })
    result_context?: CVResult;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: "JobDescription" })
    job_desc_context?: JobDescription;

    @Prop({ required: true, default: new Date() })
    created_at: Date;

    @Prop({ require: true, default: new Date() })
    updated_at: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ chat_id: 1, message_id: 1, update_id: 1 }, { unique: true });