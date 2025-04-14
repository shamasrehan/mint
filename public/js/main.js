// main.js - Core application logic

// Use a module pattern for better encapsulation
const AppState = (function() {
  // Private state
  const state = {
    phase: 1,
    selectedLanguage: 'solidity',
    currentContract: null,
    viewMode: 'solidity',
    isLoading: false,
    errors: [],
    listeners: {}, // Event listeners store
    activeTimeouts: [] // Track timeouts for cleanup
  };

  // Event system
  function on(event, callback) {
    if (!state.listeners[event]) {
      state.listeners[event] = [];
    }
    state.listeners[event].push(callback);
    return function unsubscribe() {
      state.listeners[event] = state.listeners[event].filter(cb => cb !== callback);
    };
  }

  function emit(event, data) {
    if (state.listeners[event]) {
      state.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
  }

  // Create a timeout and track it for cleanup
  function setTimeout(callback, delay) {
    const id = window.setTimeout(() => {
      // Remove from tracking once executed
      state.activeTimeouts = state.activeTimeouts.filter(t => t !== id);
      callback();
    }, delay);
    state.activeTimeouts.push(id);
    return id;
  }

  // Public methods
  return {
    // Getters
    getPhase: () => state.phase,
    getLanguage: () => state.selectedLanguage,
    getContract: () => state.currentContract ? {...state.currentContract} : null, // Return copy
    getViewMode: () => state.viewMode,
    isLoading: () => state.isLoading,
    getErrors: () => [...state.errors], // Return copy
    
    // Setters with validation and events
    setPhase: (newPhase) => {
      if (newPhase >= 1 && newPhase <= 3 && newPhase !== state.phase) {
        const oldPhase = state.phase;
        state.phase = newPhase;
        emit('phase-change', { oldPhase, newPhase });
        return true;
      }
      return false;
    },
    
    setLanguage: (language) => {
      const validLanguages = ['solidity', 'vyper', 'rust'];
      if (validLanguages.includes(language) && language !== state.selectedLanguage) {
        const oldLanguage = state.selectedLanguage;
        state.selectedLanguage = language;
        emit('language-change', { oldLanguage, newLanguage: language });
        return true;
      }
      return false;
    },
    
    setViewMode: (mode) => {
      const validModes = ['natural', 'json', 'solidity', 'abi'];
      if (validModes.includes(mode) && mode !== state.viewMode) {
        const oldMode = state.viewMode;
        state.viewMode = mode;
        emit('view-mode-change', { oldMode, newMode: mode });
        return true;
      }
      return false;
    },
    
    updateContract: (contract) => {
      if (contract && typeof contract === 'object') {
        const oldContract = state.currentContract;
        state.currentContract = contract;
        emit('contract-change', { oldContract, newContract: contract });
        return true;
      }
      return false;
    },
    
    setLoading: (isLoading) => {
      if (state.isLoading !== isLoading) {
        state.isLoading = isLoading;
        emit('loading-change', isLoading);
      }
    },
    
    addError: (error) => {
      const errorObj = { message: error, timestamp: new Date() };
      state.errors.push(errorObj);
      emit('error', errorObj);
      console.error(`App Error: ${error}`);
    },
    
    clearErrors: () => {
      if (state.errors.length > 0) {
        state.errors = [];
        emit('errors-cleared');
      }
    },
    
    // Event system
    on,
    emit,
    
    // Reset state
    reset: () => {
      state.phase = 1;
      state.currentContract = null;
      state.errors = [];
      
      // Clear all timeouts
      state.activeTimeouts.forEach(id => window.clearTimeout(id));
      state.activeTimeouts = [];
      
      emit('reset');
    },
    
    // Controlled setTimeout that can be cleaned up
    setTimeout,
    
    // Cleanup function
    cleanup: () => {
      // Clear all timeouts
      state.activeTimeouts.forEach(id => window.clearTimeout(id));
      state.activeTimeouts = [];
      
      // Clear all event listeners
      Object.keys(state.listeners).forEach(event => {
        state.listeners[event] = [];
      });
    }
  };
})();

// DOM Utilities - Efficient DOM manipulation
const DOMUtils = (function() {
  function getElement(selector) {
    return document.querySelector(selector);
  }
  
  function getAllElements(selector) {
    return Array.from(document.querySelectorAll(selector));
  }
  
  function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          element.style[prop] = val;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add children
    if (typeof children === 'string') {
      element.textContent = children;
    } else {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          element.appendChild(child);
        }
      });
    }
    
    return element;
  }
  
  // Safely update element content
  function updateContent(selector, content) {
    const element = getElement(selector);
    if (element) {
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else if (content instanceof Node) {
        element.innerHTML = '';
        element.appendChild(content);
      }
      return true;
    }
    return false;
  }
  
  // Add animation for element transitions
  function animateTransition(element, properties, duration = 300) {
    if (!(element instanceof HTMLElement)) {
      element = getElement(element);
      if (!element) return Promise.reject(new Error('Element not found'));
    }
    
    return new Promise(resolve => {
      // Store original values
      const originalValues = {};
      Object.keys(properties).forEach(key => {
        originalValues[key] = element.style[key];
      });
      
      // Set transition
      element.style.transition = `all ${duration}ms ease`;
      
      // Set new values
      Object.entries(properties).forEach(([key, value]) => {
        element.style[key] = value;
      });
      
      // Listen for transition end
      const onTransitionEnd = () => {
        element.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      };
      
      element.addEventListener('transitionend', onTransitionEnd, { once: true });
      
      // Fallback in case transition event doesn't fire
      setTimeout(() => {
        element.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      }, duration + 50);
    });
  }
  
  // Safely add/remove event listener with option to use delegation
  function addEvent(elementOrSelector, eventType, handler, useCapture = false) {
    const element = typeof elementOrSelector === 'string' 
      ? getElement(elementOrSelector) 
      : elementOrSelector;
    
    if (!element) {
      console.error(`Element not found: ${elementOrSelector}`);
      return null;
    }
    
    element.addEventListener(eventType, handler, useCapture);
    
    // Return a cleanup function
    return function removeEvent() {
      element.removeEventListener(eventType, handler, useCapture);
    };
  }
  
  // Add delegated event handler for dynamic elements
  function addDelegatedEvent(elementOrSelector, eventType, childSelector, handler) {
    const element = typeof elementOrSelector === 'string' 
      ? getElement(elementOrSelector) 
      : elementOrSelector;
    
    if (!element) {
      console.error(`Element not found: ${elementOrSelector}`);
      return null;
    }
    
    const delegatedHandler = function(event) {
      const targetElement = event.target.closest(childSelector);
      if (targetElement && element.contains(targetElement)) {
        handler.call(targetElement, event, targetElement);
      }
    };
    
    element.addEventListener(eventType, delegatedHandler);
    
    // Return a cleanup function
    return function removeEvent() {
      element.removeEventListener(eventType, delegatedHandler);
    };
  }
  
  return {
    getElement,
    getAllElements,
    createElement,
    updateContent,
    animateTransition,
    addEvent,
    addDelegatedEvent
  };
})();

