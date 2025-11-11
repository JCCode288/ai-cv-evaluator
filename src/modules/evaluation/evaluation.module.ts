import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { ExtractorModule } from './extractor/extractor.module';
import { EvaluationController } from './evaluation.controller';
import { AgentModule } from '../agent/agent.module';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { ChromaDbModule } from '../database/chromadb/chromadb.module';
import { StorageModule } from './storage/storage.module';

@Module({
    imports: [
        ExtractorModule,
        AgentModule,
        MongodbModule,
        ChromaDbModule,
        StorageModule,
    ],
    providers: [EvaluationService],
    controllers: [EvaluationController],
    exports: [EvaluationService],
})
export class EvaluationModule {}
