import {
  Schema,
  Prop, SchemaFactory
} from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CVDetail } from './cv-detail.schema';

@Schema()
export class CV extends Document {
  @Prop({
    required: true,
    text: true,
    index: true,
    unique: true
  })
  filename: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId }], default: [] })
  details: CVDetail[]
}

export const CVSchema = SchemaFactory.createForClass(CV);
