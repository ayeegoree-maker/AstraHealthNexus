// codeauthor chetas karnam
import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger.js';

type AppError = Error & {
  status?: number;
  statusCode?: number;
  publicMessage?: string;
  type?: string;
};

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
  const status = err.statusCode ?? err.status ?? 500;

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON payload'
    });
  }

  if (status >= 500) {
    logger.error(`Unhandled server error: ${err.stack ?? String(err)}`);
  }

  return res.status(status).json({
    status: 'error',
    message:
        err.publicMessage ??
        (status === 404 ? 'Route not found' : 'Internal server error')
  });
}