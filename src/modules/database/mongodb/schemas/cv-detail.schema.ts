import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CV } from './cv.schema';

@Schema()
export class CVDetail extends Document {
    @Prop({ required: true })
    page: number;

    @Prop({ required: true })
    base64_image: string;

    @Prop({ type: [String], default: [] })
    texts: string[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CV', required: true })
    CV: CV;

    @Prop({ required: true, default: new Date() })
    created_at: Date;

    @Prop({ required: true, default: new Date() })
    updated_at: Date;
}

export const CVDetailSchema = SchemaFactory.createForClass(CVDetail);

CVDetailSchema.index({ CV: 1, page: 1 }, { unique: true });