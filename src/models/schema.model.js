/**
 * JSON schema models for contract generation
 */
const config = require('../config');

// Base JSON schema that applies to all contract languages
const baseJsonSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Smart Contract Generation Schema",
  "description": "Schema for defining smart contract templates",
  "type": "object",
  "required": ["contractName", "license"],
  "properties": {
    "contractName": {
      "type": "string",
      "description": "Name of the smart contract",
      "pattern": "^[A-Z][A-Za-z0-9]*$",
      "minLength": 1
    },
    "license": {
      "type": "string",
      "description": "SPDX license identifier",
      "enum": ["MIT", "GPL-3.0", "LGPL-3.0", "AGPL-3.0", "UNLICENSED"]
    },
    // Common properties shared across all language schemas
    "abstract": {
      "type": "boolean",
      "description": "Whether the contract is abstract",
      "default": false
    },
    "imports": {
      "type": "array",
      "description": "External imports and dependencies",
      "items": {
        "type": "object",
        "required": ["path"],
        "properties": {
          "path": {
            "type": "string",
            "description": "Path or URL to import"
          },
          "symbols": {
            "type": "array",
            "description": "Specific symbols to import",
            "items": {
              "type": "string"
            }
          },
          "alias": {
            "type": "string",
            "description": "Optional alias for the import"
          }
        }
      }
    },
    "inheritance": {
      "type": "array",
      "description": "Contracts to inherit from",
      "items": {
        "type": "string"
      }
    },
    "libraries": {
      "type": "array",
      "description": "Libraries to use",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Library name"
          },
          "for": {
            "type": "string",
            "description": "Type to use the library for"
          }
        }
      }
    },
    "constants": {
      "type": "array",
      "description": "Constant values defined in the contract",
      "items": {
        "type": "object",
        "required": ["name", "type", "value"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the constant"
          },
          "type": {
            "type": "string",
            "description": "Data type of the constant"
          },
          "value": {
            "description": "Value of the constant"
          },
          "visibility": {
            "type": "string",
            "enum": ["public", "private", "internal"],
            "default": "internal"
          }
        }
      }
    },
    "enums": {
      "type": "array",
      "description": "Enumeration types",
      "items": {
        "type": "object",
        "required": ["name", "values"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the enum"
          },
          "values": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "minItems": 1
          }
        }
      }
    },
    "structs": {
      "type": "array",
      "description": "Struct definitions",
      "items": {
        "type": "object",
        "required": ["name", "fields"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the struct"
          },
          "fields": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Field name"
                },
                "type": {
                  "type": "string",
                  "description": "Field data type"
                }
              }
            },
            "minItems": 1
          }
        }
      }
    },
    "stateVariables": {
      "type": "array",
      "description": "Contract state variables",
      "items": {
        "type": "object",
        "required": ["name", "type"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Variable name"
          },
          "type": {
            "type": "string",
            "description": "Variable data type"
          },
          "visibility": {
            "type": "string",
            "enum": ["public", "private", "internal"],
            "default": "private"
          },
          "initialValue": {
            "description": "Initial value for the variable",
            "default": null
          },
          "immutable": {
            "type": "boolean",
            "default": false
          },
          "modifiers": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["override", "virtual"]
            }
          }
        }
      }
    },
    "mappings": {
      "type": "array",
      "description": "Mapping definitions",
      "items": {
        "type": "object",
        "required": ["name", "keyType", "valueType"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Mapping name"
          },
          "keyType": {
            "type": "string",
            "description": "Key data type"
          },
          "valueType": {
            "type": "string",
            "description": "Value data type"
          },
          "visibility": {
            "type": "string",
            "enum": ["public", "private", "internal"],
            "default": "private"
          }
        }
      }
    },
    "events": {
      "type": "array",
      "description": "Event definitions",
      "items": {
        "type": "object",
        "required": ["name", "parameters"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Event name"
          },
          "parameters": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Parameter name"
                },
                "type": {
                  "type": "string",
                  "description": "Parameter data type"
                },
                "indexed": {
                  "type": "boolean",
                  "default": false
                }
              }
            }
          },
          "anonymous": {
            "type": "boolean",
            "default": false
          }
        }
      }
    },
    "errors": {
      "type": "array",
      "description": "Custom error definitions",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Error name"
          },
          "parameters": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Parameter name"
                },
                "type": {
                  "type": "string",
                  "description": "Parameter data type"
                }
              }
            },
            "default": []
          }
        }
      }
    },
    "modifiers": {
      "type": "array",
      "description": "Function modifiers",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Modifier name"
          },
          "parameters": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Parameter name"
                },
                "type": {
                  "type": "string",
                  "description": "Parameter data type"
                }
              }
            },
            "default": []
          },
          "virtual": {
            "type": "boolean",
            "default": false
          },
          "override": {
            "oneOf": [
              {
                "type": "boolean"
              },
              {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            ],
            "default": false
          },
          "body": {
            "type": "string",
            "description": "Code body of the modifier"
          }
        }
      }
    },
    "constructor": {
      "type": "object",
      "description": "Contract constructor",
      "properties": {
        "parameters": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "type"],
            "properties": {
              "name": {
                "type": "string",
                "description": "Parameter name"
              },
              "type": {
                "type": "string",
                "description": "Parameter data type"
              }
            }
          },
          "default": []
        },
        "modifiers": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name"],
            "properties": {
              "name": {
                "type": "string",
                "description": "Modifier name"
              },
              "arguments": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "default": []
              }
            }
          },
          "default": []
        },
        "baseConstructorArgs": {
          "type": "object",
          "description": "Arguments passed to base contract constructors",
          "additionalProperties": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "body": {
          "type": "string",
          "description": "Code body of the constructor"
        }
      }
    },
    "functions": {
      "type": "array",
      "description": "Contract functions",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Function name"
          },
          "parameters": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Parameter name"
                },
                "type": {
                  "type": "string",
                  "description": "Parameter data type"
                }
              }
            },
            "default": []
          },
          "returns": {
            "oneOf": [
              {
                "type": "object",
                "required": ["type"],
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "Return type"
                  },
                  "name": {
                    "type": "string",
                    "description": "Optional name for the return value"
                  }
                }
              },
              {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["type"],
                  "properties": {
                    "type": {
                      "type": "string",
                      "description": "Return type"
                    },
                    "name": {
                      "type": "string",
                      "description": "Optional name for the return value"
                    }
                  }
                }
              }
            ]
          },
          "visibility": {
            "type": "string",
            "enum": ["public", "private", "internal", "external"],
            "default": "public"
          },
          "mutability": {
            "type": "string",
            "enum": ["pure", "view", "payable", "nonpayable"],
            "default": "nonpayable"
          },
          "virtual": {
            "type": "boolean",
            "default": false
          },
          "override": {
            "oneOf": [
              {
                "type": "boolean"
              },
              {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            ],
            "default": false
          },
          "modifiers": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Modifier name"
                },
                "arguments": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "default": []
                }
              }
            },
            "default": []
          },
          "body": {
            "type": "string",
            "description": "Code body of the function"
          }
        }
      }
    },
    "fallback": {
      "type": "object",
      "description": "Fallback function",
      "properties": {
        "payable": {
          "type": "boolean",
          "default": false
        },
        "external": {
          "type": "boolean",
          "default": true
        },
        "body": {
          "type": "string",
          "description": "Code body of the fallback function"
        }
      }
    },
    "receive": {
      "type": "object",
      "description": "Receive function",
      "properties": {
        "external": {
          "type": "boolean",
          "default": true
        },
        "payable": {
          "type": "boolean",
          "default": true
        },
        "body": {
          "type": "string",
          "description": "Code body of the receive function"
        }
      }
    },
    "natspec": {
      "type": "object",
      "description": "NatSpec documentation",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title of the contract"
        },
        "author": {
          "type": "string",
          "description": "Author of the contract"
        },
        "notice": {
          "type": "string",
          "description": "Explain to end users what this does"
        },
        "dev": {
          "type": "string",
          "description": "Explain to developers any extra details"
        },
        "custom": {
          "type": "object",
          "description": "Custom tags",
          "additionalProperties": {
            "type": "string"
          }
        },
        "functionDocs": {
          "type": "object",
          "description": "Function documentation",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "notice": {
                "type": "string",
                "description": "Explain to end users what this does"
              },
              "dev": {
                "type": "string",
                "description": "Explain to developers any extra details"
              },
              "params": {
                "type": "object",
                "description": "Parameter descriptions",
                "additionalProperties": {
                  "type": "string"
                }
              },
              "return": {
                "type": "string",
                "description": "Return value description"
              },
              "returns": {
                "type": "object",
                "description": "Return value descriptions for named returns",
                "additionalProperties": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata for the contract",
      "additionalProperties": true
    }
  },
  "additionalProperties": false
};

