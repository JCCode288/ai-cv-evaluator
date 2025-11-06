import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import CorsConfig from './utils/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(CorsConfig)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
