// main.js - Core application logic

//
// ──────────────────────────────────────────────────────────────────────────
//   1) APPLICATION STATE (AppState)
// ──────────────────────────────────────────────────────────────────────────
//

const AppState = (function() {
  const state = {
    phase: 1,
    selectedLanguage: 'solidity',
    currentContract: null,
    viewMode: 'solidity',
    isLoading: false,
    errors: [],
    listeners: {},
    activeTimeouts: []
  };

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

  /**
   * Create a timeout that we can track and clear on reset/cleanup
   */
  function setTimeout(callback, delay) {
    const id = window.setTimeout(() => {
      state.activeTimeouts = state.activeTimeouts.filter(t => t !== id);
      callback();
    }, delay);
    state.activeTimeouts.push(id);
    return id;
  }

  return {
    // Getters
    getPhase: () => state.phase,
    getLanguage: () => state.selectedLanguage,
    getContract: () => (state.currentContract ? { ...state.currentContract } : null),
    getViewMode: () => state.viewMode,
    isLoading: () => state.isLoading,
    getErrors: () => [...state.errors],

    // Setters
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
      const valid = ['solidity', 'vyper', 'rust'];
      if (valid.includes(language) && language !== state.selectedLanguage) {
        const old = state.selectedLanguage;
        state.selectedLanguage = language;
        emit('language-change', { oldLanguage: old, newLanguage: language });
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

    setLoading: (val) => {
      if (state.isLoading !== val) {
        state.isLoading = val;
        emit('loading-change', val);
      }
    },

    addError: (error) => {
      const errObj = { message: error, timestamp: new Date() };
      state.errors.push(errObj);
      emit('error', errObj);
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
    setTimeout,

    // Reset
    reset: () => {
      state.phase = 1;
      state.currentContract = null;
      state.errors = [];
      state.activeTimeouts.forEach(id => window.clearTimeout(id));
      state.activeTimeouts = [];
      emit('reset');
    },

    // Cleanup
    cleanup: () => {
      state.activeTimeouts.forEach(id => window.clearTimeout(id));
      state.activeTimeouts = [];
      Object.keys(state.listeners).forEach(evt => {
        state.listeners[evt] = [];
      });
    }
  };
})();

//
// ──────────────────────────────────────────────────────────────────────────
//   2) DOM Utilities (DOMUtils)
// ──────────────────────────────────────────────────────────────────────────
//

const DOMUtils = (function() {
  function getElement(sel) {
    return document.querySelector(sel);
  }
  function getAll(sel) {
    return Array.from(document.querySelectorAll(sel));
  }
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') {
        el.className = v;
      } else if (k === 'style' && typeof v === 'object') {
        Object.entries(v).forEach(([prop, val]) => {
          el.style[prop] = val;
        });
      } else if (k.startsWith('on') && typeof v === 'function') {
        const evtName = k.substring(2).toLowerCase();
        el.addEventListener(evtName, v);
      } else {
        el.setAttribute(k, v);
      }
    });

    if (typeof children === 'string') {
      el.textContent = children;
    } else {
      children.forEach(ch => {
        if (typeof ch === 'string') {
          el.appendChild(document.createTextNode(ch));
        } else if (ch instanceof Node) {
          el.appendChild(ch);
        }
      });
    }
    return el;
  }
  function updateContent(sel, content) {
    const el = getElement(sel);
    if (!el) return false;
    if (typeof content === 'string') {
      el.innerHTML = content;
    } else if (content instanceof Node) {
      el.innerHTML = '';
      el.appendChild(content);
    }
    return true;
  }
  function animateTransition(element, props, duration = 300) {
    return new Promise(resolve => {
      if (!(element instanceof HTMLElement)) {
        element = getElement(element);
        if (!element) return resolve();
      }
      const originalTransition = element.style.transition;
      element.style.transition = `all ${duration}ms ease`;
      // force reflow
      element.offsetHeight;

      Object.entries(props).forEach(([k, v]) => {
        element.style[k] = v;
      });

      function onEnd() {
        element.removeEventListener('transitionend', onEnd);
        element.style.transition = originalTransition;
        resolve();
      }

      element.addEventListener('transitionend', onEnd, { once: true });

      setTimeout(() => {
        element.removeEventListener('transitionend', onEnd);
        resolve();
      }, duration + 50);
    });
  }
  function addEvent(elOrSel, evt, handler, capture = false) {
    const el = typeof elOrSel === 'string' ? getElement(elOrSel) : elOrSel;
    if (!el) return () => {};
    el.addEventListener(evt, handler, capture);
    return () => el.removeEventListener(evt, handler, capture);
  }

  return {
    getElement,
    getAll,
    createElement,
    updateContent,
    animateTransition,
    addEvent
  };
})();

