/**
 * Utilities for generating smart contract code from JSON specs
 */
const solidityGenerator = require('../contracts/solidity.generator');
const vyperGenerator = require('../contracts/vyper.generator');
const rustGenerator = require('../contracts/rust.generator');
const config = require('../config');

/**
 * Generate contract code based on JSON spec and language
 * 
 * @param {Object} jsonSpec - The JSON specification for the contract
 * @param {string} language - The contract language
 * @returns {Promise<string>} Generated contract code
 */
async function generateContractCode(jsonSpec, language) {
  try {
    // Use the contract name if available
    const contractName = jsonSpec.contractName || "SmartContract";
    
    // Generate a sample contract based on language
    if (language === config.contractLanguages.SOLIDITY) {
      return solidityGenerator.generateCode(jsonSpec);
    } else if (language === config.contractLanguages.VYPER) {
      return vyperGenerator.generateCode(jsonSpec);
    } else if (language === config.contractLanguages.RUST) {
      return rustGenerator.generateCode(jsonSpec);
    } else {
      return `// Unsupported language selected: ${language}`;
    }
  } catch (error) {
    console.error("Error generating contract code:", error);
    return `// Error generating code: ${error.message}`;
  }
}

// Helper function to convert common Solidity types to Rust types
// This helps with cross-language compatibility
function convertTypeToRust(solidityType) {
  const typeMap = {
    'uint256': 'u128',
    'uint128': 'u128',
    'uint64': 'u64',
    'uint32': 'u32',
    'uint8': 'u8',
    'int256': 'i128',
    'int128': 'i128',
    'int64': 'i64',
    'int32': 'i32',
    'int8': 'i8',
    'bool': 'bool',
    'address': 'AccountId',
    'string': 'String',
    'bytes': 'Vec<u8>',
    'bytes32': '[u8; 32]'
  };
  
  // Check for array types
  if (solidityType.endsWith('[]')) {
    const baseType = solidityType.slice(0, -2);
    return `Vec<${convertTypeToRust(baseType)}>`;
  }
  
  // Check for mapping types (very simplified)
  if (solidityType.startsWith('mapping(')) {
    return 'HashMap<AccountId, u128>'; // Simplified assumption
  }
  
  return typeMap[solidityType] || 'String'; // Default to String for unknown types
}

module.exports = {
  generateContractCode,
  convertTypeToRust
};