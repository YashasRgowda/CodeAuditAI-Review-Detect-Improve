// File: src/components/repository/CommitListItem.js
import { formatDate } from '@/lib/utils';

export default function CommitListItem({ commit, onAnalyze }) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
      <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white mb-2 line-clamp-2">{commit.message}</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {commit.author.name}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(commit.author.date)}
              </div>
              <span className="px-2 py-1 bg-white/5 rounded font-mono text-xs">
                {commit.sha.substring(0, 7)}
              </span>
            </div>
            {commit.stats && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-green-400">+{commit.stats.additions}</span>
                <span className="text-red-400">-{commit.stats.deletions}</span>
                <span className="text-white/40">{commit.stats.total} changes</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={commit.html_url} target="_blank" rel="noopener noreferrer">
              <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </a>
            <button 
              onClick={() => onAnalyze(commit)}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}