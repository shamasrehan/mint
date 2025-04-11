/**
 * Controllers for handling contract-related requests
 */
const config = require('../../config');
const contractService = require('../services/contract.service');

// In-memory state (consider moving to a database in production)
let memoryConversation = [];
let memoryPhase = 1;
let selectedLanguage = config.defaultLanguage;

/**
 * Handle chat interactions
 */
async function handleChat(req, res, next) {
  try {
    const { message, newChat, selectedLanguage: userLang } = req.body;
    
    // Log user message (truncated for clarity)
    console.log(
      `User says: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}", Phase=${memoryPhase} (conv length: ${memoryConversation.length})`
    );

    // Handle new chat
    if (newChat) {
      memoryConversation = [];
      memoryPhase = 1;
      console.log("New chat started, conversation reset.");
    }
    
    // Update language if requested
    if (userLang && userLang !== selectedLanguage) {
      const langUpdateSuccess = setContractLanguageInternal(userLang);
      console.log(`Language update ${langUpdateSuccess ? 'successful' : 'failed'}: ${userLang}`);
    }

    // Process message via service
    const result = await contractService.handleSmartContractAssistant(
      message,
      memoryConversation,
      memoryPhase,
      selectedLanguage
    );

    // Update memory only if there was no error
    if (!result.error) {
      memoryConversation = result.conversation || memoryConversation;
      memoryPhase = result.phase || memoryPhase;
    }

    // Return response data
    const responseData = {
      phase: memoryPhase,
      message: result.message || "",
      contract: result.contract || null,
      error: result.error || null,
      functionResult: result.functionResult || null,
      debug: { 
        conversationLength: memoryConversation.length,
        selectedLanguage: selectedLanguage
      }
    };
    
    return res.json(responseData);
  } catch (error) {
    next(error);
  }
}

/**
 * Health check endpoint
 */
function healthCheck(req, res) {
  return res.json({ 
    status: 'ok', 
    version: '1.0.0',
    selectedLanguage: selectedLanguage
  });
}

/**
 * Get current language
 */
function getLanguage(req, res) {
  return res.json({ 
    language: selectedLanguage,
    supportedLanguages: Object.values(config.contractLanguages)
  });
}

/**
 * Set contract language
 */
function setLanguage(req, res) {
  const { language } = req.body;
  
  if (!language) {
    return res.status(400).json({ error: 'Missing language parameter' });
  }
  
  const success = setContractLanguageInternal(language);
  
  if (success) {
    return res.json({ status: 'success', language: selectedLanguage });
  } else {
    return res.status(400).json({ 
      error: 'Invalid language', 
      validOptions: Object.values(config.contractLanguages) 
    });
  }
}

/**
 * Internal helper for setting language
 */
function setContractLanguageInternal(language) {
  if (Object.values(config.contractLanguages).includes(language)) {
    selectedLanguage = language;
    console.log(`Contract language set to: ${language}`);
    return true;
  }
  console.error(`Invalid language: ${language}`);
  return false;
}

/**
 * Generate code from JSON specification
 */
async function generateCode(req, res, next) {
  try {
    const { jsonSpec, language } = req.body;
    
    if (!jsonSpec) {
      return res.status(400).json({ error: 'Missing JSON specification' });
    }
    
    const targetLanguage = language || selectedLanguage;
    
    // Generate code using the appropriate generator
    const code = await contractService.generateCodeFromSpec(jsonSpec, targetLanguage);
    
    return res.json({ 
      status: 'success', 
      language: targetLanguage,
      code
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle phase transitions
 */
async function handlePhaseTransition(req, res, next) {
  try {
    const { targetPhase } = req.body;
    
    if (targetPhase === undefined) {
      return res.status(400).json({ error: 'Missing targetPhase parameter' });
    }
    
    // Process phase transition
    const result = await contractService.handlePhaseTransition(
      targetPhase,
      memoryConversation,
      memoryPhase,
      selectedLanguage
    );

    // Update memory only if there was no error
    if (!result.error) {
      memoryConversation = result.conversation || memoryConversation;
      memoryPhase = result.phase || memoryPhase;
    }

    // Return response data
    const responseData = {
      phase: memoryPhase,
      message: result.message || "",
      contract: result.contract || null,
      error: result.error || null,
      debug: { 
        conversationLength: memoryConversation.length,
        selectedLanguage: selectedLanguage
      }
    };
    
    return res.json(responseData);
  } catch (error) {
    next(error);
  }
}

// Add to module.exports
module.exports = {
  handleChat,
  healthCheck,
  getLanguage,
  setLanguage,
  generateCode,
  handlePhaseTransition  // Add the new function
};