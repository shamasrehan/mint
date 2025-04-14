/**
 * Service for interacting with OpenAI API with improved error handling and retries
 */
const { OpenAI } = require('openai');
const config = require('../../config');

/**
 * Initialize OpenAI client with error handling
 */
function createOpenAIClient() {
  try {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.');
    }
    
    return new OpenAI({ 
      apiKey: config.openaiApiKey,
      timeout: config.openai.timeout || 60000
    });
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error);
    throw error;
  }
}

// Create the client but handle initialization errors properly
let openai;
try {
  openai = createOpenAIClient();
} catch (initError) {
  console.error("OpenAI client initialization failed:", initError);
  // Don't exit process - allow graceful fallback/startup
  openai = null;
}

/**
 * Implements exponential backoff retry logic
 * @param {Function} operation - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Operation result
 */
async function withRetry(operation, options = {}) {
  const {
    retryAttempts = config.openai.retryAttempts || 3,
    retryDelay = config.openai.retryDelay || 2000,
    retryableStatusCodes = [429, 500, 502, 503, 504],
    retryableErrorTypes = ['rate_limit_exceeded', 'timeout', 'server_error']
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Log the error with attempt information
      console.error(`API error on attempt ${attempt + 1}/${retryAttempts + 1}:`, {
        message: error.message,
        status: error.status || error.statusCode,
        type: error.type,
        code: error.code
      });
      
      // Check if we should retry based on error type
      const isRetryableStatus = error.status && retryableStatusCodes.includes(error.status);
      const isRetryableType = error.type && retryableErrorTypes.includes(error.type);
      const isRetryableError = isRetryableStatus || isRetryableType || 
                             error.message.includes('timeout') ||
                             error.message.includes('network');
      
      // Don't retry if this was the last attempt or error is not retryable
      if (attempt >= retryAttempts || !isRetryableError) {
        break;
      }
      
      // Calculate backoff delay with jitter
      const jitter = 0.2 * Math.random() * retryDelay; // 20% jitter
      const delay = retryDelay * Math.pow(2, attempt) + jitter;
      
      console.log(`Retrying in ${Math.round(delay / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, we've exhausted retries or encountered a non-retryable error
  throw lastError;
}

/**
 * Create a chat completion with the OpenAI API with improved error handling
 * 
 * @param {Array} messages - Array of message objects
 * @param {string} phase - Current phase (phase1, phase2, summary, discussion)
 * @param {boolean} jsonResponse - Whether to request JSON response
 * @returns {Object} OpenAI API response
 * @throws {Error} Enhanced error with details
 */
async function createChatCompletion(messages, phase = 'phase1', jsonResponse = false) {
  // Check if OpenAI client is initialized
  if (!openai) {
    try {
      openai = createOpenAIClient();
    } catch (initError) {
      throw new Error(`OpenAI client unavailable: ${initError.message}`);
    }
  }
  
  // Set parameters based on phase
  const temperature = config.openai.temperature[phase] || 0.7;
  const maxTokens = config.openai.maxTokens[phase] || 500;
  
  const params = {
    model: config.defaultModel,
    messages,
    temperature,
    top_p: 0.95,
    max_tokens: maxTokens,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  };
  
  // Request JSON response if specified
  if (jsonResponse) {
    params.response_format = { type: "json_object" };
  }
  
  // Log request parameters
  console.log(`OpenAI request: phase=${phase}, model=${params.model}, messages=${messages.length}, json=${jsonResponse}`);
  
  try {
    // Execute API request with retry logic
    const response = await withRetry(
      async () => await openai.chat.completions.create(params),
      {
        retryAttempts: config.openai.retryAttempts,
        retryDelay: config.openai.retryDelay
      }
    );
    
    // Log successful response
    console.log(`OpenAI response: status=success, length=${response.choices[0].message.content.length}`);
    
    return response;
  } catch (error) {
    // Log error details
    console.error(`OpenAI API error in phase ${phase}:`, {
      message: error.message,
      status: error.status || error.statusCode,
      type: error.type,
      code: error.code,
      param: error.param
    });
    
    // Create enhanced error with additional context
    const enhancedError = new Error(formatErrorMessage(error, phase));
    enhancedError.originalError = error;
    enhancedError.phase = phase;
    enhancedError.status = error.status || error.statusCode;
    enhancedError.details = {
      model: params.model,
      messageCount: messages.length,
      temperature,
      maxTokens,
      jsonResponse
    };
    
    throw enhancedError;
  }
}

/**
 * Format an error message with relevant context
 * @param {Error} error - Original error
 * @param {string} phase - Current operation phase
 * @returns {string} Formatted error message
 */
function formatErrorMessage(error, phase) {
  let baseMessage = 'An error occurred while processing your request';
  
  // Add specific error messages based on status code
  if (error.status === 429) {
    baseMessage = 'API rate limit exceeded. Please try again in a moment.';
  } else if (error.status >= 500) {
    baseMessage = 'The AI service is currently experiencing issues. Please try again later.';
  } else if (error.status === 401) {
    baseMessage = 'API authentication error. Please check API key configuration.';
  } else if (error.status === 400) {
    baseMessage = 'Invalid request parameters sent to AI service.';
  }
  
  // Add context from the original error message for developers
  if (process.env.NODE_ENV === 'development' && error.message) {
    return `${baseMessage} (${error.message})`;
  }
  
  return baseMessage;
}

/**
 * Check if OpenAI is available by making a simple request
 * @returns {Promise<boolean>} Whether OpenAI is available
 */
async function checkAvailability() {
  try {
    if (!openai) {
      openai = createOpenAIClient();
    }
    
    // Make a simple request
    await openai.models.list({ limit: 1 });
    return true;
  } catch (error) {
    console.error("OpenAI availability check failed:", error);
    return false;
  }
}

module.exports = {
  createChatCompletion,
  checkAvailability
};