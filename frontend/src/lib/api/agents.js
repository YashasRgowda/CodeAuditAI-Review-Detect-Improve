// agents.js — Multi-agent analysis API calls
import { apiFetch, apiStream } from './client';

export const agentsApi = {
  quick:    (data) => apiFetch('/analysis/multi-agent/quick',      { method: 'POST', body: JSON.stringify(data) }),
  quickPR:  (data) => apiFetch('/analysis/multi-agent/pr/quick',   { method: 'POST', body: JSON.stringify(data) }),
  stream:   (data) => apiStream('/analysis/multi-agent/stream',    { method: 'POST', body: JSON.stringify(data) }),
};
