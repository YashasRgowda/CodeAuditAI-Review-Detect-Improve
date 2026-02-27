// rag.js — RAG Knowledge Base API calls
import { apiFetch } from './client';

export const ragApi = {
  stats:    ()         => apiFetch('/analysis/rag/knowledge-base'),
  search:   (data)     => apiFetch('/analysis/rag/search',    { method: 'POST', body: JSON.stringify(data) }),
  store:    (data)     => apiFetch('/analysis/rag/store',     { method: 'POST', body: JSON.stringify(data) }),
  context:  (q, repo)  => apiFetch(`/analysis/rag/context?query=${encodeURIComponent(q)}${repo ? `&repo_id=${repo}` : ''}`),
  clear:    ()         => apiFetch('/analysis/rag/clear',     { method: 'DELETE' }),
};