// Language-specific schema extensions
const languageSpecificSchemas = {
  [config.contractLanguages.SOLIDITY]: {
    required: ["contractName", "solidity", "license"],
    properties: {
      solidity: {
        type: "string",
        description: "Solidity compiler version",
        pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$",
        examples: ["0.8.19", "0.8.20"]
      },
      // Solidity-specific additional properties
      pragmas: {
        type: "array",
        description: "Additional pragma directives",
        items: {
          type: "object",
          required: ["name", "value"],
          properties: {
            name: {
              type: "string",
              description: "Pragma name"
            },
            value: {
              type: "string",
              description: "Pragma value"
            }
          }
        }
      },
      experimental: {
        type: "array",
        description: "Experimental features to enable",
        items: {
          type: "string",
          enum: ["ABIEncoderV2", "SMTChecker"]
        }
      }
    }
  },
  [config.contractLanguages.VYPER]: {
    required: ["contractName", "vyper", "license"],
    properties: {
      vyper: {
        type: "string",
        description: "Vyper compiler version",
        pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$",
        examples: ["0.3.7", "0.3.9"]
      },
      // Vyper-specific additional properties
      interfaceCodes: {
        type: "array",
        description: "Interface codes to include",
        items: {
          type: "object",
          required: ["name", "code"],
          properties: {
            name: {
              type: "string",
              description: "Interface name"
            },
            code: {
              type: "string",
              description: "Interface code"
            }
          }
        }
      },
      pythonic: {
        type: "boolean",
        description: "Use more Pythonic syntax where possible",
        default: true
      }
    }
  },
  [config.contractLanguages.RUST]: {
    required: ["contractName", "rust", "license"],
    properties: {
      rust: {
        type: "string",
        description: "Rust compiler version",
        pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$",
        examples: ["1.68.0", "1.70.0"]
      },
      // Rust-specific additional properties
      substrate: {
        type: "boolean",
        description: "Use Substrate ink! framework",
        default: true
      },
      features: {
        type: "array",
        description: "Crate features to enable",
        items: {
          type: "string"
        }
      },
      dependencies: {
        type: "object",
        description: "External crate dependencies",
        additionalProperties: {
          type: "string"
        }
      }
    }
  },
  // Adding MOVE language support
  [config.contractLanguages.MOVE]: {
    required: ["contractName", "move", "license"],
    properties: {
      move: {
        type: "string",
        description: "Move language version",
        pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$",
        examples: ["1.5.0", "1.6.0"]
      },
      // Move-specific properties
      chainTarget: {
        type: "string",
        enum: ["aptos", "sui", "diem", "starcoin"],
        description: "Target blockchain for the Move contract",
        default: "aptos"
      },
      modules: {
        type: "array",
        description: "Additional modules to include",
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Module name"
            },
            address: {
              type: "string",
              description: "Module address"
            },
            friends: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Friend modules"
            }
          }
        }
      }
    }
  }
};