//
// ──────────────────────────────────────────────────────────────────────────
//   3) API Service (APIService)
// ──────────────────────────────────────────────────────────────────────────
//

const APIService = (function() {
  const API_BASE_URL = "/api";
  const DEFAULT_TIMEOUT = 30000;

  async function fetchWithTimeout(url, opts = {}, timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const toId = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(toId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const err = new Error(errData.error || `Server error ${res.status}`);
        err.status = res.status;
        err.data = errData;
        throw err;
      }
      return res.json();
    } catch (err) {
      clearTimeout(toId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw err;
    }
  }

  async function fetchWithRetry(url, opts = {}, timeout = DEFAULT_TIMEOUT, maxRetries = 3) {
    let retries = 0;
    while (retries <= maxRetries) {
      try {
        return await fetchWithTimeout(url, opts, timeout);
      } catch (err) {
        retries++;
        // no retry for 4xx
        if (err.status >= 400 && err.status < 500) throw err;
        if (retries > maxRetries) throw err;

        const delay = Math.min(1000 * Math.pow(2, retries), 10000);
        console.warn(`Retrying request (${retries}/${maxRetries}) after ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  return {
    /**
     * Chat endpoint
     */
    chat: async function(message, newChat = false) {
      return fetchWithRetry(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          newChat,
          selectedLanguage: AppState.getLanguage()
        })
      });
    },

    /**
     * Generate code from JSON spec
     */
    generateCode: async function(jsonSpec, lang) {
      return fetchWithRetry(`${API_BASE_URL}/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonSpec,
          language: lang || AppState.getLanguage()
        })
      });
    },

    // ...Add more endpoints if needed
  };
})();

//
// ──────────────────────────────────────────────────────────────────────────
//   4) MAIN UI CONTROLLER (UIController)
// ──────────────────────────────────────────────────────────────────────────
//

