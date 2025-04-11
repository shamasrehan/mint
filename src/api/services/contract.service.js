/**
 * Service for handling smart contract generation workflow
 */
const openaiService = require('./openai.service');
const promptUtils = require('../../utils/prompt.utils');
const codeGenerator = require('../../utils/code-generator.utils');
const functionExecutor = require('../../utils/function-executor.utils');
const config = require('../../config');

/**
 * The main multi-phase function for smart contract generation
 * 
 * @param {string} userInput - Message from the user
 * @param {Array} conversation - Current conversation history
 * @param {number} phase - Current phase (1 or 2)
 * @param {string} selectedLanguage - Selected contract language
 * @returns {Object} Result object with phase, conversation, message, etc.
 */
async function handleSmartContractAssistant(userInput, conversation = [], phase = 1, selectedLanguage) {
  try {
    if (phase === 1) {
      return await handlePhase1(userInput, conversation, selectedLanguage);
    } else if (phase === 2) {
      return await handlePhase2(userInput, conversation, selectedLanguage);
    } else if (phase === 3) {
      // Handle Phase 3 interactions
      return await handlePhase3(userInput, conversation, selectedLanguage);
    }
  } catch (error) {
    console.error("Error in handleSmartContractAssistant:", error);
    return {
      phase: phase,
      conversation: conversation,
      error: "An unexpected error occurred. Please try again or start a new conversation."
    };
  }
}

/**
 * Handle Phase 3: Contract refinement after generation
 */
async function handlePhase3(userInput, conversation, selectedLanguage) {
  // Check if it's a function call
  if (userInput.startsWith("/")) {
    return handleFunctionCall(userInput, conversation);
  } else {
    // Special handling for regeneration requests
    const isRegenerationRequest = userInput.toLowerCase().match(/\b(regenerate|generate again|redo|remake|recreate)\b/);
    
    if (isRegenerationRequest) {
      return await transitionToPhase3(conversation, selectedLanguage);
    } else {
      // Handle normal conversation in Phase 3
      return handleDiscussion(userInput, conversation, selectedLanguage, true);
    }
  }
}

/**
 * Handle Phase 1: Requirements gathering
 */
/**
 * Handle Phase 1: Requirements gathering
 */
