function requestReaudit() {
  const contractId = document.getElementById('contract-id-input').value.trim();
  
  if (!contractId) {
    addNotification('Please enter a contract ID', 'warning');
    
    // Add visual feedback
    const inputField = document.getElementById('contract-id-input');
    inputField.style.borderColor = 'var(--warning-color)';
    inputField.style.backgroundColor = 'var(--warning-light)';
    
    // Reset after a delay
    setTimeout(() => {
      inputField.style.borderColor = '';
      inputField.style.backgroundColor = '';
    }, 1500);
    
    return;
  }
  
  // Show progress
  addNotification(`Re-audit requested for contract ${contractId}`, 'info');
  
  // Disable button while processing
  const reauditButton = document.querySelector('.reaudit-button');
  if (reauditButton) {
    reauditButton.disabled = true;
    reauditButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
  
  // Here would normally be an API call
  setTimeout(() => {
    addNotification('Re-audit scheduled', 'success');
    
    // Update status in UI
    const statusValue = document.querySelector('.status-value');
    if (statusValue) {
      statusValue.className = 'status-value in-progress';
      statusValue.textContent = 'Scheduled';
    }
    
    // Reset button
    if (reauditButton) {
      reauditButton.disabled = false;
      reauditButton.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Request Re-audit</span>';
    }
    
    // Add message to chat
    addMessage('assistant', `
      <div style="background-color: #fff8e1; padding: 16px; border-radius: 8px; border-left: 4px solid #ffb300;">
        <h3 style="margin-top: 0; color: #f57c00;">
          <i class="fas fa-clock"></i> Audit Scheduled
        </h3>
        <p>
          Your re-audit for contract <strong>${contractId}</strong> has been scheduled. 
          The process typically takes 24-48 hours.
        </p>
        <p style="margin-bottom: 0;">
          You will receive a notification when the audit is complete.
        </p>
      </div>
    `);
  }, 2000);
}

function copyToClipboard(text) {
  const originalText = text;
  
  // Create a tooltip/badge that will appear when copying
  const copyBadge = document.createElement('div');
  copyBadge.className = 'copy-badge';
  copyBadge.innerHTML = 'Copying...';
  document.body.appendChild(copyBadge);
  
  // Position the badge near the cursor
  document.addEventListener('mousemove', positionBadge);
  
  function positionBadge(e) {
    copyBadge.style.left = (e.clientX + 15) + 'px';
    copyBadge.style.top = (e.clientY - 15) + 'px';
  }
  
  // Add styles for copy badge
  if (!document.getElementById('copy-badge-style')) {
    const style = document.createElement('style');
    style.id = 'copy-badge-style';
    style.textContent = `
      .copy-badge {
        position: fixed;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.8rem;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s ease;
      }
      
      .copy-badge.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .copy-badge.success {
        background-color: var(--success-color);
      }
      
      .copy-badge.error {
        background-color: var(--error-color);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Show the badge
  setTimeout(() => {
    copyBadge.classList.add('show');
  }, 50);
  
  // Try to copy
  if (!navigator.clipboard) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      
      if (successful) {
        copyBadge.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBadge.classList.add('success');
        addNotification(`Address copied: ${text}`, 'success');
      } else {
        copyBadge.innerHTML = '<i class="fas fa-times"></i> Failed';
        copyBadge.classList.add('error');
        addNotification('Failed to copy address', 'error');
      }
    } catch (err) {
      copyBadge.innerHTML = '<i class="fas fa-times"></i> Failed';
      copyBadge.classList.add('error');
      addNotification('Failed to copy address', 'error');
    } finally {
      document.body.removeChild(textArea);
    }
  } else {
    // Modern browsers
    navigator.clipboard.writeText(text)
      .then(() => {
        copyBadge.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBadge.classList.add('success');
        addNotification(`Address copied: ${originalText}`, 'success');
      })
      .catch((err) => {
        copyBadge.innerHTML = '<i class="fas fa-times"></i> Failed';
        copyBadge.classList.add('error');
        addNotification('Failed to copy address', 'error');
        console.error('Copy failed:', err);
      });
  }
  
  // Remove the badge after a delay
  setTimeout(() => {
    copyBadge.style.opacity = '0';
    copyBadge.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      document.body.removeChild(copyBadge);
      document.removeEventListener('mousemove', positionBadge);
    }, 300);
  }, 2000);
}

function toggleDeployments(toggleButton) {
  const networkList = toggleButton.nextElementSibling;
  if (!networkList) return;
  
  // Get the icon
  const icon = toggleButton.querySelector('i');

  if (networkList.style.display === 'none' || networkList.style.display === '') {
    // Show deployments
    networkList.style.display = 'block';
    
    // Animate arrow
    if (icon) {
      icon.style.transform = 'rotate(180deg)';
      icon.style.transition = 'transform 0.3s ease';
    }
    
    // Animate list expansion
    networkList.style.maxHeight = '0';
    networkList.style.opacity = '0';
    networkList.style.transition = 'max-height 0.5s ease, opacity 0.3s ease';
    
    // Trigger animation
    setTimeout(() => {
      networkList.style.maxHeight = networkList.scrollHeight + 'px';
      networkList.style.opacity = '1';
    }, 50);
  } else {
    // Hide deployments with animation
    networkList.style.maxHeight = '0';
    networkList.style.opacity = '0';
    
    // Reset arrow
    if (icon) {
      icon.style.transform = 'rotate(0deg)';
    }
    
    // Actually hide the element after animation completes
    setTimeout(() => {
      networkList.style.display = 'none';
    }, 500);
  }
}

/* --- DEMO FUNCTION CALLS with enhanced feedback --- */
// These functions demonstrate how the function calls would work
function demoBugFix() {
  showDemoStartNotification('Bug Fix Analysis');
  
  // Show typing animation in input
  elements.messageInput.value = "/bugFix";
  elements.messageInput.disabled = true;
  
  // Add "running" indicator
  addNotification('Running bug analysis...', 'info');
  
  // Show animated scanning effect on the contract
  const scanOverlay = document.createElement('div');
  scanOverlay.className = 'scan-overlay';
  scanOverlay.innerHTML = `
    <div class="scan-animation"></div>
  `;
  
  elements.finalContractDiv.parentNode.appendChild(scanOverlay);
  
  // Add styles for scanning effect
  if (!document.getElementById('scan-style')) {
    const style = document.createElement('style');
    style.id = 'scan-style';
    style.textContent = `
      .scan-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 5;
      }
      
      .scan-animation {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(to right, transparent, var(--primary-color), transparent);
        box-shadow: 0 0 8px var(--primary-color);
        animation: scandown 1.5s ease-in-out infinite;
      }
      
      @keyframes scandown {
        0% { top: 0; opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Submit after a brief delay
  setTimeout(() => {
    elements.form.dispatchEvent(new Event('submit'));
    elements.messageInput.value = '';
    elements.messageInput.disabled = false;
    
    // Remove scan overlay after analysis is "complete"
    setTimeout(() => {
      if (scanOverlay.parentNode) {
        scanOverlay.parentNode.removeChild(scanOverlay);
      }
    }, 2000);
  }, 1200);
}

function demoSecurityAudit() {
  showDemoStartNotification('Security Audit');
  
  // Show typing animation in input
  elements.messageInput.value = "/securityAudit";
  elements.messageInput.disabled = true;
  
  setTimeout(() => {
    elements.form.dispatchEvent(new Event('submit'));
    elements.messageInput.value = '';
    elements.messageInput.disabled = false;
  }, 1000);
}

function demoGasOptimization() {
  showDemoStartNotification('Gas Optimization');
  
  // Show typing animation in input
  elements.messageInput.value = "/gasOptimization";
  elements.messageInput.disabled = true;
  
  setTimeout(() => {
    elements.form.dispatchEvent(new Event('submit'));
    elements.messageInput.value = '';
    elements.messageInput.disabled = false;
  }, 1000);
}

function demoGenerateTests() {
  showDemoStartNotification('Test Generation');
  
  // Show typing animation in input
  elements.messageInput.value = "/generateTests";
  elements.messageInput.disabled = true;
  
  setTimeout(() => {
    elements.form.dispatchEvent(new Event('submit'));
    elements.messageInput.value = '';
    elements.messageInput.disabled = false;
  }, 1000);
}

// Helper for demo function notifications
function showDemoStartNotification(featureName) {
  // Create animated notification that fades in/out
  const notification = document.createElement('div');
  notification.className = 'demo-notification';
  notification.innerHTML = `
    <i class="fas fa-magic"></i>
    <span>Starting ${featureName} Demo...</span>
  `;
  
  document.body.appendChild(notification);
  
  // Add styles if not already added
  if (!document.getElementById('demo-notification-style')) {
    const style = document.createElement('style');
    style.id = 'demo-notification-style';
    style.textContent = `
      .demo-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #3f51b5;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        opacity: 0;
        transform: translateY(20px);
        animation: slideUpFadeIn 0.3s ease forwards, slideDownFadeOut 0.3s ease forwards 3s;
      }
      
      @keyframes slideUpFadeIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideDownFadeOut {
        to {
          opacity: 0;
          transform: translateY(20px);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Remove the notification after animation completes
  setTimeout(() => {
    if (notification.parentNode) {
      document.body.removeChild(notification);
    }
  }, 3500);
}

/* --- NEW CHAT BUTTON FUNCTION with proper cleanup and animated transitions --- */
function startNewChat() {
  // Confirm if we're in phase 2 and have a contract
  if (AppState.phase === 2 && AppState.currentContract) {
    if (!confirm("This will start a new conversation and clear the current contract. Are you sure?")) {
      return;
    }
  }
  
  // Add loading animation to chat container
  elements.chatContainer.innerHTML = `
    <div class="chat-loading">
      <div class="chat-loading-spinner"></div>
      <p>Starting new conversation...</p>
    </div>
  `;
  
  // Add styles for loading animation if not added
  if (!document.getElementById('chat-loading-style')) {
    const style = document.createElement('style');
    style.id = 'chat-loading-style';
    style.textContent = `
      .chat-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-muted);
      }
      
      .chat-loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(63, 81, 181, 0.2);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        animation: spin 1s infinite linear;
        margin-bottom: 16px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Clear UI with animations
  elements.chatNotifications.innerHTML = '';
  elements.messageInput.value = '';
  elements.finalContractDiv.style.opacity = '0';
  
  // Reset state
  AppState.reset();
  
  // Notify the server side to reset conversation
  callServerAPI("New chat requested", true)
    .then(() => {
      // Clear loading state
      setTimeout(() => {
        elements.chatContainer.innerHTML = '';
        elements.finalContractDiv.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-file-contract" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
            <p>No contract generated yet. Complete Phase 1 to generate a contract.</p>
          </div>
        `;
        elements.finalContractDiv.style.opacity = '1';
        
        // Show welcome message
        addNotification('New conversation started. Tell me what kind of smart contract you need.', 'info');
        
        // Add welcome message to chat
        addMessage('assistant', `
          <div style="text-align: center;">
            <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 16px;"></i>
            <h3 style="margin: 0 0 8px 0;">Welcome to SmartContractHub</h3>
            <p>I'm your AI assistant. I can help you create, audit, and optimize smart contracts.</p>
            <p>Tell me what kind of contract you need, and we'll build it together!</p>
          </div>
        `);
      }, 1000);
    })
    .catch((err) => {
      console.error("Error resetting chat:", err);
      addNotification("Error resetting chat on server", 'error');
      elements.chatContainer.innerHTML = '';
    });
}


/**
 * Switch between phases with proper data management
 */
async function switchPhase(targetPhase) {
  if (targetPhase === AppState.phase) return; // Already in this phase
  
  try {
    // Show loading state
    AppState.setLoading(true);
    addNotification(`Transitioning to Phase ${targetPhase}...`, 'info');
    
    // Call server to handle phase transition
    const response = await fetch("/api/phase-transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetPhase: targetPhase
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Update UI based on response
    if (result.error) {
      addNotification(`Error: ${result.error}`, 'error');
    } else {
      // Clear chat if needed
      if (targetPhase < AppState.phase) {
        // Visual transition effect
        elements.chatContainer.style.opacity = '0';
        
        setTimeout(() => {
          // Update chat container
          elements.chatContainer.innerHTML = '';
          
          // Update the phase
          AppState.setPhase(result.phase);
          
          // Show phase transition message
          if (result.message) {
            addMessage('assistant', result.message);
          }
          
          // Update contract display if available
          if (result.contract) {
            updateContractPreview(result.contract);
          } else {
            // Clear contract display
            AppState.currentContract = null;
            renderContractContent();
          }
          
          // Restore visibility
          elements.chatContainer.style.opacity = '1';
        }, 300);
      } else {
        // Forward phase transition
        AppState.setPhase(result.phase);
        
        // Show phase transition message
        if (result.message) {
          addMessage('assistant', result.message);
        }
        
        // Update contract display if available
        if (result.contract) {
          updateContractPreview(result.contract);
        }
      }
    }
  } catch (error) {
    console.error("Error switching phases:", error);
    addNotification(`Failed to switch phases: ${error.message}`, 'error');
  } finally {
    AppState.setLoading(false);
  }
}

/**
 * Add phase navigation buttons to the UI
 */
function addPhaseNavigation() {
  // Create navigation container if it doesn't exist
  let navContainer = document.querySelector('.phase-navigation');
  if (!navContainer) {
    navContainer = document.createElement('div');
    navContainer.className = 'phase-navigation';
    
    // Add navigation buttons
    navContainer.innerHTML = `
      <button id="prevPhaseBtn" class="phase-nav-btn" title="Previous Phase">
        <i class="fas fa-arrow-left"></i> Previous
      </button>
      <button id="nextPhaseBtn" class="phase-nav-btn" title="Next Phase">
        Next <i class="fas fa-arrow-right"></i>
      </button>
    `;
    
    // Insert after the stepper
    const stepper = document.querySelector('.process-stepper');
    if (stepper && stepper.parentNode) {
      stepper.parentNode.insertBefore(navContainer, stepper.nextSibling);
    }
    
    // Add event listeners
    document.getElementById('prevPhaseBtn').addEventListener('click', () => {
      if (AppState.phase > 1) {
        switchPhase(AppState.phase - 1);
      }
    });
    
    document.getElementById('nextPhaseBtn').addEventListener('click', () => {
      if (AppState.phase < 3) {
        switchPhase(AppState.phase + 1);
      }
    });
    
    // Add styles for phase navigation
    const style = document.createElement('style');
    style.textContent = `
      .phase-navigation {
        display: flex;
        justify-content: space-between;
        padding: 10px 20px;
        background-color: var(--bg-color);
        border-bottom: 1px solid var(--border-color);
      }
      
      .phase-nav-btn {
        padding: 8px 16px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .phase-nav-btn:hover {
        background-color: var(--primary-dark);
        transform: translateY(-2px);
      }
      
      .phase-nav-btn:disabled {
        background-color: var(--text-muted);
        cursor: not-allowed;
        transform: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Update button states based on current phase
  updatePhaseNavigationButtons();
}

/**
 * Update phase navigation button states
 */
function updatePhaseNavigationButtons() {
  const prevBtn = document.getElementById('prevPhaseBtn');
  const nextBtn = document.getElementById('nextPhaseBtn');
  
  if (prevBtn && nextBtn) {
    // Disable previous button in Phase 1
    prevBtn.disabled = AppState.phase <= 1;
    
    // Disable next button in Phase 3
    nextBtn.disabled = AppState.phase >= 3;
  }
}

/* --- ON LOAD with page animations --- */
window.onload = () => {
  // Initialize UI with fade-in animation
  document.body.classList.add('page-loaded');
  
  // Add page-load animation styles if not added
  if (!document.getElementById('page-load-style')) {
    const style = document.createElement('style');
    style.id = 'page-load-style';
    style.textContent = `
      body {
        opacity: 0;
        transition: opacity 0.5s ease;
      }
      
      body.page-loaded {
        opacity: 1;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Display elements
  elements.generatorPanel.style.display = 'flex';
  updateStepIndicator(1);
  
  // Add welcome notification after a slight delay
  setTimeout(() => {
    addNotification(
      'Welcome! I\'ll help you create a custom smart contract. Let\'s start by discussing what type of contract you need.', 
      'info'
    );
  }, 500);
  
  // Show initial greeting in chat
  setTimeout(() => {
    addMessage('assistant', `
      <div style="text-align: center;">
        <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 16px;"></i>
        <h3 style="margin: 0 0 8px 0;">Welcome to SmartContractHub</h3>
        <p>I'm your AI assistant. I can help you create, audit, and optimize smart contracts.</p>
        <p>Tell me what kind of contract you need, and we'll build it together!</p>
      </div>
    `);
  }, 800);
  
  // Initialize any UI elements that need it
  renderContractContent();
  
  // Add event listeners for keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to submit the form
    if (e.ctrlKey && e.key === 'Enter' && document.activeElement === elements.messageInput) {
      elements.form.dispatchEvent(new Event('submit'));
    }
    
    // Escape key to close any open dialogs
    if (e.key === 'Escape') {
      const openDialogs = document.querySelectorAll('.confirm-dialog');
      openDialogs.forEach(dialog => {
        document.body.removeChild(dialog);
      });
    }
  });
  
  // Add input focus animation
  elements.messageInput.addEventListener('focus', () => {
    elements.messageInput.style.boxShadow = '0 0 0 2px rgba(63, 81, 181, 0.2)';
    elements.messageInput.style.borderColor = 'var(--primary-color)';
  });
  
  elements.messageInput.addEventListener('blur', () => {
    elements.messageInput.style.boxShadow = '';
    elements.messageInput.style.borderColor = '';
  });
  
  // Add loading indicator when button is clicked
  elements.submitBtn.addEventListener('mousedown', () => {
    if (!elements.messageInput.value.trim()) return;
    elements.submitBtn.classList.add('clicked');
  });
  
  elements.submitBtn.addEventListener('mouseup', () => {
    elements.submitBtn.classList.remove('clicked');
  });
  
  // Add button click style
  if (!document.getElementById('button-click-style')) {
    const style = document.createElement('style');
    style.id = 'button-click-style';
    style.textContent = `
      #submit-btn.clicked {
        transform: scale(0.95);
      }
    `;
    
    document.head.appendChild(style);
  }
  // Add elements to the cached DOM elements object
  elements.approvalSection = document.querySelector('.approval-section');

  // Get initial mode from the select element
  const initialMode = elements.chatModeSelect.value;
  elements.generatorPanel.classList.add(`${initialMode}-mode`);

  // Setup toggle button if in basic mode
  if (initialMode === 'basic') {
    updateContractToggleButton('basic');
  }

  // If hovering out of the approval section in basic mode, hide it
  elements.approvalSection.addEventListener('mouseleave', (e) => {
    const toggleBtn = document.querySelector('.contract-toggle-btn');
    if (elements.generatorPanel.classList.contains('basic-mode') && 
        toggleBtn && !toggleBtn.classList.contains('locked')) {
      showContractPreview(false);
    }
  });
  // Add phase navigation
  addPhaseNavigation();
};/*******************************************************************************
 * FRONT-END LOGIC FOR UI & CHAT
 * Enhanced with better state management, UI feedback, and animations
 ******************************************************************************/

// Proper state management with a dedicated object
const AppState = {
  conversation: [],
  phase: 1,
  selectedLanguage: 'solidity',
  currentContract: null,
  viewMode: 'solidity',
  isLoading: false,
  errors: [],
  notificationCount: 0,
  notificationTimeout: null,
  
  // Constants
  CONTRACT_LANGUAGES: {
    SOLIDITY: 'solidity',
    VYPER: 'vyper',
    RUST: 'rust'
  },
  
  // Methods for state updates
  setPhase(newPhase) {
    this.phase = newPhase;
    updateStepIndicator(newPhase);
  },
  
  setLanguage(language) {
    if (Object.values(this.CONTRACT_LANGUAGES).includes(language)) {
      this.selectedLanguage = language;
      return true;
    }
    this.addError(`Invalid language: ${language}`);
    return false;
  },
  
  updateContract(contract) {
    this.currentContract = contract;
    renderContractContent();
  },
  
  setLoading(isLoading) {
    this.isLoading = isLoading;
    if (isLoading) {
      showLoading();
    } else {
      hideLoading();
    }
  },
  
  addError(error) {
    this.errors.push({ message: error, timestamp: new Date() });
    console.error(`App Error: ${error}`);
    addNotification(`Error: ${error}`, 'error');
  },
  
  clearErrors() {
    this.errors = [];
  },
  
  reset() {
    this.conversation = [];
    this.phase = 1;
    this.currentContract = null;
    this.errors = [];
    this.notificationCount = 0;
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    
    updateStepIndicator(1);
  },


  ////////////////////////////////////


  // Enhanced phase management
  setPhase(newPhase) {
    // No-op if same phase
    if (this.phase === newPhase) return;
    
    const oldPhase = this.phase;
    this.phase = newPhase;
    
    console.log(`Phase transition: ${oldPhase} -> ${newPhase}`);
    
    // Update UI for phase change
    updateStepIndicator(newPhase);
    updatePhaseNavigationButtons();
    
    // Auto-switch tabs based on phase
    if (newPhase === 2) {
      // In phase 2, focus on the chat to review requirements
      if (document.querySelector('.tab-button.active').textContent !== 'Contract Preview') {
        document.querySelector('.tab-button[onclick*="contract-preview"]').click();
      }
    } else if (newPhase === 3) {
      // In phase 3, show contract preview with JSON or Solidity active
      if (document.querySelector('.tab-button.active').textContent !== 'Contract Preview') {
        document.querySelector('.tab-button[onclick*="contract-preview"]').click();
      }
      
      // Switch to appropriate view based on contract state
      if (this.currentContract) {
        if (this.currentContract.jsonSpec && !this.currentContract.contracts) {
          // We have JSON spec but no code - show JSON view
          document.querySelector('.view-button[onclick*="json"]').click();
        } else if (this.currentContract.contracts && this.currentContract.contracts.length > 0) {
          // We have generated code - show code view
          document.querySelector('.view-button[onclick*="solidity"]').click();
        }
      }
    }
    
    // Return true to indicate successful phase change
    return true;
  },
  
  // Methods for handling requirements review
  showRequirementsReview(requirementsSummary) {
    // Add the special requirements review message with buttons
    addRequirementsReviewMessage(requirementsSummary);
  },
  
  // Methods for handling contract generation
  updateContractWithJson(jsonSpec) {
    if (!this.currentContract) {
      this.currentContract = {};
    }
    
    this.currentContract.jsonSpec = jsonSpec;
    
    // Update timestamp
    this.currentContract.timestamp = new Date().toISOString();
    
    // Update preview
    renderContractContent();
    
    // Update language indicator in header
    updateLanguageIndicator();
    
    return true;
  },
  
  updateContractWithCode(code) {
    if (!this.currentContract) {
      this.currentContract = {
        jsonSpec: { contractName: "SmartContract" }
      };
    }
    
    if (!this.currentContract.contracts) {
      this.currentContract.contracts = [];
    }
    
    if (this.currentContract.contracts.length > 0) {
      this.currentContract.contracts[0].content = code;
    } else {
      this.currentContract.contracts.push({
        name: this.currentContract.jsonSpec.contractName || "SmartContract",
        content: code
      });
    }
    
    // Update timestamp
    this.currentContract.timestamp = new Date().toISOString();
    
    // Update preview
    renderContractContent();
    
    // Update language indicator in header
    updateLanguageIndicator();
    
    return true;
  }
};


/**
 * Update language indicator in contract preview header
 */
function updateLanguageIndicator() {
  const languageIcon = document.querySelector('.language-icon i');
  const languageName = document.querySelector('.language-name');
  const timestamp = document.querySelector('.preview-timestamp');
  
  if (!languageIcon || !languageName || !timestamp) return;
  
  // Update language icon and name
  switch (AppState.selectedLanguage) {
    case 'solidity':
      languageIcon.className = 'fab fa-ethereum';
      languageName.textContent = 'Solidity';
      break;
    case 'vyper':
      languageIcon.className = 'fas fa-snake';
      languageName.textContent = 'Vyper';
      break;
    case 'rust':
      languageIcon.className = 'fas fa-cog';
      languageName.textContent = 'Rust';
      break;
    default:
      languageIcon.className = 'fas fa-file-code';
      languageName.textContent = AppState.selectedLanguage;
  }
  
  // Update timestamp
  if (AppState.currentContract && AppState.currentContract.timestamp) {
    const date = new Date(AppState.currentContract.timestamp);
    timestamp.textContent = `Generated: ${date.toLocaleString()}`;
  } else {
    timestamp.textContent = '';
  }
}

// Enhanced API function with proper error handling and timeout
async function callServerAPI(message, newChat = false) {
  // Add a timeout to prevent hanging requests
  const timeoutDuration = 30000; // 30 seconds
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeoutDuration);
  });
  
  try {
    const fetchPromise = fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        newChat: newChat,
        selectedLanguage: AppState.selectedLanguage
      }),
    });
    
    // Race between the fetch request and the timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("API call error:", error);
    // Throw the error to be handled by the caller
    throw error;
  }
}

/*******************************************************************************
 * UI Elements & Utilities
 ******************************************************************************/
// Cache DOM elements for better performance
const elements = {
  // Layout elements
  sidebar: document.getElementById('sidebar'),
  generatorPanel: document.getElementById('generatorPanel'),
  examplePanel1: document.getElementById('examplePanel1'),
  examplePanel2: document.getElementById('examplePanel2'),
  sidebarToggleIcon: document.getElementById('sidebar-toggle-icon'),
  
  // Chat elements
  chatContainer: document.getElementById('chat-container'),
  chatNotifications: document.getElementById('chatNotifications'),
  form: document.getElementById('input-form'),
  messageInput: document.getElementById('message-input'),
  submitBtn: document.getElementById('submit-btn'),
  loadingSpinner: document.getElementById('loading-spinner'),
  buttonText: document.getElementById('button-text'),
  finalContractDiv: document.getElementById('finalContract'),
  chatModeSelect: document.getElementById('chatModeSelect'),
  
  // Language toggles
  solidityToggle: document.getElementById('solidityToggle'),
  vyperToggle: document.getElementById('vyperToggle'),
  rustToggle: document.getElementById('rustToggle')
};

/* --- Enhanced Notifications in chat with types and animations --- */
function addNotification(message, type = 'info') {
  const notificationId = `notification-${Date.now()}-${AppState.notificationCount++}`;
  const note = document.createElement('div');
  note.id = notificationId;
  note.className = `chat-notification ${type}`; 
  note.textContent = message;
  
  elements.chatNotifications.appendChild(note);
  
  // If notification container was empty, make it visible
  if (elements.chatNotifications.childElementCount === 1) {
    elements.chatNotifications.style.display = 'flex';
  }
  
  // Auto-remove notifications after a delay (except errors)
  if (type !== 'error') {
    AppState.notificationTimeout = setTimeout(() => {
      const noteToRemove = document.getElementById(notificationId);
      if (noteToRemove) {
        // Add fade-out animation
        noteToRemove.style.opacity = '0';
        noteToRemove.style.transform = 'translateY(-10px)';
        noteToRemove.style.transition = 'all 0.3s ease';
        
        // Remove after animation completes
        setTimeout(() => {
          if (noteToRemove.parentNode) {
            noteToRemove.parentNode.removeChild(noteToRemove);
            
            // If no more notifications, hide the container
            if (elements.chatNotifications.childElementCount === 0) {
              elements.chatNotifications.style.display = 'none';
            }
          }
        }, 300);
      }
    }, 5000);
  } else {
    // Add a close button for errors
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'notification-close';
    closeBtn.onclick = function() {
      // Add fade-out animation
      note.style.opacity = '0';
      note.style.transform = 'translateY(-10px)';
      note.style.transition = 'all 0.3s ease';
      
      // Remove after animation completes
      setTimeout(() => {
        if (note.parentNode) {
          note.parentNode.removeChild(note);
          
          // If no more notifications, hide the container
          if (elements.chatNotifications.childElementCount === 0) {
            elements.chatNotifications.style.display = 'none';
          }
        }
      }, 300);
    };
    note.appendChild(closeBtn);
  }
  
  return notificationId;
}

/* --- SIDEBAR TOGGLE with animation --- */
function toggleSidebar() {
  elements.sidebar.classList.toggle('collapsed');
  
  // Animate the icon rotation
  if (elements.sidebar.classList.contains('collapsed')) {
    elements.sidebarToggleIcon.classList.remove('fa-chevron-left');
    elements.sidebarToggleIcon.classList.add('fa-chevron-right');
  } else {
    elements.sidebarToggleIcon.classList.remove('fa-chevron-right');
    elements.sidebarToggleIcon.classList.add('fa-chevron-left');
  }
}

/* --- SHOW PANELS & highlight active sidebar item --- */
function showPanel(panelId, evt) {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  if (evt) evt.currentTarget.classList.add('active');

  // Hide all panels with fade-out
  const allPanels = [elements.generatorPanel, elements.examplePanel1, elements.examplePanel2];
  allPanels.forEach(panel => {
    if (panel.style.display !== 'none') {
      // Only animate panels that are currently visible
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
    } else {
      panel.style.display = 'none';
    }
  });

  // Show chosen panel with fade-in
  setTimeout(() => {
    if (panelId === 'generatorPanel') {
      elements.generatorPanel.style.display = 'flex';
      elements.generatorPanel.style.opacity = '0';
      setTimeout(() => {
        elements.generatorPanel.style.opacity = '1';
        elements.generatorPanel.style.transition = 'opacity 0.3s ease';
      }, 50);
    } 
    else if (panelId === 'examplePanel1') {
      elements.examplePanel1.style.display = 'block';
      elements.examplePanel1.style.opacity = '0';
      setTimeout(() => {
        elements.examplePanel1.style.opacity = '1';
        elements.examplePanel1.style.transition = 'opacity 0.3s ease';
      }, 50);
    }
    else if (panelId === 'examplePanel2') {
      elements.examplePanel2.style.display = 'block';
      elements.examplePanel2.style.opacity = '0';
      setTimeout(() => {
        elements.examplePanel2.style.opacity = '1';
        elements.examplePanel2.style.transition = 'opacity 0.3s ease';
      }, 50);
    }
  }, 300);
}

/* --- SWITCH TABS (Contract Preview, My Contracts, etc.) with smooth transitions --- */
function switchTab(e, tabId) {
  // First deactivate all tabs
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Get the currently active tab
  const activeTab = document.querySelector('.tab-content.active');
  
  // Activate the clicked tab button
  e.currentTarget.classList.add('active');
  
  // Fade out active tab
  if (activeTab) {
    activeTab.style.opacity = '0';
    
    setTimeout(() => {
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(tabContent => {
        tabContent.classList.remove('active');
      });
      
      // Show and fade in the target tab
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
        setTimeout(() => {
          targetTab.style.opacity = '1';
        }, 50);
      }
    }, 250);
  } else {
    // If no active tab, just show the target tab
    document.querySelectorAll('.tab-content').forEach(tabContent => {
      tabContent.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
      targetTab.classList.add('active');
      targetTab.style.opacity = '0';
      setTimeout(() => {
        targetTab.style.opacity = '1';
      }, 50);
    }
  }
}

/* --- IMPROVED LANGUAGE TOGGLE with validation and visual feedback --- */
function setLanguage(lang) {
  if (!AppState.setLanguage(lang)) {
    return;
  }
  
  // Update UI to reflect the selected language with animation
  const allToggles = [elements.solidityToggle, elements.vyperToggle, elements.rustToggle];
  
  // First remove active class from all
  allToggles.forEach(toggle => {
    toggle.classList.remove('active');
    // Add subtle transition effect
    toggle.style.transform = 'scale(0.95)';
  });

  // Add active class to selected toggle with animation
  setTimeout(() => {
    if (lang === 'solidity') {
      elements.solidityToggle.classList.add('active');
      elements.solidityToggle.style.transform = 'scale(1)';
    } 
    else if (lang === 'vyper') {
      elements.vyperToggle.classList.add('active');
      elements.vyperToggle.style.transform = 'scale(1)';
    }
    else if (lang === 'rust') {
      elements.rustToggle.classList.add('active');
      elements.rustToggle.style.transform = 'scale(1)';
    }
    
    // Reset transform for other toggles
    allToggles.forEach(toggle => {
      if (!toggle.classList.contains('active')) {
        toggle.style.transform = 'scale(1)';
      }
    });
  }, 150);
  
  // Show confirmation notification
  addNotification(`Switched to ${lang.charAt(0).toUpperCase() + lang.slice(1)}`, 'success');
}

/* --- MODE CHANGE (Basic / Advanced) with feedback --- */
/* --- MODE CHANGE (Basic / Advanced) with contract panel toggle --- */
function changeChatMode() {
  const mode = elements.chatModeSelect.value;
  const modeText = mode === 'basic' ? 'Basic' : 'Advanced';
  
  // Visual feedback animation for the select
  elements.chatModeSelect.style.transform = 'scale(0.95)';
  elements.chatModeSelect.style.borderColor = 'var(--primary-color)';
  setTimeout(() => {
    elements.chatModeSelect.style.transform = 'scale(1)';
    elements.chatModeSelect.style.borderColor = 'var(--border-color)';
  }, 300);
  
  // Remove previous mode classes
  elements.generatorPanel.classList.remove('basic-mode', 'advanced-mode');
  
  // Apply new mode class
  elements.generatorPanel.classList.add(`${mode}-mode`);
  
  // Create or remove the toggle button
  updateContractToggleButton(mode);
  
  addNotification(`Switched to ${modeText} Mode`, 'info');
  
  // Update UI elements based on mode
  if (mode === 'advanced') {
    addNotification('Advanced features unlocked. Contract preview panel is now visible.', 'info');
  } else {
    addNotification('Switched to simplified interface. Use the side button to view contract details.', 'info');
  }
}

function updateContractToggleButton(mode) {
  // Remove any existing toggle button
  const existingBtn = document.querySelector('.contract-toggle-btn');
  if (existingBtn) {
    existingBtn.parentNode.removeChild(existingBtn);
  }
  
  // Only add toggle button in basic mode
  if (mode === 'basic') {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'contract-toggle-btn';
    toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
    toggleBtn.title = "Show Contract Preview";
    toggleBtn.setAttribute('aria-label', 'Show Contract Preview');
    
    toggleBtn.addEventListener('mouseenter', () => {
      showContractPreview(true);
    });
    
    toggleBtn.addEventListener('click', () => {
      // On click, keep the panel visible until clicked elsewhere
      const isLocked = toggleBtn.classList.contains('locked');
      
      if (isLocked) {
        toggleBtn.classList.remove('locked');
        toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
        toggleBtn.title = "Show Contract Preview";
        showContractPreview(false);
      } else {
        toggleBtn.classList.add('locked');
        toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
        toggleBtn.title = "Hide Contract Preview";
        showContractPreview(true);
        
        // Add click event listener to hide panel when clicking outside
        setTimeout(() => {
          document.addEventListener('click', hideContractOnClickOutside);
        }, 10);
      }
    });
    
    elements.chatColumn.appendChild(toggleBtn);
  }
}

function showContractPreview(show) {
  if (show) {
    elements.approvalSection.classList.add('temp-visible');
  } else {
    elements.approvalSection.classList.remove('temp-visible');
  }
}

function hideContractOnClickOutside(e) {
  const toggleBtn = document.querySelector('.contract-toggle-btn');
  const approvalSection = elements.approvalSection;
  
  // If clicking outside both the toggle button and approval section
  if (!approvalSection.contains(e.target) && !toggleBtn.contains(e.target)) {
    toggleBtn.classList.remove('locked');
    toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
    toggleBtn.title = "Show Contract Preview";
    showContractPreview(false);
    document.removeEventListener('click', hideContractOnClickOutside);
  }
}

/* --- STEP INDICATOR with visual feedback --- */
function updateStepIndicator(step) {
  console.log("Current Step =>", step);
  
  // Clear any existing step notifications
  document.querySelectorAll('.chat-notification.step-notification').forEach(node => {
    node.parentNode.removeChild(node);
  });
  
  // Create a new step notification with appropriate styling
  if (step === 1) {
    addNotification('Phase 1: Gathering Requirements', 'info');
    // Update UI elements for Phase 1
    document.querySelector('.approval-buttons').style.opacity = '0.6';
  } else if (step === 2) {
    // Celebrate Phase 2 with a more prominent notification
    const note = document.createElement('div');
    note.className = 'chat-notification success step-notification'; 
    note.innerHTML = `
      <strong>Phase 2: Contract Creation & Refinement</strong>
      <p style="margin-top: 8px; font-size: 0.9em;">
        Your contract is now being generated. You can review it in the Contract Preview tab and request changes.
      </p>
    `;
    elements.chatNotifications.appendChild(note);
    
    // Update UI elements for Phase 2
    document.querySelector('.approval-buttons').style.opacity = '1';
    
    // Auto-switch to contract preview if needed
    const previewTabButton = document.querySelector('.tab-button[onclick*="contract-preview"]');
    if (previewTabButton && !previewTabButton.classList.contains('active')) {
      previewTabButton.click();
    }
  }
}

/* --- LOADING STATES with improved visual feedback --- */
function showLoading() {
  elements.submitBtn.disabled = true;
  elements.buttonText.style.display = 'none';
  elements.submitBtn.querySelector('i').style.display = 'none';
  elements.loadingSpinner.style.display = 'block';
  elements.messageInput.disabled = true;
  
  // Add pulsing effect to input
  elements.messageInput.style.opacity = '0.7';
}

function hideLoading() {
  elements.submitBtn.disabled = false;
  elements.buttonText.style.display = 'inline';
  elements.submitBtn.querySelector('i').style.display = 'inline-block';
  elements.loadingSpinner.style.display = 'none';
  elements.messageInput.disabled = false;
  
  // Remove pulsing effect
  elements.messageInput.style.opacity = '1';
}

/* --- MESSAGING UTILS with enhanced formatting and animations --- */
/* --- ENHANCED MESSAGING UTILS with improved formatting and special message types --- */
function addMessage(role, content, type = '') {
  const messageDiv = document.createElement('div');
  
  // Base class based on role
  if (role === 'assistant') {
    messageDiv.className = `message bot-message ${type}`;
  } else if (role === 'user') {
    messageDiv.className = `message user-message ${type}`;
  } else {
    messageDiv.className = `message system-notification ${type}`;
  }
  
  // Special styling for different message types
  if (type === 'requirements-review') {
    messageDiv.classList.add('requirements-review');
  } else if (type === 'code-generation') {
    messageDiv.classList.add('code-generation');
  } else if (type === 'error-message') {
    messageDiv.classList.add('error-message');
  } else if (type === 'success-message') {
    messageDiv.classList.add('success-message');
  }
  
  // Process content for special formatting
  const formattedContent = processMessageContent(content);
  messageDiv.innerHTML = formattedContent;
  
  // Add to container with animation delay based on content length
  elements.chatContainer.appendChild(messageDiv);
  
  // Smooth scroll to the new message
  setTimeout(() => {
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
  
  // If code blocks are present, apply syntax highlighting
  if (messageDiv.querySelector('pre code') && window.Prism) {
    setTimeout(() => Prism.highlightAllUnder(messageDiv), 100);
  }
  
  return messageDiv;
}


/**
 * Add special requirements review message with styled elements 
 * and approval/edit buttons
 */
function addRequirementsReviewMessage(requirementsSummary) {
  const content = `
    <div class="requirements-review-container">
      <h3><i class="fas fa-clipboard-check"></i> Requirements Summary</h3>
      <p>I've gathered the following requirements for your smart contract. Please review them and confirm they're correct:</p>
      
      <div class="requirements-code">
        <pre>${escapeHtml(requirementsSummary)}</pre>
      </div>
      
      <div class="requirements-actions">
        <button class="approve-requirements-btn">
          <i class="fas fa-check"></i> Approve & Generate Contract
        </button>
        <button class="edit-requirements-btn">
          <i class="fas fa-pencil-alt"></i> Make Changes
        </button>
      </div>
    </div>
  `;
  
  // Add the special message
  const messageDiv = addMessage('assistant', content, 'requirements-review');
  
  // Add event listeners to buttons
  const approveBtn = messageDiv.querySelector('.approve-requirements-btn');
  const editBtn = messageDiv.querySelector('.edit-requirements-btn');
  
  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      // Disable buttons to prevent double clicks
      approveBtn.disabled = true;
      editBtn.disabled = true;
      
      // Add loading state
      approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
      
      // Add user confirmation message
      addMessage('user', 'I approve these requirements. Please generate the contract.');
      
      // Transition to phase 3
      switchPhase(3);
    });
  }
  
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      // Add user message
      addMessage('user', 'I\'d like to make some changes to the requirements.');
      
      // Add assistant response prompt
      addMessage('assistant', 'What changes would you like to make to the requirements? Please let me know and I\'ll update the summary.');
      
      // Focus on input
      elements.messageInput.focus();
    });
  }
  
  // Add styles for requirements review if not already added
  if (!document.getElementById('requirements-review-style')) {
    const style = document.createElement('style');
    style.id = 'requirements-review-style';
    style.textContent = `
      .requirements-review-container {
        margin: 0;
        padding: 0;
      }
      
      .requirements-review-container h3 {
        margin-top: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary-color);
      }
      
      .requirements-code {
        background-color: #f5f7fa;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin: 16px 0;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .requirements-code pre {
        margin: 0;
        padding: 16px;
        background-color: transparent;
        white-space: pre-wrap;
        color: var(--text-color);
        font-size: 0.9rem;
      }
      
      .requirements-actions {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      
      .approve-requirements-btn,
      .edit-requirements-btn {
        padding: 10px 16px;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      
      .approve-requirements-btn {
        background-color: var(--success-color);
        color: white;
      }
      
      .edit-requirements-btn {
        background-color: var(--warning-color);
        color: white;
      }
      
      .approve-requirements-btn:hover,
      .edit-requirements-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      
      .approve-requirements-btn:disabled,
      .edit-requirements-btn:disabled {
        background-color: var(--text-muted);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  return messageDiv;
}

/**
 * Process message content for improved formatting 
 * with specific handling for code blocks and schema
 */
function processMessageContent(content) {
  // Look for JSON schema blocks and format them specially
  content = content.replace(/```json schema\n([\s\S]*?)```/g, (_, schema) => {
    try {
      // Try to parse and pretty print the schema
      const parsedSchema = JSON.parse(schema.trim());
      const prettySchema = JSON.stringify(parsedSchema, null, 2);
      return `<div class="json-schema-block">
        <div class="schema-header">
          <span><i class="fas fa-code-branch"></i> JSON Schema</span>
          <button class="copy-schema-btn" onclick="copyToClipboard('${escapeHtml(prettySchema)}')">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <pre><code class="language-json">${escapeHtml(prettySchema)}</code></pre>
      </div>`;
    } catch (e) {
      // If parsing fails, just format as regular code
      return `<pre><code class="language-json">${escapeHtml(schema.trim())}</code></pre>`;
    }
  });

  // Convert markdown code blocks with improved syntax highlighting
  content = content.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, language, code) => {
    return `<pre><code class="language-${language || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Convert markdown-style links with target blank and security
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert inline code with matching backticks
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert bold text with matching asterisks
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic text with matching underscores
  content = content.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Handle special requirements summary section
  content = content.replace(/===\s*REQUIREMENTS SUMMARY\s*===([\s\S]*?)(?===|$)/gi, (match, summary) => {
    return `<div class="requirements-summary">
      <div class="summary-header">
        <i class="fas fa-list-check"></i>
        <h3>Requirements Summary</h3>
      </div>
      <div class="summary-content">${summary}</div>
    </div>`;
  });
  
  // Convert line breaks to <br>
  content = content.replace(/\n/g, '<br>');
  
  return content;
}

/**
 * Add a code generation result message with syntax highlighting and copy button
 */
function addCodeGenerationMessage(code, language) {
  const content = `
    <div class="code-generation-container">
      <div class="code-header">
        <span><i class="fas fa-code"></i> Generated ${language.charAt(0).toUpperCase() + language.slice(1)} Code</span>
        <button class="copy-code-btn" onclick="copyToClipboard(${JSON.stringify(code)})">
          <i class="fas fa-copy"></i> Copy Code
        </button>
      </div>
      <pre><code class="language-${language}">${escapeHtml(code)}</code></pre>
    </div>
  `;
  
  // Add the message
  const messageDiv = addMessage('assistant', content, 'code-generation');
  
  // Add styles for code generation if not already added
  if (!document.getElementById('code-generation-style')) {
    const style = document.createElement('style');
    style.id = 'code-generation-style';
    style.textContent = `
      .code-generation-container {
        margin: 0;
        padding: 0;
      }
      
      .code-header, .schema-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #2c3e50;
        color: white;
        padding: 8px 12px;
        border-top-left-radius: var(--border-radius);
        border-top-right-radius: var(--border-radius);
        font-size: 0.9rem;
      }
      
      .code-header span, .schema-header span {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .copy-code-btn, .copy-schema-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        color: white;
        padding: 4px 8px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .copy-code-btn:hover, .copy-schema-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .code-generation-container pre {
        margin: 0;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .json-schema-block {
        margin: 16px 0;
        border-radius: var(--border-radius);
        overflow: hidden;
      }
      
      .json-schema-block pre {
        margin: 0;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .requirements-summary {
        background-color: #f8f9fa;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin: 16px 0;
        padding: 16px;
      }
      
      .summary-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .summary-header i {
        color: var(--primary-color);
        font-size: 1.2rem;
      }
      
      .summary-header h3 {
        margin: 0;
        color: var(--primary-color);
      }
      
      .summary-content {
        white-space: pre-wrap;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Apply syntax highlighting
  if (window.Prism) {
    setTimeout(() => Prism.highlightAllUnder(messageDiv), 100);
  }
  
  return messageDiv;
}

/**
 * Copy text to clipboard with visual feedback
 */
function copyToClipboard(text) {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  
  // Select and copy the text
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  
  // Show feedback notification
  addNotification('Copied to clipboard!', 'success');
}

/**
 * Enhance contract preview tab with more interactive features
 */
function enhanceContractPreview() {
  // Add header with language indicator and generation timestamp
  const previewHeader = document.createElement('div');
  previewHeader.className = 'contract-preview-header';
  previewHeader.innerHTML = `
    <div class="preview-info">
      <div class="language-indicator">
        <span class="language-icon"><i class="fab fa-ethereum"></i></span>
        <span class="language-name">Solidity</span>
      </div>
      <span class="preview-timestamp">Generated: Just now</span>
    </div>
    <div class="preview-actions">
      <button class="preview-action" title="Copy to Clipboard" onclick="copyContractToClipboard()">
        <i class="fas fa-copy"></i>
      </button>
      <button class="preview-action" title="Download" onclick="downloadContract()">
        <i class="fas fa-download"></i>
      </button>
      <button class="preview-action" title="Regenerate" onclick="regenerateContract()">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>
  `;
  
  // Insert at the beginning of the tab content
  const tabContent = document.getElementById('contract-preview');
  if (tabContent) {
    tabContent.insertBefore(previewHeader, tabContent.firstChild);
  }
  
  // Add styles for the preview header
  const style = document.createElement('style');
  style.textContent = `
    .contract-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 16px;
    }
    
    .preview-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .language-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }
    
    .language-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: rgba(63, 81, 181, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
    }
    
    .preview-timestamp {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    
    .preview-actions {
      display: flex;
      gap: 8px;
    }
    
    .preview-action {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background-color: rgba(63, 81, 181, 0.1);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .preview-action:hover {
      background-color: var(--primary-color);
      color: white;
      transform: translateY(-2px);
    }
    
    /* Tab Styling Enhancement */
    .tab-content {
      position: relative;
    }
    
    .view-switcher {
      top: 12px;
      right: 20px;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 4px;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
    }
    
    /* Empty State Enhancement */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 20px;
      text-align: center;
      background-color: #f9fafc;
      border-radius: var(--border-radius);
      border: 2px dashed var(--border-color);
    }
    
    .empty-state i {
      font-size: 48px;
      color: var(--text-muted);
      margin-bottom: 24px;
      opacity: 0.5;
    }
    
    .empty-state h3 {
      margin-top: 0;
      margin-bottom: 8px;
      color: var(--text-color);
    }
    
    .empty-state p {
      color: var(--text-muted);
      max-width: 400px;
      margin-bottom: 24px;
    }
    
    .empty-state-btn {
      padding: 10px 16px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .empty-state-btn:hover {
      background-color: var(--primary-dark);
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
  
  // Update empty state with more interactive content
  updateEmptyState();
}

/**
 * Update empty state with more interactive elements
 */
function updateEmptyState() {
  // Only update if there's no contract yet
  if (AppState.currentContract) return;
  
  elements.finalContractDiv.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-file-contract"></i>
      <h3>No Contract Generated Yet</h3>
      <p>Complete Phase 1 to gather requirements, then proceed to Phase 2 to generate your smart contract.</p>
      <button class="empty-state-btn" onclick="showContractTutorial()">
        <i class="fas fa-play-circle"></i> Watch Tutorial
      </button>
    </div>
  `;
}

/**
 * Copy contract code to clipboard
 */
function copyContractToClipboard() {
  if (!AppState.currentContract) {
    addNotification('No contract available to copy', 'warning');
    return;
  }
  
  let textToCopy = '';
  
  if (AppState.viewMode === 'json') {
    // Copy JSON specification
    textToCopy = JSON.stringify(AppState.currentContract.jsonSpec, null, 2);
  } else if (AppState.viewMode === 'solidity' && AppState.currentContract.contracts && AppState.currentContract.contracts.length > 0) {
    // Copy Solidity code
    textToCopy = AppState.currentContract.contracts[0].content;
  } else {
    // Fallback to full contract data
    textToCopy = JSON.stringify(AppState.currentContract, null, 2);
  }
  
  copyToClipboard(textToCopy);
  addNotification('Contract copied to clipboard', 'success');
}

/**
 * Download contract as a file
 */
function downloadContract() {
  if (!AppState.currentContract) {
    addNotification('No contract available to download', 'warning');
    return;
  }
  
  let content = '';
  let filename = '';
  let type = '';
  
  if (AppState.viewMode === 'json') {
    // Download JSON specification
    content = JSON.stringify(AppState.currentContract.jsonSpec, null, 2);
    filename = `${AppState.currentContract.jsonSpec.contractName || 'contract'}_spec.json`;
    type = 'application/json';
  } else if (AppState.viewMode === 'solidity' && AppState.currentContract.contracts && AppState.currentContract.contracts.length > 0) {
    // Download Solidity code
    content = AppState.currentContract.contracts[0].content;
    filename = `${AppState.currentContract.jsonSpec.contractName || 'contract'}.sol`;
    type = 'text/plain';
  } else if (AppState.viewMode === 'vyper' && AppState.currentContract.contracts && AppState.currentContract.contracts.length > 0) {
    // Download Vyper code
    content = AppState.currentContract.contracts[0].content;
    filename = `${AppState.currentContract.jsonSpec.contractName || 'contract'}.vy`;
    type = 'text/plain';
  } else if (AppState.viewMode === 'rust' && AppState.currentContract.contracts && AppState.currentContract.contracts.length > 0) {
    // Download Rust code
    content = AppState.currentContract.contracts[0].content;
    filename = `${AppState.currentContract.jsonSpec.contractName || 'contract'}.rs`;
    type = 'text/plain';
  } else {
    // Fallback to full contract data
    content = JSON.stringify(AppState.currentContract, null, 2);
    filename = 'contract_data.json';
    type = 'application/json';
  }
  
  // Create download link
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  addNotification(`Contract downloaded as ${filename}`, 'success');
}

/**
 * Regenerate contract code
 */
function regenerateContract() {
  if (!AppState.currentContract || !AppState.currentContract.jsonSpec) {
    addNotification('No contract specification available to regenerate', 'warning');
    return;
  }
  
  // Call the code generation function
  generateCodeFromSpec();
}

/**
 * Show a tutorial for contract generation
 */
function showContractTutorial() {
  // Create tutorial overlay
  const tutorialOverlay = document.createElement('div');
  tutorialOverlay.className = 'tutorial-overlay';
  tutorialOverlay.innerHTML = `
    <div class="tutorial-container">
      <div class="tutorial-header">
        <h2>Smart Contract Generation Tutorial</h2>
        <button class="close-tutorial-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="tutorial-content">
        <div class="tutorial-step">
          <div class="step-number">1</div>
          <div class="step-details">
            <h3>Requirements Gathering</h3>
            <p>Describe your smart contract needs. The AI will ask you questions to understand your requirements fully.</p>
          </div>
        </div>
        <div class="tutorial-step">
          <div class="step-number">2</div>
          <div class="step-details">
            <h3>Review & Confirm</h3>
            <p>Review the requirements summary and confirm if everything looks correct, or request changes.</p>
          </div>
        </div>
        <div class="tutorial-step">
          <div class="step-number">3</div>
          <div class="step-details">
            <h3>Code Generation</h3>
            <p>The system generates production-ready code in your selected language (Solidity, Vyper, or Rust).</p>
          </div>
        </div>
        <div class="tutorial-step">
          <div class="step-number">4</div>
          <div class="step-details">
            <h3>Refine & Export</h3>
            <p>Make any needed adjustments, then copy or download your smart contract for deployment.</p>
          </div>
        </div>
      </div>
      <div class="tutorial-footer">
        <button class="start-now-btn">
          <i class="fas fa-rocket"></i> Start Building Now
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(tutorialOverlay);
  
  // Add styles for tutorial
  const style = document.createElement('style');
  style.textContent = `
    .tutorial-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .tutorial-container {
      background-color: white;
      border-radius: var(--border-radius);
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      transform: translateY(20px);
      transition: transform 0.3s ease;
    }
    
    .tutorial-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .tutorial-header h2 {
      margin: 0;
      color: var(--primary-color);
    }
    
    .close-tutorial-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--text-muted);
      transition: color 0.2s ease;
    }
    
    .close-tutorial-btn:hover {
      color: var(--text-color);
    }
    
    .tutorial-content {
      padding: 20px;
      flex-grow: 1;
    }
    
    .tutorial-step {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    
    .step-details h3 {
      margin-top: 0;
      margin-bottom: 8px;
      color: var(--text-color);
    }
    
    .step-details p {
      margin: 0;
      color: var(--text-light);
    }
    
    .tutorial-footer {
      padding: 20px;
      border-top: 1px solid var(--border-color);
      text-align: center;
    }
    
    .start-now-btn {
      padding: 12px 24px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .start-now-btn:hover {
      background-color: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  `;
  document.head.appendChild(style);
  
  // Animate appearance
  setTimeout(() => {
    tutorialOverlay.style.opacity = '1';
    tutorialOverlay.querySelector('.tutorial-container').style.transform = 'translateY(0)';
  }, 50);
  
  // Add event listeners
  tutorialOverlay.querySelector('.close-tutorial-btn').addEventListener('click', () => {
    tutorialOverlay.style.opacity = '0';
    tutorialOverlay.querySelector('.tutorial-container').style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(tutorialOverlay);
    }, 300);
  });
  
  tutorialOverlay.querySelector('.start-now-btn').addEventListener('click', () => {
    // Close tutorial
    tutorialOverlay.style.opacity = '0';
    tutorialOverlay.querySelector('.tutorial-container').style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(tutorialOverlay);
    }, 300);
    
    // Focus on message input
    elements.messageInput.focus();
    
    // Add a helpful prompt
    if (elements.chatContainer.childElementCount === 0) {
      addMessage('assistant', 'I\'m here to help you create a smart contract. What kind of contract would you like to build?');
    }
  });
}

// Call the function to enhance contract preview when the document loads
window.addEventListener('DOMContentLoaded', () => {
  enhanceContractPreview();
});

// Process message content for improved formatting
function processMessageContent(content) {
  // Convert markdown code blocks with improved syntax highlighting
  content = content.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, language, code) => {
    return `<pre><code class="language-${language || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Convert markdown-style links with target blank and security
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert inline code with matching backticks
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert bold text with matching asterisks
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic text with matching underscores
  content = content.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Convert line breaks to <br>
  content = content.replace(/\n/g, '<br>');
  
  return content;
}

// Helper function to escape HTML for code blocks
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/* --- CONTRACT PREVIEW RENDERING with improved display --- */
function updateContractPreview(responseData) {
  AppState.updateContract(responseData);
}

function generateSolidityCode(contractData) {
  if (!contractData) {
    return '// No contract data available.';
  }
  
  // Check if we have properly formatted contracts array
  if (contractData.contracts && Array.isArray(contractData.contracts) && contractData.contracts.length > 0) {
    const contractObj = contractData.contracts[0];
    if (contractObj && contractObj.content) {
      return `// Contract Name: ${contractObj.name || 'Unnamed'}\n${contractObj.content}`;
    }
  }
  
  // Fallback to legacy format or JSON spec
  if (contractData.jsonSpec) {
    const name = contractData.jsonSpec.contractName || 'SmartContract';
    return `// Contract Name: ${name}\n// This is a JSON specification. Switch to JSON view for details.`;
  }
  
  return '// Unable to generate proper code view. Please check JSON view.';
}

function generateAbiFromContract(contractData) {
  // This is a simplified placeholder - in a real app this would parse the contract
  return [
    {
      type: 'function',
      name: 'transfer',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [
        { name: '', type: 'bool' }
      ],
      stateMutability: 'nonpayable'
    },
    {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false }
      ],
      anonymous: false
    }
  ];
}

function generateNaturalLanguageDescription(contractData) {
  if (!contractData) return 'No contract data available';
  
  let description = '<div class="natural-description">';
  
  // Try to use the JSON spec if available
  if (contractData.jsonSpec) {
    const spec = contractData.jsonSpec;
    description += `
      <h3>Contract: ${spec.contractName || 'Unnamed'}</h3>
      <p>
        <strong>Language:</strong> ${AppState.selectedLanguage.charAt(0).toUpperCase() + AppState.selectedLanguage.slice(1)}<br>
        <strong>Compiler version:</strong> ${spec.solidity || spec.vyper || spec.rust || 'unspecified'}<br>
        <strong>License:</strong> ${spec.license || 'unspecified'}
      </p>
      
      <h4>Features:</h4>
      <ul>
    `;
    
    // State Variables
    if (spec.stateVariables && spec.stateVariables.length > 0) {
      description += `<li>${spec.stateVariables.length} state variables defined</li>`;
    }
    
    // Functions
    if (spec.functions && spec.functions.length > 0) {
      description += `<li>${spec.functions.length} functions implemented</li>`;
    }
    
    // Events
    if (spec.events && spec.events.length > 0) {
      description += `<li>${spec.events.length} events defined</li>`;
    }
    
    // Inheritance
    if (spec.inheritance && spec.inheritance.length > 0) {
      description += `<li>Inherits from: ${spec.inheritance.join(', ')}</li>`;
    }
    
    description += `
      </ul>
      <p><em>Switch to JSON or Solidity view for more details.</em></p>
    `;
  } else {
    // Legacy format or unknown structure
    description += `
      <h3>Contract: ${contractData.contractName || 'Unnamed'}</h3>
      <p>
        This contract is set up with name <strong>${contractData.contractName || 'Unnamed'}</strong>.<br/>
        <em>Additional details would be here if we had a more complex JSON.</em>
      </p>
    `;
  }
  
  description += '</div>';
  return description;
}

function renderContractContent() {
  if (!AppState.currentContract) {
    elements.finalContractDiv.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-contract" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <p>No contract generated yet. Complete Phase 1 to generate a contract.</p>
      </div>
    `;
    return;
  }
  
  let mainContent = '';
  const viewMode = AppState.viewMode;

  if (viewMode === 'json') {
    // Show raw JSON with improved formatting
    try {
      const formattedJson = JSON.stringify(AppState.currentContract, null, 2);
      mainContent = `<pre><code class="language-json">${escapeHtml(formattedJson)}</code></pre>`;
    } catch (err) {
      console.error("Error formatting JSON:", err);
      mainContent = `<pre><code class="language-json">Error formatting JSON: ${err.message}</code></pre>`;
    }
  } else if (viewMode === 'solidity') {
    // Show Solidity code
    const code = generateSolidityCode(AppState.currentContract);
    mainContent = `<pre><code class="language-solidity">${escapeHtml(code)}</code></pre>`;
  } else if (viewMode === 'abi') {
    // Show ABI with improved formatting
    try {
      const abi = generateAbiFromContract(AppState.currentContract);
      mainContent = `<pre><code class="language-json">${escapeHtml(JSON.stringify(abi, null, 2))}</code></pre>`;
    } catch (err) {
      console.error("Error generating ABI:", err);
      mainContent = `<pre><code class="language-json">Error generating ABI: ${err.message}</code></pre>`;
    }
  } else {
    // Natural language view
    mainContent = generateNaturalLanguageDescription(AppState.currentContract);
  }

  // Apply changes with transition
  elements.finalContractDiv.style.opacity = '0';
  setTimeout(() => {
    elements.finalContractDiv.innerHTML = mainContent;
    elements.finalContractDiv.style.opacity = '1';
    
    // Apply syntax highlighting if needed
    if ((viewMode === 'solidity' || viewMode === 'json' || viewMode === 'abi') && window.Prism) {
      Prism.highlightAllUnder(elements.finalContractDiv);
    }
  }, 300);
}

/**
 * Intercept view mode switching to handle special cases
 */
function setViewMode(e, mode) {
  // Store previous mode for transition effects
  const previousMode = AppState.viewMode;
  
  // Update state
  AppState.viewMode = mode;
  
  // Update UI
  document.querySelectorAll('.view-button').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');
  
  // Special handling for different modes
  if (mode === 'json') {
    // If we have a contract but no JSON spec, notify user
    if (AppState.currentContract && !AppState.currentContract.jsonSpec) {
      addNotification('No JSON specification available for this contract', 'warning');
    }
  } else if (mode === 'solidity' || mode === 'vyper' || mode === 'rust') {
    // If we have a JSON spec but no code, offer to generate
    if (AppState.currentContract && 
        AppState.currentContract.jsonSpec && 
        (!AppState.currentContract.contracts || AppState.currentContract.contracts.length === 0)) {
      
      // Show prompt to generate code
      elements.finalContractDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-code"></i>
          <h3>No Code Generated Yet</h3>
          <p>You have a contract specification but the code hasn't been generated.</p>
          <button class="empty-state-btn" onclick="generateCodeFromSpec()">
            <i class="fas fa-magic"></i> Generate ${mode.charAt(0).toUpperCase() + mode.slice(1)} Code
          </button>
        </div>
      `;
      return;
    }
  }
  
  // Only re-render if the mode actually changed
  if (previousMode !== mode) {
    renderContractContent();
  }
}

/*******************************************************************************
 * HANDLE CHAT SUBMISSION with improved error handling and user feedback
 ******************************************************************************/

/**
 * Enhanced submission handler with phase awareness
 */
elements.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = elements.messageInput.value.trim();
  if (!userMessage) return;

  // Show the user message
  addMessage('user', userMessage);
  elements.messageInput.value = '';

  // Set loading state
  AppState.setLoading(true);

  try {
    // Call the server with the user's message
    const responseData = await callServerAPI(userMessage);
    
    // Store the response data for use in conversation
    AppState.conversation = responseData.conversation || AppState.conversation;
    
    // Display the assistant's reply in chat
    if (responseData.message) {
      // Check if this is a requirements summary message in phase 1->2 transition
      const isRequirementsSummary = responseData.message.includes("REQUIREMENTS SUMMARY") || 
                                    responseData.message.includes("requirements summary");
      
      // Special handling for requirements summary
      if (isRequirementsSummary && (AppState.phase === 1 || responseData.phase === 2)) {
        // Use special requirements review message
        addRequirementsReviewMessage(responseData.message);
      } else {
        // Regular message
        addMessage('assistant', responseData.message);
      }
    } else if (responseData.error) {
      addMessage('assistant', `I encountered an error: ${responseData.error}`);
      AppState.addError(responseData.error);
    }

    // If there's a contract in responseData, show it in the left panel
    if (responseData.contract) {
      updateContractPreview(responseData.contract);
      
      // If we have a JSON spec but no code in phase 3, generate code
      if (responseData.phase === 3 && 
          responseData.contract.jsonSpec && 
          (!responseData.contract.contracts || responseData.contract.contracts.length === 0)) {
        // Auto-generate code after a short delay
        setTimeout(() => {
          generateCodeFromSpec();
        }, 1500);
      }
    }

    // Update phase if it changed
    if (responseData.phase !== AppState.phase) {
      AppState.setPhase(responseData.phase);
    }

    // Handle function results
    if (responseData.functionResult) {
      handleFunctionResult(responseData.functionResult);
    }

  } catch (err) {
    console.error("Error calling /api/chat:", err);
    
    // Show error message with retry option
    const errorMessage = `
      <div style="color: var(--error-color);">
        <strong>I'm sorry, I encountered an error communicating with the server.</strong><br>
        Error details: ${err.message}
      </div>
      <div style="margin-top: 10px;">
        <button class="retry-btn" onclick="retryLastMessage()" style="background-color: var(--primary-color); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-sync-alt"></i> Retry
        </button>
      </div>
    `;
    
    addMessage('assistant', errorMessage);
    AppState.addError(`API Error: ${err.message}`);
  } finally {
    AppState.setLoading(false);
  }
});

// Function to retry last failed message
function retryLastMessage() {
  // Get the last user message from the chat
  const userMessages = Array.from(elements.chatContainer.querySelectorAll('.user-message'));
  if (userMessages.length > 0) {
    const lastUserMessage = userMessages[userMessages.length - 1].textContent.trim();
    
    // Remove the error message and retry button
    const errorMessage = elements.chatContainer.querySelector('.bot-message:last-child');
    if (errorMessage) {
      errorMessage.remove();
    }
    
    // Add notification
    addNotification('Retrying your last message...', 'info');
    
    // Set message in input and submit
    elements.messageInput.value = lastUserMessage;
    elements.form.dispatchEvent(new Event('submit'));
  }
}

// Function to handle special function results with improved visual feedback
function handleFunctionResult(result) {
  if (!result) return;
  
  // Display different UI based on function type
  if (result.status === 'success') {
    addNotification(`Function executed successfully: ${result.message}`, 'success');
    
    // Handle specific function results
    if (result.fixes) {
      // BugFix result
      const fixCount = result.fixes.length;
      addNotification(`Found ${fixCount} issues to fix`, 'info');
      
      // Show fixes in the chat with relevant code snippets
      setTimeout(() => {
        let fixesMessage = `<strong>🐛 Bug Fix Report:</strong><br><br>`;
        
        result.fixes.forEach((fix, index) => {
          fixesMessage += `
            <div style="margin-bottom: 12px;">
              <strong>${index + 1}. ${fix.title}</strong><br>
              <span style="color: var(--error-color);">Issue: ${fix.description}</span><br>
              <span style="color: var(--success-color);">Solution: ${fix.solution}</span>
            </div>
          `;
        });
        
        fixesMessage += `<br>Would you like me to apply these fixes automatically?`;
        addMessage('assistant', fixesMessage);
      }, 800);
      
    } else if (result.findings) {
      // SecurityAudit result
      const criticalCount = result.findings.filter(f => f.severity === 'critical').length;
      const highCount = result.findings.filter(f => f.severity === 'high').length;
      
      if (criticalCount > 0) {
        addNotification(`⚠️ CRITICAL: Found ${criticalCount} critical security issues!`, 'error');
      }
      
      if (highCount > 0) {
        addNotification(`⚠️ HIGH: Found ${highCount} high severity issues`, 'warning');
      }
      
      // Show audit findings in chat
      setTimeout(() => {
        let auditMessage = `<strong>🔒 Security Audit Report:</strong><br><br>`;
        
        if (result.findings.length === 0) {
          auditMessage += `No security issues found. Your contract looks secure!`;
        } else {
          result.findings.forEach((finding, index) => {
            const severityColor = finding.severity === 'critical' ? 'var(--error-color)' : 
                                finding.severity === 'high' ? 'var(--warning-color)' : 
                                finding.severity === 'medium' ? 'var(--secondary-color)' : 'var(--success-color)';
            
            auditMessage += `
              <div style="margin-bottom: 12px; border-left: 3px solid ${severityColor}; padding-left: 10px;">
                <strong>${index + 1}. ${finding.title}</strong><br>
                <span style="color: ${severityColor}; text-transform: uppercase; font-weight: bold;">
                  ${finding.severity} SEVERITY
                </span><br>
                <span>${finding.description}</span>
              </div>
            `;
          });
          
          auditMessage += `<br>Would you like detailed recommendations on how to fix these issues?`;
        }
        
        addMessage('assistant', auditMessage);
      }, 800);
    }
  } else {
    AppState.addError(`Function error: ${result.message}`);
  }
}

/*******************************************************************************
 * CONTRACT ACTIONS with improved UX and feedback
 ******************************************************************************/
function approveContract() {
  if (!AppState.currentContract) {
    addNotification('No contract to approve', 'warning');
    return;
  }
  
  // Show approval confirmation popup
  const confirmDialog = document.createElement('div');
  confirmDialog.className = 'confirm-dialog';
  confirmDialog.innerHTML = `
    <div class="confirm-dialog-content">
      <h3><i class="fas fa-check-circle"></i> Approve Contract</h3>
      <p>Are you sure you want to approve this contract?</p>
      <div class="confirm-dialog-buttons">
        <button class="confirm-btn" id="confirm-approve">Yes, Approve</button>
        <button class="cancel-btn" id="cancel-approve">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(confirmDialog);
  
  // Add event listeners
  document.getElementById('confirm-approve').addEventListener('click', () => {
    // Remove dialog
    document.body.removeChild(confirmDialog);
    
    // Show success notification with animation
    addNotification('Contract Approved ✅', 'success');
    
    // Add confirmation message in chat
    addMessage('assistant', `
      <div style="text-align: center;">
        <i class="fas fa-check-circle" style="color: var(--success-color); font-size: 2rem;"></i>
        <p style="margin-top: 10px; font-weight: bold;">Contract Approved</p>
        <p>Your contract has been approved and is ready for deployment.</p>
      </div>
    `);
  });
  
  document.getElementById('cancel-approve').addEventListener('click', () => {
    document.body.removeChild(confirmDialog);
  });
  
  // Add dialog style if not already added
  if (!document.getElementById('dialog-style')) {
    const style = document.createElement('style');
    style.id = 'dialog-style';
    style.textContent = `
      .confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
      }
      
      .confirm-dialog-content {
        background-color: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        animation: scaleIn 0.3s ease;
      }
      
      .confirm-dialog-content h3 {
        margin-top: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-color);
      }
      
      .confirm-dialog-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
      }
      
      .confirm-btn {
        padding: 8px 16px;
        background-color: var(--success-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .cancel-btn {
        padding: 8px 16px;
        background-color: #f5f5f5;
        color: var(--text-color);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
  }
}

function requestChanges() {
  if (!AppState.currentContract) {
    addNotification('No contract to modify', 'warning');
    return;
  }
  
  addNotification('Requesting Changes...', 'info');
  
  // Show request changes modal with specific options
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
  
  // Add styles for change options if not already added
  if (!document.getElementById('change-options-style')) {
    const style = document.createElement('style');
    style.id = 'change-options-style';
    style.textContent = `
      .change-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 16px 0;
      }
      
      .change-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: #f9f9f9;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .change-option:hover {
        background: var(--primary-light);
        color: white;
        transform: translateY(-2px);
      }
      
      .change-option i {
        font-size: 1.5rem;
        margin-bottom: 8px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Add event listeners for options
  document.querySelectorAll('.change-option').forEach(option => {
    option.addEventListener('click', () => {
      document.body.removeChild(changeDialog);
      
      // Handle different change types
      const changeType = option.getAttribute('data-change');
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
      
      elements.messageInput.value = promptText;
      elements.messageInput.focus();
      
      // Place cursor at end of text
      const len = elements.messageInput.value.length;
      elements.messageInput.setSelectionRange(len, len);
    });
  });
  
  document.getElementById('cancel-changes').addEventListener('click', () => {
    document.body.removeChild(changeDialog);
  });
}

function compileContract() {
  if (!AppState.currentContract) {
    addNotification('No contract to compile', 'warning');
    return;
  }
  
  // Show compilation in progress
  addNotification('Compiling contract...', 'info');
  
  // Add compilation animation to contract preview
  const compileOverlay = document.createElement('div');
  compileOverlay.className = 'compile-overlay';
  compileOverlay.innerHTML = `
    <div class="compile-spinner"></div>
    <p>Compiling...</p>
  `;
  
  elements.finalContractDiv.parentNode.appendChild(compileOverlay);
  
  // Add styles for compilation animation
  if (!document.getElementById('compile-style')) {
    const style = document.createElement('style');
    style.id = 'compile-style';
    style.textContent = `
      .compile-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        animation: fadeIn 0.3s ease;
      }
      
      .compile-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(63, 81, 181, 0.2);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        animation: spin 1s infinite linear;
        margin-bottom: 16px;
      }
      
      .compile-overlay p {
        font-weight: 600;
        color: var(--primary-color);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Simulate compilation
  setTimeout(() => {
    // Remove overlay
    compileOverlay.style.opacity = '0';
    compileOverlay.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      if (compileOverlay.parentNode) {
        compileOverlay.parentNode.removeChild(compileOverlay);
      }
      
      // Simulate success/failure
      const success = Math.random() > 0.3; // 70% chance of success
      
      if (success) {
        addNotification('Compilation successful!', 'success');
        
        // Add success message to chat
        addMessage('assistant', `
          <div style="background-color: var(--success-light); padding: 12px; border-radius: 8px; border-left: 4px solid var(--success-color);">
            <strong><i class="fas fa-check-circle"></i> Compilation Successful</strong>
            <p style="margin-top: 8px;">Contract compiled without errors. You can now deploy it to a network.</p>
          </div>
        `);
      } else {
        addNotification('Compilation failed: Check for syntax errors', 'error');
        
        // Show error in chat
        addMessage('assistant', `
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
        `);
      }
    }, 300);
  }, 2500);
}

function quickAudit() {
  if (!AppState.currentContract) {
    addNotification('No contract to audit', 'warning');
    return;
  }
  
  addNotification('Performing quick security audit...', 'info');
  
  // Show audit in progress animation
  const auditOverlay = document.createElement('div');
  auditOverlay.className = 'audit-overlay';
  auditOverlay.innerHTML = `
    <div class="audit-animation">
      <i class="fas fa-shield-alt"></i>
      <i class="fas fa-search"></i>
    </div>
    <p>Scanning contract...</p>
    <div class="audit-progress">
      <div class="audit-progress-bar"></div>
    </div>
  `;
  
  elements.finalContractDiv.parentNode.appendChild(auditOverlay);
  
  // Add styles for audit animation
  if (!document.getElementById('audit-style')) {
    const style = document.createElement('style');
    style.id = 'audit-style';
    style.textContent = `
      .audit-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        animation: fadeIn 0.3s ease;
      }
      
      .audit-animation {
        position: relative;
        width: 80px;
        height: 80px;
        margin-bottom: 16px;
      }
      
      .audit-animation .fas {
        position: absolute;
        font-size: 40px;
      }
      
      .audit-animation .fa-shield-alt {
        color: #673ab7;
        left: 0;
        animation: pulse 2s infinite;
      }
      
      .audit-animation .fa-search {
        color: var(--primary-color);
        font-size: 24px;
        right: 0;
        bottom: 0;
        animation: scanning 3s infinite;
      }
      
      .audit-overlay p {
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 16px;
      }
      
      .audit-progress {
        width: 200px;
        height: 6px;
        background-color: rgba(0,0,0,0.1);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .audit-progress-bar {
        height: 100%;
        width: 0%;
        background-color: var(--primary-color);
        animation: progress 2.5s ease-in-out forwards;
      }
      
      @keyframes scanning {
        0% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-20px, -20px) scale(1.2); }
        100% { transform: translate(0, 0) scale(1); }
      }
      
      @keyframes progress {
        0% { width: 0%; }
        60% { width: 80%; }
        100% { width: 100%; }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Simulate audit process
  setTimeout(() => {
    // Remove overlay
    auditOverlay.style.opacity = '0';
    auditOverlay.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      if (auditOverlay.parentNode) {
        auditOverlay.parentNode.removeChild(auditOverlay);
      }
      
      // Show audit results
      addMessage('assistant', `
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
      `);
    }, 300);
  }, 3000);
}

function archiveContract() {
  if (!AppState.currentContract) {
    addNotification('No contract to archive', 'warning');
    return;
  }
  
  // Create confirmation dialog
  const archiveDialog = document.createElement('div');
  archiveDialog.className = 'confirm-dialog';
  archiveDialog.innerHTML = `
    <div class="confirm-dialog-content">
      <h3><i class="fas fa-archive"></i> Archive Contract</h3>
      <p>This will save the current contract to your archived contracts. You can access it later from "My Contracts".</p>
      <div class="form-group">
        <label for="archive-name">Contract Name</label>
        <input type="text" id="archive-name" value="${AppState.currentContract.contractName || 'Untitled Contract'}" placeholder="Enter a name for this contract">
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
  
  // Add styles for the form if not already added
  if (!document.getElementById('form-style')) {
    const style = document.createElement('style');
    style.id = 'form-style';
    style.textContent = `
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-color);
      }
      
      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-family: inherit;
        font-size: 0.9rem;
      }
      
      .form-group input:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.2);
      }
      
      .form-group textarea {
        min-height: 80px;
        resize: vertical;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Handle form submission
  document.getElementById('confirm-archive').addEventListener('click', () => {
    const name = document.getElementById('archive-name').value.trim();
    const description = document.getElementById('archive-description').value.trim();
    
    if (!name) {
      // Highlight the name field if empty
      document.getElementById('archive-name').style.borderColor = 'var(--error-color)';
      document.getElementById('archive-name').focus();
      return;
    }
    
    // Remove dialog
    document.body.removeChild(archiveDialog);
    
    // Show archiving animation
    addNotification('Archiving contract...', 'info');
    
    // Simulate archiving process
    setTimeout(() => {
      addNotification(`Contract "${name}" archived successfully`, 'success');
      
      // Update UI to show the contract is archived
      addMessage('assistant', `
        <div style="text-align: center;">
          <i class="fas fa-archive" style="color: #3fabb5; font-size: 2rem;"></i>
          <p style="margin-top: 10px; font-weight: bold;">Contract Archived</p>
          <p>Your contract "${name}" has been saved to "My Contracts".</p>
        </div>
      `);
      
      // Update the My Contracts tab with the new contract
      addContractToMyContracts(name, description);
    }, 1000);
  });
  
  document.getElementById('cancel-archive').addEventListener('click', () => {
    document.body.removeChild(archiveDialog);
  });
}

// Helper function to add a contract to My Contracts tab
function addContractToMyContracts(name, description) {
  const contractsList = document.querySelector('.contract-list');
  if (!contractsList) return;
  
  // Create new contract item
  const contractItem = document.createElement('li');
  contractItem.className = 'contract-item';
  contractItem.innerHTML = `
    <div class="contract-top-row">
      <div class="contract-left-info">
        <span class="contract-lang ${AppState.selectedLanguage}">
          <i class="fas fa-file-code"></i> ${AppState.selectedLanguage.charAt(0).toUpperCase() + AppState.selectedLanguage.slice(1)}
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
  
  // Add styles for contract description if not added
  if (!document.getElementById('contract-desc-style')) {
    const style = document.createElement('style');
    style.id = 'contract-desc-style';
    style.textContent = `
      .contract-description {
        margin: 8px 0 12px;
        font-size: 0.9rem;
        color: var(--text-light);
      }
      
      .deploy-btn {
        padding: 6px 12px;
        background-color: var(--success-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .deploy-btn:hover {
        background-color: #388e3c;
        transform: translateY(-2px);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Add contract item to the list with animation
  contractItem.style.opacity = '0';
  contractItem.style.transform = 'translateY(20px)';
  contractsList.insertBefore(contractItem, contractsList.firstChild);
  
  // Apply animation
  setTimeout(() => {
    contractItem.style.opacity = '1';
    contractItem.style.transform = 'translateY(0)';
    contractItem.style.transition = 'all 0.3s ease';
  }, 50);
}

/* --- STEP INDICATOR with visual feedback --- */
function updateStepIndicator(step) {
  console.log("Current Step =>", step);
  
  // Convert numeric step to integer to ensure proper comparison
  const currentStep = parseInt(step, 10);
  
  // Get all step elements
  const steps = document.querySelectorAll('.process-stepper .step');
  
  // Update each step's state
  steps.forEach(stepEl => {
    const stepNumber = parseInt(stepEl.getAttribute('data-step'), 10);
    
    // Remove all possible states first
    stepEl.classList.remove('active', 'completed', 'animating');
    
    // Add appropriate classes
    if (stepNumber < currentStep) {
      // Previous steps are completed
      stepEl.classList.add('completed');
    } else if (stepNumber === currentStep) {
      // Current step is active
      stepEl.classList.add('active');
      
      // Add animation for newly activated step
      stepEl.classList.add('animating');
      setTimeout(() => {
        stepEl.classList.remove('animating');
      }, 1500);
    }
  });
  
  // Update UI elements based on current step
  updateUIForCurrentStep(currentStep);
  
  // Add appropriate notifications for step
  showStepNotification(currentStep);
}

function updateUIForCurrentStep(step) {
  // This function adjusts UI elements based on the current step
  switch(step) {
    case 1:
      // Phase 1: Define - Gathering Requirements
      document.querySelector('.approval-buttons').style.opacity = '0.6';
      // Ensure chat input is ready for requirement gathering
      elements.messageInput.placeholder = "Describe your smart contract requirements...";
      break;
      
    case 2:
      // Phase 2: Review - Confirm specifications
      document.querySelector('.approval-buttons').style.opacity = '0.8';
      elements.messageInput.placeholder = "Review the requirements or request changes...";
      
      // Auto-switch to contract preview if needed
      const previewTabButton = document.querySelector('.tab-button[onclick*="contract-preview"]');
      if (previewTabButton && !previewTabButton.classList.contains('active')) {
        previewTabButton.click();
      }
      break;
      
    case 3:
      // Phase 3: Develop - Generated contract code
      document.querySelector('.approval-buttons').style.opacity = '1';
      elements.messageInput.placeholder = "Ask questions about the generated contract or request specific changes...";
      
      // Make sure Generate Code button is prominently displayed
      const generateBtn = document.querySelector('.generate-btn');
      if (generateBtn) {
        generateBtn.style.transform = 'scale(1.05)';
        generateBtn.style.boxShadow = 'var(--shadow-lg)';
        
        // Return to normal after a delay
        setTimeout(() => {
          generateBtn.style.transform = '';
          generateBtn.style.boxShadow = '';
        }, 2000);
      }
      break;
  }
}

function showStepNotification(step) {
  // Clear any existing step notifications
  document.querySelectorAll('.chat-notification.step-notification').forEach(node => {
    node.parentNode.removeChild(node);
  });
  
  // Create appropriate notification based on step
  switch(step) {
    case 1:
      addNotification('Phase 1: Gathering Requirements', 'info', 'step-notification');
      break;
      
    case 2:
      // More prominent notification for Phase 2
      const reviewNote = document.createElement('div');
      reviewNote.className = 'chat-notification success step-notification'; 
      reviewNote.innerHTML = `
        <strong>Phase 2: Review Requirements</strong>
        <p style="margin-top: 8px; font-size: 0.9em;">
          Please review the gathered requirements. Confirm if they're accurate or request changes.
        </p>
      `;
      elements.chatNotifications.appendChild(reviewNote);
      break;
      
    case 3:
      // Celebration for entering development phase
      const developNote = document.createElement('div');
      developNote.className = 'chat-notification success step-notification'; 
      developNote.innerHTML = `
        <strong>Phase 3: Working with Generated Contract</strong>
        <p style="margin-top: 8px; font-size: 0.9em;">
          Your smart contract has been generated! You can now review the code, ask questions about it, or request specific changes.
        </p>
      `;
      elements.chatNotifications.appendChild(developNote);
      break;
  }
}

// Enhanced notification function with class parameter
function addNotification(message, type = 'info', className = '') {
  const notificationId = `notification-${Date.now()}-${AppState.notificationCount++}`;
  const note = document.createElement('div');
  note.id = notificationId;
  note.className = `chat-notification ${type} ${className}`; 
  note.textContent = message;
  
  elements.chatNotifications.appendChild(note);
  
  // If notification container was empty, make it visible
  if (elements.chatNotifications.childElementCount === 1) {
    elements.chatNotifications.style.display = 'flex';
  }
  
  // Auto-remove notifications after a delay (except errors and step notifications)
  if (type !== 'error' && !className.includes('step-notification')) {
    AppState.notificationTimeout = setTimeout(() => {
      const noteToRemove = document.getElementById(notificationId);
      if (noteToRemove) {
        // Add fade-out animation
        noteToRemove.style.opacity = '0';
        noteToRemove.style.transform = 'translateY(-10px)';
        noteToRemove.style.transition = 'all 0.3s ease';
        
        // Remove after animation completes
        setTimeout(() => {
          if (noteToRemove.parentNode) {
            noteToRemove.parentNode.removeChild(noteToRemove);
            
            // If no more notifications, hide the container
            if (elements.chatNotifications.childElementCount === 0) {
              elements.chatNotifications.style.display = 'none';
            }
          }
        }, 300);
      }
    }, 5000);
  } else if (type === 'error') {
    // Add a close button for errors
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'notification-close';
    closeBtn.onclick = function() {
      // Add fade-out animation
      note.style.opacity = '0';
      note.style.transform = 'translateY(-10px)';
      note.style.transition = 'all 0.3s ease';
      
      // Remove after animation completes
      setTimeout(() => {
        if (note.parentNode) {
          note.parentNode.removeChild(note);
          
          // If no more notifications, hide the container
          if (elements.chatNotifications.childElementCount === 0) {
            elements.chatNotifications.style.display = 'none';
          }
        }
      }, 300);
    };
    note.appendChild(closeBtn);
  }
  
  return notificationId;
}

/**
 * Render and update the JSON tab in contract preview
 */
function updateJsonView(contractData) {
  if (!contractData) {
    return '// No contract data available for JSON view.';
  }
  
  try {
    // Focus on the JSON spec if available
    if (contractData.jsonSpec) {
      // Pretty-print the JSON spec with proper indentation
      return JSON.stringify(contractData.jsonSpec, null, 2);
    } else {
      // Fallback to full contract data
      return JSON.stringify(contractData, null, 2);
    }
  } catch (err) {
    console.error("Error formatting JSON data:", err);
    return `// Error formatting JSON: ${err.message}`;
  }
}

// Update the renderContractContent function to use this for JSON view
function renderContractContent() {
  if (!AppState.currentContract) {
    elements.finalContractDiv.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-contract" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <p>No contract generated yet. Complete Phase 1 to generate a contract.</p>
      </div>
    `;
    return;
  }
  
  let mainContent = '';
  const viewMode = AppState.viewMode;

  if (viewMode === 'json') {
    // Use the enhanced JSON view
    const formattedJson = updateJsonView(AppState.currentContract);
    mainContent = `<pre><code class="language-json">${escapeHtml(formattedJson)}</code></pre>`;
  } else if (viewMode === 'solidity') {
    // Show Solidity code
    const code = generateSolidityCode(AppState.currentContract);
    mainContent = `<pre><code class="language-solidity">${escapeHtml(code)}</code></pre>`;
  } else if (viewMode === 'abi') {
    // Show ABI with improved formatting
    try {
      const abi = generateAbiFromContract(AppState.currentContract);
      mainContent = `<pre><code class="language-json">${escapeHtml(JSON.stringify(abi, null, 2))}</code></pre>`;
    } catch (err) {
      console.error("Error generating ABI:", err);
      mainContent = `<pre><code class="language-json">Error generating ABI: ${err.message}</code></pre>`;
    }
  } else {
    // Natural language view
    mainContent = generateNaturalLanguageDescription(AppState.currentContract);
  }

  // Apply changes with transition
  elements.finalContractDiv.style.opacity = '0';
  setTimeout(() => {
    elements.finalContractDiv.innerHTML = mainContent;
    elements.finalContractDiv.style.opacity = '1';
    
    // Apply syntax highlighting if needed
    if ((viewMode === 'solidity' || viewMode === 'json' || viewMode === 'abi') && window.Prism) {
      Prism.highlightAllUnder(elements.finalContractDiv);
    }
  }, 300);
}

function generateCodeFromSpec() {
  if (!AppState.currentContract || !AppState.currentContract.jsonSpec) {
    addNotification('No contract specification to generate code from', 'warning');
    return;
  }
  
  // Show generation in progress
  addNotification('Generating contract code...', 'info');
  
  // Add generation animation
  const genOverlay = document.createElement('div');
  genOverlay.className = 'generate-overlay';
  genOverlay.innerHTML = `
    <div class="generate-animation">
      <i class="fas fa-code"></i>
    </div>
    <p>Generating code...</p>
  `;
  
  elements.finalContractDiv.parentNode.appendChild(genOverlay);
  
  // Make API call to generate code
  fetch("/api/generate-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonSpec: AppState.currentContract.jsonSpec,
      language: AppState.selectedLanguage
    }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    // Remove overlay
    genOverlay.style.opacity = '0';
    genOverlay.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      if (genOverlay.parentNode) {
        genOverlay.parentNode.removeChild(genOverlay);
      }
      
      if (data.status === 'success') {
        // Update contract code
        if (AppState.currentContract.contracts && AppState.currentContract.contracts.length > 0) {
          AppState.currentContract.contracts[0].content = data.code;
        } else {
          AppState.currentContract.contracts = [
            {
              name: AppState.currentContract.jsonSpec.contractName || "SmartContract",
              content: data.code
            }
          ];
        }
        
        // Render updated contract
        renderContractContent();
        
        addNotification('Contract code generated successfully!', 'success');
        
        // Switch to code view
        const solidityViewButton = document.querySelector('.view-button[onclick*="solidity"]');
        if (solidityViewButton) {
          solidityViewButton.click();
        }
      } else {
        addNotification(`Error generating code: ${data.error}`, 'error');
      }
    }, 300);
  })
  .catch(error => {
    // Remove overlay
    if (genOverlay.parentNode) {
      genOverlay.parentNode.removeChild(genOverlay);
    }
    
    console.error("Error generating code:", error);
    addNotification(`Error generating code: ${error.message}`, 'error');
  });
}

/**
 * Enhanced function to generate contract code from JSON specification
 */
function generateCodeFromSpec() {
  if (!AppState.currentContract || !AppState.currentContract.jsonSpec) {
    addNotification('No contract specification to generate code from', 'warning');
    return;
  }
  
  // Show generation in progress
  addNotification('Generating contract code...', 'info');
  
  // Add generation animation
  const genOverlay = document.createElement('div');
  genOverlay.className = 'generate-overlay';
  genOverlay.innerHTML = `
    <div class="generate-animation">
      <i class="fas fa-code"></i>
    </div>
    <p>Generating ${AppState.selectedLanguage} code...</p>
    <div class="progress-bar-container">
      <div class="progress-bar"></div>
    </div>
  `;
  
  elements.finalContractDiv.parentNode.appendChild(genOverlay);
  
  // Add styles for progress bar if not already added
  if (!document.getElementById('progress-bar-style')) {
    const style = document.createElement('style');
    style.id = 'progress-bar-style';
    style.textContent = `
      .progress-bar-container {
        width: 200px;
        height: 6px;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
        margin-top: 20px;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        width: 0;
        background-color: var(--primary-color);
        animation: progress 2s ease-in-out forwards;
      }
      
      @keyframes progress {
        0% { width: 0; }
        20% { width: 20%; }
        50% { width: 60%; }
        75% { width: 85%; }
        100% { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Make API call to generate code
  fetch("/api/generate-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonSpec: AppState.currentContract.jsonSpec,
      language: AppState.selectedLanguage
    }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    // Remove overlay with a fade out
    genOverlay.style.opacity = '0';
    genOverlay.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      if (genOverlay.parentNode) {
        genOverlay.parentNode.removeChild(genOverlay);
      }
      
      if (data.status === 'success') {
        // Update contract code
        if (!AppState.currentContract.contracts) {
          AppState.currentContract.contracts = [];
        }
        
        if (AppState.currentContract.contracts.length > 0) {
          AppState.currentContract.contracts[0].content = data.code;
        } else {
          AppState.currentContract.contracts.push({
            name: AppState.currentContract.jsonSpec.contractName || "SmartContract",
            content: data.code
          });
        }
        
        // Render updated contract
        renderContractContent();
        
        addNotification(`${AppState.selectedLanguage.charAt(0).toUpperCase() + AppState.selectedLanguage.slice(1)} code generated successfully!`, 'success');
        
        // Switch to code view
        const solidityViewButton = document.querySelector('.view-button[onclick*="solidity"]');
        if (solidityViewButton) {
          solidityViewButton.click();
        }
        
        // Add message to chat history
        addMessage('assistant', `
          <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <h3>Code Generation Complete</h3>
            <p>I've generated the ${AppState.selectedLanguage} code based on your requirements. You can view it in the "Contract Preview" tab.</p>
            <p>Would you like me to explain any part of the code or make any adjustments?</p>
          </div>
        `);
        
        // Add styles for success message if not already added
        if (!document.getElementById('success-message-style')) {
          const style = document.createElement('style');
          style.id = 'success-message-style';
          style.textContent = `
            .success-message {
              background-color: var(--success-light);
              padding: 16px;
              border-radius: 8px;
              border-left: 4px solid var(--success-color);
              margin-bottom: 16px;
            }
            
            .success-message i {
              color: var(--success-color);
              font-size: 24px;
              margin-bottom: 12px;
            }
            
            .success-message h3 {
              margin-top: 0;
              margin-bottom: 8px;
              color: var(--success-color);
            }
          `;
          document.head.appendChild(style);
        }
      } else {
        addNotification(`Error generating code: ${data.error}`, 'error');
        
        addMessage('assistant', `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Code Generation Failed</h3>
            <p>I encountered an error while generating the code: ${data.error}</p>
            <p>Would you like me to try again with a different approach?</p>
          </div>
        `);
        
        // Add styles for error message if not already added
        if (!document.getElementById('error-message-style')) {
          const style = document.createElement('style');
          style.id = 'error-message-style';
          style.textContent = `
            .error-message {
              background-color: var(--error-light);
              padding: 16px;
              border-radius: 8px;
              border-left: 4px solid var(--error-color);
              margin-bottom: 16px;
            }
            
            .error-message i {
              color: var(--error-color);
              font-size: 24px;
              margin-bottom: 12px;
            }
            
            .error-message h3 {
              margin-top: 0;
              margin-bottom: 8px;
              color: var(--error-color);
            }
          `;
          document.head.appendChild(style);
        }
      }
    }, 300);
  })
  .catch(error => {
    // Remove overlay
    if (genOverlay.parentNode) {
      genOverlay.parentNode.removeChild(genOverlay);
    }
    
    console.error("Error generating code:", error);
    addNotification(`Error generating code: ${error.message}`, 'error');
    
    addMessage('assistant', `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Code Generation Failed</h3>
        <p>I encountered an error while generating the code: ${error.message}</p>
        <p>Would you like me to try again with a different approach?</p>
      </div>
    `);
  });
}

/**
 * Initialize the application
 */
window.onload = () => {
  // Display elements
  elements.generatorPanel.style.display = 'flex';
  updateStepIndicator(1);
  
  // Add phase navigation
  addPhaseNavigation();
  
  // Enhance contract preview
  enhanceContractPreview();
  
  // Add welcome notification after a slight delay
  setTimeout(() => {
    addNotification(
      'Welcome! I\'ll help you create a custom smart contract. Let\'s start by discussing what type of contract you need.', 
      'info'
    );
  }, 500);
  
  // Show initial greeting in chat
  setTimeout(() => {
    addMessage('assistant', `
      <div style="text-align: center;">
        <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 16px;"></i>
        <h3 style="margin: 0 0 8px 0;">Welcome to SmartContractHub</h3>
        <p>I'm your AI assistant. I can help you create, audit, and optimize smart contracts.</p>
        <p>Tell me what kind of contract you need, and we'll build it together!</p>
      </div>
    `);
  }, 800);
  
  // Initialize any UI elements that need it
  renderContractContent();
};

// Modify the AppState object to add a step transition method
// Add this to the AppState definition
/*
  // Methods for step updates with transition animation
  setStep(newStep) {
    // Save previous step to animate transition correctly
    const previousStep = this.phase;
    this.phase = newStep;
    
    // Update the visual step indicator with transition
    updateStepIndicator(newStep);
    
    // Log phase change
    console.log(`Transitioning from Phase ${previousStep} to Phase ${newStep}`);
    
    return true;
  }
*/

// Update the existing setPhase method in AppState to use our new stepper
// Replace the current AppState.setPhase with this:
/*
  setPhase(newPhase) {
    this.phase = newPhase;
    updateStepIndicator(newPhase);
  }
*/