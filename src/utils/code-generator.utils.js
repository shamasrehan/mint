/**
 * Enhanced utilities for generating smart contract code from JSON specs
 * with improved error handling, validation, and language support
 */
const solidityGenerator = require('../contracts/solidity.generator');
const vyperGenerator = require('../contracts/vyper.generator');
const rustGenerator = require('../contracts/rust.generator');
const schemaModel = require('../models/schema.model');
const logger = require('./logger');
const config = require('../config');

/**
 * Validate JSON specification against schema
 * 
 * @param {Object} jsonSpec - The JSON specification to validate
 * @param {string} language - Contract language
 * @returns {Object} Validation result with success flag and errors
 * @throws {Error} If validation fails with critical issues
 */
function validateJsonSpec(jsonSpec, language) {
  if (!jsonSpec || typeof jsonSpec !== 'object') {
    throw new Error('Invalid JSON specification: must be an object');
  }
  
  // Check for required language field based on target language
  const languageKey = language === config.contractLanguages.SOLIDITY ? 'solidity' :
                     language === config.contractLanguages.VYPER ? 'vyper' :
                     language === config.contractLanguages.RUST ? 'rust' : null;
  
  if (languageKey && !jsonSpec[languageKey]) {
    // Add default version if missing
    const defaultVersions = {
      'solidity': '0.8.20',
      'vyper': '0.3.9',
      'rust': '1.70.0'
    };
    
    jsonSpec[languageKey] = defaultVersions[languageKey] || '1.0.0';
    logger.warn(`Added missing ${languageKey} version: ${jsonSpec[languageKey]}`);
  }
  
  // Check contractName
  if (!jsonSpec.contractName) {
    jsonSpec.contractName = 'SmartContract';
    logger.warn('Added missing contractName: SmartContract');
  }
  
  // Check license
  if (!jsonSpec.license) {
    jsonSpec.license = 'MIT';
    logger.warn('Added missing license: MIT');
  }
  
  try {
    // Run full schema validation
    const validationResult = schemaModel.validateContractDefinition(jsonSpec, language);
    
    if (!validationResult.valid) {
      // Log validation errors
      logger.warn('JSON specification validation failed', {
        errors: validationResult.errors,
        language
      });
      
      // Check if errors are critical or can be worked around
      const criticalErrors = validationResult.errors.filter(error => 
        error.keyword === 'required' || 
        error.keyword === 'type' ||
        error.keyword === 'enum'
      );
      
      if (criticalErrors.length > 0) {
        throw new Error(
          `Invalid JSON specification: ${criticalErrors[0].message || 'validation failed'}`
        );
      }
      
      // Return validation result with warnings
      return {
        valid: false,
        warnings: validationResult.errors,
        fixedSpec: jsonSpec
      };
    }
    
    return { valid: true, fixedSpec: jsonSpec };
  } catch (error) {
    logger.error('Schema validation error', {
      error: error.message,
      stack: error.stack
    });
    
    throw new Error(`Schema validation error: ${error.message}`);
  }
}

/**
 * Add standard functionality to incomplete JSON specs
 * 
 * @param {Object} jsonSpec - The JSON specification to enhance
 * @param {string} language - Contract language
 * @returns {Object} Enhanced JSON specification
 */
function enhanceJsonSpec(jsonSpec, language) {
  // Deep clone to avoid modifying the original
  const enhancedSpec = JSON.parse(JSON.stringify(jsonSpec));
  
  // Add standard events if missing
  if (!enhancedSpec.events || enhancedSpec.events.length === 0) {
    enhancedSpec.events = [];
    
    // Add standard events based on contract type inferred from name
    const contractName = enhancedSpec.contractName.toLowerCase();
    
    if (contractName.includes('token') || contractName.includes('erc20')) {
      // Add standard ERC20 events
      enhancedSpec.events.push({
        name: 'Transfer',
        parameters: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      });
      
      enhancedSpec.events.push({
        name: 'Approval',
        parameters: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'spender', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      });
    }
  }
  
  // Ensure we have at least one function if missing
  if (!enhancedSpec.functions || enhancedSpec.functions.length === 0) {
    enhancedSpec.functions = [{
      name: 'example',
      visibility: 'public',
      mutability: 'view',
      returns: {
        type: 'string'
      },
      body: 'return "Hello, World!";'
    }];
  }
  
  // Ensure NatSpec documentation is present
  if (!enhancedSpec.natspec) {
    enhancedSpec.natspec = {
      title: enhancedSpec.contractName,
      author: '',
      notice: `${enhancedSpec.contractName} smart contract`,
      dev: 'Generated using SmartContractHub'
    };
  }
  
  return enhancedSpec;
}