const UIController = (function() {
  let elements = {};

  function cacheElements() {
    elements = {
      generatorPanel: DOMUtils.getElement('#generatorPanel'),
      chatContainer: DOMUtils.getElement('#chat-container'),
      chatNotifications: DOMUtils.getElement('#chatNotifications'),
      messageInput: DOMUtils.getElement('#message-input'),
      submitBtn: DOMUtils.getElement('#submit-btn'),
      loadingSpinner: DOMUtils.getElement('#loading-spinner'),
      buttonText: DOMUtils.getElement('#button-text'),
      finalContractDiv: DOMUtils.getElement('#finalContract'),
      form: DOMUtils.getElement('#input-form'),
      chatModeSelect: DOMUtils.getElement('#chatModeSelect'),
      // If you need more elements from the old code, add them:
      chatColumn: DOMUtils.getElement('#chatColumn'),
      approvalSection: DOMUtils.getElement('.approval-section')
    };
  }

  /**
   * Initialize the UI
   */
  function init() {
    cacheElements();
    const eventCleanup = initEventListeners();

    // Initially render if a contract is present
    renderContractContent();
    // Update step indicator for current phase
    updateStepIndicator(AppState.getPhase());

    // Show an initial greeting
    AppState.setTimeout(() => {
      addNotification('Welcome! Tell me what kind of smart contract you need.', 'info');
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

    return () => {
      eventCleanup();
      AppState.cleanup();
    };
  }

  /**
   * Set up event listeners and return a cleanup function
   */
  function initEventListeners() {
    // Listen to AppState changes
    AppState.on('loading-change', setLoading);
    AppState.on('contract-change', renderContractContent);
    AppState.on('view-mode-change', renderContractContent);
    AppState.on('phase-change', ({ newPhase }) => updateStepIndicator(newPhase));

    // Chat form submission
    if (elements.form) {
      DOMUtils.addEvent(elements.form, 'submit', async evt => {
        evt.preventDefault();
        const msg = elements.messageInput.value.trim();
        if (!msg) return;
        addMessage('user', msg);
        elements.messageInput.value = '';
        AppState.setLoading(true);

        try {
          const resData = await APIService.chat(msg);
          if (resData.message) addMessage('assistant', resData.message);
          if (resData.contract) AppState.updateContract(resData.contract);
          if (resData.phase && resData.phase !== AppState.getPhase()) {
            AppState.setPhase(resData.phase);
          }
        } catch (err) {
          console.error('Error in chat submit:', err);
          addMessage('assistant', `
            <div style="color: var(--error-color);">
              <strong>I'm sorry, I encountered an error:</strong><br>
              ${err.message}
            </div>
            <div style="margin-top: 10px;">
              <button class="retry-btn" onclick="UIController.retryLastMessage()" style="background-color: var(--primary-color); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-sync-alt"></i> Retry
              </button>
            </div>
          `);
          AppState.addError(err.message);
        } finally {
          AppState.setLoading(false);
        }
      });
    }

    // If you had sidebars or toggles, handle them here (e.g. from old code):
    // (Add more if needed)

    // Return a cleanup that removes all such listeners
    return function cleanup() {
      // remove any event listeners if you created them here
      // e.g. sideBarCleanup(), formCleanup()...
    };
  }

  /**
   * Render the contract content in #finalContract
   */
  function renderContractContent() {
    if (!elements.finalContractDiv) return;
    const contract = AppState.getContract();
    const mode = AppState.getViewMode();

    if (!contract) {
      elements.finalContractDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-contract" style="font-size:3rem; color:var(--text-muted); margin-bottom:16px;"></i>
          <p>No contract generated yet. Complete Phase 1 to generate a contract.</p>
        </div>
      `;
      return;
    }

    let content = '';
    try {
      switch (mode) {
        case 'json': {
          const jsonStr = JSON.stringify(contract.jsonSpec || contract, null, 2);
          content = `<pre><code class="language-json">${escapeHtml(jsonStr)}</code></pre>`;
          break;
        }
        case 'natural': {
          content = generateNaturalDescription(contract);
          break;
        }
        case 'abi': {
          // Simple default ABI fallback:
          const defaultAbi = [
            {
              type: 'function',
              name: 'example',
              inputs: [{ name: 'param', type: 'uint256' }],
              outputs: [{ name: '', type: 'bool' }],
              stateMutability: 'view'
            }
          ];
          const abiStr = JSON.stringify(contract.abi || defaultAbi, null, 2);
          content = `<pre><code class="language-json">${escapeHtml(abiStr)}</code></pre>`;
          break;
        }
        case 'solidity':
        default: {
          if (contract.contracts && contract.contracts.length > 0) {
            content = `<pre><code class="language-solidity">${escapeHtml(contract.contracts[0].content)}</code></pre>`;
          } else {
            content = `<pre><code class="language-solidity">// No contract code generated yet</code></pre>`;
          }
          break;
        }
      }
    } catch (err) {
      console.error('renderContractContent error:', err);
      content = `<div class="error-message">Error rendering contract: ${err.message}</div>`;
    }

    elements.finalContractDiv.style.opacity = '0';
    AppState.setTimeout(() => {
      elements.finalContractDiv.innerHTML = content;
      elements.finalContractDiv.style.opacity = '1';
      if (window.Prism) {
        try {
          Prism.highlightAllUnder(elements.finalContractDiv);
        } catch (e) {
          console.error('Prism highlight error:', e);
        }
      }
    }, 300);
  }

  /**
   * Produce a “natural language” description
   */
  function generateNaturalDescription(contract) {
    if (!contract) return '<p>No contract data available</p>';
    let desc = '<div class="natural-description">';
    try {
      const spec = contract.jsonSpec;
      if (spec) {
        desc += `
          <h3>Contract: ${spec.contractName || 'Unnamed'}</h3>
          <p><strong>Language:</strong> ${AppState.getLanguage().charAt(0).toUpperCase() + AppState.getLanguage().slice(1)}<br>
             <strong>Compiler version:</strong> ${spec.solidity || spec.vyper || spec.rust || 'unspecified'}<br>
             <strong>License:</strong> ${spec.license || 'unspecified'}
          </p>
          <h4>Features:</h4>
          <ul>
        `;
        if (spec.stateVariables?.length) {
          desc += `<li>${spec.stateVariables.length} state variables defined</li>`;
        }
        if (spec.functions?.length) {
          desc += `<li>${spec.functions.length} functions implemented</li>`;
        }
        if (spec.events?.length) {
          desc += `<li>${spec.events.length} events defined</li>`;
        }
        if (spec.inheritance?.length) {
          desc += `<li>Inherits from: ${spec.inheritance.join(', ')}</li>`;
        }
        desc += `</ul><p><em>Switch to JSON or code view for more details.</em></p>`;
      } else {
        desc += `
          <h3>Contract: ${contract.contractName || 'Unnamed'}</h3>
          <p>No detailed JSON spec found.</p>
        `;
      }
    } catch (err) {
      console.error('Error in generateNaturalDescription:', err);
      desc += `<p>Error generating description: ${err.message}</p>`;
    }
    desc += '</div>';
    return desc;
  }

  /**
   * Update step indicator for the current phase
   */
  function updateStepIndicator(step) {
    const steps = DOMUtils.getAll('.process-stepper .step');
    steps.forEach(st => {
      const num = parseInt(st.getAttribute('data-step'), 10);
      st.classList.remove('active', 'completed', 'animating');
      if (num < step) {
        st.classList.add('completed');
      } else if (num === step) {
        st.classList.add('active', 'animating');
        AppState.setTimeout(() => {
          st.classList.remove('animating');
        }, 1500);
      }
    });
  }

  /**
   * Whether the UI is loading or not
   */
  function setLoading(isLoading) {
    if (
      !elements.submitBtn ||
      !elements.messageInput ||
      !elements.buttonText ||
      !elements.loadingSpinner
    )
      return;

    elements.submitBtn.disabled = isLoading;
    elements.messageInput.disabled = isLoading;

    if (isLoading) {
      elements.buttonText.style.display = 'none';
      elements.submitBtn.querySelector('i').style.display = 'none';
      elements.loadingSpinner.style.display = 'block';
      elements.submitBtn.setAttribute('aria-busy', 'true');
      elements.submitBtn.setAttribute('aria-label', 'Sending message...');
    } else {
      elements.buttonText.style.display = 'inline';
      elements.submitBtn.querySelector('i').style.display = 'inline-block';
      elements.loadingSpinner.style.display = 'none';
      elements.submitBtn.removeAttribute('aria-busy');
      elements.submitBtn.setAttribute('aria-label', 'Send message');
    }
  }

  /**
   * Add a message to the chat
   */
  function addMessage(role, content, type = '') {
    if (!elements.chatContainer) return;
    const msgDiv = DOMUtils.createElement('div', {
      className:
        `message ${role === 'assistant'
          ? 'bot-message'
          : role === 'user'
          ? 'user-message'
          : 'system-notification'} ${type}`
    });
    msgDiv.innerHTML = processMessageContent(content);
    elements.chatContainer.appendChild(msgDiv);

    AppState.setTimeout(() => {
      msgDiv.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    if (window.Prism) {
      AppState.setTimeout(() => {
        try {
          Prism.highlightAllUnder(msgDiv);
        } catch (e) {
          console.error(e);
        }
      }, 100);
    }
    return msgDiv;
  }

  /**
   * Process message content with code blocks, markdown, etc.
   */
  function processMessageContent(txt) {
    if (typeof txt !== 'string') return String(txt);
    // code blocks
    txt = txt.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    // inline code
    txt = txt.replace(/`([^`]+)`/g, '<code>$1</code>');
    // links [text](url)
    txt = txt.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // bold **text**
    txt = txt.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic _text_
    txt = txt.replace(/_([^_]+)_/g, '<em>$1</em>');
    // line breaks
    txt = txt.replace(/\n/g, '<br>');
    return txt;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Add a notification to #chatNotifications
   */
  function addNotification(message, type = 'info') {
    if (!elements.chatNotifications) return;

    const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const note = DOMUtils.createElement(
      'div',
      { id: noteId, className: `chat-notification ${type}` },
      message
    );

    if (type === 'error') {
      // Add close button for errors
      const closeBtn = DOMUtils.createElement(
        'span',
        {
          className: 'notification-close',
          onclick: () => {
            DOMUtils.animateTransition(note, {
              opacity: '0',
              transform: 'translateY(-10px)'
            }).then(() => {
              if (note.parentNode) {
                note.parentNode.removeChild(note);
                if (!elements.chatNotifications.hasChildNodes()) {
                  elements.chatNotifications.style.display = 'none';
                }
              }
            });
          }
        },
        '×'
      );
      note.appendChild(closeBtn);
    }

    elements.chatNotifications.appendChild(note);

    // Show the container if first notification
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
              if (!elements.chatNotifications.hasChildNodes()) {
                elements.chatNotifications.style.display = 'none';
              }
            }
          });
        }
      }, 5000);
    }
  }

  /**
   * Retry the last user message if an error occurred
   */
  function retryLastMessage() {
    const userMsgs = DOMUtils.getAll('.user-message');
    if (!userMsgs.length) return;
    const lastUserMsg = userMsgs[userMsgs.length - 1].textContent.trim();
    // remove last bot error
    const errorMsg = DOMUtils.getElement('.bot-message:last-child');
    if (errorMsg && errorMsg.parentNode) {
      errorMsg.parentNode.removeChild(errorMsg);
    }
    addNotification('Retrying your last message...', 'info');
    if (elements.messageInput && elements.form) {
      elements.messageInput.value = lastUserMsg;
      elements.form.dispatchEvent(new Event('submit'));
    }
  }

  /**
   * Start a brand-new chat
   */
  function startNewChat() {
    // confirm if user is in a later phase or has a contract
    if (AppState.getPhase() > 1 || AppState.getContract()) {
      if (!confirm('Starting a new chat will clear your current progress. Are you sure?')) {
        return;
      }
    }

    // fade out chat container
    if (elements.chatContainer) {
      DOMUtils.animateTransition(elements.chatContainer, { opacity: '0' }).then(() => {
        elements.chatContainer.innerHTML = '';
        DOMUtils.animateTransition(elements.chatContainer, { opacity: '1' });
      });
    }

    // clear notifications
    if (elements.chatNotifications) {
      elements.chatNotifications.innerHTML = '';
      elements.chatNotifications.style.display = 'none';
    }

    // clear input
    if (elements.messageInput) {
      elements.messageInput.value = '';
    }

    // reset state
    AppState.reset();

    // call server to reset conversation
    APIService.chat('New chat requested', true)
      .then(() => {
        addNotification('New conversation started', 'info');
        AppState.setTimeout(() => {
          addMessage('assistant', `
            <div style="text-align: center;">
              <i class="fas fa-robot" style="font-size:2rem; color:var(--primary-color); margin-bottom:16px;"></i>
              <h3>Welcome to SmartContractHub</h3>
              <p>I'm your AI assistant. Let's build something!</p>
            </div>
          `);
        }, 500);
      })
      .catch(err => {
        console.error('Error resetting chat:', err);
        addNotification('Error resetting chat on server', 'error');
      });
  }

  /**
   * Show or hide the contract preview panel
   */
  function showContractPreview(show) {
    if (!elements.approvalSection) return;
    if (show) elements.approvalSection.classList.add('temp-visible');
    else elements.approvalSection.classList.remove('temp-visible');
  }

  /**
   * Switch to a different .tab-content panel by ID
   */
  function switchTab(tabId) {
    const activeTab = DOMUtils.getElement('.tab-content.active');
    if (activeTab) {
      DOMUtils.animateTransition(activeTab, { opacity: '0' }).then(() => {
        DOMUtils.getAll('.tab-content').forEach(t => t.classList.remove('active'));
        const target = DOMUtils.getElement('#' + tabId);
        if (target) {
          target.classList.add('active');
          DOMUtils.animateTransition(target, { opacity: '1' });
        }
      });
    } else {
      // no active
      DOMUtils.getAll('.tab-content').forEach(t => t.classList.remove('active'));
      const target = DOMUtils.getElement('#' + tabId);
      if (target) {
        target.classList.add('active');
        DOMUtils.animateTransition(target, { opacity: '1' });
      }
    }
  }

  /**
   * Show a specific main panel (#generatorPanel, #examplePanel1, etc.)
   */
  function showPanel(panelId) {
    const possiblePanels = [
      DOMUtils.getElement('#generatorPanel'),
      DOMUtils.getElement('#examplePanel1'),
      DOMUtils.getElement('#examplePanel2')
    ].filter(Boolean);
    const targetPanel = DOMUtils.getElement('#' + panelId);
    if (!targetPanel) {
      console.error('Panel not found:', panelId);
      return;
    }
    // fade out others
    possiblePanels.forEach(p => {
      if (p.style.display !== 'none' && p !== targetPanel) {
        DOMUtils.animateTransition(p, { opacity: '0' }, 200).then(() => {
          p.style.display = 'none';
        });
      } else if (p !== targetPanel) {
        p.style.display = 'none';
      }
    });
    setTimeout(() => {
      targetPanel.style.display = panelId === 'generatorPanel' ? 'flex' : 'block';
      targetPanel.style.opacity = '0';
      setTimeout(() => {
        DOMUtils.animateTransition(targetPanel, { opacity: '1' }, 200);
      }, 50);
    }, 200);
  }

  /**
   * Set the view mode (natural/json/solidity/abi)
   */
  function setViewMode(mode) {
    AppState.setViewMode(mode);
  }

  /**
   * Set the language (solidity/vyper/rust)
   */
  function setLanguage(lang) {
    if (!AppState.setLanguage(lang)) {
      addNotification(`Invalid language: ${lang}`, 'error');
      return;
    }
    const toggleMap = {
      solidity: document.getElementById('solidityToggle'),
      vyper: document.getElementById('vyperToggle'),
      rust: document.getElementById('rustToggle')
    };
    Object.values(toggleMap).forEach(t => {
      if (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      }
    });
    if (toggleMap[lang]) {
      toggleMap[lang].classList.add('active');
      toggleMap[lang].setAttribute('aria-selected', 'true');
    }
    addNotification(`Switched to ${lang.charAt(0).toUpperCase() + lang.slice(1)}`, 'success');
  }

  /**
   * For 'basic' vs 'advanced' mode
   */
  function updateChatMode(mode) {
    if (!elements.generatorPanel) return;
    elements.generatorPanel.classList.remove('basic-mode', 'advanced-mode');
    elements.generatorPanel.classList.add(`${mode}-mode`);
    addNotification(`Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, 'info');
  }

  /**
   * Generate code from the existing contract spec
   * (Merges from the old code's functionality)
   */
  async function generateCodeFromSpec() {
    const contract = AppState.getContract();
    if (!contract || !contract.jsonSpec) {
      addNotification('No contract specification to generate from', 'warning');
      return;
    }

    // Show notification
    addNotification('Generating code...', 'info');

    // create an overlay
    const genOverlay = DOMUtils.createElement('div', { className: 'generate-overlay' }, [
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
      const result = await APIService.generateCode(contract.jsonSpec, AppState.getLanguage());
      if (result.status === 'success') {
        // update contract with generated code
        if (!contract.contracts) {
          contract.contracts = [];
        }
        if (contract.contracts.length > 0) {
          contract.contracts[0].content = result.code;
        } else {
          contract.contracts.push({
            name: contract.jsonSpec.contractName || 'SmartContract',
            content: result.code
          });
        }
        AppState.updateContract(contract);

        addNotification('Code generated successfully!', 'success');
        addMessage('assistant', `
          <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <h3>Code Generation Complete</h3>
            <p>I've generated the ${AppState.getLanguage()} code based on your requirements. You can view it in the "Contract Preview" tab.</p>
            <p>Would you like me to explain any part of the code or make any adjustments?</p>
          </div>
        `);
      } else {
        throw new Error(result.error || 'Code generation failed');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      addNotification(`Error generating code: ${error.message}`, 'error');

      addMessage('assistant', `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Code Generation Failed</h3>
          <p>I encountered an error while generating the code: ${error.message}</p>
          <p>Would you like me to try again with a different approach?</p>
        </div>
      `);
    } finally {
      // remove overlay
      if (genOverlay.parentNode) {
        DOMUtils.animateTransition(genOverlay, { opacity: '0' }).then(() => {
          if (genOverlay.parentNode) {
            genOverlay.parentNode.removeChild(genOverlay);
          }
        });
      }
    }
  }

  /**
   * Cleanup everything
   */
  function cleanup() {
    AppState.cleanup();
  }

  return {
    // Lifecycle
    init,
    cleanup,

    // Chat
    addMessage,
    addNotification,
    retryLastMessage,
    startNewChat,

    // Contract
    generateCodeFromSpec,
    showContractPreview,

    // Tabs / Panels
    switchTab,
    showPanel,

    // Language / Mode
    setViewMode,
    setLanguage,
    updateChatMode,

    // Helpers
    escapeHtml,
    processMessageContent
  };
})();

// Expose globally
window.UIController = UIController;

// Finally, initialize on DOMContentLoaded if desired
let appCleanup;
window.addEventListener('DOMContentLoaded', () => {
  try {
    appCleanup = UIController.init();
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (appCleanup && typeof appCleanup === 'function') {
    appCleanup();
  }
});


// Single global function for the HTML's "onclick" usage:
window.switchTab = function (e, tabId) {
  e?.preventDefault();
  if (UIController && typeof UIController.switchTab === 'function') {
    // Optionally mark the clicked button "active" here if needed:
    // e.currentTarget?.classList.add('active');

    UIController.switchTab(tabId);
  }
};

window.showPanel = function (panelId, e) {
  e?.preventDefault();
  if (UIController && typeof UIController.showPanel === 'function') {
    UIController.showPanel(panelId);
  }
};

