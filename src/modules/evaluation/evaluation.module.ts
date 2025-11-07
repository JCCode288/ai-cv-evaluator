import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { ExtractorModule } from './extractor/extractor.module';
import { EvaluationController } from './evaluation.controller';
import { AgentModule } from '../agent/agent.module';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { ChromaDbModule } from '../database/chromadb/chromadb.module';

@Module({
  imports: [
    ExtractorModule,
    AgentModule,
    MongodbModule,
    ChromaDbModule
  ],
  providers: [EvaluationService],
  controllers: [EvaluationController],
  exports: [EvaluationService]
})
export class EvaluationModule { }
