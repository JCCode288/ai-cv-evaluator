import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import CorsConfig from './utils/cors.config';
import { GlobalHttpExceptionFilter } from './exceptions/http-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors(CorsConfig);

    const globalPipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        transform: true,
    });
    app.useGlobalPipes(globalPipe);

    const exceptionFilter = new GlobalHttpExceptionFilter();
    app.useGlobalFilters(exceptionFilter);

    const responseInterceptor = new ResponseInterceptor();
    app.useGlobalInterceptors(responseInterceptor);

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
