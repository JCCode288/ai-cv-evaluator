import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class JobDescription extends Document {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop([String])
    requirements: string[];

    @Prop({ required: true, default: new Date() })
    created_at: Date;

    @Prop({ required: true, default: new Date() })
    updated_at: Date;
}

export const JobDescriptionSchema = SchemaFactory.createForClass(JobDescription);
