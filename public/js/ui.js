// ui.js

// Cache main DOM elements for easy reference
window.elements = {
  sidebar: document.getElementById('sidebar'),
  sidebarToggleIcon: document.getElementById('sidebar-toggle-icon'),
  generatorPanel: document.getElementById('generatorPanel'),
  examplePanel1: document.getElementById('examplePanel1'),
  examplePanel2: document.getElementById('examplePanel2'),
  approvalSection: document.getElementById('approvalSection'),
  finalContractDiv: document.getElementById('finalContract'),
  chatContainer: document.getElementById('chat-container'),
  chatNotifications: document.getElementById('chatNotifications'),
  chatModeSelect: document.getElementById('chatModeSelect'),
  messageInput: document.getElementById('message-input'),
  submitBtn: document.getElementById('submit-btn'),
  loadingSpinner: document.getElementById('loading-spinner'),
  buttonText: document.getElementById('button-text'),
  newChatBtn: document.getElementById('newChatBtn'),
  chatColumn: document.getElementById('chatColumn'),
  // Language toggles
  solidityToggle: document.getElementById('solidityToggle'),
  vyperToggle: document.getElementById('vyperToggle'),
  rustToggle: document.getElementById('rustToggle')
};

/**
 * Toggle the collapsible sidebar open/close
 */
window.toggleSidebar = function toggleSidebar() {
  elements.sidebar.classList.toggle('collapsed');
  if (elements.sidebar.classList.contains('collapsed')) {
    elements.sidebarToggleIcon.classList.remove('fa-chevron-left');
    elements.sidebarToggleIcon.classList.add('fa-chevron-right');
  } else {
    elements.sidebarToggleIcon.classList.remove('fa-chevron-right');
    elements.sidebarToggleIcon.classList.add('fa-chevron-left');
  }
};

/**
 * Show a specific main panel (generatorPanel, examplePanel1, examplePanel2)
 * and highlight the correct sidebar menu item
 */
window.showPanel = function showPanel(panelId, evt) {
  // Remove active from all menu items
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add('active');
  }

  const allPanels = [elements.generatorPanel, elements.examplePanel1, elements.examplePanel2];
  allPanels.forEach(panel => {
    // Fade out if visible
    if (panel.style.display !== 'none') {
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.style.display = 'none';
      }, 200);
    } else {
      panel.style.display = 'none';
    }
  });

  // Show chosen panel
  setTimeout(() => {
    const targetPanel = document.getElementById(panelId);
    targetPanel.style.display = (panelId === 'generatorPanel') ? 'flex' : 'block';
    targetPanel.style.opacity = '0';
    setTimeout(() => {
      targetPanel.style.opacity = '1';
      targetPanel.style.transition = 'opacity 0.3s ease';
    }, 50);
  }, 200);
};

/**
 * Switch tabs (Contract Preview, My Contracts, Audit, Template Dapps)
 */
window.switchTab = function switchTab(e, tabId) {
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  e.currentTarget.classList.add('active');

  // Fade out currently active tab
  const activeTab = document.querySelector('.tab-content.active');
  if (activeTab) {
    activeTab.style.opacity = '0';
    setTimeout(() => {
      activeTab.classList.remove('active');
      // Show the target tab
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.opacity = '0';
        setTimeout(() => {
          targetTab.style.opacity = '1';
        }, 50);
      }
    }, 250);
  } else {
    // No active tab, just show the target
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
      targetTab.classList.add('active');
    }
  }
};

/**
 * Add a notification message inside the chat notification area
 */
window.addNotification = function addNotification(message, type = 'info') {
  const container = elements.chatNotifications;
  const note = document.createElement('div');
  note.className = `chat-notification ${type}`;
  note.textContent = message;

  container.appendChild(note);
  if (container.childElementCount === 1) {
    container.style.display = 'flex';
  }

  // Auto-remove unless error
  if (type !== 'error') {
    setTimeout(() => {
      if (note.parentNode) {
        note.style.opacity = '0';
        note.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (note.parentNode) {
            note.parentNode.removeChild(note);
            if (container.childElementCount === 0) {
              container.style.display = 'none';
            }
          }
        }, 300);
      }
    }, 5000);
  } else {
    // Add close button for errors
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'notification-close';
    closeBtn.onclick = () => {
      note.style.opacity = '0';
      note.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (note.parentNode) {
          note.parentNode.removeChild(note);
          if (container.childElementCount === 0) {
            container.style.display = 'none';
          }
        }
      }, 300);
    };
    note.appendChild(closeBtn);
  }
};

/**
 * Set language (Solidity, Vyper, Rust) for the contract generation
 */
window.setLanguage = function setLanguage(lang) {
  // Remove active from all toggles
  [elements.solidityToggle, elements.vyperToggle, elements.rustToggle].forEach(btn => {
    btn.classList.remove('active');
  });

  // Add active to the selected
  if (lang === 'solidity') {
    elements.solidityToggle.classList.add('active');
    AppState.selectedLanguage = 'solidity';
  } else if (lang === 'vyper') {
    elements.vyperToggle.classList.add('active');
    AppState.selectedLanguage = 'vyper';
  } else if (lang === 'rust') {
    elements.rustToggle.classList.add('active');
    AppState.selectedLanguage = 'rust';
  }
  addNotification(`Language switched to ${lang}`, 'success');
};

/**
 * Change chat mode (basic / advanced) - show/hide contract preview
 */
window.changeChatMode = function changeChatMode() {
  const mode = elements.chatModeSelect.value; // 'basic' or 'advanced'
  const gp = elements.generatorPanel;

  // Remove old mode classes
  gp.classList.remove('basic-mode', 'advanced-mode');
  // Add new mode class
  gp.classList.add(`${mode}-mode`);

  addNotification(`Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, 'info');

  // Also handle toggle button logic
  updateContractToggleButton(mode);
};

/**
 * Create or remove the contract toggle button in Basic mode
 */
window.updateContractToggleButton = function updateContractToggleButton(mode) {
  // Remove any existing toggle
  const existingBtn = document.querySelector('.contract-toggle-btn');
  if (existingBtn) {
    existingBtn.remove();
  }

  // Only add if we're in basic mode
  if (mode === 'basic') {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'contract-toggle-btn';
    toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
    toggleBtn.title = "Show Contract Preview";

    toggleBtn.addEventListener('mouseenter', () => {
      showContractPreview(true);
    });

    toggleBtn.addEventListener('click', () => {
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
        // Hide on outside click
        setTimeout(() => {
          document.addEventListener('click', hideContractOnClickOutside);
        }, 10);
      }
    });

    elements.chatColumn.appendChild(toggleBtn);
  }
};

window.showContractPreview = function showContractPreview(show) {
  if (show) {
    elements.approvalSection.classList.add('temp-visible');
  } else {
    elements.approvalSection.classList.remove('temp-visible');
  }
};

window.hideContractOnClickOutside = function hideContractOnClickOutside(e) {
  const toggleBtn = document.querySelector('.contract-toggle-btn');
  if (!toggleBtn) return;
  const isLocked = toggleBtn.classList.contains('locked');

  // If clicking outside both the button and the approval section, close it
  if (
    !elements.approvalSection.contains(e.target) &&
    !toggleBtn.contains(e.target)
  ) {
    toggleBtn.classList.remove('locked');
    toggleBtn.innerHTML = '<i class="fas fa-code"></i>';
    toggleBtn.title = "Show Contract Preview";
    showContractPreview(false);
    document.removeEventListener('click', hideContractOnClickOutside);
  }
};
