// contract-actions.js - Handles contract-related actions

/**
 * Contract Actions Service - Manages all contract actions
 */
const ContractActions = (function() {
  // Private variables
  const ACTION_DELAY = 300; // Animation delay in ms
  
  // Contract operation result types
  const RESULT = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info'
  };
  
  /**
   * Creates a confirmation dialog
   * @param {Object} options - Dialog options
   * @returns {Promise} Resolves with true if confirmed, false if cancelled
   */
  function createConfirmDialog(options) {
    const defaults = {
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      confirmClass: 'confirm-btn',
      cancelClass: 'cancel-btn'
    };
    
    const settings = {...defaults, ...options};
    
    return new Promise(resolve => {
      // Create dialog element
      const dialogEl = document.createElement('div');
      dialogEl.className = 'confirm-dialog';
      
      dialogEl.innerHTML = `
        <div class="confirm-dialog-content">
          <h3>${settings.title}</h3>
          <p>${settings.message}</p>
          <div class="confirm-dialog-buttons">
            <button class="${settings.confirmClass}" id="confirm-action">${settings.confirmText}</button>
            <button class="${settings.cancelClass}" id="cancel-action">${settings.cancelText}</button>
          </div>
        </div>
      `;
      
      // Add to DOM
      document.body.appendChild(dialogEl);
      
      // Add event listeners
      dialogEl.querySelector('#confirm-action').addEventListener('click', () => {
        document.body.removeChild(dialogEl);
        resolve(true);
      });
      
      dialogEl.querySelector('#cancel-action').addEventListener('click', () => {
        document.body.removeChild(dialogEl);
        resolve(false);
      });
      
      // Close on backdrop click
      dialogEl.addEventListener('click', (e) => {
        if (e.target === dialogEl) {
          document.body.removeChild(dialogEl);
          resolve(false);
        }
      });
      
      // Close on Escape key
      document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escapeHandler);
          if (dialogEl.parentNode) {
            document.body.removeChild(dialogEl);
            resolve(false);
          }
        }
      });
    });
  }
  
  /**
   * Shows a result message in both notification and chat
   * @param {Object} result - Operation result
   */
  function showOperationResult(result) {
    const { title, message, type, chatMessage } = result;
    
    // Add notification
    if (typeof addNotification === 'function') {
      addNotification(`${title}: ${message}`, type);
    }
    
    // Add message to chat if provided
    if (chatMessage && typeof addMessage === 'function') {
      addMessage('assistant', chatMessage);
    }
  }
  
  /**
   * Creates an animated overlay for contract actions
   * @param {string} type - Overlay type ('loading', 'success', etc.)
   * @param {string} message - Overlay message
   * @returns {Object} Overlay control object
   */
  function createActionOverlay(type, message) {
    const targetContainer = document.querySelector('.approval-section') || 
                            document.getElementById('finalContract').parentNode;
    if (!targetContainer) {
      console.error('Could not find container for overlay');
      return null;
    }
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = `action-overlay ${type}-overlay`;
    
    // Set overlay content based on type
    switch (type) {
      case 'loading':
        overlay.innerHTML = `
          <div class="spinner"></div>
          <p>${message || 'Processing...'}</p>
        `;
        break;
      case 'success':
        overlay.innerHTML = `
          <div class="success-icon"><i class="fas fa-check-circle"></i></div>
          <p>${message || 'Operation successful!'}</p>
        `;
        break;
      case 'error':
        overlay.innerHTML = `
          <div class="error-icon"><i class="fas fa-exclamation-circle"></i></div>
          <p>${message || 'An error occurred'}</p>
        `;
        break;
      default:
        overlay.innerHTML = `
          <div class="info-icon"><i class="fas fa-info-circle"></i></div>
          <p>${message || 'Processing...'}</p>
        `;
    }
    
    // Add to container
    targetContainer.appendChild(overlay);
    
    // Return control methods
    return {
      update: (newMessage) => {
        const messageEl = overlay.querySelector('p');
        if (messageEl) {
          messageEl.textContent = newMessage;
        }
      },
      remove: () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    };
  }
  
  /**
   * Approve contract action
   * @returns {Promise} Operation result
   */
  async function approveContract() {
    try {
      // Get contract from state
      const contract = window.AppState ? AppState.getContract() : null;
      
      if (!contract) {
        return {
          type: RESULT.WARNING,
          title: 'Approval Failed',
          message: 'No contract to approve',
        };
      }
      
      // Show confirmation dialog
      const confirmed = await createConfirmDialog({
        title: 'Approve Contract',
        message: 'Are you sure you want to approve this contract?',
        confirmText: 'Yes, Approve',
        cancelText: 'Cancel'
      });
      
      if (!confirmed) {
        return { cancelled: true };
      }
      
      // Show success result
      return {
        type: RESULT.SUCCESS,
        title: 'Contract Approved',
        message: 'Contract has been approved successfully',
        chatMessage: `
          <div style="text-align: center;">
            <i class="fas fa-check-circle" style="color: var(--success-color); font-size: 2rem;"></i>
            <p style="margin-top: 10px; font-weight: bold;">Contract Approved</p>
            <p>Your contract is ready for deployment.</p>
          </div>
        `
      };
    } catch (error) {
      console.error('Error approving contract:', error);
      
      return {
        type: RESULT.ERROR,
        title: 'Approval Error',
        message: error.message || 'An unexpected error occurred during approval'
      };
    }
  }
  
  /**
   * Request changes to contract
   * @returns {Promise} Operation result
   */
  async function requestChanges() {
    try {
      // Get contract from state
      const contract = window.AppState ? AppState.getContract() : null;
      
      if (!contract) {
        return {
          type: RESULT.WARNING,
          title: 'Modification Failed',
          message: 'No contract to modify'
        };
      }
      
      // Create change request dialog
      const changeDialog = document.createElement('div');
      changeDialog.className = 'confirm-dialog';
      changeDialog.innerHTML = `
        <div class="confirm-dialog-content">
          <h3><i class="fas fa-edit"></i> Request Changes</h3>
          <p>What type of changes would you like to make?</p>
          <div class="change-options">
            <button class="change-option" data-change="functionality">
              <i class="fas fa-cogs"></i>
              <span>Functionality Changes</span>
            </button>
            <button class="change-option" data-change="security">
              <i class="fas fa-shield-alt"></i>
              <span>Security Improvements</span>
            </button>
            <button class="change-option" data-change="gas">
              <i class="fas fa-gas-pump"></i>
              <span>Gas Optimization</span>
            </button>
            <button class="change-option" data-change="custom">
              <i class="fas fa-pencil-alt"></i>
              <span>Custom Changes</span>
            </button>
          </div>
          <div class="confirm-dialog-buttons" style="justify-content: space-between;">
            <button class="cancel-btn" id="cancel-changes">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(changeDialog);
      
      // Return a promise that resolves when an option is selected
      return new Promise((resolve) => {
        // Handle option selection
        const options = changeDialog.querySelectorAll('.change-option');
        options.forEach(option => {
          option.addEventListener('click', () => {
            const changeType = option.getAttribute('data-change');
            document.body.removeChild(changeDialog);
            
            // Set input value based on selected change type
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
              let promptText = '';
              
              switch (changeType) {
                case 'functionality':
                  promptText = "I'd like to modify the functionality of the contract by ";
                  break;
                case 'security':
                  promptText = "I'd like to improve the security of the contract by ";
                  break;
                case 'gas':
                  promptText = "I'd like to optimize the contract for gas efficiency by ";
                  break;
                case 'custom':
                  promptText = "I'd like to make the following changes to the contract: ";
                  break;
              }
              
              messageInput.value = promptText;
              messageInput.focus();
              
              // Place cursor at end of text
              const len = messageInput.value.length;
              messageInput.setSelectionRange(len, len);
            }
            
            resolve({
              type: RESULT.INFO,
              title: 'Changes Requested',
              message: `Please describe the ${changeType} changes you want to make`
            });
          });
        });
        
        // Handle cancel
        const cancelBtn = changeDialog.querySelector('#cancel-changes');
        cancelBtn.addEventListener('click', () => {
          document.body.removeChild(changeDialog);
          resolve({ cancelled: true });
        });
        
        // Close on backdrop click
        changeDialog.addEventListener('click', (e) => {
          if (e.target === changeDialog) {
            document.body.removeChild(changeDialog);
            resolve({ cancelled: true });
          }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
          if (e.key === 'Escape') {
            document.removeEventListener('keydown', escapeHandler);
            if (changeDialog.parentNode) {
              document.body.removeChild(changeDialog);
              resolve({ cancelled: true });
            }
          }
        });
      });
    } catch (error) {
      console.error('Error requesting changes:', error);
      
      return {
        type: RESULT.ERROR,
        title: 'Request Error',
        message: error.message || 'An unexpected error occurred while requesting changes'
      };
    }
  }
  
  /**
   * Compile contract
   * @returns {Promise} Operation result
   */
  async function compileContract() {
    try {
      // Get contract from state
      const contract = window.AppState ? AppState.getContract() : null;
      
      if (!contract) {
        return {
          type: RESULT.WARNING,
          title: 'Compilation Failed',
          message: 'No contract to compile'
        };
      }
      
      // Show loading overlay
      const overlay = createActionOverlay('loading', 'Compiling contract...');
      
      // Add notification
      if (typeof addNotification === 'function') {
        addNotification('Compiling contract...', 'info');
      }
      
      // Simulate compilation (would be a real API call in production)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate compilation result (70% success rate)
      const success = Math.random() > 0.3;
      
      // Remove overlay with delay for animation
      setTimeout(() => {
        if (overlay) overlay.remove();
      }, ACTION_DELAY);
      
      if (success) {
        return {
          type: RESULT.SUCCESS,
          title: 'Compilation Successful',
          message: 'Contract compiled without errors',
          chatMessage: `
            <div style="background-color: var(--success-light); padding: 12px; border-radius: 8px; border-left: 4px solid var(--success-color);">
              <strong><i class="fas fa-check-circle"></i> Compilation Successful</strong>
              <p style="margin-top: 8px;">Contract compiled without errors. You can now deploy it to a network.</p>
            </div>
          `
        };
      } else {
        return {
          type: RESULT.ERROR,
          title: 'Compilation Failed',
          message: 'Syntax errors found during compilation',
          chatMessage: `
            <div style="background-color: var(--error-light); padding: 12px; border-radius: 8px; border-left: 4px solid var(--error-color);">
              <strong><i class="fas fa-exclamation-circle"></i> Compilation Failed</strong>
              <p style="margin-top: 8px;">The contract has syntax errors that need to be fixed:</p>
              <pre style="background-color: rgba(0,0,0,0.05); padding: 8px; margin-top: 8px; border-radius: 4px; font-size: 0.9em;">
Error: DeclarationError: Undeclared identifier.
--> line 42: uint totalSupply = _calculateSupply();
                               ^-------------^
Error: ParserError: Expected ',' but got identifier
--> line 78: function transfer(address to uint256 amount) public returns (bool) {
                                     ^
              </pre>
            </div>
            
            <p style="margin-top: 12px;">Would you like me to help fix these errors?</p>
          `
        };
      }
    } catch (error) {
      console.error('Error compiling contract:', error);
      
      return {
        type: RESULT.ERROR,
        title: 'Compilation Error',
        message: error.message || 'An unexpected error occurred during compilation'
      };
    }
  }
  
  /**
   * Perform quick security audit
   * @returns {Promise} Operation result
   */
  async function quickAudit() {
    try {
      // Get contract from state
      const contract = window.AppState ? AppState.getContract() : null;
      
      if (!contract) {
        return {
          type: RESULT.WARNING,
          title: 'Audit Failed',
          message: 'No contract to audit'
        };
      }
      
      // Show loading overlay
      const overlay = createActionOverlay('loading', 'Performing security audit...');
      
      // Add notification
      if (typeof addNotification === 'function') {
        addNotification('Performing quick security audit...', 'info');
      }
      
      // Simulate audit process (would be a real API call in production)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Remove overlay with delay for animation
      setTimeout(() => {
        if (overlay) overlay.remove();
      }, ACTION_DELAY);
      
      return {
        type: RESULT.SUCCESS,
        title: 'Audit Complete',
        message: 'Security audit completed',
        chatMessage: `
          <div style="background-color: #e8eaf6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px; color: #3f51b5;">
              <i class="fas fa-shield-alt"></i> Quick Audit Results
            </h3>
            
            <div style="display: flex; align-items: center; margin: 16px 0; gap: 8px;">
              <div style="flex-grow: 1; height: 8px; border-radius: 4px; background-color: #e3f2fd; overflow: hidden;">
                <div style="width: 85%; height: 100%; background-color: #2196f3;"></div>
              </div>
              <span style="font-weight: bold; color: #2196f3;">85/100</span>
            </div>
            
            <ul style="margin-bottom: 0; padding-left: 20px;">
              <li>No critical vulnerabilities detected</li>
              <li>Contract follows most security best practices</li>
              <li>Consider adding more input validation</li>
              <li>Events should be emitted for all state changes</li>
              <li>A full audit is recommended before production deployment</li>
            </ul>
          </div>
          
          <p>Would you like me to address any of these issues?</p>
        `
      };
    } catch (error) {
      console.error('Error performing audit:', error);
      
      return {
        type: RESULT.ERROR,
        title: 'Audit Error',
        message: error.message || 'An unexpected error occurred during the audit'
      };
    }
  }
  
  /**
   * Archive contract
   * @returns {Promise} Operation result
   */
  async function archiveContract() {
    try {
      // Get contract from state
      const contract = window.AppState ? AppState.getContract() : null;
      
      if (!contract) {
        return {
          type: RESULT.WARNING,
          title: 'Archive Failed',
          message: 'No contract to archive'
        };
      }
      
      const contractName = contract.jsonSpec?.contractName || contract.contractName || 'Untitled';
      
      // Create archive dialog
      const archiveDialog = document.createElement('div');
      archiveDialog.className = 'confirm-dialog';
      archiveDialog.innerHTML = `
        <div class="confirm-dialog-content">
          <h3><i class="fas fa-archive"></i> Archive Contract</h3>
          <p>This will save the current contract to your archived contracts. You can access it later from "My Contracts".</p>
          <div class="form-group">
            <label for="archive-name">Contract Name</label>
            <input type="text" id="archive-name" value="${contractName}" placeholder="Enter a name for this contract">
          </div>
          <div class="form-group">
            <label for="archive-description">Description (optional)</label>
            <textarea id="archive-description" placeholder="Add a brief description"></textarea>
          </div>
          <div class="confirm-dialog-buttons">
            <button class="confirm-btn" id="confirm-archive">Archive</button>
            <button class="cancel-btn" id="cancel-archive">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(archiveDialog);
      
      // Return a promise that resolves when archive is confirmed
      return new Promise((resolve) => {
        // Handle confirmation
        const confirmBtn = archiveDialog.querySelector('#confirm-archive');
        confirmBtn.addEventListener('click', () => {
          const name = archiveDialog.querySelector('#archive-name').value.trim();
          const description = archiveDialog.querySelector('#archive-description').value.trim();
          
          if (!name) {
            // Highlight the name field if empty
            const nameInput = archiveDialog.querySelector('#archive-name');
            nameInput.style.borderColor = 'var(--error-color)';
            nameInput.focus();
            return;
          }
          
          document.body.removeChild(archiveDialog);
          
          // Show loading overlay
          const overlay = createActionOverlay('loading', 'Archiving contract...');
          
          // Add notification
          if (typeof addNotification === 'function') {
            addNotification('Archiving contract...', 'info');
          }
          
          // Simulate archiving (would be a real API call in production)
          setTimeout(() => {
            // Remove overlay
            if (overlay) overlay.remove();
            
            // Add the contract to My Contracts tab
            addContractToMyContracts(name, description);
            
            resolve({
              type: RESULT.SUCCESS,
              title: 'Contract Archived',
              message: `Contract "${name}" archived successfully`,
              chatMessage: `
                <div style="text-align: center;">
                  <i class="fas fa-archive" style="color: #3fabb5; font-size: 2rem;"></i>
                  <p style="margin-top: 10px; font-weight: bold;">Contract Archived</p>
                  <p>Your contract "${name}" has been saved to "My Contracts".</p>
                </div>
              `
            });
          }, 1000);
        });
        
        // Handle cancel
        const cancelBtn = archiveDialog.querySelector('#cancel-archive');
        cancelBtn.addEventListener('click', () => {
          document.body.removeChild(archiveDialog);
          resolve({ cancelled: true });
        });
        
        // Close on backdrop click
        archiveDialog.addEventListener('click', (e) => {
          if (e.target === archiveDialog) {
            document.body.removeChild(archiveDialog);
            resolve({ cancelled: true });
          }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
          if (e.key === 'Escape') {
            document.removeEventListener('keydown', escapeHandler);
            if (archiveDialog.parentNode) {
              document.body.removeChild(archiveDialog);
              resolve({ cancelled: true });
            }
          }
        });
      });
    } catch (error) {
      console.error('Error archiving contract:', error);
      
      return {
        type: RESULT.ERROR,
        title: 'Archive Error',
        message: error.message || 'An unexpected error occurred while archiving the contract'
      };
    }
  }
  
  /**
   * Generate code from spec
   * @returns {Promise} Operation result
   */
  async function generateCodeFromSpec() {
    try {
      // Get contract from state
      const contract = window.AppState ? AppState.getContract() : null;
      
      if (!contract || !contract.jsonSpec) {
        return {
          type: RESULT.WARNING,
          title: 'Code Generation Failed',
          message: 'No contract specification to generate from'
        };
      }
      
      // Show loading overlay
      const overlay = createActionOverlay('loading', 'Generating code...');
      
      // Add notification
      if (typeof addNotification === 'function') {
        addNotification('Generating code...', 'info');
      }
      
      try {
        // Make API call to generate code (wrap in try-catch to handle API errors)
        const selectedLanguage = window.AppState && AppState.getLanguage ? 
          AppState.getLanguage() : 'solidity';
        
        // Use the API service if available, otherwise simulate
        let result;
        if (window.APIService && typeof APIService.generateCode === 'function') {
          result = await APIService.generateCode(contract.jsonSpec, selectedLanguage);
        } else {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          result = {
            status: 'success',
            language: selectedLanguage,
            code: `// Generated ${selectedLanguage} code\n\ncontract ${contract.jsonSpec.contractName || 'MyContract'} {\n  // Implementation would be here\n}`
          };
        }
        
        // Check for success
        if (result.status === 'success') {
          // Update contract with generated code
          if (!contract.contracts) {
            contract.contracts = [];
          }
          
          if (contract.contracts.length > 0) {
            contract.contracts[0].content = result.code;
          } else {
            contract.contracts.push({
              name: contract.jsonSpec.contractName || "SmartContract",
              content: result.code
            });
          }
          
          // Update application state
          if (window.AppState && typeof AppState.updateContract === 'function') {
            AppState.updateContract(contract);
          }
          
          // Remove overlay with delay for animation
          setTimeout(() => {
            if (overlay) overlay.remove();
          }, ACTION_DELAY);
          
          return {
            type: RESULT.SUCCESS,
            title: 'Code Generation Complete',
            message: 'Contract code has been generated successfully',
            chatMessage: `
              <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <h3>Code Generation Complete</h3>
                <p>I've generated the ${selectedLanguage} code based on your requirements. You can view it in the "Contract Preview" tab.</p>
                <p>Would you like me to explain any part of the code or make any adjustments?</p>
              </div>
            `
          };
        } else {
          throw new Error(result.error || 'Code generation failed');
        }
      } catch (apiError) {
        console.error('API error in code generation:', apiError);
        
        // Remove overlay with delay for animation
        setTimeout(() => {
          if (overlay) overlay.remove();
        }, ACTION_DELAY);
        
        return {
          type: RESULT.ERROR,
          title: 'Generation Error',
          message: apiError.message || 'Failed to generate code from the server',
          chatMessage: `
            <div class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              <h3>Code Generation Failed</h3>
              <p>I encountered an error while generating the code: ${apiError.message}</p>
              <p>Would you like me to try again with a different approach?</p>
            </div>
          `
        };
      }
    } catch (error) {
      console.error('Error generating code from spec:', error);
      
      return {
        type: RESULT.ERROR,
        title: 'Generation Error',
        message: error.message || 'An unexpected error occurred during code generation'
      };
    }
  }
  
  /**
   * Add contract to My Contracts tab
   * @param {string} name - Contract name
   * @param {string} description - Contract description
   */
  function addContractToMyContracts(name, description) {
    const contractsList = document.querySelector('.contract-list');
    if (!contractsList) return;
    
    // Get the current language from state
    const language = window.AppState && AppState.getLanguage ? 
      AppState.getLanguage() : 'solidity';
    
    // Create new contract item
    const contractItem = document.createElement('li');
    contractItem.className = 'contract-item';
    contractItem.innerHTML = `
      <div class="contract-top-row">
        <div class="contract-left-info">
          <span class="contract-lang ${language}">
            <i class="fas fa-file-code"></i> ${language.charAt(0).toUpperCase() + language.slice(1)}
          </span>
          <span class="contract-name">${name}</span>
        </div>
        <div class="contract-actions">
          <button class="icon-button" title="View Audit"><i class="fas fa-shield-alt"></i></button>
          <button class="icon-button" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="icon-button" title="Share"><i class="fas fa-share-alt"></i></button>
          <button class="icon-button" title="Delete"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      ${description ? `<p class="contract-description">${description}</p>` : ''}
      <div class="deployments-toggle" onclick="toggleDeployments(this)">
        <span>Deployments</span>
        <i class="fas fa-chevron-down"></i>
      </div>
      <ul class="network-list">
        <li>
          <div class="network-left">
            <span class="network-symbol">DEV</span>
            <span class="network-name">Local Development</span>
          </div>
          <div class="network-right">
            <button class="deploy-btn">
              <i class="fas fa-rocket"></i>
              <span>Deploy</span>
            </button>
          </div>
        </li>
      </ul>
    `;
    
    // Apply animation
    contractItem.style.opacity = '0';
    contractItem.style.transform = 'translateY(20px)';
    
    // Add to list at the beginning
    contractsList.insertBefore(contractItem, contractsList.firstChild);
    
    // Trigger animation
    setTimeout(() => {
      contractItem.style.opacity = '1';
      contractItem.style.transform = 'translateY(0)';
      contractItem.style.transition = 'all 0.3s ease';
    }, 10);
    
    // Switch to My Contracts tab if it's not visible
    const myContractsTab = document.querySelector('.tab-button[onclick*="my-contracts"]');
    if (myContractsTab && !myContractsTab.classList.contains('active')) {
      myContractsTab.click();
    }
  }
  
  /**
   * Handle function demo actions
   * @param {string} type - Demo function type
   * @returns {Promise} Operation result
   */
  async function handleDemoFunction(type) {
    try {
      // Show notification
      if (typeof addNotification === 'function') {
        addNotification(`Starting ${type} demo...`, 'info');
      }
      
      // Add initial message based on demo type
      let initialMessage = '';
      
      switch (type) {
        case 'bugFix':
          initialMessage = "I'm analyzing the contract for bugs now...";
          break;
        case 'securityAudit':
          initialMessage = "Performing a thorough security audit...";
          break;
        case 'gasOptimization':
          initialMessage = "Scanning for gas optimization opportunities...";
          break;
        case 'generateTests':
          initialMessage= "Generating tests for your contract...";
          break;
        default:
          initialMessage = "Processing your request...";
      }
      
      if (typeof addMessage === 'function') {
        addMessage('assistant', initialMessage);
      }
      
      // Simulate processing with typing animation
      const input = document.getElementById('message-input');
      if (input) {
        input.value = `/${type}`;
        input.disabled = true;
      }
      
      // Simulate submission after a delay
      setTimeout(() => {
        if (input) {
          input.disabled = false;
          input.value = '';
        }
        
        // Simulate a form submission for the demo command
        const form = document.getElementById('input-form');
        if (form) {
          form.dispatchEvent(new Event('submit'));
        }
      }, 1200);
      
      return {
        type: RESULT.SUCCESS,
        title: 'Demo Started',
        message: `${type} demo initiated`
      };
    } catch (error) {
      console.error(`Error in ${type} demo:`, error);
      
      return {
        type: RESULT.ERROR,
        title: 'Demo Error',
        message: error.message || `An error occurred starting the ${type} demo`
      };
    }
  }
  
  // Public API
  return {
    // Contract actions
    approveContract: async function() {
      const result = await approveContract();
      if (!result.cancelled) showOperationResult(result);
      return result;
    },
    
    requestChanges: async function() {
      const result = await requestChanges();
      if (!result.cancelled) showOperationResult(result);
      return result;
    },
    
    compileContract: async function() {
      const result = await compileContract();
      showOperationResult(result);
      return result;
    },
    
    quickAudit: async function() {
      const result = await quickAudit();
      showOperationResult(result);
      return result;
    },
    
    archiveContract: async function() {
      const result = await archiveContract();
      if (!result.cancelled) showOperationResult(result);
      return result;
    },
    
    generateCodeFromSpec: async function() {
      const result = await generateCodeFromSpec();
      showOperationResult(result);
      return result;
    },
    
    // Demo functions
    demoBugFix: async function() {
      return handleDemoFunction('bugFix');
    },
    
    demoSecurityAudit: async function() {
      return handleDemoFunction('securityAudit');
    },
    
    demoGasOptimization: async function() {
      return handleDemoFunction('gasOptimization');
    },
    
    demoGenerateTests: async function() {
      return handleDemoFunction('generateTests');
    },
    
    // Helper methods
    createConfirmDialog,
    showOperationResult,
    createActionOverlay
  };
})();

// Export methods to window for compatibility with existing code
window.approveContract = ContractActions.approveContract;
window.requestChanges = ContractActions.requestChanges;
window.compileContract = ContractActions.compileContract;
window.quickAudit = ContractActions.quickAudit;
window.archiveContract = ContractActions.archiveContract;
window.generateCodeFromSpec = ContractActions.generateCodeFromSpec;
window.demoBugFix = ContractActions.demoBugFix;
window.demoSecurityAudit = ContractActions.demoSecurityAudit;
window.demoGasOptimization = ContractActions.demoGasOptimization;
window.demoGenerateTests = ContractActions.demoGenerateTests;