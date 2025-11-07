import { Module } from '@nestjs/common';
import { JobDescriptionService } from './job-description.service';
import { JobDescriptionController } from './job-description.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JobDescription, JobDescriptionSchema } from '../database/mongodb/schemas/job-description.schema';
import { MongodbModule } from '../database/mongodb/mongodb.module';

@Module({
  imports: [MongodbModule],
  providers: [JobDescriptionService],
  controllers: [JobDescriptionController]
})
export class JobDescriptionModule { }
