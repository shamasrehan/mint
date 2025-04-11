# Smart Contract Generator

An AI-powered platform for generating smart contracts through natural language conversations. The system guides users through a Q&A process to gather requirements, then generates production-ready smart contracts in multiple languages.

## Features

- **Multi-language Support**: Generate contracts in Solidity, Vyper, or Rust/ink!
- **Conversation-driven Design**: Define contract requirements through natural dialogue
- **Intelligent Guidance**: Receive tailored questions based on contract type
- **Code Quality**: Produces secure, gas-optimized, and well-documented smart contracts
- **Advanced Functions**: Analyze contracts for bugs, security issues, and optimization opportunities

## Architecture

This application uses a modular architecture:

```
project-root/
  ├── server.js                # Main entry point
  ├── src/
  │   ├── app.js               # Express app configuration
  │   ├── config/              # App configuration settings
  │   ├── api/                 # API endpoints and logic
  │   │   ├── routes/          # Route definitions
  │   │   ├── controllers/     # Request handlers
  │   │   ├── middleware/      # Request/response middleware
  │   │   └── services/        # Business logic 
  │   ├── models/              # Data models
  │   ├── utils/               # Utility functions
  │   └── contracts/           # Contract generation code
  └── public/                  # Static frontend assets
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/smart-contract-generator.git
cd smart-contract-generator
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file from the example
```bash
cp .env.example .env
```

4. Add your OpenAI API key to the `.env` file

5. Start the server
```bash
npm start
```

The application will be available at http://localhost:3000.

## Usage

1. Start a conversation by describing the smart contract you want to create
2. Answer the AI's questions to define requirements
3. Review the requirements summary
4. Confirm to generate the smart contract
5. View, test, and refine the generated contract

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.



# Complete Project Directory Structure

```
project-root/
  ├── .env                     # Environment variables (created from .env.example)
  ├── .env.example             # Example environment variables
  ├── .gitignore               # Git ignore file
  ├── package.json             # Node.js package configuration
  ├── README.md                # Project documentation
  ├── server.js                # Main entry point
  ├── src/                     # Source code
  │   ├── app.js               # Express app configuration
  │   ├── config/              # Configuration files
  │   │   └── index.js         # Centralized configuration
  │   ├── api/                 # API endpoints and logic
  │   │   ├── routes/          # Route definitions
  │   │   │   └── index.js     # API routes
  │   │   ├── controllers/     # Request handlers
  │   │   │   └── contract.controller.js # Contract controller
  │   │   ├── middleware/      # Middleware
  │   │   │   └── error.middleware.js    # Error handling middleware
  │   │   └── services/        # Business logic services
  │   │       ├── contract.service.js    # Contract generation service
  │   │       └── openai.service.js      # OpenAI API service
  │   ├── models/              # Data models
  │   │   └── schema.model.js  # JSON schema model
  │   ├── utils/               # Utility functions
  │   │   ├── code-generator.utils.js    # Code generation utilities
  │   │   ├── function-executor.utils.js # Function execution utilities
  │   │   └── prompt.utils.js  # Prompt template utilities
  │   └── contracts/           # Contract generation code
  │       ├── solidity.generator.js      # Solidity code generator
  │       ├── vyper.generator.js         # Vyper code generator
  │       └── rust.generator.js          # Rust code generator
  └── public/                  # Static frontend assets
      ├── index.html           # Main HTML file
      ├── css/                 # CSS styles
      │   └── styles.css       # Main stylesheet
      └── js/                  # JavaScript files
          └── script.js        # Main frontend script
```

# Key Files Summary

- **server.js**: Entry point that starts the Express server
- **src/app.js**: Express application setup and middleware configuration
- **src/config/index.js**: Configuration settings from environment variables
- **src/api/routes/index.js**: API route definitions
- **src/api/controllers/contract.controller.js**: Handles HTTP requests
- **src/api/middleware/error.middleware.js**: Error handling middleware
- **src/api/services/contract.service.js**: Smart contract generation logic
- **src/api/services/openai.service.js**: OpenAI API interaction
- **src/models/schema.model.js**: JSON schema definition for contracts
- **src/utils/*.js**: Utility functions for code generation, etc.
- **src/contracts/*.js**: Language-specific code generators
- **public/index.html**: Main HTML file for the web interface
- **public/css/styles.css**: CSS styles for the web interface
- **public/js/script.js**: Frontend JavaScript for the web interface

# Frontend Files Needed

The frontend files should be copied from the original application:
- **public/index.html**: From `paste-2.txt`
- **public/css/styles.css**: From `paste-4.txt`
- **public/js/script.js**: From `improved-script-js` or the original `paste-3.txt`

All API endpoints remain the same as in the original application, so the frontend should work without modifications.