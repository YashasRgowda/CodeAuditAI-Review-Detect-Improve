// chat.js — AI conversational chat API calls
import { apiFetch } from './client';

export const chatApi = {
  start:      (analysisId)           => apiFetch('/analysis/chat/start', { method: 'POST', body: JSON.stringify({ analysis_id: analysisId }) }),
  message:    (sessionId, message)   => apiFetch('/analysis/chat/message', { method: 'POST', body: JSON.stringify({ session_id: sessionId, message }) }),
  history:    (sessionId)            => apiFetch(`/analysis/chat/${sessionId}/history`),
};
