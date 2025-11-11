import { Module } from '@nestjs/common';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AgentModule } from './modules/agent/agent.module';
import { JobDescriptionModule } from './modules/job-description/job-description.module';
import { AuthModule } from './modules/auth/auth.module';

const configs = [
    ConfigModule.forRoot({
        isGlobal: true,
    }),
    MongooseModule.forRootAsync({
        useFactory: () => {
            const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
            const dbName = process.env.MONGODB_DB_NAME ?? 'ai-cv-evaluator';

            return {
                uri,
                dbName,
            };
        },
    }),
];

const modules = [EvaluationModule, TelegramModule, AgentModule];

@Module({
    imports: [...configs, ...modules, JobDescriptionModule, AuthModule],
})
export class AppModule { }