/**
 * Generate contract code based on JSON spec and language
 * with enhanced error handling and validation
 * 
 * @param {Object} jsonSpec - The JSON specification for the contract
 * @param {string} language - The contract language
 * @returns {Promise<string>} Generated contract code
 * @throws {Error} If code generation fails
 */
async function generateContractCode(jsonSpec, language) {
  try {
    // Validate the language
    if (!Object.values(config.contractLanguages).includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    // Log generation attempt
    logger.info(`Generating ${language} code for contract: ${jsonSpec.contractName || 'Unnamed'}`);
    
    // Validate JSON spec against schema
    const validationResult = validateJsonSpec(jsonSpec, language);
    
    // Use validated and fixed specification
    const enhancedSpec = enhanceJsonSpec(validationResult.fixedSpec, language);
    
    // Generate code for the specified language
    let code = '';
    
    switch (language) {
      case config.contractLanguages.SOLIDITY:
        code = await generateSolidityCode(enhancedSpec);
        break;
      case config.contractLanguages.VYPER:
        code = await generateVyperCode(enhancedSpec);
        break;
      case config.contractLanguages.RUST:
        code = await generateRustCode(enhancedSpec);
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
    
    // Add warning comment if validation had warnings
    if (validationResult.warnings) {
      const warningComment = language === config.contractLanguages.SOLIDITY || 
                           language === config.contractLanguages.RUST
        ? '// WARNING: This contract was generated with some schema validation warnings.\n// Review carefully before deployment.\n\n'
        : '# WARNING: This contract was generated with some schema validation warnings.\n# Review carefully before deployment.\n\n';
      
      code = warningComment + code;
    }
    
    return code;
  } catch (error) {
    logger.error(`Error generating contract code: ${error.message}`, {
      language,
      contractName: jsonSpec?.contractName || 'Unnamed',
      stack: error.stack
    });
    
    throw new Error(`Failed to generate ${language} code: ${error.message}`);
  }
}

/**
 * Generate Solidity code with error handling
 * 
 * @param {Object} jsonSpec - Enhanced JSON specification
 * @returns {Promise<string>} Generated Solidity code
 */
async function generateSolidityCode(jsonSpec) {
  try {
    return solidityGenerator.generateCode(jsonSpec);
  } catch (error) {
    logger.error(`Solidity generation error: ${error.message}`, {
      stack: error.stack
    });
    
    // Provide fallback simple code in case of error
    return generateFallbackSolidityCode(jsonSpec);
  }
}

/**
 * Generate Vyper code with error handling
 * 
 * @param {Object} jsonSpec - Enhanced JSON specification
 * @returns {Promise<string>} Generated Vyper code
 */
async function generateVyperCode(jsonSpec) {
  try {
    return vyperGenerator.generateCode(jsonSpec);
  } catch (error) {
    logger.error(`Vyper generation error: ${error.message}`, {
      stack: error.stack
    });
    
    // Provide fallback simple code in case of error
    return generateFallbackVyperCode(jsonSpec);
  }
}

/**
 * Generate Rust code with error handling
 * 
 * @param {Object} jsonSpec - Enhanced JSON specification
 * @returns {Promise<string>} Generated Rust code
 */
async function generateRustCode(jsonSpec) {
  try {
    return rustGenerator.generateCode(jsonSpec);
  } catch (error) {
    logger.error(`Rust generation error: ${error.message}`, {
      stack: error.stack
    });
    
    // Provide fallback simple code in case of error
    return generateFallbackRustCode(jsonSpec);
  }
}

/**
 * Generate fallback Solidity code if the main generator fails
 * 
 * @param {Object} jsonSpec - JSON specification
 * @returns {string} Fallback Solidity code
 */
function generateFallbackSolidityCode(jsonSpec) {
  const contractName = jsonSpec.contractName || 'SmartContract';
  const solVersion = jsonSpec.solidity || '0.8.20';
  const license = jsonSpec.license || 'MIT';
  
  return `// SPDX-License-Identifier: ${license}
// ERROR: This is a fallback contract because there was an error in normal generation
pragma solidity ^${solVersion};

/**
 * @title ${contractName}
 * @notice This is a fallback contract generated due to errors in the main generator
 * @dev Review and replace with proper implementation
 */
contract ${contractName} {
    // Basic state variables
    address public owner;
    string public name;
    
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Constructor
    constructor() {
        owner = msg.sender;
        name = "${contractName}";
    }
    
    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Example function
    function getName() public view returns (string memory) {
        return name;
    }
    
    // Transfer ownership
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}`;
}

/**
 * Generate fallback Vyper code if the main generator fails
 * 
 * @param {Object} jsonSpec - JSON specification
 * @returns {string} Fallback Vyper code
 */
function generateFallbackVyperCode(jsonSpec) {
  const contractName = jsonSpec.contractName || 'SmartContract';
  const vyperVersion = jsonSpec.vyper || '0.3.9';
  const license = jsonSpec.license || 'MIT';
  
  return `#pragma version ${vyperVersion}
# SPDX-License-Identifier: ${license}
# ERROR: This is a fallback contract because there was an error in normal generation

"""
@title ${contractName}
@notice This is a fallback contract generated due to errors in the main generator
@dev Review and replace with proper implementation
"""

# State variables
owner: public(address)
name: public(String[100])

# Events
event OwnershipTransferred:
    previousOwner: indexed(address)
    newOwner: indexed(address)

# Constructor
@external
def __init__():
    self.owner = msg.sender
    self.name = "${contractName}"

# Only owner check
@internal
def _check_owner():
    assert msg.sender == self.owner, "Only owner can call this function"

# Example function
@view
@external
def get_name() -> String[100]:
    return self.name

# Transfer ownership
@external
def transfer_ownership(new_owner: address):
    self._check_owner()
    assert new_owner != empty(address), "New owner is the zero address"
    log OwnershipTransferred(self.owner, new_owner)
    self.owner = new_owner`;
}

/**
 * Generate fallback Rust code if the main generator fails
 * 
 * @param {Object} jsonSpec - JSON specification
 * @returns {string} Fallback Rust code
 */
function generateFallbackRustCode(jsonSpec) {
  const contractName = jsonSpec.contractName || 'SmartContract';
  const rustVersion = jsonSpec.rust || '1.70.0';
  const license = jsonSpec.license || 'MIT';
  
  return `// SPDX-License-Identifier: ${license}
// Using Rust version ${rustVersion}
// ERROR: This is a fallback contract because there was an error in normal generation

#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

/// ${contractName}
/// This is a fallback contract generated due to errors in the main generator
#[ink::contract]
mod ${jsonSpec.contractName ? jsonSpec.contractName.toLowerCase() : 'smart_contract'} {
    use ink_storage::traits::{PackedLayout, SpreadLayout};
    
    /// Contract storage
    #[ink(storage)]
    pub struct ${contractName} {
        /// Owner of the contract
        owner: AccountId,
        /// Name of the contract
        name: ink_prelude::string::String,
    }
    
    /// Events
    #[ink(event)]
    pub struct OwnershipTransferred {
        #[ink(topic)]
        previous_owner: AccountId,
        #[ink(topic)]
        new_owner: AccountId,
    }
    
    /// Errors
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        NotOwner,
        ZeroAddressNotAllowed,
    }
    
    /// Result type
    pub type Result<T> = core::result::Result<T, Error>;
    
    impl ${contractName} {
        /// Constructor
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                name: String::from("${contractName}"),
            }
        }
        
        /// Returns the name of the contract
        #[ink(message)]
        pub fn get_name(&self) -> ink_prelude::string::String {
            self.name.clone()
        }
        
        /// Returns the owner of the contract
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }
        
        /// Transfer ownership to a new account
        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            
            // Ensure new owner is not a zero address (if possible to check in Rust/ink!)
            let zero_account = AccountId::from([0x0; 32]);
            if new_owner == zero_account {
                return Err(Error::ZeroAddressNotAllowed);
            }
            
            let previous_owner = self.owner;
            self.owner = new_owner;
            
            self.env().emit_event(OwnershipTransferred {
                previous_owner,
                new_owner,
            });
            
            Ok(())
        }
    }
}`;
}

/**
 * Helper function to convert common Solidity types to Rust types
 * This helps with cross-language compatibility
 * 
 * @param {string} solidityType - Solidity type to convert
 * @returns {string} Equivalent Rust type
 */
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
  
  // Check for fixed size arrays
  const fixedArrayMatch = solidityType.match(/^(.+)\[(\d+)\]$/);
  if (fixedArrayMatch) {
    const baseType = fixedArrayMatch[1];
    const size = fixedArrayMatch[2];
    return `[${convertTypeToRust(baseType)}; ${size}]`;
  }
  
  // Check for mapping types (simplified)
  if (solidityType.startsWith('mapping(')) {
    const mappingMatch = solidityType.match(/mapping\((.+) => (.+)\)/);
    if (mappingMatch) {
      const keyType = convertTypeToRust(mappingMatch[1].trim());
      const valueType = convertTypeToRust(mappingMatch[2].trim());
      return `HashMap<${keyType}, ${valueType}>`;
    }
    return 'HashMap<AccountId, u128>'; // Fallback
  }
  
  return typeMap[solidityType] || 'String'; // Default to String for unknown types
}

/**
 * Helper function to convert common Solidity types to Vyper types
 * 
 * @param {string} solidityType - Solidity type to convert
 * @returns {string} Equivalent Vyper type
 */
function convertTypeToVyper(solidityType) {
  const typeMap = {
    'uint256': 'uint256',
    'uint128': 'uint128',
    'uint64': 'uint64',
    'uint32': 'uint32',
    'uint8': 'uint8',
    'int256': 'int256',
    'int128': 'int128',
    'int64': 'int64',
    'int32': 'int32',
    'int8': 'int8',
    'bool': 'bool',
    'address': 'address',
    'string': 'String[100]', // Default sized string
    'bytes': 'Bytes[100]'   // Default sized bytes
  };
  
  // Check for array types
  if (solidityType.endsWith('[]')) {
    const baseType = solidityType.slice(0, -2);
    const vyperBaseType = convertTypeToVyper(baseType);
    return `DynArray[${vyperBaseType}, 100]`; // Default to 100 elements
  }
  
  // Check for fixed size arrays
  const fixedArrayMatch = solidityType.match(/^(.+)\[(\d+)\]$/);
  if (fixedArrayMatch) {
    const baseType = fixedArrayMatch[1];
    const size = fixedArrayMatch[2];
    const vyperBaseType = convertTypeToVyper(baseType);
    return `DynArray[${vyperBaseType}, ${size}]`;
  }
  
  // Check for bytes with fixed size
  const fixedBytesMatch = solidityType.match(/^bytes(\d+)$/);
  if (fixedBytesMatch) {
    const size = parseInt(fixedBytesMatch[1]);
    return `Bytes[${size}]`;
  }
  
  // Check for strings with known size
  const fixedStringMatch = solidityType.match(/^string\[(\d+)\]$/);
  if (fixedStringMatch) {
    const size = parseInt(fixedStringMatch[1]);
    return `String[${size}]`;
  }
  
  // Check for mapping types
  if (solidityType.startsWith('mapping(')) {
    const mappingMatch = solidityType.match(/mapping\((.+) => (.+)\)/);
    if (mappingMatch) {
      const keyType = convertTypeToVyper(mappingMatch[1].trim());
      const valueType = convertTypeToVyper(mappingMatch[2].trim());
      return `HashMap[${keyType}, ${valueType}]`;
    }
  }
  
  return typeMap[solidityType] || solidityType;
}

module.exports = {
  generateContractCode,
  convertTypeToRust,
  convertTypeToVyper,
  validateJsonSpec,
  enhanceJsonSpec
};