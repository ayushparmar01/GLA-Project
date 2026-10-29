import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';
import { config } from '../config/env.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log error details for server diagnostics
  console.error(`[Error] ${req.method} ${req.path} - ${statusCode} [${code}]: ${message}`);
  if (!isAppError && err.stack) {
    console.error(err.stack);
  }

  const responseBody: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details: isAppError ? err.details : undefined,
      stack: config.nodeEnv === 'development' ? err.stack : undefined,
    },
  };

  res.status(statusCode).json(responseBody);
};
