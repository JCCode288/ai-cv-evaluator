import { Module } from '@nestjs/common';
import { RewooAgent } from './rewoo/rewoo.agent';
import { RagAgent } from './rag/rag.agent';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { ChromaDbModule } from '../database/chromadb/chromadb.module';

@Module({
  imports: [MongodbModule, ChromaDbModule],
  providers: [RewooAgent, RagAgent],
  exports: [RewooAgent, RagAgent]
})
export class AgentModule { }
