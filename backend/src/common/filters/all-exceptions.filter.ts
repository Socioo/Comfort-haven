import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapterHost` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as Error)?.message || 'Internal server error';

    // Log the full stack trace for internal server errors
    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `💥 Internal Server Error at ${httpAdapter.getRequestUrl(ctx.getRequest())}`,
        (exception as Error).stack,
      );
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: typeof message === 'object' ? (message as any).message || message : message,
      // Temporarily including debug info in the response to fix the 500 issue
      debug: {
        errorName: (exception as Error)?.name || 'UnknownError',
        stack: (exception as Error)?.stack?.split('\n').slice(0, 5) || [], // Send first 5 lines of stack
      }
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
