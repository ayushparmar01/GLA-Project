import rateLimit from 'express-rate-limit';

// Standard error generator
const createRateLimitMessage = (action: string, retryAfter: string) => ({
  success: false,
  error: {
    code: 'TOO_MANY_REQUESTS',
    message: `Too many ${action} requests. Please wait ${retryAfter} before trying again.`,
  },
});

/**
 * Tier 1: Authentication Rate Limiter
 * 30 attempts per 15 minutes per IP.
 * Protects login, registration, password resets against brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('authentication', '15 minutes'),
});

/**
 * Tier 2: AI & LLM Inference Rate Limiter
 * 20 requests per minute per IP / authenticated user.
 * Protects ATS resume scanning, AI interview question generation, and AI guidance.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('AI generation', '1 minute'),
});

/**
 * Tier 3: Expensive Computation & File Export Limiter
 * 15 requests per minute per IP.
 * Protects PDF report rendering, heavy analytical queries, and document downloads.
 */
export const expensiveOperationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: createRateLimitMessage('report or file generation', '1 minute'),
});

/**
 * Tier 4: Global API Ceiling Limiter
 * 150 requests per minute per IP.
 * Protects general API endpoints against Denial of Service (DoS) floods.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip in test runs unless explicitly tested via header
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return true;
    }
    return false;
  },
  message: createRateLimitMessage('API', '1 minute'),
});
