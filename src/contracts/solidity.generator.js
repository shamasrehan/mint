/**
 * Solidity code generator
 */

/**
 * Generate Solidity code from JSON specification
 * 
 * @param {Object} jsonSpec - The JSON specification for the contract
 * @returns {string} Generated Solidity code
 */
function generateCode(jsonSpec) {
  const contractName = jsonSpec.contractName || "SmartContract";
  const solVersion = jsonSpec.solidity || "0.8.20";
  const license = jsonSpec.license || "MIT";
  
  // Start with basic contract structure
  let code = `// SPDX-License-Identifier: ${license}
pragma solidity ^${solVersion};

`;

  // Add imports if available
  if (jsonSpec.imports && jsonSpec.imports.length > 0) {
    jsonSpec.imports.forEach(imp => {
      code += `import "${imp.path}";\n`;
    });
    code += "\n";
  }

  // Add NatSpec documentation if available
  if (jsonSpec.natspec) {
    code += "/**\n";
    if (jsonSpec.natspec.title) code += ` * @title ${jsonSpec.natspec.title}\n`;
    if (jsonSpec.natspec.author) code += ` * @author ${jsonSpec.natspec.author}\n`;
    if (jsonSpec.natspec.notice) code += ` * @notice ${jsonSpec.natspec.notice}\n`;
    if (jsonSpec.natspec.dev) code += ` * @dev ${jsonSpec.natspec.dev}\n`;
    
    // Add custom tags
    if (jsonSpec.natspec.custom) {
      Object.entries(jsonSpec.natspec.custom).forEach(([tag, value]) => {
        code += ` * @${tag} ${value}\n`;
      });
    }
    
    code += " */\n";
  }

  // Open contract declaration
  code += `contract ${contractName}`;
  
  // Add inheritance if available
  if (jsonSpec.inheritance && jsonSpec.inheritance.length > 0) {
    code += ` is ${jsonSpec.inheritance.join(', ')}`;
  }
  
  code += " {\n";
  
  // Add structs
  if (jsonSpec.structs && jsonSpec.structs.length > 0) {
    code += "    // Struct definitions\n";
    jsonSpec.structs.forEach(struct => {
      code += `    struct ${struct.name} {\n`;
      struct.fields.forEach(field => {
        code += `        ${field.type} ${field.name};\n`;
      });
      code += "    }\n\n";
    });
  }
  
  // Add enums
  if (jsonSpec.enums && jsonSpec.enums.length > 0) {
    code += "    // Enum definitions\n";
    jsonSpec.enums.forEach(enumDef => {
      code += `    enum ${enumDef.name} {\n`;
      code += `        ${enumDef.values.join(',\n        ')}\n`;
      code += "    }\n\n";
    });
  }
  
  // Add events
  if (jsonSpec.events && jsonSpec.events.length > 0) {
    code += "    // Events\n";
    jsonSpec.events.forEach(event => {
      // Add NatSpec if available
      if (jsonSpec.natspec && jsonSpec.natspec.functionDocs && jsonSpec.natspec.functionDocs[event.name]) {
        const doc = jsonSpec.natspec.functionDocs[event.name];
        code += "    /**\n";
        if (doc.notice) code += `     * @notice ${doc.notice}\n`;
        if (doc.dev) code += `     * @dev ${doc.dev}\n`;
        code += "     */\n";
      }
      
      code += `    event ${event.name}(`;
      if (event.parameters && event.parameters.length > 0) {
        code += event.parameters.map(param => {
          return `${param.type} ${param.indexed ? 'indexed ' : ''}${param.name}`;
        }).join(', ');
      }
      code += ");\n\n";
    });
  }
  
  // Add custom errors
  if (jsonSpec.errors && jsonSpec.errors.length > 0) {
    code += "    // Custom Errors\n";
    jsonSpec.errors.forEach(error => {
      code += `    error ${error.name}(`;
      if (error.parameters && error.parameters.length > 0) {
        code += error.parameters.map(param => `${param.type} ${param.name}`).join(', ');
      }
      code += ");\n";
    });
    code += "\n";
  }
  
  // Add constants
  if (jsonSpec.constants && jsonSpec.constants.length > 0) {
    code += "    // Constants\n";
    jsonSpec.constants.forEach(constant => {
      code += `    ${constant.type} ${constant.visibility || 'internal'} constant ${constant.name} = ${constant.value};\n`;
    });
    code += "\n";
  }
  
  // Add state variables
  if (jsonSpec.stateVariables && jsonSpec.stateVariables.length > 0) {
    code += "    // State variables\n";
    jsonSpec.stateVariables.forEach(variable => {
      let modifier = '';
      if (variable.visibility) {
        modifier += ` ${variable.visibility}`;
      }
      if (variable.immutable) {
        modifier += ' immutable';
      }
      code += `    ${variable.type}${modifier} ${variable.name}`;
      
      // Add initial value if available
      if (variable.initialValue) {
        code += ` = ${variable.initialValue}`;
      }
      
      code += ";\n";
    });
    code += "\n";
  }
  
  // Add mappings
  if (jsonSpec.mappings && jsonSpec.mappings.length > 0) {
    code += "    // Mappings\n";
    jsonSpec.mappings.forEach(mapping => {
      code += `    mapping(${mapping.keyType} => ${mapping.valueType}) ${mapping.visibility || 'private'} ${mapping.name};\n`;
    });
    code += "\n";
  }
  
  // Add modifiers
  if (jsonSpec.modifiers && jsonSpec.modifiers.length > 0) {
    code += "    // Modifiers\n";
    jsonSpec.modifiers.forEach(modifier => {
      // Add NatSpec if available
      if (jsonSpec.natspec && jsonSpec.natspec.functionDocs && jsonSpec.natspec.functionDocs[modifier.name]) {
        const doc = jsonSpec.natspec.functionDocs[modifier.name];
        code += "    /**\n";
        if (doc.notice) code += `     * @notice ${doc.notice}\n`;
        if (doc.dev) code += `     * @dev ${doc.dev}\n`;
        
        // Add parameter docs
        if (doc.params) {
          Object.entries(doc.params).forEach(([paramName, paramDesc]) => {
            code += `     * @param ${paramName} ${paramDesc}\n`;
          });
        }
        
        code += "     */\n";
      }
      
      code += `    modifier ${modifier.name}(`;
      
      // Add parameters
      if (modifier.parameters && modifier.parameters.length > 0) {
        code += modifier.parameters.map(param => `${param.type} ${param.name}`).join(', ');
      }
      
      code += ") {\n";
      
      // Add modifier body or default placeholder
      if (modifier.body) {
        code += `        ${modifier.body.replace(/\n/g, '\n        ')}\n`;
      } else {
        code += "        _;\n";
      }
      
      code += "    }\n\n";
    });
  }
  
  // Add constructor
  if (jsonSpec.constructor) {
    // Add NatSpec if available
    if (jsonSpec.natspec && jsonSpec.natspec.functionDocs && jsonSpec.natspec.functionDocs.constructor) {
      const doc = jsonSpec.natspec.functionDocs.constructor;
      code += "    /**\n";
      if (doc.notice) code += `     * @notice ${doc.notice}\n`;
      if (doc.dev) code += `     * @dev ${doc.dev}\n`;
      
      // Add parameter docs
      if (doc.params) {
        Object.entries(doc.params).forEach(([paramName, paramDesc]) => {
          code += `     * @param ${paramName} ${paramDesc}\n`;
        });
      }
      
      code += "     */\n";
    }
    
    code += "    constructor(";
    
    // Add constructor parameters
    if (jsonSpec.constructor.parameters && jsonSpec.constructor.parameters.length > 0) {
      code += jsonSpec.constructor.parameters.map(param => `${param.type} ${param.name}`).join(', ');
    }
    
    code += ")";
    
    // Add modifiers
    if (jsonSpec.constructor.modifiers && jsonSpec.constructor.modifiers.length > 0) {
      jsonSpec.constructor.modifiers.forEach(mod => {
        code += ` ${mod.name}(`;
        if (mod.arguments && mod.arguments.length > 0) {
          code += mod.arguments.join(', ');
        }
        code += ")";
      });
    }
    
    code += " {\n";
    
    // Add constructor body
    if (jsonSpec.constructor.body) {
      code += `        ${jsonSpec.constructor.body.replace(/\n/g, '\n        ')}\n`;
    } else {
      code += "        // Constructor body\n";
    }
    
    code += "    }\n\n";
  }
  
  // Add functions
  if (jsonSpec.functions && jsonSpec.functions.length > 0) {
    code += "    // Functions\n";
    jsonSpec.functions.forEach(func => {
      // Add NatSpec if available
      if (jsonSpec.natspec && jsonSpec.natspec.functionDocs && jsonSpec.natspec.functionDocs[func.name]) {
        const doc = jsonSpec.natspec.functionDocs[func.name];
        code += "    /**\n";
        if (doc.notice) code += `     * @notice ${doc.notice}\n`;
        if (doc.dev) code += `     * @dev ${doc.dev}\n`;
        
        // Add parameter docs
        if (doc.params) {
          Object.entries(doc.params).forEach(([paramName, paramDesc]) => {
            code += `     * @param ${paramName} ${paramDesc}\n`;
          });
        }
        
        // Add return docs
        if (doc.return) {
          code += `     * @return ${doc.return}\n`;
        } else if (doc.returns) {
          Object.entries(doc.returns).forEach(([returnName, returnDesc]) => {
            code += `     * @return ${returnName} ${returnDesc}\n`;
          });
        }
        
        code += "     */\n";
      }
      
      // Function signature
      code += `    function ${func.name}(`;
      
      // Function parameters
      if (func.parameters && func.parameters.length > 0) {
        code += func.parameters.map(param => `${param.type} ${param.name}`).join(', ');
      }
      
      code += ")";
      
      // Function visibility
      if (func.visibility) {
        code += ` ${func.visibility}`;
      }
      
      // Function mutability
      if (func.mutability && func.mutability !== 'nonpayable') {
        code += ` ${func.mutability}`;
      }
      
      // Function virtual/override
      if (func.virtual) {
        code += " virtual";
      }
      
      if (func.override) {
        if (typeof func.override === 'boolean' && func.override) {
          code += " override";
        } else if (Array.isArray(func.override)) {
          code += ` override(${func.override.join(', ')})`;
        }
      }
      
      // Function return values
      if (func.returns) {
        code += " returns (";
        if (Array.isArray(func.returns)) {
          code += func.returns.map(ret => `${ret.type}${ret.name ? ' ' + ret.name : ''}`).join(', ');
        } else {
          code += `${func.returns.type}${func.returns.name ? ' ' + func.returns.name : ''}`;
        }
        code += ")";
      }
      
      // Function modifiers
      if (func.modifiers && func.modifiers.length > 0) {
        func.modifiers.forEach(mod => {
          code += ` ${mod.name}(`;
          if (mod.arguments && mod.arguments.length > 0) {
            code += mod.arguments.join(', ');
          }
          code += ")";
        });
      }
      
      code += " {\n";
      
      // Function body
      if (func.body) {
        code += `        ${func.body.replace(/\n/g, '\n        ')}\n`;
      } else {
        code += "        // Function implementation\n";
      }
      
      code += "    }\n\n";
    });
  }
  
  // Add receive function
  if (jsonSpec.receive) {
    code += "    // Receive function\n";
    code += "    receive() external";
    if (jsonSpec.receive.payable !== false) {
      code += " payable";
    }
    code += " {\n";
    
    if (jsonSpec.receive.body) {
      code += `        ${jsonSpec.receive.body.replace(/\n/g, '\n        ')}\n`;
    } else {
      code += "        // Implementation\n";
    }
    
    code += "    }\n\n";
  }
  
  // Add fallback function
  if (jsonSpec.fallback) {
    code += "    // Fallback function\n";
    code += "    fallback() external";
    if (jsonSpec.fallback.payable) {
      code += " payable";
    }
    code += " {\n";
    
    if (jsonSpec.fallback.body) {
      code += `        ${jsonSpec.fallback.body.replace(/\n/g, '\n        ')}\n`;
    } else {
      code += "        // Implementation\n";
    }
    
    code += "    }\n\n";
  }
  
  // Close contract
  code += "}\n";
  
  return code;
}

module.exports = {
  generateCode
};