/**
 * Service for interacting with OpenAI API
 */
const { OpenAI } = require('openai');
const config = require('../../config');

// Initialize OpenAI with proper error handling
let openai;
try {
  openai = new OpenAI({ apiKey: config.openaiApiKey });
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
  process.exit(1); // Exit if we can't initialize OpenAI client
}

/**
 * Create a chat completion with the OpenAI API
 * 
 * @param {Array} messages - Array of message objects
 * @param {string} phase - Current phase (phase1, phase2, summary, discussion)
 * @param {boolean} jsonResponse - Whether to request JSON response
 * @returns {Object} OpenAI API response
 */
/**
 * Create a chat completion with the OpenAI API
 * 
 * @param {Array} messages - Array of message objects
 * @param {string} phase - Current phase (phase1, phase2, summary, discussion)
 * @param {boolean} jsonResponse - Whether to request JSON response
 * @returns {Object} OpenAI API response
 */
async function createChatCompletion(messages, phase = 'phase1', jsonResponse = false) {
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
  
  try {
    // Add detailed logging for API calls
    console.log(`OpenAI API request: model=${params.model}, phase=${phase}, messages=${messages.length}, json=${jsonResponse}`);
    
    // Set timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), config.openai.timeout);
    });
    
    // Create the API request
    const apiPromise = openai.chat.completions.create(params);
    
    // Race the API request against the timeout
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    // Log successful response
    console.log(`OpenAI API response: status=success, length=${response.choices[0].message.content.length}`);
    
    return response;
  } catch (error) {
    // Log detailed error information
    console.error(`OpenAI API error in phase ${phase}:`, {
      message: error.message,
      code: error.code,
      type: error.type,
      param: error.param,
      statusCode: error.status || error.statusCode
    });
    
    // Enhance error with additional context
    const enhancedError = new Error(`OpenAI API error: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.phase = phase;
    enhancedError.requestData = {
      model: params.model,
      messageCount: messages.length,
      temperature,
      maxTokens,
      jsonResponse
    };
    
    throw enhancedError;
  }
}

module.exports = {
  createChatCompletion
};