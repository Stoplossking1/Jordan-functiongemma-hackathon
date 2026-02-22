// make sure to import this file as early as possible
import dotenv from 'dotenv';
const nodeEnv = process.env.NODE_ENV ?? 'development';
dotenv.config({
  path: [
    `.env.${nodeEnv}.local`, // For specific environments like 'development', 'production', 'test'
    '.env.local',
    `.env.${nodeEnv}`, // For specific environments like 'development', 'production', 'test'
    '.env.node', // Specific to Node.js environment
    '.env', // Default fallback
  ],
});
