// ui.js - Handles UI components and interactions

/**
 * UI Service - Manages UI components and interactions
 */
const UIService = (function() {
  // Cache DOM elements for better performance
  const elements = {};
  
  // Track event listeners for cleanup
  const eventListeners = [];
  
  /**
   * Initialize the UI module
   */
  function init() {
    // Cache core elements
    cacheElements();
    
    // Initialize UI components
    initializeComponents();
    
    // Setup accessibility improvements
    setupAccessibility();
    
    // Return cleanup function
    return cleanup;
  }
  
  /**
   * Cache DOM elements for frequently used elements
   */
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
      collapseBtn: '.collapse-btn',
      solidityToggle: '#solidityToggle',
      vyperToggle: '#vyperToggle',
      rustToggle: '#rustToggle',
      tabButtons: '.tab-button',
      viewButtons: '.view-button',
      menuItems: '.menu-item'
    };
    
    // Clear existing cache
    Object.keys(elements).forEach(key => delete elements[key]);
    
    // Populate element cache
    Object.entries(elementSelectors).forEach(([key, selector]) => {
      if (selector.startsWith('.')) {
        // For class selectors, get all elements
        elements[key] = document.querySelectorAll(selector);
      } else {
        // For ID selectors, get single element
        elements[key] = document.getElementById(selector.substring(1));
      }
      
      // Check if element exists
      if ((!elements[key] || (elements[key] instanceof NodeList && elements[key].length === 0)) && 
          selector !== '.menu-item') { // menu-item may not exist initially
        console.warn(`Element not found: ${selector}`);
      }
    });
  }
  
  /**
   * Add event listener with automatic tracking for cleanup
   * @param {Element|string} element - DOM element or selector
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {boolean|Object} options - Event listener options
   * @returns {Function} Cleanup function
   */
  function addEvent(element, eventType, handler, options = false) {
    // Get the DOM element if a selector was provided
    const el = typeof element === 'string' ? 
      (element.startsWith('.') ? document.querySelectorAll(element) : document.querySelector(element)) : 
      element;
    
    if (!el) {
      console.error(`Element not found for selector: ${element}`);
      return () => {};
    }
    
    // For NodeList, add event to all elements
    if (el instanceof NodeList || el instanceof HTMLCollection) {
      const cleanupFunctions = [];
      
      el.forEach(item => {
        item.addEventListener(eventType, handler, options);
        cleanupFunctions.push(() => {
          item.removeEventListener(eventType, handler, options);
        });
      });
      
      // Store the cleanup functions
      const cleanupGroup = () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
      
      eventListeners.push(cleanupGroup);
      return cleanupGroup;
    } else {
      // Add event to single element
      el.addEventListener(eventType, handler, options);
      
      // Create and store cleanup function
      const cleanup = () => {
        el.removeEventListener(eventType, handler, options);
      };
      
      eventListeners.push(cleanup);
      return cleanup;
    }
  }
  
  /**
   * Initialize UI components
   */
  function initializeComponents() {
    // Initialize sidebar toggle
    if (elements.collapseBtn) {
      addEvent(elements.collapseBtn, 'click', toggleSidebar);
    }
    
    // Initialize menu items
    addEvent(elements.menuItems, 'click', handleMenuItemClick);
    
    // Initialize tab buttons
    addEvent(elements.tabButtons, 'click', handleTabClick);
    
    // Initialize view mode buttons
    addEvent(elements.viewButtons, 'click', handleViewModeChange);
    
    // Initialize language toggles
    if (elements.solidityToggle) {
      addEvent(elements.solidityToggle, 'click', () => setLanguage('solidity'));
    }
    if (elements.vyperToggle) {
      addEvent(elements.vyperToggle, 'click', () => setLanguage('vyper'));
    }
    if (elements.rustToggle) {
      addEvent(elements.rustToggle, 'click', () => setLanguage('rust'));
    }
    
    // Initialize chat mode dropdown
    if (elements.chatModeSelect) {
      addEvent(elements.chatModeSelect, 'change', handleModeChange);
    }
    
    // Initialize new chat button
    if (elements.newChatBtn) {
      addEvent(elements.newChatBtn, 'click', handleNewChat);
    }
    
    // Initialize form
    if (elements.form) {
      addEvent(elements.form, 'submit', handleFormSubmit);
    }
    
    // Add keyboard shortcuts
    addEvent(document, 'keydown', handleKeyboardShortcuts);
    
    // Input focus effects
    if (elements.messageInput) {
      addEvent(elements.messageInput, 'focus', () => {
        elements.messageInput.style.boxShadow = '0 0 0 2px rgba(63, 81, 181, 0.2)';
        elements.messageInput.style.borderColor = 'var(--primary-color)';
      });
      
      addEvent(elements.messageInput, 'blur', () => {
        elements.messageInput.style.boxShadow = '';
        elements.messageInput.style.borderColor = '';
      });
    }
  }
  
  /**
   * Setup accessibility improvements
   */
  function setupAccessibility() {
    // Add ARIA attributes to interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(button => {
      // Set aria-label based on text content or icon
      if (button.textContent.trim()) {
        button.setAttribute('aria-label', button.textContent.trim());
      } else if (button.querySelector('i[class*="fa-"]')) {
        // Try to determine label from icon class
        const icon = button.querySelector('i[class*="fa-"]');
        const iconClass = Array.from(icon.classList)
          .find(cls => cls.startsWith('fa-'))
          ?.replace('fa-', '') || 'button';
        button.setAttribute('aria-label', iconClass.replace('-', ' '));
      }
    });
    
    // Add tab indices to interactive elements that may be missed
    document.querySelectorAll('.menu-item, .tab-button, .view-button, .icon-button')
      .forEach(el => {
        if (!el.hasAttribute('tabindex')) {
          el.setAttribute('tabindex', '0');
        }
      });
    
    // Add keyboard activation to items that only have click handlers
    document.querySelectorAll('.menu-item, .tab-button, .view-button, .icon-button')
      .forEach(el => {
        addEvent(el, 'keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
          }
        });
      });
    
    // Improve focus visibility
    const style = document.createElement('style');
    style.textContent = `
      :focus-visible {
        outline: 2px solid var(--primary-color) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Toggle sidebar expanded/collapsed state
   */
  function toggleSidebar() {
    if (!elements.sidebar) return;
    
    elements.sidebar.classList.toggle('collapsed');
    
    const isCollapsed = elements.sidebar.classList.contains('collapsed');
    
    // Update toggle icon
    if (elements.sidebarToggleIcon) {
      elements.sidebarToggleIcon.className = isCollapsed ? 
        'fas fa-chevron-right' : 'fas fa-chevron-left';
        
      // Add SR text for screen readers
      const srText = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
      elements.sidebarToggleIcon.setAttribute('aria-label', srText);
    }
    
    // Update ARIA attributes
    elements.sidebar.setAttribute('aria-expanded', !isCollapsed);
    
    // Fire an event that can be listened to
    const event = new CustomEvent('sidebar:toggle', { 
      detail: { collapsed: isCollapsed } 
    });
    document.dispatchEvent(event);
    
    // Save state to localStorage for persistence
    try {
      localStorage.setItem('sidebar:collapsed', isCollapsed);
    } catch (e) {
      console.warn('Could not save sidebar state to localStorage', e);
    }
  }
  
  /**
   * Handle menu item clicks
   * @param {Event} event - Click event
   */
  function handleMenuItemClick(event) {
    const menuItem = event.currentTarget;
    
    // Get panel ID from data attribute or onclick attribute
    const panelId = menuItem.dataset.panel || 
      menuItem.getAttribute('onclick')?.match(/showPanel\(['"]([^'"]+)['"]/)?.[1];
    
    if (!panelId) {
      console.error('No panel ID found for menu item', menuItem);
      return;
    }
    
    // Update active state
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    
    menuItem.classList.add('active');
    menuItem.setAttribute('aria-selected', 'true');
    
    // Show the selected panel
    showPanel(panelId);
  }
  
  /**
   * Show a panel and hide others with animation
   * @param {string} panelId - ID of panel to show
   */
  function showPanel(panelId) {
    // Find all panels
    const panels = [
      elements.generatorPanel,
      elements.examplePanel1,
      elements.examplePanel2
    ].filter(Boolean);
    
    // Target panel
    const targetPanel = document.getElementById(panelId);
    
    if (!targetPanel) {
      console.error(`Panel not found: ${panelId}`);
      return;
    }
    
    // Hide all panels with animation
    panels.forEach(panel => {
      if (panel.style.display !== 'none' && panel !== targetPanel) {
        // Only animate currently visible panels
        animateElement(panel, { opacity: '0' }, 200)
          .then(() => {
            panel.style.display = 'none';
          });
      } else if (panel !== targetPanel) {
        // Just hide panels that are already hidden
        panel.style.display = 'none';
      }
    });
    
    // Show target panel with animation after a short delay
    setTimeout(() => {
      targetPanel.style.display = (panelId === 'generatorPanel') ? 'flex' : 'block';
      targetPanel.style.opacity = '0';
      
      setTimeout(() => {
        animateElement(targetPanel, { opacity: '1' }, 200);
      }, 50);
    }, 200);
    
    // Fire an event that can be listened to
    const event = new CustomEvent('panel:shown', { 
      detail: { panelId } 
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Handle tab button clicks
   * @param {Event} event - Click event
   */
  function handleTabClick(event) {
    const button = event.currentTarget;
    
    // Get tab ID from data attribute or onclick attribute
    const tabId = button.dataset.tab ||
      button.getAttribute('onclick')?.match(/switchTab\(event,\s*['"](\w+(?:-\w+)*)['"]\)/)?.[1];
    
    if (!tabId) {
      console.error('No tab ID found for tab button', button);
      return;
    }
    
    // Update active state for buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    
    // Switch to the selected tab content
    switchTab(tabId);
  }
  
  /**
   * Switch tabs with animation
   * @param {string} tabId - ID of tab to show
   */
  function switchTab(tabId) {
    // Get currently active tab
    const activeTab = document.querySelector('.tab-content.active');
    
    // Target tab
    const targetTab = document.getElementById(tabId);
    
    if (!targetTab) {
      console.error(`Tab not found: ${tabId}`);
      return;
    }
    
    // Fade out active tab
    if (activeTab) {
      animateElement(activeTab, { opacity: '0' }, 250)
        .then(() => {
          // Hide all tabs
          document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-hidden', 'true');
          });
          
          // Show and fade in the target tab
          targetTab.classList.add('active');
          targetTab.setAttribute('aria-hidden', 'false');
          
          animateElement(targetTab, { opacity: '1' }, 250);
        });
    } else {
      // No active tab, just show the target
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-hidden', 'true');
      });
      
      targetTab.classList.add('active');
      targetTab.setAttribute('aria-hidden', 'false');
      targetTab.style.opacity = '0';
      
      animateElement(targetTab, { opacity: '1' }, 250);
    }
    
    // Fire an event that can be listened to
    const event = new CustomEvent('tab:switched', { 
      detail: { tabId } 
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Handle view mode button clicks
   * @param {Event} event - Click event
   */
  function handleViewModeChange(event) {
    const button = event.currentTarget;
    
    // Get view mode from data attribute or onclick attribute
    const viewMode = button.dataset.mode ||
      button.getAttribute('onclick')?.match(/setViewMode\(event,\s*['"](\w+)['"]\)/)?.[1];
    
    if (!viewMode) {
      console.error('No view mode found for button', button);
      return;
    }
    
    // Update active state
    document.querySelectorAll('.view-button').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    
    // Change the view mode
    setViewMode(viewMode);
  }
  
  /**
   * Set contract view mode
   * @param {string} mode - View mode ('natural', 'json', 'solidity', 'abi')
   */
  function setViewMode(mode) {
    // Update state via AppState if available
    if (window.AppState && typeof AppState.setViewMode === 'function') {
      AppState.setViewMode(mode);
    } else {
      // Force re-render
      if (typeof renderContractContent === 'function') {
        renderContractContent();
      }
    }
    
    // Fire an event that can be listened to
    const event = new CustomEvent('viewMode:changed', { 
      detail: { mode } 
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Set contract language
   * @param {string} language - Contract language ('solidity', 'vyper', 'rust')
   */
  function setLanguage(language) {
    // Validate language
    const validLanguages = ['solidity', 'vyper', 'rust'];
    if (!validLanguages.includes(language)) {
      console.error(`Invalid language: ${language}`);
      
      if (typeof addNotification === 'function') {
        addNotification(`Invalid language: ${language}`, 'error');
      }
      return;
    }
    
    // Update state via AppState if available
    if (window.AppState && typeof AppState.setLanguage === 'function') {
      AppState.setLanguage(language);
    } else {
      // Update UI
      const toggleMap = {
        solidity: document.getElementById('solidityToggle'),
        vyper: document.getElementById('vyperToggle'),
        rust: document.getElementById('rustToggle')
      };
      
      // Remove active class from all toggles
      Object.values(toggleMap).forEach(toggle => {
        if (toggle) {
          toggle.classList.remove('active');
          toggle.setAttribute('aria-selected', 'false');
        }
      });
      
      // Add active class to selected toggle
      if (toggleMap[language]) {
        toggleMap[language].classList.add('active');
        toggleMap[language].setAttribute('aria-selected', 'true');
      }
      
      // Show notification
      if (typeof addNotification === 'function') {
        addNotification(`Switched to ${language.charAt(0).toUpperCase() + language.slice(1)}`, 'success');
      }
    }
    
    // Fire an event that can be listened to
    const event = new CustomEvent('language:changed', { 
      detail: { language } 
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Handle chat mode changes
   * @param {Event} event - Change event
   */
  function handleModeChange(event) {
    const mode = event.target.value;
    
    // Remove existing mode classes
    if (elements.generatorPanel) {
      elements.generatorPanel.classList.remove('basic-mode', 'advanced-mode');
      
      // Add the selected mode class
      elements.generatorPanel.classList.add(`${mode}-mode`);
    }
    
    // Update UI based on mode
    updateContractToggleButton(mode);
    
    // Show notification
    if (typeof addNotification === 'function') {
      addNotification(`Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, 'info');
    }
    
    // Fire an event that can be listened to
    const event = new CustomEvent('mode:changed', { 
      detail: { mode } 
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Update contract toggle button based on mode
   * @param {string} mode - UI mode ('basic' or 'advanced')
   */
  function updateContractToggleButton(mode) {
    // Remove any existing toggle button
    const existingBtn = document.querySelector('.contract-toggle-btn');
    if (existingBtn && existingBtn.parentNode) {
      existingBtn.parentNode.removeChild(existingBtn);
    }
    
    // Only add toggle button in basic mode
    if (mode === 'basic' && elements.chatColumn) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'contract-toggle-btn';
      toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
      toggleBtn.title = 'Show Contract Preview';
      toggleBtn.setAttribute('aria-label', 'Show Contract Preview');
      
      toggleBtn.addEventListener('mouseenter', () => {
        showContractPreview(true);
      });
      
      toggleBtn.addEventListener('click', (e) => {
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
          const outsideClickHandler = (event) => {
            const approvalSection = document.querySelector('.approval-section');
            
            if (approvalSection && !approvalSection.contains(event.target) && 
                !toggleBtn.contains(event.target)) {
              toggleBtn.classList.remove('locked');
              toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
              toggleBtn.title = 'Show Contract Preview';
              toggleBtn.setAttribute('aria-label', 'Show Contract Preview');
              showContractPreview(false);
              document.removeEventListener('click', outsideClickHandler);
            }
          };
          
          // Need to delay adding the handler to avoid immediate trigger
          setTimeout(() => {
            document.addEventListener('click', outsideClickHandler);
          }, 10);
        }
      });
      
      elements.chatColumn.appendChild(toggleBtn);
    }
  }
  
  /**
   * Show/hide contract preview panel
   * @param {boolean} show - Whether to show the panel
   */
  function showContractPreview(show) {
    const approvalSection = document.querySelector('.approval-section');
    if (approvalSection) {
      if (show) {
        approvalSection.classList.add('temp-visible');
      } else {
        approvalSection.classList.remove('temp-visible');
      }
    }
  }
  
  /**
   * Handle new chat button click
   */
  function handleNewChat() {
    // Use window function if available
    if (typeof window.startNewChat === 'function') {
      window.startNewChat();
    } else {
      console.error('startNewChat function not available');
    }
  }
  
  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  function handleFormSubmit(event) {
    // Prevent default form submission
    event.preventDefault();
    
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    const userMsg = messageInput.value.trim();
    if (!userMsg) return;
    
    // Clear the input
    messageInput.value = '';
    
    // Use AppState to handle the submission if available
    if (window.AppState && typeof AppState.handleSubmit === 'function') {
      AppState.handleSubmit(userMsg);
    } else if (typeof callServerAPI === 'function' && typeof addMessage === 'function') {
      // Legacy handling
      processSubmission(userMsg);
    } else {
      console.error('Chat submission handlers not available');
    }
  }
  
  /**
   * Process form submission using legacy functions
   * @param {string} userMsg - User message
   */
  async function processSubmission(userMsg) {
    // Show user message
    if (typeof addMessage === 'function') {
      addMessage('user', userMsg);
    }
    
    // Set loading state
    setLoading(true);
    
    try {
      // Call the API
      const responseData = await callServerAPI(userMsg);
      
      // Process the response
      if (responseData.message && typeof addMessage === 'function') {
        addMessage('assistant', responseData.message);
      }
      
      // Update contract if included
      if (responseData.contract && typeof window.AppState === 'object') {
        AppState.updateContract(responseData.contract);
      }
      
      // Update phase if changed
      if (responseData.phase !== undefined && 
          typeof window.AppState === 'object' && 
          typeof AppState.setPhase === 'function') {
        AppState.setPhase(responseData.phase);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      
      // Show error message
      if (typeof addMessage === 'function') {
        addMessage('assistant', `
          <div style="color: var(--error-color);">
            <strong>I'm sorry, I encountered an error:</strong><br>
            ${error.message}
          </div>
          <div style="margin-top: 10px;">
            <button class="retry-btn" onclick="retryLastMessage()" style="background-color: var(--primary-color); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
              <i class="fas fa-sync-alt"></i> Retry
            </button>
          </div>
        `);
      }
      
      // Add to error log
      if (typeof window.AppState === 'object' && typeof AppState.addError === 'function') {
        AppState.addError(error.message);
      }
      
      // Show notification
      if (typeof addNotification === 'function') {
        addNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      // Reset loading state
      setLoading(false);
    }
  }
  
  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyboardShortcuts(event) {
    // Ctrl+Enter to submit form when input has focus
    if (event.ctrlKey && event.key === 'Enter' && 
        document.activeElement === document.getElementById('message-input')) {
      event.preventDefault();
      
      const form = document.getElementById('input-form');
      if (form) {
        form.dispatchEvent(new Event('submit'));
      }
    }
    
    // Escape key to close dialogs
    if (event.key === 'Escape') {
      const dialogs = document.querySelectorAll('.confirm-dialog, .modal-dialog');
      dialogs.forEach(dialog => {
        if (dialog.parentNode) {
          dialog.parentNode.removeChild(dialog);
        }
      });
    }// Slash command shortcuts when input has focus
    if (event.key === '/' && 
      document.activeElement === document.getElementById('message-input') &&
      document.getElementById('message-input').value === '') {
    // Show command helper tooltip
    showCommandHelper();
  }
}

/**
 * Show a helper tooltip for slash commands
 */
function showCommandHelper() {
  // Remove any existing helper
  const existingHelper = document.getElementById('command-helper');
  if (existingHelper) {
    existingHelper.parentNode.removeChild(existingHelper);
    return;
  }
  
  // Create helper element
  const helper = document.createElement('div');
  helper.id = 'command-helper';
  helper.className = 'command-helper';
  helper.innerHTML = `
    <div class="command-helper-header">
      <span>Available Commands</span>
      <button class="close-helper" aria-label="Close command helper">&times;</button>
    </div>
    <div class="command-list">
      <div class="command-item" data-command="/bugFix">
        <div class="command-name">/bugFix</div>
        <div class="command-desc">Analyze and fix bugs in contract</div>
      </div>
      <div class="command-item" data-command="/securityAudit">
        <div class="command-name">/securityAudit</div>
        <div class="command-desc">Perform security audit on contract</div>
      </div>
      <div class="command-item" data-command="/gasOptimization">
        <div class="command-name">/gasOptimization</div>
        <div class="command-desc">Optimize contract for gas usage</div>
      </div>
      <div class="command-item" data-command="/generateTests">
        <div class="command-name">/generateTests</div>
        <div class="command-desc">Generate test cases for contract</div>
      </div>
    </div>
  `;
  
  // Add styles if not already present
  if (!document.getElementById('command-helper-style')) {
    const style = document.createElement('style');
    style.id = 'command-helper-style';
    style.textContent = `
      .command-helper {
        position: absolute;
        bottom: 100%;
        left: 20px;
        width: calc(100% - 40px);
        max-width: 500px;
        background-color: white;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border-color);
        margin-bottom: 8px;
        z-index: 100;
        overflow: hidden;
      }
      
      .command-helper-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: var(--primary-light);
        color: white;
        font-weight: 600;
      }
      
      .close-helper {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .command-list {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .command-item {
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid var(--border-color);
      }
      
      .command-item:last-child {
        border-bottom: none;
      }
      
      .command-item:hover {
        background-color: rgba(63, 81, 181, 0.08);
      }
      
      .command-name {
        font-weight: 600;
        color: var(--primary-color);
      }
      
      .command-desc {
        font-size: 0.85rem;
        color: var(--text-light);
        margin-top: 2px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Get input form for positioning
  const inputForm = document.getElementById('input-form');
  if (!inputForm) return;
  
  // Append to form
  inputForm.appendChild(helper);
  
  // Add event listeners
  const closeButton = helper.querySelector('.close-helper');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      if (helper.parentNode) {
        helper.parentNode.removeChild(helper);
      }
    });
  }
  
  // Add click handlers for commands
  const commandItems = helper.querySelectorAll('.command-item');
  commandItems.forEach(item => {
    item.addEventListener('click', () => {
      const command = item.getAttribute('data-command');
      const messageInput = document.getElementById('message-input');
      
      if (messageInput && command) {
        messageInput.value = command;
        messageInput.focus();
      }
      
      if (helper.parentNode) {
        helper.parentNode.removeChild(helper);
      }
    });
  });
  
  // Close when clicking outside
  document.addEventListener('click', function closeHandler(e) {
    if (!helper.contains(e.target) && 
        e.target !== document.getElementById('message-input')) {
      if (helper.parentNode) {
        helper.parentNode.removeChild(helper);
      }
      document.removeEventListener('click', closeHandler);
    }
  });
  
  // Close on escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      if (helper.parentNode) {
        helper.parentNode.removeChild(helper);
      }
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}

/**
 * Set loading state on chat form
 * @param {boolean} isLoading - Whether the form is in loading state
 */
function setLoading(isLoading) {
  const submitBtn = document.getElementById('submit-btn');
  const messageInput = document.getElementById('message-input');
  const buttonText = document.getElementById('button-text');
  const loadingSpinner = document.getElementById('loading-spinner');
  
  if (!submitBtn || !messageInput || !buttonText || !loadingSpinner) return;
  
  submitBtn.disabled = isLoading;
  messageInput.disabled = isLoading;
  
  if (isLoading) {
    buttonText.style.display = 'none';
    submitBtn.querySelector('i').style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    // Add aria-live to inform screen readers
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.setAttribute('aria-label', 'Sending message...');
  } else {
    buttonText.style.display = 'inline';
    submitBtn.querySelector('i').style.display = 'inline-block';
    loadingSpinner.style.display = 'none';
    
    // Reset ARIA attributes
    submitBtn.removeAttribute('aria-busy');
    submitBtn.setAttribute('aria-label', 'Send message');
  }
}

/**
 * Animate element properties with Promise support
 * @param {Element} element - Element to animate
 * @param {Object} properties - CSS properties to animate
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Resolves when animation completes
 */
function animateElement(element, properties, duration = 300) {
  return new Promise(resolve => {
    // Store original transition
    const originalTransition = element.style.transition;
    
    // Set new transition
    element.style.transition = `all ${duration}ms ease`;
    
    // Force reflow
    element.offsetHeight;
    
    // Apply new properties
    Object.entries(properties).forEach(([property, value]) => {
      element.style[property] = value;
    });
    
    // Listen for transition end
    function handleTransitionEnd() {
      element.removeEventListener('transitionend', handleTransitionEnd);
      
      // Restore original transition
      element.style.transition = originalTransition;
      
      resolve();
    }
    
    element.addEventListener('transitionend', handleTransitionEnd);
    
    // Safety timeout in case transitionend doesn't fire
    setTimeout(() => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    }, duration + 50);
  });
}

/**
 * Cleanup all event listeners and resources
 */
function cleanup() {
  // Clean up all registered event listeners
  eventListeners.forEach(cleanupFn => {
    if (typeof cleanupFn === 'function') {
      cleanupFn();
    }
  });
  
  // Clear the event listeners array
  eventListeners.length = 0;
  
  // Clean up any remaining command helpers
  const commandHelper = document.getElementById('command-helper');
  if (commandHelper && commandHelper.parentNode) {
    commandHelper.parentNode.removeChild(commandHelper);
  }
  
  // Clear any bound global handlers
  document.removeEventListener('click', handleOutsideClicks);
  
  console.log('UI Service cleanup complete');
}

/**
 * Global handler for clicks outside UI components
 * @param {Event} e - Click event
 */
function handleOutsideClicks(e) {
  // Command helper handling
  const commandHelper = document.getElementById('command-helper');
  if (commandHelper && 
      !commandHelper.contains(e.target) && 
      e.target !== document.getElementById('message-input')) {
    commandHelper.parentNode.removeChild(commandHelper);
  }
}

// Register global outside click handler
document.addEventListener('click', handleOutsideClicks);

// Public API
return {
  init,
  cleanup,
  setLanguage,
  switchTab,
  showPanel,
  setViewMode,
  showContractPreview,
  setLoading,
  animateElement,
  updateContractToggleButton
};
})();

// ui.js - Simplified to just expose global functions that HTML calls
//          and internally delegate to UIController (declared in main.js).

// Toggle the left sidebar
window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  const icon = document.getElementById('sidebar-toggle-icon');
  if (icon) {
    icon.classList.toggle('fa-chevron-left', !isCollapsed);
    icon.classList.toggle('fa-chevron-right', isCollapsed);
  }
};

// Show a panel (generatorPanel, examplePanel1, etc.)
window.showPanel = function(panelId, evt) {
  // If UIController is defined, let it handle
  if (window.UIController && typeof UIController.showPanel === 'function') {
    if (evt && evt.currentTarget) {
      // Mark the menu-item as active
      document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
      });
      evt.currentTarget.classList.add('active');
    }
    UIController.showPanel(panelId);
  } else {
    console.warn('UIController.showPanel not available.');
  }
};

// Switch the top tabs inside the generator panel
window.switchTab = function(e, tabId) {
  if (window.UIController && typeof UIController.switchTab === 'function') {
    // Mark the tab button as active
    if (e && e.currentTarget) {
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      e.currentTarget.classList.add('active');
    }
    UIController.switchTab(tabId);
  } else {
    console.warn('UIController.switchTab not available.');
  }
};

// Set the contract preview mode (Natural, JSON, Solidity, ABI)
window.setViewMode = function(e, mode) {
  if (window.UIController && typeof UIController.setViewMode === 'function') {
    if (e && e.currentTarget) {
      document.querySelectorAll('.view-button').forEach(btn => {
        btn.classList.remove('active');
      });
      e.currentTarget.classList.add('active');
    }
    UIController.setViewMode(mode);
  } else {
    console.warn('UIController.setViewMode not available.');
  }
};

// Set contract language
window.setLanguage = function(lang) {
  if (window.UIController && typeof UIController.setLanguage === 'function') {
    UIController.setLanguage(lang);
  } else {
    console.warn('UIController.setLanguage not available.');
  }
};

// Change chat mode (basic / advanced)
window.changeChatMode = function() {
  const modeSelect = document.getElementById('chatModeSelect');
  if (!modeSelect) return;
  const mode = modeSelect.value;
  
  if (window.UIController && typeof UIController.updateChatMode === 'function') {
    UIController.updateChatMode(mode);
  } else {
    // Fallback: just do some quick toggling
    const generatorPanel = document.getElementById('generatorPanel');
    if (generatorPanel) {
      generatorPanel.classList.remove('basic-mode', 'advanced-mode');
      generatorPanel.classList.add(`${mode}-mode`);
    }
  }
};

// Show/hide contract preview (in basic mode)
window.showContractPreview = function(show) {
  if (window.UIController && typeof UIController.showContractPreview === 'function') {
    UIController.showContractPreview(show);
  } else {
    console.warn('UIController.showContractPreview not available.');
  }
};

// Start new chat
window.startNewChat = function() {
  if (window.UIController && typeof UIController.startNewChat === 'function') {
    UIController.startNewChat();
  } else if (typeof window.startNewChat === 'function') {
    // fallback to ChatService's startNewChat
    window.startNewChat();
  }
};

// On DOMContentLoaded, if you want to automatically init the UI, do so:
document.addEventListener('DOMContentLoaded', () => {
  if (window.UIController && typeof UIController.init === 'function') {
    UIController.init();
  }
});


// Clean up on page unload
window.addEventListener('beforeunload', function() {
if (UIService && typeof UIService.cleanup === 'function') {
  UIService.cleanup();
}
});