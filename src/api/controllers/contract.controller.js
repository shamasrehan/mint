/**
 * Controllers for handling contract-related requests with improved error handling
 */
const config = require('../../config');
const contractService = require('../services/contract.service');
const openaiService = require('../services/openai.service');
const logger = require('../../utils/logger');

// Session state store - in a production app, this would be in Redis/database
const sessionStore = {
  conversations: new Map(),
  phases: new Map(),
  languages: new Map(),
  lastActivity: new Map(),
  cleanupInterval: null
};

// Initialize cleanup interval for idle sessions
function initSessionCleanup() {
  // Clean up idle sessions every hour
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  const IDLE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  
  sessionStore.cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    sessionStore.lastActivity.forEach((timestamp, sessionId) => {
      if (now - timestamp > IDLE_TIMEOUT) {
        // Clean up idle session
        sessionStore.conversations.delete(sessionId);
        sessionStore.phases.delete(sessionId);
        sessionStore.languages.delete(sessionId);
        sessionStore.lastActivity.delete(sessionId);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      logger.info(`Session cleanup: removed ${cleanedCount} idle sessions`);
    }
  }, CLEANUP_INTERVAL);
}

// Start session cleanup
initSessionCleanup();

/**
 * Generate a unique session ID or get from request
 * @param {Object} req - Express request object
 * @returns {string} Session ID
 */
function getSessionId(req) {
  // Use session ID from request if available (future implementation)
  if (req.sessionID) return req.sessionID;
  
  // Use client IP + user agent as fallback session ID
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'unknown';
  return `${ip}-${userAgent}`.replace(/[^a-zA-Z0-9-]/g, '');
}

/**
 * Get session data for the current request
 * @param {Object} req - Express request object
 * @returns {Object} Session data
 */
function getSessionData(req) {
  const sessionId = getSessionId(req);
  
  // Initialize session if needed
  if (!sessionStore.conversations.has(sessionId)) {
    sessionStore.conversations.set(sessionId, []);
    sessionStore.phases.set(sessionId, 1);
    sessionStore.languages.set(sessionId, config.defaultLanguage);
    sessionStore.lastActivity.set(sessionId, Date.now());
  } else {
    // Update last activity
    sessionStore.lastActivity.set(sessionId, Date.now());
  }
  
  return {
    conversation: sessionStore.conversations.get(sessionId),
    phase: sessionStore.phases.get(sessionId),
    language: sessionStore.languages.get(sessionId),
    sessionId
  };
}

/**
 * Update session data
 * @param {string} sessionId - Session ID
 * @param {Object} data - Updated data
 */
function updateSessionData(sessionId, data) {
  if (data.conversation) {
    sessionStore.conversations.set(sessionId, data.conversation);
  }
  
  if (data.phase) {
    sessionStore.phases.set(sessionId, data.phase);
  }
  
  if (data.language) {
    sessionStore.languages.set(sessionId, data.language);
  }
  
  // Update last activity
  sessionStore.lastActivity.set(sessionId, Date.now());
}

