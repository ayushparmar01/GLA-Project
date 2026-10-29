import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';
import { Role } from '../types/index.js';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  // 1. Try reading from HttpOnly cookie
  if (req.cookies && req.cookies.cb_token) {
    token = req.cookies.cb_token;
  }

  // 2. Fall back to Authorization: Bearer <token> header
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
      },
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication session. Please log in again.',
      },
    });
    return;
  }

  req.user = payload;
  next();
};

export const authorizeRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before accessing this protected resource.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Your role (${req.user.role}) is not authorized for this resource.`,
        },
      });
      return;
    }

    next();
  };
};
