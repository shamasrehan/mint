// chat.js

/**
 * Call your server's /api/chat or similar endpoint with user's message
 */
window.callServerAPI = async function callServerAPI(message, newChat = false) {
  const timeoutDuration = 30000; // 30 sec

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeoutDuration);
  });

  try {
    const fetchPromise = fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        newChat,
        selectedLanguage: AppState.selectedLanguage
      }),
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("callServerAPI error:", error);
    throw error;
  }
};

/**
 * Add a new message to the chat container
 */
window.addMessage = function addMessage(role, content, type = '') {
  const msgDiv = document.createElement('div');
  if (role === 'assistant') {
    msgDiv.className = `message bot-message ${type}`;
  } else if (role === 'user') {
    msgDiv.className = `message user-message ${type}`;
  } else {
    msgDiv.className = `message system-notification ${type}`;
  }

  msgDiv.innerHTML = processMessageContent(content);
  elements.chatContainer.appendChild(msgDiv);

  // Scroll into view
  setTimeout(() => {
    msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 50);

  // Syntax highlight if code
  if (window.Prism) {
    setTimeout(() => Prism.highlightAllUnder(msgDiv), 100);
  }
};

/**
 * Process message content (format code blocks, etc.)
 */
window.processMessageContent = function processMessageContent(text) {
  // Convert triple backticks for code blocks
  text = text.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links [label](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Bold **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic _text_
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Convert line breaks
  text = text.replace(/\n/g, '<br>');

  return text;
};

/**
 * Escape HTML to safely insert code text
 */
window.escapeHtml = function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Start a new chat (clear current conversation)
 */
window.startNewChat = function startNewChat() {
  // Confirm if needed, then reset
  if (!confirm("Start a new conversation? This will clear current messages.")) {
    return;
  }

  // Clear chat container
  elements.chatContainer.innerHTML = "";
  // Possibly also notify server side
  addNotification("New chat started.", "info");
  
  // Show a quick welcome
  setTimeout(() => {
    addMessage('assistant', `
      <div style="text-align: center;">
        <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 16px;"></i>
        <h3>New Conversation</h3>
        <p>How can I help you now?</p>
      </div>
    `);
  }, 500);
};

/**
 * Copy text to clipboard
 */
window.copyToClipboard = function copyToClipboard(text) {
  if (!navigator.clipboard) {
    // fallback
    const tempArea = document.createElement('textarea');
    tempArea.value = text;
    document.body.appendChild(tempArea);
    tempArea.select();
    try {
      document.execCommand('copy');
      addNotification(`Copied: ${text}`, 'success');
    } catch (err) {
      addNotification('Failed to copy', 'error');
    }
    document.body.removeChild(tempArea);
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => {
      addNotification(`Copied: ${text}`, 'success');
    })
    .catch(err => {
      console.error('Clipboard error', err);
      addNotification('Failed to copy', 'error');
    });
};

/**
 * Toggle deployments list in My Contracts
 */
window.toggleDeployments = function toggleDeployments(toggleButton) {
  const networkList = toggleButton.nextElementSibling;
  if (!networkList) return;
  const icon = toggleButton.querySelector('i');

  if (networkList.style.display === 'none' || !networkList.style.display) {
    networkList.style.display = 'block';
    icon.style.transform = 'rotate(180deg)';
    networkList.style.opacity = '0';
    setTimeout(() => {
      networkList.style.opacity = '1';
    }, 50);
  } else {
    networkList.style.opacity = '0';
    icon.style.transform = 'rotate(0)';
    setTimeout(() => {
      networkList.style.display = 'none';
    }, 300);
  }
};
