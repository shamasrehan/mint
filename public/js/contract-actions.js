// contract-actions.js

/**
 * Approve contract action
 */
window.approveContract = function approveContract() {
  if (!AppState.currentContract) {
    addNotification('No contract to approve', 'warning');
    return;
  }
  // Quick confirmation
  if (!confirm("Approve this contract?")) return;

  addNotification('Contract Approved ✅', 'success');
  addMessage('assistant', `
    <div style="text-align: center;">
      <i class="fas fa-check-circle" style="color: var(--success-color); font-size: 2rem;"></i>
      <p style="margin-top: 10px; font-weight: bold;">Contract Approved</p>
      <p>Your contract is ready for deployment.</p>
    </div>
  `);
};

/**
 * Request changes to contract
 */
window.requestChanges = function requestChanges() {
  if (!AppState.currentContract) {
    addNotification('No contract to modify', 'warning');
    return;
  }
  addNotification('Requesting changes...', 'info');
  // In a real app, show a modal or prompt the user for the changes
  addMessage('assistant', "What changes would you like to request?");
};

/**
 * Compile contract
 */
window.compileContract = function compileContract() {
  if (!AppState.currentContract) {
    addNotification('No contract to compile', 'warning');
    return;
  }
  addNotification('Compiling contract...', 'info');

  // Simulate a compile step with a timeout
  setTimeout(() => {
    const success = Math.random() > 0.3;
    if (success) {
      addNotification('Compilation successful!', 'success');
      addMessage('assistant', `
        <div style="background-color: var(--success-light); padding: 12px; border-left: 4px solid var(--success-color);">
          <strong><i class="fas fa-check-circle"></i> Compilation Successful</strong>
          <p>Contract compiled without errors.</p>
        </div>
      `);
    } else {
      addNotification('Compilation failed: syntax errors found', 'error');
      addMessage('assistant', `
        <div style="background-color: var(--error-light); padding: 12px; border-left: 4px solid var(--error-color);">
          <strong><i class="fas fa-exclamation-circle"></i> Compilation Failed</strong>
          <p>Please fix the syntax errors and try again.</p>
        </div>
      `);
    }
  }, 2000);
};

/**
 * Quick Audit
 */
window.quickAudit = function quickAudit() {
  if (!AppState.currentContract) {
    addNotification('No contract to audit', 'warning');
    return;
  }
  addNotification('Performing quick audit...', 'info');

  // Simulate with a timeout
  setTimeout(() => {
    addMessage('assistant', `
      <div style="background-color: #e8eaf6; padding: 16px; border-radius: 8px;">
        <h3 style="color: #3f51b5;"><i class="fas fa-shield-alt"></i> Quick Audit Results</h3>
        <ul>
          <li>No critical vulnerabilities detected</li>
          <li>Some recommended best practices to implement</li>
        </ul>
      </div>
    `);
  }, 1500);
};

/**
 * Archive contract
 */
window.archiveContract = function archiveContract() {
  if (!AppState.currentContract) {
    addNotification('No contract to archive', 'warning');
    return;
  }
  const name = AppState.currentContract.contractName || 'Untitled';

  if (!confirm(`Archive contract "${name}"?`)) return;
  addNotification(`Contract "${name}" archived successfully`, 'success');
  addMessage('assistant', `
    <div style="text-align: center;">
      <i class="fas fa-archive" style="color: #3fabb5; font-size: 2rem;"></i>
      <p style="margin-top: 10px; font-weight: bold;">Contract Archived</p>
    </div>
  `);
};

/**
 * Generate code from spec
 */
window.generateCodeFromSpec = function generateCodeFromSpec() {
  if (!AppState.currentContract || !AppState.currentContract.jsonSpec) {
    addNotification('No contract spec to generate from', 'warning');
    return;
  }
  addNotification('Generating code...', 'info');
  
  // Simulate code generation
  setTimeout(() => {
    // Assume we got some random code
    const randomCode = `// Example ${AppState.selectedLanguage} code\n\ncontract MyContract {\n  // ...implementation\n}`;
    AppState.currentContract.contracts = [{
      name: "MyContract",
      content: randomCode
    }];
    addNotification('Code generation complete', 'success');
    addMessage('assistant', 'Here is your generated code! Check the "Solidity" tab to view it.');
    
    // Force re-render if you're doing a manual "renderContractContent"
    renderContractContent();
  }, 1500);
};

/**
 * Demo bug fix
 */
window.demoBugFix = function demoBugFix() {
  addNotification('Starting Bug Fix demo...', 'info');
  addMessage('assistant', "I'm analyzing the contract for bugs now...");
};

/**
 * Demo security audit
 */
window.demoSecurityAudit = function demoSecurityAudit() {
  addNotification('Starting Security Audit demo...', 'info');
  addMessage('assistant', "Performing a thorough security audit...");
};

/**
 * Demo gas optimization
 */
window.demoGasOptimization = function demoGasOptimization() {
  addNotification('Starting Gas Optimization demo...', 'info');
  addMessage('assistant', "Scanning for gas optimization opportunities...");
};

/**
 * Demo test generation
 */
window.demoGenerateTests = function demoGenerateTests() {
  addNotification('Starting Test Generation demo...', 'info');
  addMessage('assistant', "Generating tests for your contract...");
};

/**
 * Re-audit function from the Audit Report tab
 */
window.requestReaudit = function requestReaudit() {
  const contractIdInput = document.getElementById('contract-id-input');
  const contractId = contractIdInput.value.trim();
  if (!contractId) {
    addNotification('Please enter a Contract ID', 'warning');
    return;
  }
  addNotification(`Re-audit requested for ${contractId}`, 'info');
};
