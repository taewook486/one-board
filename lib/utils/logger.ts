/**
 * Structured logging utility for OneBoard
 * Replaces console.* calls with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerConfig {
  level: LogLevel;
  isDevelopment: boolean;
  enableColors: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      isDevelopment: process.env.NODE_ENV === 'development',
      enableColors: true,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(entry: LogEntry): string {
    if (this.config.isDevelopment && this.config.enableColors) {
      const color = LOG_COLORS[entry.level];
      const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase().padEnd(5)}`;
      let message = `${color}${prefix}${RESET_COLOR} ${entry.message}`;

      if (entry.context && Object.keys(entry.context).length > 0) {
        message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }

      if (entry.error) {
        message += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack && this.config.isDevelopment) {
          message += `\n  Stack: ${entry.error.stack}`;
        }
      }

      return message;
    }

    // Production: JSON format for log aggregation
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    const formattedMessage = this.formatMessage(entry);

    // Use console for output (Edge Runtime compatible)
    // In production, this would be replaced with a proper logging service
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log('error', message, context, errorObj);
  }

  // Convenience methods for common patterns
  apiRequest(method: string, path: string, context?: Record<string, unknown>): void {
    this.info(`API Request: ${method} ${path}`, context);
  }

  apiResponse(method: string, path: string, status: number, duration?: number): void {
    const context = duration ? { status, duration: `${duration}ms` } : { status };
    this.info(`API Response: ${method} ${path}`, context);
  }

  dbQuery(query: string, duration?: number): void {
    const context = duration ? { duration: `${duration}ms` } : undefined;
    this.debug(`DB Query: ${query}`, context);
  }

  dbError(operation: string, error: Error): void {
    this.error(`DB Error: ${operation}`, error);
  }

  authEvent(event: string, userId?: number | string): void {
    this.info(`Auth Event: ${event}`, { userId });
  }

  securityEvent(event: string, context?: Record<string, unknown>): void {
    this.warn(`Security Event: ${event}`, context);
  }
}

// Export singleton instance
const logger = new Logger();

export default logger;
export { Logger, type LogLevel, type LogEntry };
