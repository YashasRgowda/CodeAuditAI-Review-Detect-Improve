// File: src/components/repository/PullRequestCard.js
import { formatDate } from '@/lib/utils';

const getStateColor = (state) => {
  switch (state) {
    case 'open': return 'bg-green-500/10 text-green-400 border-green-500/50';
    case 'closed': return 'bg-red-500/10 text-red-400 border-red-500/50';
    case 'merged': return 'bg-purple-500/10 text-purple-400 border-purple-500/50';
    default: return 'bg-white/10 text-white/60 border-white/10';
  }
};

export default function PullRequestCard({ pullRequest, onAnalyze, isAnalyzing }) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
      <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium text-white">#{pullRequest.number}: {pullRequest.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStateColor(pullRequest.state)}`}>
                {pullRequest.state.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/50 mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {pullRequest.user}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                {pullRequest.head_branch} → {pullRequest.base_branch}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(pullRequest.updated_at)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">+{pullRequest.additions}</span>
              <span className="text-red-400">-{pullRequest.deletions}</span>
              <span className="text-white/40">{pullRequest.changed_files} files</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={pullRequest.html_url} target="_blank" rel="noopener noreferrer">
              <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </a>
            <button 
              onClick={() => onAnalyze(pullRequest)}
              disabled={isAnalyzing}
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isAnalyzing 
                  ? 'bg-emerald-600/50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              } text-white`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing PR...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Analyze PR</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}