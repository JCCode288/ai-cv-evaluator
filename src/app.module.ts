import { Module } from '@nestjs/common';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';



const configs = [
  ConfigModule.forRoot({
    isGlobal: true
  }),
];

const modules = [
  EvaluationModule,
  DatabaseModule,
];

@Module({
  imports: [...configs, ...modules],
})
export class AppModule { }
