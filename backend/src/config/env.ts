import dotenv from 'dotenv';

// Load .env file from current working directory or backend root
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  icanSandboxApiKey: string;
  icanSandboxBaseUrl: string;
  // Phase 7 AI Configuration
  aiProvider: string;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  aiTimeoutMs: number;
  aiRateLimitPerMin: number;
  // Phase 10 WhatsApp Business Platform Cloud API
  whatsappEnabled: boolean;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  whatsappVerifyToken: string;
  whatsappAppSecret: string;
  whatsappApiVersion: string;
  whatsappWebhookPath: string;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'careerbridge_development_jwt_secret_key_minimum_32_characters';

if (nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('[Config] CRITICAL: JWT_SECRET must be set to at least 32 characters in production.');
  process.exit(1);
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerbridge',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  icanSandboxApiKey: process.env.ICAN_SANDBOX_API_KEY || '',
  icanSandboxBaseUrl: process.env.ICAN_SANDBOX_BASE_URL || 'https://sandbox.ican.mock/api/v1',
  aiProvider: process.env.AI_PROVIDER || 'DETERMINISTIC_FALLBACK',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  aiTimeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '15000', 10),
  aiRateLimitPerMin: parseInt(process.env.AI_RATE_LIMIT_PER_MIN || '20', 10),
  whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'careerbridge_verify_token_default',
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || '',
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  whatsappWebhookPath: process.env.WHATSAPP_WEBHOOK_PATH || '/api/whatsapp/webhook',
};