/**
 * Handle chat interactions with improved error handling
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function handleChat(req, res, next) {
  const startTime = Date.now();
  
  try {
    // Validate request
    const { message, newChat, selectedLanguage } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: message is required and must be a string'
      });
    }
    
    // Get or initialize session data
    const { conversation, phase, language, sessionId } = getSessionData(req);
    
    // Log request (truncate long messages)
    const truncatedMessage = message.length > 100 ? 
      `${message.substring(0, 100)}...` : message;
    logger.info(
      `Chat request: sessionId=${sessionId}, phase=${phase}, lang=${language}, message="${truncatedMessage}"`
    );
    
    // Reset conversation if requested
    let currentConversation = conversation;
    let currentPhase = phase;
    let currentLanguage = language;
    
    if (newChat) {
      currentConversation = [];
      currentPhase = 1;
      logger.info(`New chat started for session ${sessionId}`);
    }
    
    // Update language if requested
    if (selectedLanguage && selectedLanguage !== currentLanguage) {
      const langUpdateSuccess = isValidLanguage(selectedLanguage);
      
      if (langUpdateSuccess) {
        currentLanguage = selectedLanguage;
        logger.info(`Language updated to ${selectedLanguage} for session ${sessionId}`);
      } else {
        logger.warn(`Invalid language requested: ${selectedLanguage}`);
      }
    }
    
    // Check OpenAI availability before proceeding
    const isOpenAIAvailable = await openaiService.checkAvailability();
    if (!isOpenAIAvailable) {
      logger.error("OpenAI service unavailable");
      return res.status(503).json({ 
        error: "AI service is currently unavailable. Please try again later.",
        status: "error",
        retryable: true
      });
    }
    
    // Process message via service with timeout protection
    const TIMEOUT = 60000; // 60 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request processing timed out')), TIMEOUT);
    });
    
    const processingPromise = contractService.handleSmartContractAssistant(
      message,
      currentConversation,
      currentPhase,
      currentLanguage
    );
    
    // Race against timeout
    const result = await Promise.race([processingPromise, timeoutPromise])
      .catch(error => {
        logger.error(`Error processing chat: ${error.message}`);
        
        // Determine if error is retryable
        const isRetryable = error.message.includes('timeout') || 
                           error.message.includes('rate limit') ||
                           error.status >= 500;
        
        return {
          error: error.message,
          retryable: isRetryable
        };
      });
    
    // Update session data if there was no error
    if (!result.error) {
      // Update memory
      updateSessionData(sessionId, {
        conversation: result.conversation || currentConversation,
        phase: result.phase || currentPhase,
        language: currentLanguage
      });
    }
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Return response data
    const responseData = {
      phase: result.phase || currentPhase,
      message: result.message || "",
      contract: result.contract || null,
      error: result.error || null,
      functionResult: result.functionResult || null,status: result.error ? "error" : "success",
      retryable: result.retryable || false,
      debug: {
        responseTime: `${responseTime}ms`,
        sessionId: sessionId,
        conversationLength: (result.conversation || currentConversation).length
      }
    };
    
    // Log response status
    logger.info(
      `Chat response: sessionId=${sessionId}, status=${responseData.status}, time=${responseTime}ms`
    );
    
    return res.json(responseData);
  } catch (error) {
    logger.error(`Unexpected error in handleChat: ${error.message}`, { stack: error.stack });
    next(error);
  }
}

/**
 * Health check endpoint with enhanced diagnostics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function healthCheck(req, res) {
  try {
    // Check OpenAI availability
    const isOpenAIAvailable = await openaiService.checkAvailability();
    
    // Basic session stats
    const sessionStats = {
      activeSessions: sessionStore.conversations.size,
      oldestSession: sessionStore.lastActivity.size > 0 ? 
        Math.min(...sessionStore.lastActivity.values()) : null
    };
    
    return res.json({ 
      status: 'ok', 
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      selectedLanguage: config.defaultLanguage,
      aiService: {
        available: isOpenAIAvailable,
        model: config.defaultModel
      },
      sessionStats,
      uptime: Math.floor(process.uptime())
    });
  } catch (error) {
    logger.error(`Error in healthCheck: ${error.message}`);
    return res.status(500).json({ 
      status: 'error',
      error: error.message
    });
  }
}

/**
 * Get current language settings
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function getLanguage(req, res) {
  try {
    // Get session language
    const { language } = getSessionData(req);
    
    return res.json({ 
      language,
      supportedLanguages: Object.values(config.contractLanguages)
    });
  } catch (error) {
    logger.error(`Error in getLanguage: ${error.message}`);
    return res.status(500).json({ 
      error: error.message
    });
  }
}

/**
 * Set contract language
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function setLanguage(req, res) {
  try {
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({ error: 'Missing language parameter' });
    }
    
    // Validate language
    const success = isValidLanguage(language);
    
    if (success) {
      // Update session language
      const { sessionId } = getSessionData(req);
      updateSessionData(sessionId, { language });
      
      logger.info(`Language set to ${language} for session ${sessionId}`);
      
      return res.json({ 
        status: 'success', 
        language 
      });
    } else {
      return res.status(400).json({ 
        error: 'Invalid language', 
        validOptions: Object.values(config.contractLanguages) 
      });
    }
  } catch (error) {
    logger.error(`Error in setLanguage: ${error.message}`);
    return res.status(500).json({ 
      error: error.message
    });
  }
}

/**
 * Validates if the provided language is supported
 * @param {string} language - Language to validate
 * @returns {boolean} Whether language is valid
 */
