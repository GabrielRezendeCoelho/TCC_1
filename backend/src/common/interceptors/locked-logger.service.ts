import { Injectable, Logger } from '@nestjs/common';
import { Mutex } from 'async-mutex';

@Injectable()
export class LockedLoggerService {
  private readonly logger: Logger;
  private readonly mutex = new Mutex();

  constructor() {
    this.logger = new Logger('LockedLogger');
  }

  async logInfo(
    context: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const metaStr = metadata
        ? ` | metadata: ${JSON.stringify(metadata)}`
        : '';
      this.logger.log(`[${context}] ${message}${metaStr}`);
    } finally {
      release();
    }
  }

  async logWarn(
    context: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const metaStr = metadata
        ? ` | metadata: ${JSON.stringify(metadata)}`
        : '';
      this.logger.warn(`[${context}] ${message}${metaStr}`);
    } finally {
      release();
    }
  }

  async logError(
    context: string,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const metaStr = metadata
        ? ` | metadata: ${JSON.stringify(metadata)}`
        : '';
      const errorStr = error ? ` | error: ${error.message}` : '';
      this.logger.error(`[${context}] ${message}${errorStr}${metaStr}`);
    } finally {
      release();
    }
  }

  async executeWithLock<T>(
    context: string,
    operation: string,
    metadata: Record<string, unknown>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const release = await this.mutex.acquire();
    const startTime = Date.now();

    try {
      this.logger.log(
        `[${context}] INÍCIO: ${operation} | metadata: ${JSON.stringify(metadata)}`,
      );
      const result = await fn();
      const duration = Date.now() - startTime;
      this.logger.log(
        `[${context}] FIM: ${operation} | duração: ${duration}ms | metadata: ${JSON.stringify(metadata)}`,
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `[${context}] ERRO: ${operation} | duração: ${duration}ms | error: ${err.message} | metadata: ${JSON.stringify(metadata)}`,
      );
      throw error;
    } finally {
      release();
    }
  }
}
