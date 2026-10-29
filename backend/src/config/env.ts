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
};
