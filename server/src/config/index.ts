/**
 * Configuration Module
 * ----------------------------------------------------------------------------
 * Centralized configuration management with environment variable validation.
 */

/**
 * Validates that required environment variables are present
 * @throws Error if required environment variables are missing
 */
function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please create a .env file with the required variables.'
    );
  }
}

// Validate environment on module load
validateEnv();

/**
 * Server Configuration
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS (can be extended for production)
  corsOrigin: process.env.CORS_ORIGIN || '*',
} as const;

/**
 * Type-safe configuration access
 */
export type Config = typeof config;
