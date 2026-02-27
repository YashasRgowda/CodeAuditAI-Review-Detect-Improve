// api/index.js — Unified API export
// All existing imports `from '@/lib/api'` continue to work via this file.
// New feature-specific imports can use: `from '@/lib/api/chat'` etc.

export { repositoriesApi } from './repositories';
export { analysisApi }     from './analysis';
export { chatApi }         from './chat';
export { agentsApi }       from './agents';
export { autofixApi }      from './autofix';
export { ragApi }          from './rag';
export { apiFetch, apiStream, BASE_URL } from './client';

// Legacy api object — keeps old pages working without changes
import { repositoriesApi } from './repositories';
import { analysisApi }     from './analysis';

class ApiClient {
  getUserRepos      = ()         => repositoriesApi.list();
  getRepository     = (id)       => repositoriesApi.get(id);
  deleteRepository  = (id)       => repositoriesApi.delete(id);
  addRepository     = (name)     => repositoriesApi.add(name);
  getGitHubRepos    = ()         => repositoriesApi.listGitHub();
  getCommits        = (id)       => repositoriesApi.commits(id);
  getCommitDiff     = (id, sha)  => repositoriesApi.commitDiff(id, sha);
  getPullRequests   = (id)       => repositoriesApi.pullRequests(id);
  getPRFiles        = (id, num)  => repositoriesApi.prFiles(id, num);
  quickAnalysis     = (data)     => analysisApi.quick(data);
  fullAnalysis      = (data)     => analysisApi.full(data);
  getAnalysisHistory= (id)       => analysisApi.history(id);
  getAnalysis       = (id)       => analysisApi.get(id);
  compareAnalyses   = (a, b)     => analysisApi.compare(a, b);
  quickPRAnalysis   = (data)     => analysisApi.quickPR(data);
  fullPRAnalysis    = (data)     => analysisApi.fullPR(data);
}

export const api = new ApiClient();
