import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { HttpModule } from '@nestjs/axios';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { MongodbModule } from '../database/mongodb/mongodb.module';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [
    HttpModule,
    EvaluationModule,
    MongodbModule,
    EvaluationModule,
    AgentModule,
  ],
  providers: [TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}