/**
 * Get the JSON schema for a specific contract language
 * 
 * @param {string} language - Contract language
 * @returns {Object} JSON schema for the specified language
 */
function getJsonSchema(language) {
  // Create a deep copy of the base schema
  const schema = JSON.parse(JSON.stringify(baseJsonSchema));
  
  // Apply language-specific extensions if available
  if (languageSpecificSchemas[language]) {
    if (languageSpecificSchemas[language].required) {
      schema.required = languageSpecificSchemas[language].required;
    }
    
    if (languageSpecificSchemas[language].properties) {
      schema.properties = {
        ...schema.properties,
        ...languageSpecificSchemas[language].properties
      };
    }
    
    // Update schema title for the specific language
    schema.title = `${language.charAt(0).toUpperCase() + language.slice(1)} Smart Contract Generation Schema`;
  }
  
  return schema;
}

/**
 * Validates a contract definition against its corresponding schema
 * 
 * @param {Object} contractDef - Contract definition object
 * @param {string} language - Contract language
 * @returns {Object} Validation result with success flag and errors
 */
function validateContractDefinition(contractDef, language) {
  const Ajv = require('ajv');
  const ajv = new Ajv({ allErrors: true });
  
  const schema = getJsonSchema(language);
  const validate = ajv.compile(schema);
  const valid = validate(contractDef);
  
  return {
    valid,
    errors: validate.errors || []
  };
}

/**
 * Creates a basic contract definition template for the specified language
 * 
 * @param {string} language - Contract language
 * @param {string} contractName - Name of the contract
 * @returns {Object} Basic contract definition template
 */
function createContractTemplate(language, contractName) {
  // Default version by language
  const defaultVersions = {
    [config.contractLanguages.SOLIDITY]: "0.8.20",
    [config.contractLanguages.VYPER]: "0.3.9",
    [config.contractLanguages.RUST]: "1.70.0",
    [config.contractLanguages.MOVE]: "1.6.0"
  };
  
  const template = {
    contractName: contractName || "MyContract",
    license: "MIT",
    abstract: false,
    imports: [],
    inheritance: [],
    libraries: [],
    constants: [],
    enums: [],
    structs: [],
    stateVariables: [],
    mappings: [],
    events: [],
    errors: [],
    modifiers: [],
    constructor: {
      parameters: [],
      modifiers: [],
      body: ""
    },
    functions: [],
    natspec: {
      title: contractName || "MyContract",
      author: "",
      notice: "This is a sample contract",
      dev: "This contract was generated using a template"
    },
    metadata: {}
  };
  
  // Add language-specific properties
  if (language === config.contractLanguages.SOLIDITY) {
    template.solidity = defaultVersions[language];
  } else if (language === config.contractLanguages.VYPER) {
    template.vyper = defaultVersions[language];
  } else if (language === config.contractLanguages.RUST) {
    template.rust = defaultVersions[language];
    template.substrate = true;
    template.features = [];
    template.dependencies = {};
  } else if (language === config.contractLanguages.MOVE) {
    template.move = defaultVersions[language];
    template.chainTarget = "aptos";
    template.modules = [];
  }
  
  return template;
}

module.exports = {
  getJsonSchema,
  validateContractDefinition,
  createContractTemplate
};