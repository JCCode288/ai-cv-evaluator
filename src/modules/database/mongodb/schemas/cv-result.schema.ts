import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CV } from './cv.schema';

@Schema()
export class CVResult extends Document {
    @Prop({ required: true })
    cv_match_rate: number;

    @Prop({ required: true })
    cv_feedback: string;

    @Prop({ required: true })
    project_score: number;

    @Prop({ required: true })
    project_feedback: string;

    @Prop({ required: true })
    overall_summary: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CV', required: true })
    CV: CV;
}

export const CVResultSchema = SchemaFactory.createForClass(CVResult);

CVResultSchema.index({ CV: 1, page: 1, vector_id: 1 }, { unique: true });