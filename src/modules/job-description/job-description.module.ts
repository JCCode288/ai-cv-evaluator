import { Module } from '@nestjs/common';
import { JobDescriptionService } from './job-description.service';
import { JobDescriptionController } from './job-description.controller';
import { MongodbModule } from '../database/mongodb/mongodb.module';

@Module({
  imports: [MongodbModule],
  providers: [JobDescriptionService],
  controllers: [JobDescriptionController],
})
export class JobDescriptionModule {}