async function handlePhase1(userInput, conversation, selectedLanguage) {
  if (conversation.length === 0) {
    // Starting Phase 1
    const newConversation = await startPhase1(userInput, selectedLanguage);
    return {
      phase: 1,
      conversation: newConversation,
      message: newConversation[newConversation.length - 1].content
    };
  } else {
    // Continue Phase 1
    const result = await continuePhase1(conversation, userInput, selectedLanguage);
    
    // Check if we should transition to Phase 2
    const isRequirementsSummary = result.message.includes("=== REQUIREMENTS SUMMARY ===") || 
                                  result.message.includes("REQUIREMENTS SUMMARY");
                                  
    const userConfirms = userInput.toLowerCase().match(/\b(yes|confirm|agree|ok|proceed|generate|phase 2|correct|sounds good|looks good|that's right|that is right)\b/);
    
    const readyForPhase2 = (isRequirementsSummary && conversation.length > 6) || 
                         (userConfirms && result.message.includes("summary") && conversation.length > 6);

    if (readyForPhase2) {
      try {
        // Add more detailed logging for the transition to Phase 2
        console.log("Transitioning to Phase 2 - Generating smart contract...");
        
        // Show a transition message to the user during generation
        const transitionMessage = {
          phase: 1,
          conversation: [
            ...result.conversation,
            { 
              role: "assistant", 
              content: "I'm now generating your smart contract based on these requirements. This may take a moment..." 
            }
          ],
          message: "I'm now generating your smart contract based on these requirements. This may take a moment..."
        };
        
        // Attempt to generate the contract
        const contract = await generateSmartContract(result.conversation, selectedLanguage);
        
        if (contract.error) {
          console.error("Error during contract generation:", contract.error);
          
          // If contract generation failed, stay in Phase 1 and report the error
          return {
            phase: 1,
            conversation: [
              ...result.conversation,
              { 
                role: "assistant", 
                content: `I encountered an issue generating the contract: ${contract.error}. Let's try a different approach. Could you provide a bit more detail about the contract functionality you need?` 
              }
            ],
            message: `I encountered an issue generating the contract: ${contract.error}. Let's try a different approach. Could you provide a bit more detail about the contract functionality you need?`
          };
        } else {
          // Successful transition to Phase 2
          return {
            phase: 2,
            conversation: result.conversation,
            contract,
            message: "Smart contract has been generated based on your requirements. You can view it in the Contract Preview tab."
          };
        }
      } catch (error) {
        console.error("Error transitioning to Phase 2:", error);
        
        // If there's an exception, stay in Phase 1 with an error message
        return {
          phase: 1,
          conversation: [
            ...result.conversation,
            { 
              role: "assistant", 
              content: "I encountered an unexpected error while generating your contract. Could you provide more details about what you're looking for?" 
            }
          ],
          message: "I encountered an unexpected error while generating your contract. Could you provide more details about what you're looking for?"
        };
      }
    } else {
      // Continue in Phase 1
      return {
        phase: 1,
        conversation: result.conversation,
        message: result.message
      };
    }
  }
}

/**
 * Start Phase 1 conversation
 */
async function startPhase1(userQuery, selectedLanguage, contractType = 'default') {
  try {
    const systemPrompt = promptUtils.compilePrompt('phase1.system', {
      language: selectedLanguage,
      contractType: contractType
    });
    
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "assistant",
        content:
          userQuery ||
          "Hi there! I'll help you create a custom smart contract. To get started:  \n\nWhat type of smart contract are you looking to create? (Examples: token, marketplace, vesting schedule, multisig wallet, voting system, etc.)\n\n(If anything is unclear, you can ask for clarification before answering.)"
      }
    ];
    
    try {
      const response = await openaiService.createChatCompletion(messages, 'phase1');
      
      const assistantReply = response.choices[0].message.content;
      return [...messages, { role: "assistant", content: assistantReply }];
    } catch (openaiError) {
      console.error("OpenAI API error during Phase 1 start:", openaiError);
      
      // Return a graceful error message
      return [
        ...messages,
        { 
          role: "assistant", 
          content: "I'm sorry, I encountered an issue while processing your request. Please try again in a moment. If the problem persists, please check your network connection or try refreshing the page."
        }
      ];
    }
  } catch (error) {
    console.error("Problem during Phase 1 start:", error);
    return [{ role: "assistant", content: "I apologize, but there was a technical issue starting our conversation. Please try again or contact support if the issue persists." }];
  }
}

/**
 * Continue Phase 1 conversation
 */
async function continuePhase1(conversation, userMessage, selectedLanguage) {
  try {
    // Detect if user message appears to be asking for a contract type
    const contractTypeRegex = /\b(token|marketplace|dao|nft|vesting|multisig|auction|wallet|voting)\b/i;
    const contractTypeMatch = userMessage.match(contractTypeRegex);
    const contractType = contractTypeMatch ? contractTypeMatch[1].toLowerCase() : 'default';
    
    // Update system prompt if this is early in the conversation to optimize for contract type
    let updatedConversation = [...conversation];
    
    // Only update system message if we're in the first 3 messages (early stage)
    if (conversation.length <= 3 && contractType !== 'default') {
      const systemPrompt = promptUtils.compilePrompt('phase1.system', {
        language: selectedLanguage,
        contractType: contractType
      });
      
      // Replace the first system message
      if (updatedConversation[0].role === 'system') {
        updatedConversation[0] = { role: 'system', content: systemPrompt };
      }
    }
    
    // Add user message
    updatedConversation.push({ role: "user", content: userMessage });
    
    try {
      const response = await openaiService.createChatCompletion(updatedConversation, 'phase1');
      
      const assistantMessage = response.choices[0].message.content;
      updatedConversation.push({ role: "assistant", content: assistantMessage });
      return { conversation: updatedConversation, message: assistantMessage };
    } catch (openaiError) {
      console.error("OpenAI API error during Phase 1 continuation:", openaiError);
      
      // Add a graceful error message but preserve the conversation
      updatedConversation.push({ 
        role: "assistant", 
        content: "I'm sorry, I encountered an issue processing your message. Could we try again? If the problem persists, you might want to refresh the page or try a slightly different approach to your question." 
      });
      
      return { 
        conversation: updatedConversation, 
        message: "I'm sorry, I encountered an issue processing your message. Could we try again? If the problem persists, you might want to refresh the page or try a slightly different approach to your question." 
      };
    }
  } catch (error) {
    console.error("Problem continuing Phase 1:", error);
    return { 
      conversation, 
      message: "I apologize, but there was a technical issue continuing our conversation. Please try again or contact support if the issue persists." 
    };
  }
}

