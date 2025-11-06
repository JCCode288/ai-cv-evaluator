import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { ExtractorModule } from './extractor/extractor.module';
import { AgentModule } from './agent/agent.module';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [ExtractorModule, AgentModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, WebsocketGateway],
})
export class EvaluationModule { }
