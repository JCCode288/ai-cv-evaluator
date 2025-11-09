import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import e, { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
    private readonly ISE_MESSAGE = "Internal Server Error";
    private readonly ISE_STATUS = 500;
    private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        this.logger.error("Globally handled: ", exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = this.getStatus(exception);
        const message = this.getMessage(exception);
        const data = this.getData(exception, request.url);

        return response.status(status).json({
            success: false,
            message,
            data
        });
    }

    getStatus(exception: Error): number {
        switch (true) {
            case exception instanceof HttpException:
                return exception.getStatus();
            default:
                return this.ISE_STATUS;
        }
    }

    getMessage(exception: Error): string {
        switch (true) {
            case exception instanceof HttpException:
                return exception.message;
            default:
                return this.ISE_MESSAGE;
        }
    }

    getData(exception: unknown, path: string) {
        switch (true) {
            case !!(exception instanceof BadRequestException && (exception as any)?.response?.message):
                return {
                    path: path,
                    timestamp: new Date().getTime(),
                    ...(exception as any)?.response
                }

            case exception instanceof HttpException:
                return {
                    path: path,
                    timestamp: new Date().getTime(),
                }

            default:
                return {
                    path: path,
                    timestamp: new Date().getTime(),
                }
        }
    }
}