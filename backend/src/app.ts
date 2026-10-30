import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { sanitizeMiddleware } from './middlewares/sanitize.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';

export const createApp = (): Application => {
  const app = express();

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, postman) or matching client url
        if (!origin || config.clientUrl === '*' || origin === config.clientUrl || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-test-rate-limit'],
    })
  );

  // Cookie parser for JWT in HttpOnly cookies
  app.use(cookieParser());

  // Body Parsing Middleware with raw buffer retention for webhook signature verification
  app.use(
    express.json({
      limit: '100kb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Global NoSQL Injection and XSS Sanitizer
  app.use(sanitizeMiddleware);

  // Root welcome / discovery route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      service: 'CareerBridge Backend Server',
      status: 'online',
      version: '0.19.0',
      apiDocs: '/api/health',
    });
  });

  // Mount API Router under /api with API rate limiter
  app.use('/api', apiRateLimiter, apiRouter);

  // 404 Handler for undefined routes
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
