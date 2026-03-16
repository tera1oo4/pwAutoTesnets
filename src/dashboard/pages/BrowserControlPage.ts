import { renderRunLauncherForm, getDefaultOptions } from "../components/RunLauncher.ts";
import { renderBrowserManager } from "../components/BrowserManager.ts";
import type { DashboardApiClient } from "../client/apiClient.ts";

/**
 * BrowserControlPage - Dashboard page for launching and managing browser runs
 * Combines run launcher and browser manager into one page
 */
export interface BrowserControlPageResponse {
  ok: boolean;
  error?: string;
  data?: {
    title: string;
    launcherHtml: string;
    managerHtml: string;
    timestamp: string;
  };
}

/**
 * Build browser control page data
 */
export async function buildBrowserControlPage(
  apiClient: DashboardApiClient
): Promise<BrowserControlPageResponse> {
  try {
    // Get options for launcher
    const launcherOptions = getDefaultOptions();

    // Get active sessions count
    const sessionsResponse = await apiClient.listBrowserSessions();
    const activeSessionCount = sessionsResponse.sessions.filter(s => s.isActive).length;

    return {
      ok: true,
      data: {
        title: "Browser Control",
        launcherHtml: renderRunLauncherForm(launcherOptions),
        managerHtml: renderBrowserManager(activeSessionCount),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Format browser control page as HTML
 */
export function renderBrowserControlPageHtml(data: BrowserControlPageResponse): string {
  if (!data.ok) {
    return `<div class="error">Error: ${data.error}</div>`;
  }

  if (!data.data) {
    return `<div class="empty">No data</div>`;
  }

  const { launcherHtml, managerHtml } = data.data;

  return `
<div class="browser-control-page">
  <div class="page-header">
    <h1>🔧 Browser Control Dashboard</h1>
    <p class="subtitle">Launch and manage automated browser sessions directly from the dashboard</p>
  </div>

  <div class="page-content">
    ${launcherHtml}
    ${managerHtml}
  </div>
</div>

<style>
  .browser-control-page {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .subtitle {
    color: var(--text-secondary);
    margin: 0;
    font-size: 1rem;
  }

  .page-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .page-header h1 {
      font-size: 1.5rem;
    }

    .browser-controls {
      grid-template-columns: 1fr !important;
    }
  }
</style>
  `;
}
