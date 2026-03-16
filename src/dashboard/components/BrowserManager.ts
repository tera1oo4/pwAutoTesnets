import type { BrowserSession } from "../../api/services/BrowserControlService.ts";

/**
 * BrowserManager component - Manages active browser sessions and commands
 * Allows users to:
 * - View active browser sessions
 * - Execute commands in the browser
 * - View command history
 * - Capture screenshots
 * - Modify browser data (cookies, storage, etc.)
 */

export interface BrowserCommand {
  type: string;
  [key: string]: any;
}

export type BrowserCommandType = 
  | "navigate" 
  | "click" 
  | "fill" 
  | "screenshot" 
  | "execute" 
  | "getCookies" 
  | "setCookies" 
  | "getStorage" 
  | "setStorage" 
  | "clearStorage" 
  | "evaluate";

/**
 * Create HTML for browser manager interface
 */
export function renderBrowserManager(activeSessionCount: number = 0): string {
  return `
<div class="browser-manager">
  <h2>🖥️ Browser Manager</h2>

  <div class="browser-controls">
    <div class="control-section">
      <h3>Active Sessions</h3>
      <div id="sessions-list" class="sessions-list">
        <p class="loading">Loading sessions...</p>
      </div>
      <button class="btn btn-secondary" onclick="refreshSessions()">Refresh</button>
    </div>

    <div class="control-section">
      <h3>Browser Command Console</h3>
      <div class="command-console">
        <div id="command-history" class="command-history"></div>
        
        <div class="command-input-section">
          <div class="form-group">
            <label for="session-selector">Select Session</label>
            <select id="session-selector">
              <option value="">-- No active session --</option>
            </select>
          </div>

          <div class="form-group">
            <label for="command-type">Command Type</label>
            <select id="command-type" onchange="updateCommandForm()">
              <option value="">-- Select command --</option>
              <option value="navigate">Navigate to URL</option>
              <option value="click">Click Element</option>
              <option value="fill">Fill Input</option>
              <option value="screenshot">Take Screenshot</option>
              <option value="execute">Execute JavaScript</option>
              <option value="getCookies">Get Cookies</option>
              <option value="setCookies">Set Cookies</option>
              <option value="getStorage">Get Storage</option>
              <option value="setStorage">Set Storage</option>
              <option value="clearStorage">Clear Storage</option>
              <option value="evaluate">Evaluate Expression</option>
            </select>
          </div>

          <div id="command-params" class="command-params"></div>

          <button class="btn btn-primary" onclick="executeCommand()">Execute Command</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .browser-manager {
    background: var(--bg-secondary);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    margin-bottom: 2rem;
  }

  .browser-manager h2 {
    margin-top: 0;
    color: var(--accent);
  }

  .browser-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1.5rem;
  }

  @media (max-width: 1024px) {
    .browser-controls {
      grid-template-columns: 1fr;
    }
  }

  .control-section {
    background: var(--bg-primary);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .control-section h3 {
    margin-top: 0;
    color: var(--accent);
    font-size: 1.1rem;
  }

  .sessions-list {
    margin-bottom: 1rem;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.5rem;
  }

  .session-item {
    padding: 0.75rem;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .session-item:hover {
    background: rgba(56, 189, 248, 0.2);
  }

  .session-item.active {
    background: rgba(34, 197, 94, 0.1);
    border-color: var(--success);
  }

  .session-id {
    font-weight: 600;
    color: var(--accent);
    font-size: 0.85rem;
    word-break: break-all;
  }

  .session-info {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .session-status {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 0.5rem;
    background: var(--success);
  }

  .session-status.inactive {
    background: #64748b;
  }

  .command-console {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .command-history {
    background: var(--bg-primary);
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
    border-radius: 8px 8px 0 0;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
  }

  .command-entry {
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .command-entry:last-child {
    border-bottom: none;
  }

  .command-type {
    color: var(--accent);
    font-weight: 600;
  }

  .command-result {
    color: var(--success);
    margin-top: 0.25rem;
  }

  .command-error {
    color: var(--error);
  }

  .command-input-section {
    padding: 1.5rem;
  }

  .command-params {
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: 6px;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.625rem;
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.9rem;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
    font-family: 'Courier New', monospace;
  }

  .btn-secondary {
    background: var(--border);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: #475569;
  }

  .loading {
    color: var(--text-secondary);
    font-style: italic;
  }
</style>

<script>
  // Global state
  let selectedSessionId = null;

  async function refreshSessions() {
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = '<p class="loading">Loading sessions...</p>';

    try {
      const response = await fetch('/api/browser/sessions');
      const data = await response.json();

      if (data.sessions && data.sessions.length > 0) {
        sessionsList.innerHTML = data.sessions
          .map((session, idx) => \`
            <div class="session-item" onclick="selectSession('\${session.runId}')" id="session-\${idx}">
              <div class="session-id">
                <span class="session-status\${session.isActive ? '' : ' inactive'}"></span>
                \${session.runId.substring(0, 12)}...
              </div>
              <div class="session-info">
                Status: \${session.isActive ? '🟢 Active' : '🔴 Inactive'} | 
                Commands: \${session.commandCount} | 
                Results: \${session.resultCount}
              </div>
            </div>
          \`)
          .join('');

        updateSessionSelector(data.sessions);
      } else {
        sessionsList.innerHTML = '<p class="loading">No active browser sessions</p>';
        updateSessionSelector([]);
      }
    } catch (error) {
      sessionsList.innerHTML = '<p class="loading" style="color: var(--error);">Error loading sessions: ' + error.message + '</p>';
    }
  }

  function updateSessionSelector(sessions) {
    const selector = document.getElementById('session-selector');
    const currentValue = selector.value;
    
    selector.innerHTML = '<option value="">-- No active session --</option>' +
      sessions
        .filter(s => s.isActive)
        .map(s => '<option value="' + s.runId + '">' + s.runId.substring(0, 8) + '... (' + s.commandCount + ' commands)</option>')
        .join('');

    if (currentValue && sessions.some(s => s.runId === currentValue)) {
      selector.value = currentValue;
    }
  }

  function selectSession(runId) {
    selectedSessionId = runId;
    document.getElementById('session-selector').value = runId;
  }

  function updateCommandForm() {
    const commandType = document.getElementById('command-type').value;
    const paramsDiv = document.getElementById('command-params');

    paramsDiv.innerHTML = '';

    if (!commandType) return;

    const forms = {
      navigate: '<div class="form-group"><label>URL</label><input type="url" id="param-url" placeholder="https://example.com"></div>',
      click: '<div class="form-group"><label>CSS Selector</label><input type="text" id="param-selector" placeholder=".button, #submit"></div>',
      fill: '<div class="form-group"><label>CSS Selector</label><input type="text" id="param-selector" placeholder=".input, #email"></div>' +
            '<div class="form-group"><label>Text</label><input type="text" id="param-text" placeholder="Enter text"></div>',
      screenshot: '<div class="form-group"><label>Filename (optional)</label><input type="text" id="param-filename" placeholder="screenshot.png"></div>',
      execute: '<div class="form-group"><label>JavaScript Code</label><textarea id="param-script">// Write your JavaScript here</textarea></div>',
      getCookies: '<p style="color: var(--text-secondary);">No parameters needed. Click Execute to get all cookies.</p>',
      setCookies: '<div class="form-group"><label>Cookies (JSON)</label><textarea id="param-cookies">[{"name":"key","value":"value"}]</textarea></div>',
      getStorage: '<div class="form-group"><label>Storage Type</label><select id="param-storageType"><option value="local">Local Storage</option><option value="session">Session Storage</option></select></div>',
      setStorage: '<div class="form-group"><label>Storage Type</label><select id="param-storageType"><option value="local">Local Storage</option><option value="session">Session Storage</option></select></div>' +
                  '<div class="form-group"><label>Key</label><input type="text" id="param-key" placeholder="storage_key"></div>' +
                  '<div class="form-group"><label>Value</label><input type="text" id="param-value" placeholder="storage_value"></div>',
      clearStorage: '<div class="form-group"><label>Storage Type</label><select id="param-storageType"><option value="local">Local Storage</option><option value="session">Session Storage</option></select></div>',
      evaluate: '<div class="form-group"><label>JavaScript Expression</label><textarea id="param-expression">// Return a value</textarea></div>'
    };

    paramsDiv.innerHTML = forms[commandType] || '';
  }

  async function executeCommand() {
    const sessionId = selectedSessionId || document.getElementById('session-selector').value;
    const commandType = document.getElementById('command-type').value;
    const history = document.getElementById('command-history');

    if (!sessionId) {
      addHistoryEntry('⚠️ No session selected', '', true);
      return;
    }

    if (!commandType) {
      addHistoryEntry('⚠️ No command type selected', '', true);
      return;
    }

    // Build command object
    const command = { type: commandType };

    try {
      switch (commandType) {
        case 'navigate':
          command.url = document.getElementById('param-url')?.value || '';
          if (!command.url) throw new Error('URL is required');
          break;
        case 'click':
          command.selector = document.getElementById('param-selector')?.value || '';
          if (!command.selector) throw new Error('CSS Selector is required');
          break;
        case 'fill':
          command.selector = document.getElementById('param-selector')?.value || '';
          command.text = document.getElementById('param-text')?.value || '';
          if (!command.selector || !command.text) throw new Error('Selector and text are required');
          break;
        case 'screenshot':
          command.filename = document.getElementById('param-filename')?.value || undefined;
          break;
        case 'execute':
          command.script = document.getElementById('param-script')?.value || '';
          if (!command.script) throw new Error('JavaScript code is required');
          break;
        case 'setCookies':
          command.cookies = JSON.parse(document.getElementById('param-cookies')?.value || '[]');
          break;
        case 'getStorage':
        case 'clearStorage':
          command.storageType = document.getElementById('param-storageType')?.value || 'local';
          break;
        case 'setStorage':
          command.storageType = document.getElementById('param-storageType')?.value || 'local';
          command.key = document.getElementById('param-key')?.value || '';
          command.value = document.getElementById('param-value')?.value || '';
          if (!command.key || !command.value) throw new Error('Key and value are required');
          break;
        case 'evaluate':
          command.expression = document.getElementById('param-expression')?.value || '';
          if (!command.expression) throw new Error('Expression is required');
          break;
      }

      addHistoryEntry('> Executing: ' + commandType, JSON.stringify(command));

      const response = await fetch('/api/browser/sessions/' + sessionId + '/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });

      const result = await response.json();

      if (result.result.success) {
        addHistoryEntry('✓ Success', JSON.stringify(result.result.result || {}, null, 2));
      } else {
        addHistoryEntry('✗ Error', result.result.error, true);
      }
    } catch (error) {
      addHistoryEntry('✗ Error', error instanceof Error ? error.message : String(error), true);
    }
  }

  function addHistoryEntry(label, value, isError = false) {
    const history = document.getElementById('command-history');
    const entry = document.createElement('div');
    entry.className = 'command-entry' + (isError ? ' command-error' : '');
    entry.innerHTML = '<span class="command-type">' + label + '</span>' +
                      (value ? '<pre style="margin: 0.5rem 0; background: var(--bg-secondary); padding: 0.5rem; border-radius: 4px; overflow-x: auto;">' + escapeHtml(value) + '</pre>' : '');
    history.appendChild(entry);
    history.scrollTop = history.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load sessions on page load
  window.addEventListener('load', refreshSessions);
  // Refresh every 5 seconds
  setInterval(refreshSessions, 5000);
</script>
  `;
}
