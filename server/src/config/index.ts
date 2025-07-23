import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Server configuration for environment-based settings
export const SERVER_CONFIG = {
  // Server settings
  PORT: process.env.PORT || 5000,
  ENV: process.env.NODE_ENV || 'development',
  
  // Frontend configuration (for CORS)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET,
  
  // AI Integration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Development settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
}

// CORS configuration based on environment
export const getCorsOptions = () => {
  const allowedOrigins = SERVER_CONFIG.IS_DEVELOPMENT 
    ? [
        SERVER_CONFIG.FRONTEND_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ]
    : [SERVER_CONFIG.FRONTEND_URL]

  return {
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
  }
}

// Development logging
if (SERVER_CONFIG.IS_DEVELOPMENT) {
  console.log('🔧 Server Configuration:', {
    PORT: SERVER_CONFIG.PORT,
    FRONTEND_URL: SERVER_CONFIG.FRONTEND_URL,
    ENV: SERVER_CONFIG.ENV,
    CORS_ORIGINS: getCorsOptions().origin
  })
}

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars)
  if (SERVER_CONFIG.IS_PRODUCTION) {
    process.exit(1)
  }
}

export default SERVER_CONFIG
