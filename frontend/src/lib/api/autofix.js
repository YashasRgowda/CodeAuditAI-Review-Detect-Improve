// autofix.js — AI auto-fix API calls
import { apiFetch } from './client';

export const autofixApi = {
  fixIssue:  (data) => apiFetch('/analysis/auto-fix',        { method: 'POST', body: JSON.stringify(data) }),
  fixCustom: (data) => apiFetch('/analysis/auto-fix/custom', { method: 'POST', body: JSON.stringify(data) }),
};
