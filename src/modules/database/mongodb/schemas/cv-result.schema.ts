import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CV } from './cv.schema';
import { User } from './user.schema';
import { CVStatusEnum } from 'src/utils/cv-status.enum';
import { JobDescription } from './job-description.schema';

@Schema()
export class CVResult extends Document {
  @Prop({})
  cv_match_rate?: number;

  @Prop({})
  cv_feedback?: string;

  @Prop({})
  project_score?: number;

  @Prop({})
  project_feedback?: string;

  @Prop({})
  overall_score?: number;

  @Prop({})
  overall_summary?: string;

  @Prop({ required: true })
  status: `${CVStatusEnum}`;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'JobDescription',
  })
  jobDescription: JobDescription;

  @Prop({ required: true, default: new Date() })
  created_at: Date;

  @Prop({ required: true, default: new Date() })
  updated_at: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CV', required: true })
  CV: CV;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  evaluator: User;
}

export const CVResultSchema = SchemaFactory.createForClass(CVResult);

CVResultSchema.index({ CV: 1, jobDescription: 1 }, { unique: true });
