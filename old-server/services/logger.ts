import fs from 'fs';
import path from 'path';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  stack?: string;
}

// Logger configuration
const config = {
  level: (process.env.LOG_LEVEL as keyof typeof LogLevel) || 'INFO',
  file: process.env.LOG_FILE || 'logs/app.log',
  maxFiles: parseInt(process.env.LOG_MAX_FILES || '10'),
  maxSize: process.env.LOG_MAX_SIZE || '10m',
  console: process.env.NODE_ENV !== 'production'
};

// Ensure log directory exists
const logDir = path.dirname(config.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// File rotation utility
class LogRotator {
  private currentFile: string;
  private currentSize: number = 0;
  private maxSizeBytes: number;

  constructor() {
    this.currentFile = config.file;
    this.maxSizeBytes = this.parseSize(config.maxSize);
    this.ensureFileExists();
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
    const match = size.match(/(\d+(?:\.\d+)?)\s*([kmgt]?)$/i);
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    
    const sizeNum = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    return sizeNum * (units[unit] || 1);
  }

  private ensureFileExists() {
    if (!fs.existsSync(this.currentFile)) {
      fs.writeFileSync(this.currentFile, '');
    }
    this.currentSize = fs.statSync(this.currentFile).size;
  }

  private rotate() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = `${this.currentFile}.${timestamp}`;
    
    fs.copyFileSync(this.currentFile, rotatedFile);
    fs.writeFileSync(this.currentFile, '');
    this.currentSize = 0;
    
    // Clean up old files
    this.cleanup();
  }

  private cleanup() {
    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith(path.basename(config.file)))
      .map(f => ({
        name: f,
        path: path.join(logDir, f),
        mtime: fs.statSync(path.join(logDir, f)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Remove old files beyond maxFiles limit
    for (let i = config.maxFiles; i < files.length; i++) {
      try {
        fs.unlinkSync(files[i].path);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  write(data: string) {
    const dataLength = Buffer.byteLength(data);
    
    if (this.currentSize + dataLength > this.maxSizeBytes) {
      this.rotate();
    }

    fs.appendFileSync(this.currentFile, data);
    this.currentSize += dataLength;
  }
}

const rotator = new LogRotator();

export class Logger {
  private name: string;

  constructor(name: string = 'App') {
    this.name = name;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= LogLevel[config.level];
  }

  private formatEntry(level: LogLevel, message: string, meta?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      meta
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR && meta instanceof Error) {
      entry.stack = meta.stack;
    }

    return JSON.stringify(entry) + '\n';
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatEntry(level, message, meta);
    
    // Write to file
    rotator.write(formatted);
    
    // Write to console if enabled
    if (config.console) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                           level === LogLevel.WARN ? 'warn' : 'log';
      console[consoleMethod](formatted.trim());
    }
  }

  error(message: string, error?: Error | any) {
    this.log(LogLevel.ERROR, message, error);
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  // Structured logging methods
  apiRequest(req: any, res: any, duration: number) {
    this.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }

  apiError(req: any, error: Error, duration: number) {
    this.error('API Error', {
      method: req.method,
      url: req.originalUrl,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      error: error.message,
      stack: error.stack
    });
  }

  providerEvent(providerId: string, event: string, details?: any) {
    this.info('Provider Event', {
      providerId,
      event,
      ...details
    });
  }

  syncEvent(providerId: string, event: string, details?: any) {
    this.info('Sync Event', {
      providerId,
      event,
      ...details
    });
  }

  securityEvent(event: string, details?: any) {
    this.warn('Security Event', {
      event,
      ...details
    });
  }
}

// Create default logger
export const logger = new Logger();

// Global error handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise: promise.toString()
  });
});

// Export logger factory
export function createLogger(name: string): Logger {
  return new Logger(name);
}