/**
 * Generate smart contract based on requirements summary
 */
/**
 * Generate smart contract based on requirements summary
 */
async function generateSmartContract(conversation, selectedLanguage) {
  try {
    // Summarize the Phase 1 conversation
    const requirementsSummary = await summarizeRequirements(conversation, selectedLanguage);
    console.log("Generating contract from summary:", requirementsSummary.slice(0,100), "...");

    // Create Phase 2 prompts with the correct language and schema
    const phase2Messages = [
      { 
        role: "system", 
        content: promptUtils.compilePrompt('phase2.system', { 
          language: selectedLanguage
        }) 
      },
      {
        role: "user",
        content: `Here is the requirements summary for the smart contract:\n\n${requirementsSummary}`
      }
    ];

    try {
      // Add additional logging to diagnose API issues
      console.log(`Calling OpenAI API for contract generation (language: ${selectedLanguage})`);
      
      // Add timeout and retry mechanism for more reliability
      let attempts = 0;
      const maxAttempts = 3;
      let response;
      
      while (attempts < maxAttempts) {
        try {
          response = await openaiService.createChatCompletion(phase2Messages, 'phase2', true);
          break; // Success, exit the retry loop
        } catch (apiError) {
          attempts++;
          console.error(`API attempt ${attempts} failed:`, apiError.message);
          
          if (attempts >= maxAttempts) {
            throw apiError; // Rethrow after max attempts
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        }
      }
      
      if (!response) {
        throw new Error("Failed to get response from API after multiple attempts");
      }
      
      const rawContent = response.choices[0].message.content;
      console.log("API response received, content length:", rawContent.length);

      // Attempt to parse JSON output
      try {
        // Add more robust JSON parsing
        let parsedJson;
        try {
          parsedJson = JSON.parse(rawContent);
        } catch (initialJsonError) {
          console.error("Initial JSON parse error:", initialJsonError);
          
          // Try to extract JSON if it's embedded in other text
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsedJson = JSON.parse(jsonMatch[0]);
              console.log("Successfully extracted JSON from response");
            } catch (extractionError) {
              console.error("JSON extraction failed:", extractionError);
              throw initialJsonError; // Rethrow the original error if extraction fails
            }
          } else {
            throw initialJsonError; // Rethrow the original error if no JSON pattern found
          }
        }
        
        // Validate the parsed JSON has minimal required fields
        if (!parsedJson || typeof parsedJson !== 'object') {
          throw new Error("Parsed JSON is not an object");
        }
        
        if (!parsedJson.contractName) {
          // Add contractName if missing
          parsedJson.contractName = "SmartContract";
          console.log("Added missing contractName to JSON");
        }
        
        // Generate sample contract code based on the JSON
        console.log("Generating contract code from JSON spec");
        const contractCode = await codeGenerator.generateContractCode(parsedJson, selectedLanguage);
        
        // Return both the JSON spec and generated code
        return {
          jsonSpec: parsedJson,
          contracts: [
            {
              name: parsedJson.contractName || "SmartContract",
              content: contractCode
            }
          ]
        };
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        
        // Try to repair the JSON if possible
        const repairedJson = promptUtils.attemptJsonRepair(rawContent);
        if (repairedJson) {
          console.log("Successfully repaired JSON");
          
          // Generate sample contract code based on the repaired JSON
          const contractCode = await codeGenerator.generateContractCode(repairedJson, selectedLanguage);
          
          return {
            jsonSpec: repairedJson,
            contracts: [
              {
                name: repairedJson.contractName || "SmartContract",
                content: contractCode
              }
            ],
            warning: "The JSON had to be repaired - please review carefully."
          };
        }
        
        // If all parsing attempts fail, generate a fallback contract
        console.log("Generating fallback contract due to JSON parsing failure");
        const fallbackJson = createFallbackContractJson(requirementsSummary, selectedLanguage);
        const fallbackCode = await codeGenerator.generateContractCode(fallbackJson, selectedLanguage);
        
        return {
          jsonSpec: fallbackJson,
          contracts: [
            {
              name: fallbackJson.contractName || "SmartContract",
              content: fallbackCode
            }
          ],
          warning: "Used fallback contract due to parsing issues - please review carefully."
        };
      }
    } catch (openaiError) {
      console.error("OpenAI API error in Phase 2 generation:", openaiError);
      throw new Error("Error communicating with AI service. Please try again.");
    }
  } catch (error) {
    console.error("Error in Phase 2 generation:", error);
    return { error: error.message || "Error generating the smart contract." };
  }
}

