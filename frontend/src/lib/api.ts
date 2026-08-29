/**
 * API Client — Real HTTP calls to the RiskSentinel backend.
 */
const BASE_URL = 'http://localhost:8001/api/v1';

async function fetchJSON(url: string, options?: RequestInit) {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API Error [${url}]:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getOverview: () => fetchJSON('/dashboard/overview'),
  getAlerts: () => fetchJSON('/dashboard/alerts'),
  getHeatmap: () => fetchJSON('/dashboard/heatmap'),
  getTimeline: () => fetchJSON('/dashboard/timeline'),
  getVelocity: () => fetchJSON('/dashboard/velocity'),
  getPredictions: () => fetchJSON('/dashboard/predictions'),
  getCascade: () => fetchJSON('/dashboard/cascade'),
  getEntityProfile: (id: string) => fetchJSON(`/dashboard/entity/${id}`),

  // Assessment
  triggerAssessment: (entityId: string, entityType: string = 'customer') =>
    fetchJSON(`/assess/?entity_id=${entityId}&entity_type=${entityType}`, { method: 'POST' }),

  // Simulator
  simulate: (params: { entity_id: string; scenario: string; parameters: Record<string, number> }) =>
    fetchJSON('/simulate/', { method: 'POST', body: JSON.stringify(params) }),
  getScenarios: () => fetchJSON('/simulate/scenarios'),

  // Approvals
  getApprovals: () => fetchJSON('/approvals/'),
  approveAction: (id: string) => fetchJSON(`/approvals/${id}/approve`, { method: 'POST' }),
  rejectAction: (id: string) => fetchJSON(`/approvals/${id}/reject`, { method: 'POST' }),

  // Copilot (SSE streaming)
  chatStream: async function* (message: string, entityId: string = '') {
    try {
      const res = await fetch(`${BASE_URL}/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, entity_id: entityId }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            yield data;
          }
        }
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      yield 'Error connecting to copilot. Please check if the backend is running.';
    }
  },

  // Health
  health: () => fetch(`${BASE_URL.replace('/api/v1', '')}/health`).then(r => r.json()),
};
