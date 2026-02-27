// repositories.js — GitHub repos & commits API calls
import { apiFetch } from './client';

export const repositoriesApi = {
  list:         ()           => apiFetch('/repos/'),
  get:          (id)         => apiFetch(`/repos/${id}`),
  delete:       (id)         => apiFetch(`/repos/${id}`, { method: 'DELETE' }),
  add:          (repoName)   => apiFetch(`/repos/add-github-repo?repo_name=${encodeURIComponent(repoName)}`, { method: 'POST' }),
  listGitHub:   ()           => apiFetch('/repos/github/list'),
  commits:      (id)         => apiFetch(`/repos/${id}/commits`),
  commitDiff:   (id, sha)    => apiFetch(`/repos/${id}/commits/${sha}/diff`),
  pullRequests: (id)         => apiFetch(`/repos/${id}/pull-requests`),
  prFiles:      (id, prNum)  => apiFetch(`/repos/${id}/pull-requests/${prNum}/files`),
};