/**
 * Create a fallback contract JSON if all other methods fail
 */
function createFallbackContractJson(requirementsSummary, selectedLanguage) {
  // Extract the contract name from the requirements if possible
  let contractName = "SmartContract";
  const nameMatch = requirementsSummary.match(/contract\s+name:?\s*["']?([A-Za-z0-9]+)["']?/i);
  if (nameMatch && nameMatch[1]) {
    contractName = nameMatch[1];
  }
  
  // Create a minimal valid JSON spec
  return {
    contractName: contractName,
    license: "MIT",
    solidity: "0.8.20",
    vyper: "0.3.9",
    rust: "1.70.0",
    stateVariables: [],
    functions: [
      {
        name: "example",
        visibility: "public",
        mutability: "view",
        returns: {
          type: "string"
        },
        body: "return \"This is a fallback contract. Please regenerate.\";"
      }
    ],
    natspec: {
      title: `${contractName}`,
      notice: "This is a fallback contract generated due to an error in processing requirements.",
      dev: `Requirements summary: ${requirementsSummary.substring(0, 100)}...`
    }
  };
}

/**
 * Summarize requirements from conversation
 */
async function summarizeRequirements(conversation, selectedLanguage) {
  try {
    const summaryMessages = [
      {
        role: "system",
        content: promptUtils.compilePrompt('summarize.system', { language: selectedLanguage })
      },
      ...conversation,
      {
        role: "user",
        content: "Please provide a structured summary of all the requirements for this smart contract."
      }
    ];
    
    try {
      const response = await openaiService.createChatCompletion(summaryMessages, 'summary');
      
      return response.choices[0].message.content;
    } catch (openaiError) {
      console.error("OpenAI API error summarizing requirements:", openaiError);
      
      // Create a basic summary from the conversation as a fallback
      return promptUtils.createBasicSummary(conversation);
    }
  } catch (error) {
    console.error("Error summarizing requirements:", error);
    return "Error summarizing requirements. Using raw conversation instead.";
  }
}

/**
 * Handle Phase 2: Contract refinement
 */
async function handlePhase2(userInput, conversation, selectedLanguage) {
  // Check if it's a function call
  if (userInput.startsWith("/")) {
    return handleFunctionCall(userInput, conversation);
  } else {
    // Check if the user is confirming the requirements
    const isConfirmation = userInput.toLowerCase().match(/\b(yes|confirm|agree|ok|proceed|generate|looks good|that's correct|i confirm|approved)\b/);
    
    if (isConfirmation && conversation.length > 0) {
      // User confirmed requirements, trigger phase 3
      return await transitionToPhase3(conversation, selectedLanguage);
    } else {
      // Normal message in Phase 2 - Use GPT to refine or discuss
      return handleDiscussion(userInput, conversation, selectedLanguage);
    }
  }
}

/**
 * Transition to Phase 3: Generate final contract code
 */
async function transitionToPhase3(conversation, selectedLanguage) {
  try {
    // Generate or retrieve the contract JSON spec from phase 2
    let contractSpec;
    
    // Look for the latest contract specification in the conversation
    for (let i = conversation.length - 1; i >= 0; i--) {
      const message = conversation[i];
      if (message.role === "assistant" && message.content.includes("contract has been generated")) {
        // We've found a reference to the generated contract
        contractSpec = await summarizeRequirements(conversation, selectedLanguage);
        break;
      }
    }
    
    if (!contractSpec) {
      // If we can't find a reference, regenerate the spec
      contractSpec = await summarizeRequirements(conversation, selectedLanguage);
    }
    
    // Generate the contract code
    const contractJson = await generateFinalContractSpec(contractSpec, selectedLanguage);
    const contractCode = await codeGenerator.generateContractCode(contractJson, selectedLanguage);
    
    return {
      phase: 3,
      conversation: [
        ...conversation,
        { role: "user", content: "Please generate the final contract code." },
        { 
          role: "assistant", 
          content: "I've generated the final contract code based on your requirements. You can view it in the Contract Preview tab and make any necessary adjustments."
        }
      ],
      contract: {
        jsonSpec: contractJson,
        contracts: [
          {
            name: contractJson.contractName || "SmartContract",
            content: contractCode
          }
        ]
      },
      message: "I've generated the final contract code based on your requirements. You can view it in the Contract Preview tab and make any necessary adjustments."
    };
  } catch (error) {
    console.error("Error in Phase 3 transition:", error);
    return {
      phase: 2,
      conversation: [
        ...conversation,
        { role: "user", content: "Please generate the final contract code." }
      ],
      message: "I encountered an issue while generating the final contract code. Could you provide more details or try again?"
    };
  }
}

/**
 * Generate the final contract specification
 */
async function generateFinalContractSpec(requirementsSummary, selectedLanguage) {
  try {
    const phase3Messages = [
      { 
        role: "system", 
        content: promptUtils.compilePrompt('phase2.system', { 
          language: selectedLanguage
        }) 
      },
      {
        role: "user",
        content: `Generate the final contract specification using this summary:\n\n${requirementsSummary}`
      }
    ];

    const response = await openaiService.createChatCompletion(phase3Messages, 'phase2', true);
    const rawContent = response.choices[0].message.content;

    try {
      return JSON.parse(rawContent);
    } catch (jsonError) {
      console.error("JSON parse error in final spec:", jsonError);
      
      // Try to repair the JSON if possible
      const repairedJson = promptUtils.attemptJsonRepair(rawContent);
      if (repairedJson) {
        console.log("Successfully repaired JSON in final spec");
        return repairedJson;
      }
      
      throw new Error("Failed to parse contract specification JSON");
    }
  } catch (error) {
    console.error("Error generating final contract spec:", error);
    throw error;
  }
}

/**
 * Handle function call in Phase 2
 */
async function handleFunctionCall(userInput, conversation) {
  const parts = userInput.substring(1).split(" ");
  const command = parts[0];
  const functionArgs = userInput.substring(command.length + 2);
  const allFunctions = ["bugFix", "securityAudit", "gasOptimization", "generateTests"];

  if (allFunctions.includes(command)) {
    try {
      let params;
      try {
        params = functionArgs.trim().length > 0 ? JSON.parse(functionArgs) : {};
      } catch (jsonError) {
        console.warn("Invalid JSON for function args, using empty object:", jsonError);
        params = {};
      }
      
      const funcResult = await functionExecutor.executeFunction(command, params);
      
      return {
        phase: 2,
        conversation: [
          ...conversation,
          { role: "user", content: userInput },
          { role: "assistant", content: `Function result: ${JSON.stringify(funcResult, null, 2)}` }
        ],
        functionResult: funcResult,
        message: `Function ${command} executed successfully.`
      };
    } catch (err) {
      console.error("Error executing function:", err);
      return { 
        phase: 2, 
        conversation: [
          ...conversation,
          { role: "user", content: userInput },
          { role: "assistant", content: `Error executing function: ${err.message}` }
        ],
        error: `Error executing function: ${err.message}` 
      };
    }
  } else {
    return { 
      phase: 2, 
      conversation: [
        ...conversation,
        { role: "user", content: userInput },
        { role: "assistant", content: `Unknown command: ${command}. Available commands are: ${allFunctions.join(', ')}` }
      ],
      error: `Unknown command: ${command}` 
    };
  }
}

/**
 * Handle discussion in Phase 2
 */
/**
 * Handle discussion in Phase 2 or 3
 */
async function handleDiscussion(userInput, conversation, selectedLanguage, isPhase3 = false) {
  try {
    // Create a system message to explain context
    const phaseContext = isPhase3 ? 
      `You are an expert ${selectedLanguage} developer assisting with a smart contract that has been fully generated and is now being refined. The user may want to make specific adjustments to the code, ask for explanations, or request optimizations.` :
      `You are an expert ${selectedLanguage} developer assisting with a smart contract that has already been generated. The user wants to discuss, refine, or ask questions about the contract.`;
    
    const systemMessage = {
      role: "system",
      content: `${phaseContext} 
Focus on providing helpful information about the contract, explaining functionality, or suggesting improvements.
If the user wants significant changes, guide them on how to articulate those changes clearly.`
    };
    
    // Add the system message at the start of the conversation for this specific message
    // but don't persist it in the stored conversation
    const refinementConversation = [
      systemMessage,
      ...conversation,
      { role: "user", content: userInput }
    ];
    
    const response = await openaiService.createChatCompletion(refinementConversation, 'discussion');
    
    const assistantMessage = response.choices[0].message.content;
    
    return {
      phase: isPhase3 ? 3 : 2,
      conversation: [
        ...conversation,
        { role: "user", content: userInput },
        { role: "assistant", content: assistantMessage }
      ],
      message: assistantMessage
    };
  } catch (error) {
    console.error(`Error in Phase ${isPhase3 ? '3' : '2'} discussion:`, error);
    return {
      phase: isPhase3 ? 3 : 2,
      conversation: [
        ...conversation,
        { role: "user", content: userInput }
      ],
      message: "I'm sorry, I encountered an issue processing your message. Could you try rephrasing or providing more details?"
    };
  }
}
/**
 * Generate code from a JSON specification
 */
async function generateCodeFromSpec(jsonSpec, language) {
  try {
    // Validate inputs
    if (!jsonSpec || typeof jsonSpec !== 'object') {
      throw new Error('Invalid JSON specification provided');
    }
    
    if (!Object.values(config.contractLanguages).includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    // Log the generation attempt
    console.log(`Generating ${language} code for contract: ${jsonSpec.contractName || 'Unnamed'}`);
    
    // Call the appropriate generator
    let code = '';
    
    if (language === config.contractLanguages.SOLIDITY) {
      code = await solidityGenerator.generateCode(jsonSpec);
    } else if (language === config.contractLanguages.VYPER) {
      code = await vyperGenerator.generateCode(jsonSpec);
    } else if (language === config.contractLanguages.RUST) {
      code = await rustGenerator.generateCode(jsonSpec);
    } else {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    // Add a header comment to the generated code
    const timestamp = new Date().toISOString();
    const header = `// Code generated by SmartContractHub on ${timestamp}\n` +
                   `// Contract: ${jsonSpec.contractName || 'Unnamed'}\n` +
                   `// Language: ${language}\n\n`;
                   
    return header + code;
  } catch (error) {
    console.error("Error generating code from spec:", error);
    throw new Error(`Failed to generate ${language} code: ${error.message}`);
  }
}

/**
 * Handle transition between phases with proper data management
 * 
 * @param {number} targetPhase - The phase to transition to 
 * @param {Array} conversation - Current conversation history
 * @param {number} currentPhase - Current phase
 * @param {string} selectedLanguage - Selected contract language
 * @returns {Object} Result with updated phase, conversation, etc.
 */
async function handlePhaseTransition(targetPhase, conversation = [], currentPhase = 1, selectedLanguage) {
  console.log(`Requested transition from phase ${currentPhase} to phase ${targetPhase}`);
  
  // Validate target phase
  if (targetPhase < 1 || targetPhase > 3) {
    return {
      phase: currentPhase,
      conversation,
      error: "Invalid phase requested"
    };
  }

  // Handle backwards transitions - clear data from future phases
  if (targetPhase < currentPhase) {
    // Find the last message from the target phase
    let cutoffIndex = -1;
    
    // Simplified phase marker detection
    for (let i = conversation.length - 1; i >= 0; i--) {
      const message = conversation[i];
      // Look for phase markers in assistant messages
      if (message.role === "assistant" && message.metadata && message.metadata.phase === targetPhase) {
        cutoffIndex = i;
        break;
      }
    }
    
    // If phase marker found, truncate conversation
    const trimmedConversation = cutoffIndex >= 0 
      ? conversation.slice(0, cutoffIndex + 1) 
      : [];
      
    return {
      phase: targetPhase,
      conversation: trimmedConversation,
      message: `Returned to Phase ${targetPhase}. ${getPhaseDescription(targetPhase)}`,
      contract: targetPhase >= 2 ? await retrieveCurrentContract(trimmedConversation, selectedLanguage) : null
    };
  }
  
  // Handle forward transitions
  if (targetPhase > currentPhase) {
    if (targetPhase === 2 && currentPhase === 1) {
      // Transition to Phase 2 requires requirements summary
      return await transitionToPhase2(conversation, selectedLanguage);
    } 
    else if (targetPhase === 3 && currentPhase === 2) {
      // Transition to Phase 3 requires contract generation
      return await transitionToPhase3(conversation, selectedLanguage);
    }
  }
  
  // Default - stay in current phase
  return {
    phase: currentPhase,
    conversation,
    message: "Unable to transition phases at this time"
  };
}

/**
 * Retrieve current contract from conversation if available
 */
async function retrieveCurrentContract(conversation, selectedLanguage) {
  // Look for contract data in the conversation metadata
  for (let i = conversation.length - 1; i >= 0; i--) {
    const message = conversation[i];
    if (message.metadata && message.metadata.contract) {
      return message.metadata.contract;
    }
  }
  
  // If no contract found but in phase 2+, generate one
  const lastAssistantMsg = conversation
    .filter(msg => msg.role === "assistant")
    .pop();
    
  if (lastAssistantMsg && lastAssistantMsg.metadata && lastAssistantMsg.metadata.phase >= 2) {
    // Try to regenerate contract
    const requirementsSummary = await summarizeRequirements(conversation, selectedLanguage);
    const contract = await generateSmartContract(requirementsSummary, selectedLanguage);
    return contract;
  }
  
  return null;
}

/**
 * Get a description for each phase
 */
function getPhaseDescription(phase) {
  switch(phase) {
    case 1:
      return "Let's gather your contract requirements.";
    case 2:
      return "Review your requirements summary and make any needed adjustments.";
    case 3:
      return "Your contract has been generated. Let's refine the implementation.";
    default:
      return "";
  }
}

// Add these functions to the module.exports
module.exports = {
  handleSmartContractAssistant,
  generateCodeFromSpec,
  handlePhaseTransition  // Export the new function
};