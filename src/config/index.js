/**
 * Application configuration settings
 */

// Contract language constants
const CONTRACT_LANGUAGES = {
  SOLIDITY: 'solidity',
  VYPER: 'vyper',
  RUST: 'rust'
};

// Environment configuration
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  defaultLanguage: CONTRACT_LANGUAGES.SOLIDITY,
  defaultModel: 'gpt-4',
  
  // OpenAI API config
  // OpenAI API config
  openai: {
    timeout: 60000, // Increase to 60 seconds for longer API calls
    temperature: {
      phase1: 0.7,
      phase2: 0.3, // Lower temperature for more deterministic JSON outputs
      summary: 0.3,
      discussion: 0.7
    },
    maxTokens: {
      phase1: 1000,  // Increase token limits
      phase2: 4000,  // Increase significantly for complex contract generation
      summary: 2000,
      discussion: 1000
    },
    retryAttempts: 3,
    retryDelay: 2000 // Base delay before retrying (will be multiplied by attempt number)
  },
  
  // Contract languages
  contractLanguages: CONTRACT_LANGUAGES
};

module.exports = config;