// API Service - Handle all API calls 
const APIService = (function() {
  const API_BASE_URL = "/api";
  const DEFAULT_TIMEOUT = 30000; // 30 seconds
  
  // Implement fetch with timeout and automatic JSON parsing
  async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          errorData.error || `Server responded with ${response.status}: ${response.statusText}`
        );
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      
      throw error;
    }
  }
  
  // Implement retry logic
  async function fetchWithRetry(url, options = {}, timeout = DEFAULT_TIMEOUT, maxRetries = 3) {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        return await fetchWithTimeout(url, options, timeout);
      } catch (error) {
        retries++;
        
        // Don't retry 4xx errors (client errors)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Don't retry if this was the last attempt
        if (retries > maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retries), 10000);
        console.warn(`Retrying request (${retries}/${maxRetries}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return {
    // Chat endpoint
    chat: async function(message, newChat = false) {
      try {
        return await fetchWithRetry(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            newChat,
            selectedLanguage: AppState.getLanguage()
          })
        });
      } catch (error) {
        console.error("Chat API error:", error);
        throw error;
      }
    },
    
    // Generate code from JSON spec
    generateCode: async function(jsonSpec, language) {
      try {
        return await fetchWithRetry(`${API_BASE_URL}/generate-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonSpec,
            language: language || AppState.getLanguage()
          })
        });
      } catch (error) {
        console.error("Generate code API error:", error);
        throw error;
      }
    },
    
    // Phase transition
    phaseTransition: async function(targetPhase) {
      try {
        return await fetchWithRetry(`${API_BASE_URL}/phase-transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPhase })
        });
      } catch (error) {
        console.error("Phase transition API error:", error);
        throw error;
      }
    },
    
    // Set contract language
    setLanguage: async function(language) {
      try {
        return await fetchWithRetry(`${API_BASE_URL}/language`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language })
        });
      } catch (error) {
        console.error("Set language API error:", error);
        throw error;
      }
    },
    
    // Get health check
    healthCheck: async function() {
      try {
        return await fetchWithRetry(`${API_BASE_URL}/health`, {
          method: "GET"
        });
      } catch (error) {
        console.error("Health check API error:", error);
        throw error;
      }
    }
  };
})();

// UI Controller - Handle UI updates and interactions
const UIController = (function() {
  // Cache DOM elements
  const elements = {};
  
  // Initialize element cache
  function cacheElements() {
    const elementSelectors = {
      sidebar: '#sidebar',
      sidebarToggleIcon: '#sidebar-toggle-icon',
      generatorPanel: '#generatorPanel',
      examplePanel1: '#examplePanel1',
      examplePanel2: '#examplePanel2',
      approvalSection: '.approval-section',
      finalContractDiv: '#finalContract',
      chatContainer: '#chat-container',
      chatNotifications: '#chatNotifications',
      chatModeSelect: '#chatModeSelect',
      messageInput: '#message-input',
      submitBtn: '#submit-btn',
      form: '#input-form',
      loadingSpinner: '#loading-spinner',
      buttonText: '#button-text',
      newChatBtn: '#newChatBtn',
      chatColumn: '#chatColumn',
      solidityToggle: '#solidityToggle',
      vyperToggle: '#vyperToggle',
      rustToggle: '#rustToggle',
      tabButtons: '.tab-button',
      viewButtons: '.view-button'
    };
    
    // Populate elements cache
    Object.entries(elementSelectors).forEach(([key, selector]) => {
      elements[key] = DOMUtils.getElement(selector);
      if (!elements[key]) {
        console.warn(`Element not found: ${selector}`);
      }
    });
  }
  
  // Handle UI updates based on loading state
  function updateLoadingState(isLoading) {
    if (!elements.submitBtn || !elements.messageInput) return;
    
    if (isLoading) {
      elements.submitBtn.disabled = true;
      elements.messageInput.disabled = true;
      elements.submitBtn.querySelector('i').style.display = 'none';
      elements.buttonText.style.display = 'none';
      elements.loadingSpinner.style.display = 'block';
    } else {
      elements.submitBtn.disabled = false;
      elements.messageInput.disabled = false;
      elements.submitBtn.querySelector('i').style.display = 'inline-block';
      elements.buttonText.style.display = 'inline';
      elements.loadingSpinner.style.display = 'none';
    }
  }
  
  // Add a message to the chat
  function addMessage(role, content, type = '') {
    if (!elements.chatContainer) return null;
    
    const messageDiv = DOMUtils.createElement('div', {
      className: `message ${role === 'assistant' ? 'bot-message' : 
                           role === 'user' ? 'user-message' : 
                           'system-notification'} ${type}`
    });
    
    messageDiv.innerHTML = processMessageContent(content);
    elements.chatContainer.appendChild(messageDiv);
    
    // Scroll to the new message
    AppState.setTimeout(() => {
      messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
    
    // Apply syntax highlighting
    if (window.Prism) {
      AppState.setTimeout(() => {
        try {
          Prism.highlightAllUnder(messageDiv);
        } catch (err) {
          console.error("Prism highlighting error:", err);
        }
      }, 100);
    }
    
    return messageDiv;
  }
  
  // Add a notification
  function addNotification(message, type = 'info') {
    if (!elements.chatNotifications) return null;
    
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const note = DOMUtils.createElement('div', {
      id: notificationId,
      className: `chat-notification ${type}`
    }, message);
    
    // Add close button for errors
    if (type === 'error') {
      const closeBtn = DOMUtils.createElement('span', {
        className: 'notification-close',
        onclick: function() {
          DOMUtils.animateTransition(note, {
            opacity: '0',
            transform: 'translateY(-10px)'
          }).then(() => {
            if (note.parentNode) {
              note.parentNode.removeChild(note);
              
              // Hide container if empty
              if (elements.chatNotifications.childElementCount === 0) {
                elements.chatNotifications.style.display = 'none';
              }
            }
          });
        }
      }, '×');
      
      note.appendChild(closeBtn);
    }
    
    elements.chatNotifications.appendChild(note);
    
    // Show container if this is the first notification
    if (elements.chatNotifications.childElementCount === 1) {
      elements.chatNotifications.style.display = 'flex';
    }
    
    // Auto-remove non-error notifications
    if (type !== 'error') {
      AppState.setTimeout(() => {
        if (note.parentNode) {
          DOMUtils.animateTransition(note, {
            opacity: '0',
            transform: 'translateY(-10px)'
          }).then(() => {
            if (note.parentNode) {
              note.parentNode.removeChild(note);
              
              // Hide container if empty
              if (elements.chatNotifications.childElementCount === 0) {
                elements.chatNotifications.style.display = 'none';
              }
            }
          });
        }
      }, 5000);
    }
    
    return notificationId;
  }
  
  // Process message content (format code blocks, links, etc.)
  function processMessageContent(content) {
    if (typeof content !== 'string') {
      return String(content);
    }
    
    // Process code blocks
    content = content.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, language, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre><code class="language-${language || 'text'}">${escapedCode}</code></pre>`;
    });
    
    // Process inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Process Markdown links
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Process bold text
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Process italic text
    content = content.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Process line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
  }
  
  // Escape HTML special characters
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Render contract content
  function renderContractContent() {
    if (!elements.finalContractDiv) return;
    
    const contract = AppState.getContract();
    const viewMode = AppState.getViewMode();
    
    if (!contract) {
      elements.finalContractDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-contract" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
          <p>No contract generated yet. Complete Phase 1 to generate a contract.</p>
        </div>
      `;
      return;
    }
    
    let content = '';
    
    try {
      switch (viewMode) {
        case 'json':
          const jsonStr = JSON.stringify(contract.jsonSpec || contract, null, 2);
          content = `<pre><code class="language-json">${escapeHtml(jsonStr)}</code></pre>`;
          break;
          
        case 'natural':
          content = generateNaturalLanguageDescription(contract);
          break;
          
        case 'abi':
          const abiStr = JSON.stringify(contract.abi || generateDefaultAbi(contract), null, 2);
          content = `<pre><code class="language-json">${escapeHtml(abiStr)}</code></pre>`;
          break;
          
        case 'solidity':
        default:
          if (contract.contracts && contract.contracts.length > 0) {
            content = `<pre><code class="language-solidity">${escapeHtml(contract.contracts[0].content)}</code></pre>`;
          } else {
            content = `<pre><code class="language-solidity">// No contract code generated yet</code></pre>`;
          }
          break;
      }
    } catch (error) {
      console.error("Error rendering contract:", error);
      content = `<div class="error-message">Error rendering contract: ${error.message}</div>`;
    }
    
    // Apply with transition
    elements.finalContractDiv.style.opacity = '0';
    
    AppState.setTimeout(() => {
      elements.finalContractDiv.innerHTML = content;
      elements.finalContractDiv.style.opacity = '1';
      
      // Apply syntax highlighting
      if (window.Prism) {
        try {
          Prism.highlightAllUnder(elements.finalContractDiv);
        } catch (err) {
          console.error("Prism highlighting error:", err);
        }
      }
    }, 300);
  }
  
  // Generate natural language description
  function generateNaturalLanguageDescription(contract) {
    if (!contract) return '<p>No contract data available</p>';
    
    let description = '<div class="natural-description">';
    
    try {
      // Try to use the JSON spec if available
      if (contract.jsonSpec) {
        const spec = contract.jsonSpec;
        description += `
          <h3>Contract: ${spec.contractName || 'Unnamed'}</h3>
          <p>
            <strong>Language:</strong> ${AppState.getLanguage().charAt(0).toUpperCase() + AppState.getLanguage().slice(1)}<br>
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
          <p><em>Switch to JSON or code view for more details.</em></p>
        `;
      } else {
        // Legacy format or unknown structure
        description += `
          <h3>Contract: ${contract.contractName || 'Unnamed'}</h3>
          <p>
            This contract is set up with name <strong>${contract.contractName || 'Unnamed'}</strong>.<br/>
            <em>Additional details would be here if we had a more complex JSON.</em>
          </p>
        `;
      }
    } catch (error) {
      console.error("Error generating natural description:", error);
      description += `
        <h3>Contract</h3>
        <p>Error generating contract description: ${error.message}</p>
      `;
    }
    
    description += '</div>';
    return description;
  }
  
  // Generate default ABI for display
  function generateDefaultAbi(contract) {
    // This is a simplified placeholder
    return [
      {
        type: 'function',
        name: 'example',
        inputs: [
          { name: 'param', type: 'uint256' }
        ],
        outputs: [
          { name: '', type: 'bool' }
        ],
        stateMutability: 'view'
      }
    ];
  }
  
  // Update step indicator
  function updateStepIndicator(step) {
    const steps = DOMUtils.getAllElements('.process-stepper .step');
    
    steps.forEach(stepEl => {
      const stepNumber = parseInt(stepEl.getAttribute('data-step'), 10);
      
      // Remove existing classes
      stepEl.classList.remove('active', 'completed', 'animating');
      
      // Add appropriate classes
      if (stepNumber < step) {
        stepEl.classList.add('completed');
      } else if (stepNumber === step) {
        stepEl.classList.add('active', 'animating');
        
        // Remove animation class after animation completes
        AppState.setTimeout(() => {
          stepEl.classList.remove('animating');
        }, 1500);
      }
    });
  }
  
  // Initialize event listeners
  function initEventListeners() {
    // Handle loading state changes
    AppState.on('loading-change', updateLoadingState);
    
    // Handle contract changes
    AppState.on('contract-change', () => renderContractContent());
    
    // Handle view mode changes
    AppState.on('view-mode-change', () => renderContractContent());
    
    // Handle phase changes
    AppState.on('phase-change', ({ newPhase }) => updateStepIndicator(newPhase));
    
    // Handle chat form submission
    const formCleanup = DOMUtils.addEvent(elements.form, 'submit', async (evt) => {
      evt.preventDefault();
      
      const userMsg = elements.messageInput.value.trim();
      if (!userMsg) return;
      
      // Show user message
      addMessage('user', userMsg);
      elements.messageInput.value = '';
      
      // Set loading state
      AppState.setLoading(true);
      
      try {
        // Call the API
        const responseData = await APIService.chat(userMsg);
        
        // Process response
        if (responseData.message) {
          addMessage('assistant', responseData.message);
        }
        
        if (responseData.contract) {
          AppState.updateContract(responseData.contract);
        }
        
        if (responseData.phase !== AppState.getPhase()) {
          AppState.setPhase(responseData.phase);
        }
      } catch (error) {
        console.error("Error in form submission:", error);
        
        addMessage('assistant', `
          <div style="color: var(--error-color);">
            <strong>I'm sorry, I encountered an error:</strong><br>
            ${error.message}
          </div>
          <div style="margin-top: 10px;">
            <button class="retry-btn" onclick="UIController.retryLastMessage()" style="background-color: var(--primary-color); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
              <i class="fas fa-sync-alt"></i> Retry
            </button>
          </div>
        `);
        
        AppState.addError(error.message);
      } finally {
        AppState.setLoading(false);
      }
    });
    
    // Toggle sidebar
    const sidebarToggleCleanup = DOMUtils.addEvent(elements.sidebar.querySelector('.collapse-btn'), 'click', () => {
      elements.sidebar.classList.toggle('collapsed');
      
      const isCollapsed = elements.sidebar.classList.contains('collapsed');
      elements.sidebarToggleIcon.classList.toggle('fa-chevron-left', !isCollapsed);
      elements.sidebarToggleIcon.classList.toggle('fa-chevron-right', isCollapsed);
    });
    
    // Set language
    const languageTogglesCleanup = [
      DOMUtils.addEvent(elements.solidityToggle, 'click', () => setLanguage('solidity')),
      DOMUtils.addEvent(elements.vyperToggle, 'click', () => setLanguage('vyper')),
      DOMUtils.addEvent(elements.rustToggle, 'click', () => setLanguage('rust'))
    ];
    
    // Set chat mode
    const chatModeCleanup = DOMUtils.addEvent(elements.chatModeSelect, 'change', () => {
      const mode = elements.chatModeSelect.value;
      
      // Remove existing mode classes
      elements.generatorPanel.classList.remove('basic-mode', 'advanced-mode');
      
      // Add the selected mode class
      elements.generatorPanel.classList.add(`${mode}-mode`);
      
      // Update UI based on mode
      updateContractToggleButton(mode);
      
      addNotification(`Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, 'info');
    });
    
    // New chat button
    const newChatBtnCleanup = DOMUtils.addEvent(elements.newChatBtn, 'click', startNewChat);
    
    // View mode buttons
    const viewModeBtnCleanup = DOMUtils.addDelegatedEvent(document, 'click', '.view-button', (event) => {
      const mode = event.target.getAttribute('data-mode') || 
                   event.target.getAttribute('onclick').match(/setViewMode\(event,\s*['"](\w+)['"]\)/)[1];
      
      // Update active state on buttons
      DOMUtils.getAllElements('.view-button').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');
      
      // Update view mode
      AppState.setViewMode(mode);
    });
    
    // Tab buttons
    const tabBtnCleanup = DOMUtils.addDelegatedEvent(document, 'click', '.tab-button', (event) => {
      const tabId = event.target.getAttribute('data-tab') || 
                    event.target.getAttribute('onclick').match(/switchTab\(event,\s*['"](\w+(?:-\w+)*)['"]\)/)[1];
      
      switchTab(event, tabId);
    });
    
    // Keyboard shortcuts
    const keyboardShortcutsCleanup = DOMUtils.addEvent(document, 'keydown', (e) => {
      // Ctrl+Enter to submit the form when input is focused
      if (e.ctrlKey && e.key === 'Enter' && document.activeElement === elements.messageInput) {
        e.preventDefault();
        elements.form.dispatchEvent(new Event('submit'));
      }
      
      // Escape key to close any open dialogs
      if (e.key === 'Escape') {
        const openDialogs = DOMUtils.getAllElements('.confirm-dialog, .modal-dialog');
        openDialogs.forEach(dialog => {
          if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
          }
        });
      }
    });
    
    // Return a function to clean up all event listeners
    return function cleanup() {
      formCleanup();
      sidebarToggleCleanup();
      languageTogglesCleanup.forEach(cleanup => cleanup());
      chatModeCleanup();
      newChatBtnCleanup();
      viewModeBtnCleanup();
      tabBtnCleanup();
      keyboardShortcutsCleanup();
    };
  }
  
  // Switch tabs
  function switchTab(e, tabId) {
    // Deactivate all tab buttons
    DOMUtils.getAllElements('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    
    // Activate clicked button
    e.currentTarget.classList.add('active');
    
    // Get currently active tab
    const activeTab = DOMUtils.getElement('.tab-content.active');
    
    // Fade out active tab
    if (activeTab) {
      DOMUtils.animateTransition(activeTab, { opacity: '0' }).then(() => {
        // Hide all tabs
        DOMUtils.getAllElements('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Show and fade in the target tab
        const targetTab = DOMUtils.getElement(`#${tabId}`);
        if (targetTab) {
          targetTab.classList.add('active');
          DOMUtils.animateTransition(targetTab, { opacity: '1' });
        }
      });
    } else {
      // No active tab, just show the target
      DOMUtils.getAllElements('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      
      const targetTab = DOMUtils.getElement(`#${tabId}`);
      if (targetTab) {
        targetTab.classList.add('active');
        DOMUtils.animateTransition(targetTab, { opacity: '1' });
      }
    }
  }
  
  // Set language with validation and UI update
  function setLanguage(lang) {
    // Validate and update state
    if (!AppState.setLanguage(lang)) {
      console.error(`Invalid language: ${lang}`);
      addNotification(`Invalid language: ${lang}`, 'error');
      return false;
    }
    
    // Update UI
    const toggleMap = {
      solidity: elements.solidityToggle,
      vyper: elements.vyperToggle,
      rust: elements.rustToggle
    };
    
    // Remove active class from all toggles
    Object.values(toggleMap).forEach(toggle => {
      if (toggle) toggle.classList.remove('active');
    });
    
    // Add active class to selected toggle
    if (toggleMap[lang]) {
      toggleMap[lang].classList.add('active');
    }
    
    // Show notification
    addNotification(`Switched to ${lang.charAt(0).toUpperCase() + lang.slice(1)}`, 'success');
    
    // Update API
    APIService.setLanguage(lang).catch(error => {
      console.error(`Error updating language on server: ${error.message}`);
    });
    
    return true;
  }
  
  // Start a new chat
  function startNewChat() {
    // Confirm if in Phase 2+ or if contract exists
    if (AppState.getPhase() > 1 || AppState.getContract()) {
      if (!confirm('Starting a new chat will clear your current progress. Are you sure?')) {
        return;
      }
    }
    
    // Clear chat container with animation
    const chatContainer = elements.chatContainer;
    if (chatContainer) {
      DOMUtils.animateTransition(chatContainer, { opacity: '0' }).then(() => {
        chatContainer.innerHTML = '';
        DOMUtils.animateTransition(chatContainer, { opacity: '1' });
      });
    }
    
    // Clear notifications
    if (elements.chatNotifications) {
      elements.chatNotifications.innerHTML = '';
      elements.chatNotifications.style.display = 'none';
    }
    
    // Clear input
    if (elements.messageInput) {
      elements.messageInput.value = '';
    }
    
    // Reset application state
    AppState.reset();
    
    // Call server to reset conversation
    APIService.chat('New chat requested', true)
      .then(() => {
        // Show welcome message
        addNotification('New conversation started', 'info');
        
        AppState.setTimeout(() => {
          addMessage('assistant', `
            <div style="text-align: center;">
              <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 16px;"></i>
              <h3>Welcome to SmartContractHub</h3>
              <p>I'm your AI assistant. I can help you create, audit, and optimize smart contracts.</p>
              <p>Tell me what kind of contract you need, and we'll build it together!</p>
            </div>
          `);
        }, 500);
      })
      .catch(error => {
        console.error('Error resetting chat:', error);
        addNotification('Error resetting chat on server', 'error');
      });
  }
  
  // Update contract toggle button
  function updateContractToggleButton(mode) {
    // Remove any existing toggle button
    const existingBtn = DOMUtils.getElement('.contract-toggle-btn');
    if (existingBtn && existingBtn.parentNode) {
      existingBtn.parentNode.removeChild(existingBtn);
    }
    
    // Only add toggle button in basic mode
    if (mode === 'basic' && elements.chatColumn) {
      const toggleBtn = DOMUtils.createElement('button', {
        className: 'contract-toggle-btn',
        title: 'Show Contract Preview',
        'aria-label': 'Show Contract Preview',
        onmouseenter: () => showContractPreview(true),
        onclick: (e) => {
          e.stopPropagation();
          const isLocked = toggleBtn.classList.contains('locked');
          
          if (isLocked) {
            toggleBtn.classList.remove('locked');
            toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
            toggleBtn.title = 'Show Contract Preview';
            toggleBtn.setAttribute('aria-label', 'Show Contract Preview');
            showContractPreview(false);
          } else {
            toggleBtn.classList.add('locked');
            toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
            toggleBtn.title = 'Hide Contract Preview';
            toggleBtn.setAttribute('aria-label', 'Hide Contract Preview');
            showContractPreview(true);
            
            // Add click event to hide panel when clicking outside
            AppState.setTimeout(() => {
              const outsideClickHandler = (event) => {
                if (!elements.approvalSection.contains(event.target) && 
                    !toggleBtn.contains(event.target)) {
                  toggleBtn.classList.remove('locked');
                  toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
                  toggleBtn.title = 'Show Contract Preview';
                  toggleBtn.setAttribute('aria-label', 'Show Contract Preview');
                  showContractPreview(false);
                  document.removeEventListener('click', outsideClickHandler);
                }
              };
              
              document.addEventListener('click', outsideClickHandler);
            }, 10);
          }
        }
      }, '<i class="fas fa-code"></i>');
      
      elements.chatColumn.appendChild(toggleBtn);
    }
  }
  
  // Show/hide contract preview
  function showContractPreview(show) {
    if (elements.approvalSection) {
      if (show) {
        elements.approvalSection.classList.add('temp-visible');
      } else {
        elements.approvalSection.classList.remove('temp-visible');
      }
    }
  }
  
  // Retry last failed message
  function retryLastMessage() {
    // Get the last user message from the chat
    const userMessages = DOMUtils.getAllElements('.user-message');
    if (userMessages.length === 0) return;
    
    const lastUserMessage = userMessages[userMessages.length - 1].textContent.trim();
    
    // Remove the error message and retry button
    const errorMessage = DOMUtils.getElement('.bot-message:last-child');
    if (errorMessage && errorMessage.parentNode) {
      errorMessage.parentNode.removeChild(errorMessage);
    }
    
    // Add notification
    addNotification('Retrying your last message...', 'info');
    
    // Set message in input and submit
    if (elements.messageInput && elements.form) {
      elements.messageInput.value = lastUserMessage;
      elements.form.dispatchEvent(new Event('submit'));
    }
  }
  
  // Generate code from spec
  async function generateCodeFromSpec() {
    const contract = AppState.getContract();
    
    if (!contract || !contract.jsonSpec) {
      addNotification('No contract specification to generate from', 'warning');
      return;
    }
    
    // Show notification
    addNotification('Generating code...', 'info');
    
    // Create and add generation overlay
    const genOverlay = DOMUtils.createElement('div', {
      className: 'generate-overlay'
    }, [
      DOMUtils.createElement('div', { className: 'generate-animation' }, [
        DOMUtils.createElement('i', { className: 'fas fa-code' })
      ]),
      DOMUtils.createElement('p', {}, 'Generating code...'),
      DOMUtils.createElement('div', { className: 'progress-bar-container' }, [
        DOMUtils.createElement('div', { className: 'progress-bar' })
      ])
    ]);
    
    if (elements.finalContractDiv && elements.finalContractDiv.parentNode) {
      elements.finalContractDiv.parentNode.appendChild(genOverlay);
    }
    
    try {
      // Call API to generate code
      const result = await APIService.generateCode(contract.jsonSpec, AppState.getLanguage());
      
      // Handle successful generation
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
        AppState.updateContract(contract);
        
        // Show success notification
        addNotification('Code generated successfully!', 'success');
        
        // Add message to chat
        addMessage('assistant', `
          <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <h3>Code Generation Complete</h3>
            <p>I've generated the ${AppState.getLanguage()} code based on your requirements. You can view it in the "Contract Preview" tab.</p>
            <p>Would you like me to explain any part of the code or make any adjustments?</p>
          </div>
        `);
      } else {
        // Handle error
        throw new Error(result.error || 'Code generation failed');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      
      // Show error notification
      addNotification(`Error generating code: ${error.message}`, 'error');
      
      // Add error message to chat
      addMessage('assistant', `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Code Generation Failed</h3>
          <p>I encountered an error while generating the code: ${error.message}</p>
          <p>Would you like me to try again with a different approach?</p>
        </div>
      `);
    } finally {
      // Remove overlay with animation
      if (genOverlay.parentNode) {
        DOMUtils.animateTransition(genOverlay, { opacity: '0' }).then(() => {
          if (genOverlay.parentNode) {
            genOverlay.parentNode.removeChild(genOverlay);
          }
        });
      }
    }
  }
  
  // Initialize the UI
  function init() {
    cacheElements();
    const eventCleanup = initEventListeners();
    
    // Initial render of contract if available
    renderContractContent();
    
    // Update step indicator for current phase
    updateStepIndicator(AppState.getPhase());
    
    // Welcome message
    AppState.setTimeout(() => {
      addNotification(
        'Welcome! Tell me what kind of smart contract you need.', 
        'info'
      );
      
      AppState.setTimeout(() => {
        addMessage('assistant', `
          <div style="text-align: center;">
            <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 16px;"></i>
            <h3>Welcome to SmartContractHub</h3>
            <p>I'm your AI assistant. I can help you create, audit, and optimize smart contracts.</p>
            <p>Tell me what kind of contract you need, and we'll build it together!</p>
          </div>
        `);
      }, 300);
    }, 500);
    
    // Return cleanup function
    return function cleanup() {
      eventCleanup();
      AppState.cleanup();
    };
  }
  
  // Return public methods
  return {
    init,
    addMessage,
    addNotification,
    retryLastMessage,
    generateCodeFromSpec,
    startNewChat,
    showContractPreview,
    switchTab,
    setLanguage,
    escapeHtml,
    processMessageContent
  };
})();

// Initialize on window load
let appCleanup;
window.addEventListener('DOMContentLoaded', () => {
  try {
    appCleanup = UIController.init();
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});

// Cleanup on window unload
window.addEventListener('beforeunload', () => {
  if (appCleanup && typeof appCleanup === 'function') {
    appCleanup();
  }
});