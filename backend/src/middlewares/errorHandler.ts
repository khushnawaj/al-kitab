import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV === 'development';
  const status = typeof error.status === 'number' ? error.status : (typeof error.statusCode === 'number' ? error.statusCode : 500);
  const rawMessage = error.message || 'Internal server error';

  // Log 5xx errors without leaking credentials or query headers
  if (status >= 500) {
    console.error(`[SERVER ERROR ${status}] ${req.method} ${req.path}:`, isDev ? error : rawMessage);
  }

  res.status(status).json({
    success: false,
    message: status >= 500 && !isDev ? 'An unexpected server error occurred' : rawMessage,
    errors: error.errors || [],
    ...(isDev && error.stack ? { stack: error.stack } : {})
  });
};
