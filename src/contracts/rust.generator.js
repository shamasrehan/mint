/**
 * Rust/ink! code generator
 */
const codeGeneratorUtils = require('../utils/code-generator.utils');

/**
 * Generate Rust/ink! code from JSON specification
 * 
 * @param {Object} jsonSpec - The JSON specification for the contract
 * @returns {string} Generated Rust/ink! code
 */
function generateCode(jsonSpec) {
  const contractName = jsonSpec.contractName || "SmartContract";
  const rustVersion = jsonSpec.rust || "1.70.0";
  const license = jsonSpec.license || "MIT";
  
  // Simple Rust/ink! structure
  let code = `// SPDX-License-Identifier: ${license}
// Using Rust version ${rustVersion}

#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

/// ${jsonSpec.natspec?.title || contractName}
/// ${jsonSpec.natspec?.notice || ''}
#[ink::contract]
mod ${jsonSpec.contractName ? jsonSpec.contractName.toLowerCase() : 'smart_contract'} {
    // Import ink storage and environment
    use ink_storage::collections::HashMap;
    use ink_storage::traits::{PackedLayout, SpreadLayout};
    use ink_prelude::string::String;
    
    /// Contract storage
    #[ink(storage)]
    pub struct ${jsonSpec.contractName || 'SmartContract'} {
`;

  // Add state variables
  if (jsonSpec.stateVariables && jsonSpec.stateVariables.length > 0) {
    jsonSpec.stateVariables.forEach(variable => {
      const rustType = codeGeneratorUtils.convertTypeToRust(variable.type);
      code += `        /// ${variable.name}: ${variable.type} in Solidity
        pub ${variable.name}: ${rustType},\n`;
    });
  } else {
    code += "        // State variables will go here\n";
  }
  
  code += `    }
    
    /// Custom errors
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
`;

  // Add custom errors
  if (jsonSpec.errors && jsonSpec.errors.length > 0) {
    jsonSpec.errors.forEach(error => {
      code += `        /// ${error.name} error
        ${error.name},\n`;
    });
  } else {
    code += `        /// Default error
        ContractError,\n`;
  }
  
  code += `    }
    
    /// Type alias for Result type
    pub type Result<T> = core::result::Result<T, Error>;
    
    /// Event definitions
    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        from: Option<AccountId>,
        #[ink(topic)]
        to: Option<AccountId>,
        value: Balance,
    }
    
    impl ${jsonSpec.contractName || 'SmartContract'} {
        /// Constructor
        #[ink(constructor)]
        pub fn new(`;
  
  // Add constructor parameters
  if (jsonSpec.constructor && jsonSpec.constructor.parameters) {
    code += jsonSpec.constructor.parameters.map(param => {
      const rustType = codeGeneratorUtils.convertTypeToRust(param.type);
      return `${param.name}: ${rustType}`;
    }).join(', ');
  }
  
  code += `) -> Self {
            // Create new contract instance
            Self {
`;

  // Initialize state variables
  if (jsonSpec.stateVariables && jsonSpec.stateVariables.length > 0) {
    jsonSpec.stateVariables.forEach(variable => {
      if (variable.initialValue) {
        code += `                ${variable.name}: ${variable.initialValue},\n`;
      } else {
        code += `                ${variable.name}: Default::default(),\n`;
      }
    });
  }

  code += `            }
        }
        
`;

  // Add functions
  if (jsonSpec.functions && jsonSpec.functions.length > 0) {
    jsonSpec.functions.forEach(func => {
      // Add doc comments
      code += `        /// ${func.name} function\n`;
      if (jsonSpec.natspec && jsonSpec.natspec.functionDocs && jsonSpec.natspec.functionDocs[func.name]) {
        const doc = jsonSpec.natspec.functionDocs[func.name];
        if (doc.notice) code += `        /// @notice ${doc.notice}\n`;
        if (doc.dev) code += `        /// @dev ${doc.dev}\n`;
      }
      
      // Function signature with ink! attribute
      if (func.visibility === "external" || func.visibility === "public") {
        code += "        #[ink(message)]\n";
        if (func.mutability === "payable") {
          code += "        #[ink(payable)]\n";
        }
        
        // Add view (no state change) attribute
        if (func.mutability === "view" || func.mutability === "pure") {
          code += `        pub fn ${func.name.toLowerCase()}(&self`;
        } else {
          code += `        pub fn ${func.name.toLowerCase()}(&mut self`;
        }
      } else {
        // Internal functions in Rust
        if (func.mutability === "view" || func.mutability === "pure") {
          code += `        fn ${func.name.toLowerCase()}(&self`;
        } else {
          code += `        fn ${func.name.toLowerCase()}(&mut self`;
        }
      }
      
      // Function parameters
      if (func.parameters && func.parameters.length > 0) {
        if (func.parameters.length > 0) code += ", ";
        code += func.parameters.map(param => {
          const rustType = codeGeneratorUtils.convertTypeToRust(param.type);
          return `${param.name}: ${rustType}`;
        }).join(', ');
      }
      
      code += ")";
      
      // Function return type
      if (func.returns) {
        code += " -> ";
        if (Array.isArray(func.returns)) {
          // Tuple return type
          code += `(${func.returns.map(ret => codeGeneratorUtils.convertTypeToRust(ret.type)).join(', ')})`;
        } else {
          code += codeGeneratorUtils.convertTypeToRust(func.returns.type);
        }
      } else {
        // Default to Result type for non-view functions that don't specify a return
        if (func.mutability !== "view" && func.mutability !== "pure") {
          code += " -> Result<()>";
        } else {
          code += " -> ()";
        }
      }
      
      code += " {\n";
      
      // Function body or placeholder
      if (func.body) {
        const rustBody = func.body
          .replace(/require\(/g, 'ensure!(')
          .replace(/msg.sender/g, 'self.env().caller()');
        
        code += `            // Converted logic from Solidity
            ${rustBody.replace(/\n/g, '\n            ')}\n`;
      } else {
        // Default function implementation
        if (func.returns) {
          code += "            unimplemented!()\n";
        } else {
          if (func.mutability !== "view" && func.mutability !== "pure") {
            code += "            Ok(())\n";
          } else {
            code += "            ()\n";
          }
        }
      }
      
      code += "        }\n\n";
    });
  }
  
  // Add helper methods
  code += `        // Helper methods
        fn _emit_transfer_event(&self, from: Option<AccountId>, to: Option<AccountId>, value: Balance) {
            self.env().emit_event(Transfer {
                from,
                to, 
                value,
            });
        }
`;
  
  // Close implementation and module
  code += `    }
    
    // Tests module
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink_lang as ink;

        #[ink::test]
        fn test_${jsonSpec.contractName ? jsonSpec.contractName.toLowerCase() : 'contract'}() {
            // Test code will go here
            let contract = ${jsonSpec.contractName || 'SmartContract'}::new(
                // Add constructor parameters here
            );
            
            // Add test assertions here
            assert!(true);
        }
    }
}
`;
  
  return code;
}

module.exports = {
  generateCode
};