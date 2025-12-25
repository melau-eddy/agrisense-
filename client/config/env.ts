// Environment configuration
const ENV = {
  // Groq API Configuration
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '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',
  
  // Firebase Configuration (already in firebase.ts)
  // Add other API keys and secrets here
  
  // App Configuration
  APP_NAME: 'AgriSense',
  APP_VERSION: '1.0.0',
  
  // API Endpoints
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.agrisense.com',
  
  // Feature Flags
  ENABLE_AI_CHAT: true,
  ENABLE_ANALYTICS: true,
  
  // Debug Mode
  DEBUG: process.env.NODE_ENV === 'development',
} as const;

// Validation
if (!ENV.GROQ_API_KEY && ENV.ENABLE_AI_CHAT) {
  console.warn('⚠️  Groq API key is not set. AI chat features will not work.');
}

export default ENV;