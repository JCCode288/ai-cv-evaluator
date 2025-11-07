import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { HttpModule } from '@nestjs/axios';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { ChromaDbModule } from '../database/chromadb/chromadb.module';

@Module({
  imports: [
    HttpModule,
    EvaluationModule,
    MongodbModule,
    ChromaDbModule,

  ],
  providers: [TelegramService],
  controllers: [TelegramController]
})
export class TelegramModule { }
