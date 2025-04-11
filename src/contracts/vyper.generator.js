/**
 * Vyper code generator
 */

/**
 * Generate Vyper code from JSON specification
 * 
 * @param {Object} jsonSpec - The JSON specification for the contract
 * @returns {string} Generated Vyper code
 */
function generateCode(jsonSpec) {
  const contractName = jsonSpec.contractName || "SmartContract";
  const vyperVersion = jsonSpec.vyper || "0.3.9";
  const license = jsonSpec.license || "MIT";
  
  // Start with basic contract structure
  let code = `#pragma version ${vyperVersion}
# SPDX-License-Identifier: ${license}

"""
@title ${jsonSpec.natspec?.title || contractName}
${jsonSpec.natspec?.author ? `@author ${jsonSpec.natspec.author}` : ''}
${jsonSpec.natspec?.notice ? `@notice ${jsonSpec.natspec.notice}` : ''}
${jsonSpec.natspec?.dev ? `@dev ${jsonSpec.natspec.dev}` : ''}
"""

`;

  // Add imports if available
  if (jsonSpec.imports && jsonSpec.imports.length > 0) {
    code += "# Imports\n";
    jsonSpec.imports.forEach(imp => {
      code += `from ${imp.path} import ${imp.symbols ? imp.symbols.join(', ') : '*'}\n`;
    });
    code += "\n";
  }

  // Add interfaces
  // Note: Vyper handles interfaces differently than Solidity
  if (jsonSpec.inheritance && jsonSpec.inheritance.length > 0) {
    code += "# Interfaces\n";
    jsonSpec.inheritance.forEach(intf => {
      code += `# Implements: ${intf}\n`;
    });
    code += "\n";
  }

  // Add structs
  if (jsonSpec.structs && jsonSpec.structs.length > 0) {
    code += "# Structs\n";
    jsonSpec.structs.forEach(struct => {
      code += `struct ${struct.name}:\n`;
      struct.fields.forEach(field => {
        code += `    ${field.name}: ${convertToVyperType(field.type)}\n`;
      });
      code += "\n";
    });
  }
  
  // Add enums
  if (jsonSpec.enums && jsonSpec.enums.length > 0) {
    code += "# Enums\n";
    jsonSpec.enums.forEach((enumDef, idx) => {
      // In Vyper, enums are typically implemented as constants
      enumDef.values.forEach((value, valueIdx) => {
        code += `${enumDef.name}_${value}: constant(uint256) = ${valueIdx}\n`;
      });
      code += "\n";
    });
  }

  // Add events
  if (jsonSpec.events && jsonSpec.events.length > 0) {
    code += "# Events\n";
    jsonSpec.events.forEach(event => {
      code += `event ${event.name}:\n`;
      if (event.parameters && event.parameters.length > 0) {
        event.parameters.forEach(param => {
          code += `    ${param.name}: ${convertToVyperType(param.type)}${param.indexed ? ' indexed' : ''}\n`;
        });
      }
      code += "\n";
    });
  }
  
  // Add constants
  if (jsonSpec.constants && jsonSpec.constants.length > 0) {
    code += "# Constants\n";
    jsonSpec.constants.forEach(constant => {
      code += `${constant.name}: constant(${convertToVyperType(constant.type)}) = ${constant.value}\n`;
    });
    code += "\n";
  }
  
  // Add state variables
  if (jsonSpec.stateVariables && jsonSpec.stateVariables.length > 0) {
    code += "# State Variables\n";
    jsonSpec.stateVariables.forEach(variable => {
      code += `${variable.name}: ${convertToVyperType(variable.type)}`;
      
      // Add initial value if available
      if (variable.initialValue) {
        code += ` = ${variable.initialValue}`;
      }
      
      code += "\n";
    });
    code += "\n";
  }
  
  // Add mappings
  if (jsonSpec.mappings && jsonSpec.mappings.length > 0) {
    code += "# Mappings\n";
    jsonSpec.mappings.forEach(mapping => {
      code += `${mapping.name}: public(HashMap[${convertToVyperType(mapping.keyType)}, ${convertToVyperType(mapping.valueType)}])\n`;
    });
    code += "\n";
  }
  
  // Add initialize function (equivalent to constructor)
  code += "@external\ndef __init__(";
  
  // Add constructor parameters if available
  if (jsonSpec.constructor && jsonSpec.constructor.parameters) {
    code += jsonSpec.constructor.parameters.map(param => `${param.name}: ${convertToVyperType(param.type)}`).join(', ');
  }
  
  code += "):\n";
  
  // Add constructor body
  if (jsonSpec.constructor && jsonSpec.constructor.body) {
    code += `    ${jsonSpec.constructor.body.replace(/\n/g, '\n    ')}\n`;
  } else {
    code += "    pass\n";
  }
  
  code += "\n";
  
  // Add functions
  if (jsonSpec.functions && jsonSpec.functions.length > 0) {
    jsonSpec.functions.forEach(func => {
      // Add decorator based on visibility and mutability
      if (func.visibility === "external") {
        code += "@external\n";
      } else if (func.visibility === "internal") {
        code += "@internal\n";
      } else if (func.visibility === "public") {
        // Default is external in Vyper
        code += "@external\n";
      }
      
      if (func.mutability === "view") {
        code += "@view\n";
      } else if (func.mutability === "pure") {
        code += "@pure\n";
      } else if (func.mutability === "payable") {
        code += "@payable\n";
      }
      
      // Add Function NatSpec if available
      if (jsonSpec.natspec && jsonSpec.natspec.functionDocs && jsonSpec.natspec.functionDocs[func.name]) {
        const doc = jsonSpec.natspec.functionDocs[func.name];
        code += '"""\n';
        if (doc.notice) code += `@notice ${doc.notice}\n`;
        if (doc.dev) code += `@dev ${doc.dev}\n`;
        
        // Add parameter docs
        if (doc.params) {
          Object.entries(doc.params).forEach(([paramName, paramDesc]) => {
            code += `@param ${paramName} ${paramDesc}\n`;
          });
        }
        
        // Add return docs
        if (doc.return) {
          code += `@return ${doc.return}\n`;
        }
        
        code += '"""\n';
      }
      
      // Function signature
      code += `def ${func.name}(`;
      
      // Function parameters
      if (func.parameters && func.parameters.length > 0) {
        code += func.parameters.map(param => `${param.name}: ${convertToVyperType(param.type)}`).join(', ');
      }
      
      code += ")";
      
      // Function return type
      if (func.returns) {
        code += " -> ";
        if (Array.isArray(func.returns)) {
          // Tuple return type in Vyper
          code += `(${func.returns.map(ret => convertToVyperType(ret.type)).join(', ')})`;
        } else {
          code += convertToVyperType(func.returns.type);
        }
      }
      
      code += ":\n";
      
      // Function body
      if (func.body) {
        code += `    ${func.body.replace(/\n/g, '\n    ')}\n`;
      } else {
        code += "    pass\n";
      }
      
      code += "\n";
    });
  }
  
  // Add fallback function if specified
  if (jsonSpec.fallback) {
    code += "@external\n";
    if (jsonSpec.fallback.payable) {
      code += "@payable\n";
    }
    code += "def __default__():\n";
    if (jsonSpec.fallback.body) {
      code += `    ${jsonSpec.fallback.body.replace(/\n/g, '\n    ')}\n`;
    } else {
      code += "    pass\n";
    }
    code += "\n";
  }
  
  return code;
}

/**
 * Convert Solidity types to Vyper types
 * 
 * @param {string} solidityType - The Solidity type to convert
 * @returns {string} Equivalent Vyper type
 */
function convertToVyperType(solidityType) {
  // Basic type conversions
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
    const vyperBaseType = convertToVyperType(baseType);
    return `DynArray[${vyperBaseType}, 100]`; // Default to 100 elements
  }
  
  // Check for fixed size arrays
  const fixedArrayMatch = solidityType.match(/^(.+)\[(\d+)\]$/);
  if (fixedArrayMatch) {
    const baseType = fixedArrayMatch[1];
    const size = fixedArrayMatch[2];
    const vyperBaseType = convertToVyperType(baseType);
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
    // Extract key and value types
    const mappingMatch = solidityType.match(/mapping\((.+) => (.+)\)/);
    if (mappingMatch) {
      const keyType = convertToVyperType(mappingMatch[1].trim());
      const valueType = convertToVyperType(mappingMatch[2].trim());
      return `HashMap[${keyType}, ${valueType}]`;
    }
  }
  
  // Return the converted type or the original if no conversion exists
  return typeMap[solidityType] || solidityType;
}

module.exports = {
  generateCode
};