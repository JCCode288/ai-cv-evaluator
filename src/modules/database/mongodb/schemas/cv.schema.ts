import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CVDetail } from './cv-detail.schema';
import { User } from './user.schema';

@Schema()
export class CV extends Document {
    @Prop({
        required: true,
        text: true,
        index: true,
    })
    cv_filename: string;

    @Prop({
        required: true,
    })
    cv_mimetype: string;

    @Prop({
        required: true,
        text: true,
        index: true,
    })
    project_filename: string;

    @Prop({
        required: true,
    })
    project_mimetype: string;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId }], default: [] })
    details: CVDetail[];

    @Prop({ required: true, default: new Date() })
    created_at: Date;

    @Prop({ required: true, default: new Date() })
    updated_at: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
    uploader: User;
}

export const CVSchema = SchemaFactory.createForClass(CV);
