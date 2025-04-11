// main.js

// Global state object
window.AppState = {
  phase: 1,
  selectedLanguage: 'solidity',
  currentContract: null
  // You can store more fields here as needed
};

/**
 * Render the contract content based on current view mode (natural, json, solidity, abi)
 */
window.renderContractContent = function renderContractContent() {
  const contract = AppState.currentContract;
  if (!contract) {
    elements.finalContractDiv.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-contract" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <p>No contract generated yet. Complete Phase 1 to generate a contract.</p>
      </div>
    `;
    return;
  }

  const viewMode = AppState.viewMode || 'solidity'; // fallback
  let contentHtml = '';

  if (viewMode === 'natural') {
    // Show a basic natural language summary
    contentHtml = `
      <div class="natural-description">
        <h3>Contract: ${contract.jsonSpec?.contractName || 'Unnamed'}</h3>
        <p>This is a natural language summary of your contract. You can switch to another view to see more details.</p>
      </div>
    `;
  }
  else if (viewMode === 'json') {
    // Show JSON
    const jsonStr = JSON.stringify(contract.jsonSpec || contract, null, 2);
    contentHtml = `<pre><code class="language-json">${escapeHtml(jsonStr)}</code></pre>`;
  }
  else if (viewMode === 'abi') {
    // Fake or example ABI
    const fakeAbi = [
      {
        "type": "function",
        "name": "transfer",
        "inputs": [
          {"name": "to", "type": "address"},
          {"name": "amount", "type": "uint256"}
        ],
        "outputs": [{"name": "", "type": "bool"}]
      }
    ];
    contentHtml = `<pre><code class="language-json">${escapeHtml(JSON.stringify(fakeAbi, null, 2))}</code></pre>`;
  }
  else { // 'solidity' or fallback
    if (contract.contracts && contract.contracts.length > 0) {
      contentHtml = `<pre><code class="language-solidity">${escapeHtml(contract.contracts[0].content)}</code></pre>`;
    } else {
      contentHtml = `<pre><code class="language-solidity">// No solidity code generated yet</code></pre>`;
    }
  }

  elements.finalContractDiv.style.opacity = '0';
  setTimeout(() => {
    elements.finalContractDiv.innerHTML = contentHtml;
    elements.finalContractDiv.style.opacity = '1';

    // Prism highlight if needed
    if (window.Prism) {
      Prism.highlightAllUnder(elements.finalContractDiv);
    }
  }, 300);
};

/**
 * Switch the contract preview "view mode"
 */
window.setViewMode = function setViewMode(e, mode) {
  AppState.viewMode = mode;
  document.querySelectorAll('.view-button').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');

  renderContractContent();
};

/**
 * On window load, do initial setup
 */
window.onload = () => {
  // Default to showing the generatorPanel
  elements.generatorPanel.style.display = 'flex';

  // Set default advanced mode
  elements.generatorPanel.classList.add('advanced-mode');

  // Render contract content if any
  renderContractContent();

  // Handle form submission for chat
  const form = document.getElementById('input-form');
  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const userMsg = elements.messageInput.value.trim();
    if (!userMsg) return;
    
    // Show user message
    addMessage('user', userMsg);
    elements.messageInput.value = '';

    // Set loading
    setLoading(true);

    try {
      // Call your server
      const responseData = await callServerAPI(userMsg);
      if (responseData.message) {
        addMessage('assistant', responseData.message);
      }
      if (responseData.contract) {
        // If server returns a contract, store in our state
        AppState.currentContract = responseData.contract;
        renderContractContent();
      }
      if (responseData.phase && responseData.phase !== AppState.phase) {
        AppState.phase = responseData.phase;
        updateStepIndicator(AppState.phase);
      }
    } catch (error) {
      console.error("Error in chat submission:", error);
      addMessage('assistant', `Error: ${error.message}`);
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  });

  // If you want a quick welcome message in chat
  setTimeout(() => {
    addNotification("Welcome! Let's build your smart contract.", 'info');
    addMessage('assistant', `
      <div style="text-align: center;">
        <i class="fas fa-robot" style="font-size: 2rem; color: var(--primary-color);"></i>
        <h3>Welcome to SmartContractHub</h3>
        <p>I can assist you with creating and auditing smart contracts.</p>
      </div>
    `);
  }, 500);
};

/**
 * Show or hide "loading" state on the chat form
 */
function setLoading(isLoading) {
  elements.submitBtn.disabled = isLoading;
  elements.messageInput.disabled = isLoading;
  if (isLoading) {
    elements.buttonText.style.display = 'none';
    elements.submitBtn.querySelector('i').style.display = 'none';
    elements.loadingSpinner.style.display = 'block';
  } else {
    elements.buttonText.style.display = 'inline';
    elements.submitBtn.querySelector('i').style.display = 'inline-block';
    elements.loadingSpinner.style.display = 'none';
  }
}

/**
 * Update the step indicator at top
 */
window.updateStepIndicator = function updateStepIndicator(step) {
  const steps = document.querySelectorAll('.process-stepper .step');
  steps.forEach(s => {
    const stepNumber = parseInt(s.getAttribute('data-step'), 10);
    s.classList.remove('active', 'completed', 'animating');
    if (stepNumber < step) {
      s.classList.add('completed');
    } else if (stepNumber === step) {
      s.classList.add('active', 'animating');
      setTimeout(() => s.classList.remove('animating'), 1500);
    }
  });
};
