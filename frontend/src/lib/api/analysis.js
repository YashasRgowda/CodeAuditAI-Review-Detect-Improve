// analysis.js — AI analysis API calls
import { apiFetch, apiStream } from './client';

export const analysisApi = {
  quick:       (data)        => apiFetch('/analysis/quick', { method: 'POST', body: JSON.stringify(data) }),
  full:        (data)        => apiFetch('/analysis/', { method: 'POST', body: JSON.stringify(data) }),
  history:     (repoId)      => apiFetch(`/analysis/${repoId ? `?repository_id=${repoId}` : ''}`),
  get:         (id)          => apiFetch(`/analysis/${id}`),
  delete:      (id)          => apiFetch(`/analysis/${id}`, { method: 'DELETE' }),
  compare:     (id1, id2)    => apiFetch(`/analysis/compare/${id1}/${id2}`),
  quickPR:     (data)        => apiFetch('/analysis/pr/quick', { method: 'POST', body: JSON.stringify(data) }),
  fullPR:      (data)        => apiFetch('/analysis/pr/', { method: 'POST', body: JSON.stringify(data) }),
  stream:      (data)        => apiStream('/analysis/stream', { method: 'POST', body: JSON.stringify(data) }),
  streamPR:    (data)        => apiStream('/analysis/pr/stream', { method: 'POST', body: JSON.stringify(data) }),
};
