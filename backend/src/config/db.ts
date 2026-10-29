import mongoose from 'mongoose';
import { config } from './env.js';
import { DatabaseStatus } from '../types/index.js';

const connectionStates: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const connectDatabase = async (): Promise<boolean> => {
  if (!config.mongoUri) {
    console.warn('[MongoDB] MONGODB_URI is not set. Operating in degraded mode (in-memory/no-DB).');
    return false;
  }

  try {
    console.log(`[MongoDB] Attempting connection to MongoDB at: ${config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    
    // Connect with a 4-second timeout to avoid holding startup if DB is down
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });

    console.log('[MongoDB] Successfully connected to database.');
    return true;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[MongoDB] Warning: Unable to connect to MongoDB (${errMessage}). The server will start in degraded mode without crashing.`);
    return false;
  }
};

export const getDbStatus = (): DatabaseStatus => {
  const readyState = mongoose.connection.readyState;
  const stateStr = connectionStates[readyState] || 'unknown';

  if (readyState === 1) {
    return {
      status: 'connected',
      state: stateStr,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }

  return {
    status: readyState === 2 ? 'connecting' : 'disconnected',
    state: stateStr,
  };
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected.');
  }
};
