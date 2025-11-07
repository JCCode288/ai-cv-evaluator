import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
    private readonly ISE_MESSAGE = "Internal Server Error";
    private readonly ISE_STATUS = 500;

    catch(exception: HttpException, host: ArgumentsHost) {
        console.log((exception as any));
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = this.getStatus(exception);
        const message = this.getMessage(exception);

        return response.status(status).json({
            success: false,
            message,
            data: {
                status,
                path: request.url,
                timestamp: new Date().getTime()
            }
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
}