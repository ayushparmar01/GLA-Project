import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
    },
  };
  res.status(404).json(response);
};
