// File: src/lib/api.js - COMPLETE REPLACEMENT
import { getSession } from 'next-auth/react';
import { API_BASE_URL } from './constants';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get NextAuth session to access GitHub token
    const session = await getSession();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Use GitHub access token from NextAuth session
    if (session?.accessToken) {
      config.headers.Authorization = `token ${session.accessToken}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Repository methods
  async getGitHubRepos() {
    return this.get('/repos/github/list');
  }

  async addRepository(repoName) {
    return this.post(`/repos/add-github-repo?repo_name=${encodeURIComponent(repoName)}`);
  }

  async getUserRepos() {
    return this.get('/repos');
  }

  async getRepository(id) {
    return this.get(`/repos/${id}`);
  }

  async deleteRepository(id) {
    return this.delete(`/repos/${id}`);
  }

  async getCommits(repoId) {
    return this.get(`/repos/${repoId}/commits`);
  }

  async getCommitDiff(repoId, commitSha) {
    return this.get(`/repos/${repoId}/commits/${commitSha}/diff`);
  }

  // Analysis methods
  async quickAnalysis(data) {
    return this.post('/analysis/quick', data);
  }

  async fullAnalysis(data) {
    return this.post('/analysis', data);
  }

  async getAnalysisHistory(repoId = null) {
    const query = repoId ? `?repository_id=${repoId}` : '';
    return this.get(`/analysis${query}`);
  }

  async getAnalysis(id) {
    return this.get(`/analysis/${id}`);
  }

  async compareAnalyses(id1, id2) {
    return this.get(`/analysis/compare/${id1}/${id2}`);
  }

  // Pull Request methods
  async getPullRequests(repoId) {
    return this.get(`/repos/${repoId}/pull-requests`);
  }

  async getPRFiles(repoId, prNumber) {
    return this.get(`/repos/${repoId}/pull-requests/${prNumber}/files`);
  }

  async quickPRAnalysis(data) {
    return this.post('/analysis/pr/quick', data);
  }

  async fullPRAnalysis(data) {
    return this.post('/analysis/pr', data);
  }
}

export const api = new ApiClient();