function isValidLanguage(language) {
  return Object.values(config.contractLanguages).includes(language);
}

/**
 * Generate code from JSON specification
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function generateCode(req, res, next) {
  try {
    const { jsonSpec, language } = req.body;
    
    if (!jsonSpec) {
      return res.status(400).json({ error: 'Missing JSON specification' });
    }
    
    // Get session data
    const { language: sessionLanguage, sessionId } = getSessionData(req);
    const targetLanguage = language || sessionLanguage;
    
    // Validate language
    if (!isValidLanguage(targetLanguage)) {
      return res.status(400).json({ 
        error: 'Invalid language', 
        validOptions: Object.values(config.contractLanguages) 
      });
    }
    
    logger.info(`Generating ${targetLanguage} code for session ${sessionId}`);
    
    // Generate code with timeout protection
    const TIMEOUT = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Code generation timed out')), TIMEOUT);
    });
    
    const generationPromise = contractService.generateCodeFromSpec(jsonSpec, targetLanguage);
    
    // Race against timeout
    const code = await Promise.race([generationPromise, timeoutPromise])
      .catch(error => {
        logger.error(`Error generating code: ${error.message}`);
        throw error;
      });
    
    logger.info(`Code generation successful for session ${sessionId}`);
    
    return res.json({ 
      status: 'success', 
      language: targetLanguage,
      code
    });
  } catch (error) {
    logger.error(`Error in generateCode: ${error.message}`, { stack: error.stack });
    
    // Determine HTTP status code
    const statusCode = error.statusCode || 
                      (error.message.includes('timeout') ? 504 : 500);
    
    return res.status(statusCode).json({
      status: 'error',
      error: error.message,
      retryable: error.message.includes('timeout') || statusCode >= 500
    });
  }
}

/**
 * Handle phase transitions
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function handlePhaseTransition(req, res, next) {
  try {
    const { targetPhase } = req.body;
    
    if (targetPhase === undefined) {
      return res.status(400).json({ error: 'Missing targetPhase parameter' });
    }
    
    // Validate phase
    if (targetPhase < 1 || targetPhase > 3) {
      return res.status(400).json({ error: 'Invalid phase. Must be between 1 and 3.' });
    }
    
    // Get session data
    const { conversation, phase, language, sessionId } = getSessionData(req);
    
    logger.info(`Phase transition request: ${phase} -> ${targetPhase} for session ${sessionId}`);
    
    // Process phase transition
    const result = await contractService.handlePhaseTransition(
      targetPhase,
      conversation,
      phase,
      language
    );

    // Update session if there was no error
    if (!result.error) {
      updateSessionData(sessionId, {
        conversation: result.conversation || conversation,
        phase: result.phase || phase
      });
    }

    // Return response data
    const responseData = {
      phase: result.phase || phase,
      message: result.message || "",
      contract: result.contract || null,
      error: result.error || null,
      status: result.error ? "error" : "success"
    };
    
    logger.info(`Phase transition ${result.error ? 'failed' : 'successful'}: now at phase ${responseData.phase}`);
    
    return res.json(responseData);
  } catch (error) {
    logger.error(`Error in handlePhaseTransition: ${error.message}`, { stack: error.stack });
    next(error);
  }
}

/**
 * Clear session data for the current session
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function clearSession(req, res) {
  try {
    const sessionId = getSessionId(req);
    
    // Remove session data
    sessionStore.conversations.delete(sessionId);
    sessionStore.phases.delete(sessionId);
    sessionStore.lastActivity.delete(sessionId);
    
    // Keep language setting (optional)
    
    logger.info(`Session cleared: ${sessionId}`);
    
    return res.json({ 
      status: 'success',
      message: 'Session data cleared successfully'
    });
  } catch (error) {
    logger.error(`Error in clearSession: ${error.message}`);
    return res.status(500).json({ 
      error: error.message
    });
  }
}

module.exports = {
  handleChat,
  healthCheck,
  getLanguage,
  setLanguage,
  generateCode,
  handlePhaseTransition,
  clearSession
};