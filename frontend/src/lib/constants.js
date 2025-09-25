// File: src/lib/constants.js
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const ENDPOINTS = {
  // Auth
  GITHUB_LOGIN: '/auth/github/login',
  GITHUB_CALLBACK: '/auth/github/callback',
  AUTH_ME: '/auth/me',
  LOGOUT: '/auth/logout',
  
  // Repositories
  GITHUB_REPOS: '/repos/github/list',
  ADD_REPO: '/repos/add-github-repo',
  USER_REPOS: '/repos',
  REPO_DETAILS: (id) => `/repos/${id}`,
  REPO_COMMITS: (id) => `/repos/${id}/commits`,
  COMMIT_DIFF: (id, sha) => `/repos/${id}/commits/${sha}/diff`,
  REPO_PRS: (id) => `/repos/${id}/pull-requests`,
  PR_FILES: (id, number) => `/repos/${id}/pull-requests/${number}/files`,
  
  // Analysis
  QUICK_ANALYSIS: '/analysis/quick',
  FULL_ANALYSIS: '/analysis',
  ANALYSIS_HISTORY: '/analysis',
  ANALYSIS_DETAILS: (id) => `/analysis/${id}`,
  COMPARE_ANALYSIS: (id1, id2) => `/analysis/compare/${id1}/${id2}`,
  QUICK_PR_ANALYSIS: '/analysis/pr/quick',
  FULL_PR_ANALYSIS: '/analysis/pr',
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
};
