import { Module } from '@nestjs/common';
import { MongodbModule } from './mongodb/mongodb.module';
import { QdrantModule } from './qdrant/qdrant.module';

@Module({
  imports: [MongodbModule, QdrantModule]
})
export class DatabaseModule { }
