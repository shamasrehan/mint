// chat.js - Handles chat interactions and message display

/**
 * Chat Service - Manages all chat-related functionality
 */
const ChatService = (function() {
  // Private variables
  let messageHistory = [];
  
  /**
   * Call the server API with the user's message
   * @param {string} message - User message
   * @param {boolean} newChat - Whether to start a new chat
   * @returns {Promise} API response
   */
  async function callServerAPI(message, newChat = false) {
    // Request configuration
    const timeoutDuration = 30000; // 30 seconds
    const maxRetries = 3;
    let retryCount = 0;
    
    // Function to attempt the API call
    async function attemptApiCall() {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeoutDuration);
      });
      
      try {
        // Create main fetch promise
        const fetchPromise = fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            newChat,
            selectedLanguage: AppState ? AppState.getLanguage() : 'solidity'
          }),
        });
        
        // Race the promises
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Check response status
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.error || `Server returned ${response.status}: ${response.statusText}`
          );
          error.status = response.status;
          error.data = errorData;
          throw error;
        }
        
        // Parse response
        return await response.json();
      } catch (error) {
        // Check if we should retry (server errors, network issues, timeouts)
        const isServerError = error.status >= 500;
        const isNetworkError = error.message.includes('NetworkError') || 
                              error.message.includes('Failed to fetch');
        const isTimeout = error.message.includes('timeout');
        
        if ((isServerError || isNetworkError || isTimeout) && retryCount < maxRetries) {
          retryCount++;
          console.warn(`API call attempt ${retryCount} failed, retrying...`);
          
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the API call
          return attemptApiCall();
        }
        
        // Throw the error if we shouldn't retry or we've exhausted retries
        console.error("API call error:", error);
        throw error;
      }
    }
    
    // Start the first attempt
    return attemptApiCall();
  }
  
  /**
   * Add a new message to the chat display
   * @param {string} role - Message role ('user', 'assistant', 'system')
   * @param {string} content - Message content
   * @param {string} type - Optional message type/class
   * @returns {HTMLElement} The created message element
   */
  function addMessage(role, content, type = '') {
    // Store in history
    const message = { role, content, type, timestamp: new Date() };
    messageHistory.push(message);
    
    // Use UIController to add message to DOM
    if (window.UIController && typeof UIController.addMessage === 'function') {
      return UIController.addMessage(role, content, type);
    }
    
    // Fallback display method if UIController is not available
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return null;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'assistant' ? 'bot-message' : 
                               role === 'user' ? 'user-message' : 
                               'system-notification'} ${type}`;
    
    msgDiv.innerHTML = processMessageContent(content);
    chatContainer.appendChild(msgDiv);
    
    // Scroll into view
    setTimeout(() => {
      msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
    
    // Apply syntax highlighting
    if (window.Prism) {
      try {
        setTimeout(() => Prism.highlightAllUnder(msgDiv), 100);
      } catch (error) {
        console.error("Prism highlighting error:", error);
      }
    }
    
    return msgDiv;
  }
  
  /**
   * Process message content (format code blocks, links, etc.)
   * @param {string} text - Raw message text
   * @returns {string} Formatted HTML content
   */
  function processMessageContent(text) {
    if (typeof text !== 'string') {
      return String(text);
    }
    
    // Use UIController method if available
    if (window.UIController && typeof UIController.processMessageContent === 'function') {
      return UIController.processMessageContent(text);
    }
    
    // Convert code blocks with syntax highlighting
    text = text.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Convert inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert links [label](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic _text_
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Convert line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
  }
  
  /**
   * Escape HTML to safely insert text
   * @param {string} str - String to escape
   * @returns {string} Escaped HTML
   */
  function escapeHtml(str) {
    // Use UIController method if available
    if (window.UIController && typeof UIController.escapeHtml === 'function') {
      return UIController.escapeHtml(str);
    }
    
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  /**
   * Start a new chat (clear current conversation)
   */
  function startNewChat() {
    if (window.UIController && typeof UIController.startNewChat === 'function') {
      return UIController.startNewChat();
    }
    
    // Confirmation
    if (messageHistory.length > 0) {
      if (!confirm("Start a new conversation? This will clear current messages.")) {
        return;
      }
    }
    
    // Clear chat container
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.innerHTML = "";
    }
    
    // Clear message history
    messageHistory = [];
    
    // Show notification
    if (typeof addNotification === 'function') {
      addNotification("New chat started.", "info");
    }
    
    // Call server to reset conversation
    callServerAPI("New chat requested", true)
      .then(() => {
        // Show welcome message
        setTimeout(() => {
          addMessage('assistant', `
            <div style="text-align: center;">
              <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 16px;"></i>
              <h3>New Conversation</h3>
              <p>How can I help you now?</p>
            </div>
          `);
        }, 500);
      })
      .catch(error => {
        console.error("Error starting new chat:", error);
        if (typeof addNotification === 'function') {
          addNotification("Error starting new chat: " + error.message, "error");
        }
      });
  }
  
  /**
   * Copy text to clipboard with proper error handling
   * @param {string} text - Text to copy
   */
  function copyToClipboard(text) {
    // Create a notification function if it doesn't exist
    const notify = typeof addNotification === 'function' ? 
      addNotification : 
      (msg, type) => console.log(`${type}: ${msg}`);
    
    // Modern clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          notify(`Copied to clipboard`, 'success');
        })
        .catch(err => {
          console.error('Clipboard error', err);
          
          // Fall back to legacy method if permission denied
          if (err.name === 'NotAllowedError') {
            legacyCopy();
          } else {
            notify('Failed to copy: ' + err.message, 'error');
          }
        });
      return;
    }
    
    // Legacy method
    legacyCopy();
    
    // Legacy clipboard method
    function legacyCopy() {
      try {
        const tempArea = document.createElement('textarea');
        tempArea.value = text;
        tempArea.setAttribute('readonly', '');
        tempArea.style.position = 'absolute';
        tempArea.style.left = '-9999px';
        document.body.appendChild(tempArea);
        
        // Select and copy
        const selection = document.getSelection();
        const selected = selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
        
        tempArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(tempArea);
        
        // Restore selection
        if (selected) {
          selection.removeAllRanges();
          selection.addRange(selected);
        }
        
        if (success) {
          notify(`Copied to clipboard`, 'success');
        } else {
          notify('Failed to copy', 'error');
        }
      } catch (err) {
        console.error('Legacy clipboard error', err);
        notify('Failed to copy', 'error');
      }
    }
  }
  
  /**
   * Toggle deployments list in My Contracts
   * @param {HTMLElement} toggleButton - The toggle button element
   */
  function toggleDeployments(toggleButton) {
    if (!toggleButton) return;
    
    const networkList = toggleButton.nextElementSibling;
    if (!networkList) return;
    
    const icon = toggleButton.querySelector('i');
    if (!icon) return;
    
    // Check current state
    const isHidden = networkList.style.display === 'none' || !networkList.style.display;
    
    if (isHidden) {
      // Show with animation
      networkList.style.display = 'block';
      networkList.style.maxHeight = '0';
      networkList.style.opacity = '0';
      networkList.style.overflow = 'hidden';
      networkList.style.transition = 'max-height 0.3s ease, opacity 0.2s ease';
      
      // Rotate icon
      if (icon) {
        icon.style.transform = 'rotate(180deg)';
        icon.style.transition = 'transform 0.3s ease';
      }
      
      // Trigger animation
      setTimeout(() => {
        networkList.style.maxHeight = networkList.scrollHeight + 'px';
        networkList.style.opacity = '1';
      }, 10);
      
      // Remove height restriction after animation
      setTimeout(() => {
        networkList.style.maxHeight = 'none';
      }, 300);
    } else {
      // Hide with animation
      networkList.style.maxHeight = networkList.scrollHeight + 'px';
      networkList.style.overflow = 'hidden';
      
      // Force reflow
      networkList.offsetHeight;
      
      // Start animation
      networkList.style.maxHeight = '0';
      networkList.style.opacity = '0';
      
      // Reset icon
      if (icon) {
        icon.style.transform = 'rotate(0deg)';
      }
      
      // Actually hide after animation completes
      setTimeout(() => {
        networkList.style.display = 'none';
      }, 300);
    }
  }
  
  /**
   * Get message history
   * @returns {Array} Message history
   */
  function getMessageHistory() {
    return [...messageHistory]; // Return a copy
  }
  
  /**
   * Clear message history
   */
  function clearMessageHistory() {
    messageHistory = [];
  }
  
  // Public API
  return {
    callServerAPI,
    addMessage,
    processMessageContent,
    escapeHtml,
    startNewChat,
    copyToClipboard,
    toggleDeployments,
    getMessageHistory,
    clearMessageHistory
  };
})();

// Export methods to window for compatibility with existing code
window.callServerAPI = ChatService.callServerAPI;
window.addMessage = ChatService.addMessage;
window.processMessageContent = ChatService.processMessageContent;
window.escapeHtml = ChatService.escapeHtml;
window.startNewChat = ChatService.startNewChat;
window.copyToClipboard = ChatService.copyToClipboard;
window.toggleDeployments = ChatService.toggleDeployments;