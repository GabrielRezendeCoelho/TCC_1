import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { LockedLoggerService } from './locked-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly lockedLogger: LockedLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const userId = request.user?.id || 'anônimo';
    const startTime = Date.now();

    this.lockedLogger.logInfo('HTTP', `→ ${method} ${url} | user: ${userId}`);

    return next.handle().pipe(
      tap((responseData) => {
        const duration = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;
        this.lockedLogger.logInfo(
          'HTTP',
          `← ${method} ${url} | status: ${statusCode} | duração: ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error?.status || 500;
        this.lockedLogger.logError(
          'HTTP',
          `✗ ${method} ${url} | status: ${statusCode} | duração: ${duration}ms`,
          error instanceof Error ? error : new Error(String(error)),
        );
        throw error;
      }),
    );
  }
}
