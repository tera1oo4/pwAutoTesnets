import type { DashboardApiClient } from "../client/apiClient.ts";

/**
 * RunLauncher component - Form for creating and launching new runs
 * Allows users to:
 * - Select scenario
 * - Select profile
 * - Select network (optional)
 * - Set max attempts
 * - Launch the run
 */

export interface RunLauncherState {
  scenarioId: string;
  profileId: string;
  networkId: string;
  maxAttempts: number;
  isLoading: boolean;
  error?: string;
  success?: string;
}

export interface RunLauncherOptions {
  scenarios: Array<{ id: string; name: string; description?: string }>;
  profiles: Array<{ id: string; name: string }>;
  networks: Array<{ id: string; name: string }>;
  onRunCreated?: (runId: string) => void;
}

/**
 * Create HTML for run launcher form
 */
export function renderRunLauncherForm(options: RunLauncherOptions): string {
  const { scenarios, profiles, networks } = options;

  const scenariosHtml = scenarios
    .map(s => `<option value="${s.id}">${s.name}</option>`)
    .join("");

  const profilesHtml = profiles
    .map(p => `<option value="${p.id}">${p.name}</option>`)
    .join("");

  const networksHtml = networks
    .map(n => `<option value="${n.id}">${n.name}</option>`)
    .join("");

  return `
<div class="run-launcher">
  <h2>🚀 Launch New Run</h2>
  <form id="run-launcher-form">
    <fieldset>
      <legend>Run Configuration</legend>

      <div class="form-group">
        <label for="scenario-select">Scenario *</label>
        <select id="scenario-select" name="scenarioId" required>
          <option value="">-- Select a scenario --</option>
          ${scenariosHtml}
        </select>
        <small>Choose the automation scenario to execute</small>
      </div>

      <div class="form-group">
        <label for="profile-select">Profile *</label>
        <select id="profile-select" name="profileId" required>
          <option value="">-- Select a profile --</option>
          ${profilesHtml}
        </select>
        <small>Choose the browser profile to use</small>
      </div>

      <div class="form-group">
        <label for="network-select">Network (Optional)</label>
        <select id="network-select" name="networkId">
          <option value="">-- Select a network --</option>
          ${networksHtml}
        </select>
        <small>Choose a blockchain network (if applicable)</small>
      </div>

      <div class="form-group">
        <label for="max-attempts">Max Attempts</label>
        <input type="number" id="max-attempts" name="maxAttempts" value="3" min="1" max="10">
        <small>Maximum number of retry attempts</small>
      </div>

      <button type="submit" class="btn btn-primary">Launch Run</button>
    </fieldset>
  </form>

  <div id="launcher-status" class="status-container" style="display: none;"></div>
  <div id="launcher-result" class="result-container" style="display: none;"></div>
</div>

<style>
  .run-launcher {
    background: var(--bg-secondary);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    margin-bottom: 2rem;
  }

  .run-launcher h2 {
    margin-top: 0;
    color: var(--accent);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.625rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.9rem;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--accent) 0%, #0ea5e9 100%);
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
  }

  .status-container,
  .result-container {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 8px;
  }

  .status-container.loading {
    background: rgba(56, 189, 248, 0.1);
    color: var(--accent);
  }

  .result-container.success {
    background: rgba(34, 197, 94, 0.1);
    color: var(--success);
    border: 1px solid var(--success);
  }

  .result-container.error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error);
    border: 1px solid var(--error);
  }
</style>

<script>
  const form = document.getElementById('run-launcher-form');
  const statusDiv = document.getElementById('launcher-status');
  const resultDiv = document.getElementById('launcher-result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      scenarioId: formData.get('scenarioId'),
      profileId: formData.get('profileId'),
      networkId: formData.get('networkId') || undefined,
      maxAttempts: parseInt(formData.get('maxAttempts') || '3')
    };

    // Validate
    if (!data.scenarioId || !data.profileId) {
      showResult('Please fill in all required fields', 'error');
      return;
    }

    showStatus('Creating run...');

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create run');
      }

      const result = await response.json();
      const runId = result.run.id;

      showResult(
        '<strong>✓ Run created successfully!</strong>' +
        '<br><code style="word-break: break-all;">' + runId + '</code>' +
        '<br><a href="/runs/' + runId + '" class="btn">View Run Details</a>',
        'success'
      );

      form.reset();
    } catch (error) {
      showResult(error instanceof Error ? error.message : 'Unknown error', 'error');
    }
  });

  function showStatus(message) {
    statusDiv.textContent = message;
    statusDiv.className = 'status-container loading';
    statusDiv.style.display = 'block';
    resultDiv.style.display = 'none';
  }

  function showResult(message, type) {
    statusDiv.style.display = 'none';
    resultDiv.innerHTML = message;
    resultDiv.className = 'result-container ' + type;
    resultDiv.style.display = 'block';
  }
</script>
  `;
}

/**
 * Get available scenarios, profiles, and networks
 * This would typically come from the API
 */
export function getDefaultOptions(): RunLauncherOptions {
  return {
    scenarios: [
      { id: "connect_wallet", name: "Connect Wallet", description: "Connect to a wallet extension" },
      { id: "switch_network", name: "Switch Network", description: "Switch blockchain networks" },
      { id: "token_swap", name: "Token Swap", description: "Perform a token swap transaction" },
      { id: "sign_message", name: "Sign Message", description: "Sign a message with wallet" },
      { id: "generic_transaction", name: "Generic Transaction", description: "Execute a generic transaction" }
    ],
    profiles: [
      { id: "default", name: "Default Profile" },
      { id: "metamask", name: "MetaMask Profile" },
      { id: "rabby", name: "Rabby Profile" },
      { id: "test", name: "Test Profile" }
    ],
    networks: [
      { id: "ethereum", name: "Ethereum Mainnet" },
      { id: "polygon", name: "Polygon" },
      { id: "arbitrum", name: "Arbitrum" },
      { id: "optimism", name: "Optimism" },
      { id: "base", name: "Base" },
      { id: "localhost", name: "Localhost (Dev)" }
    ]
  };
}
