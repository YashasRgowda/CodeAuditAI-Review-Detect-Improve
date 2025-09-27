// File: src/components/analysis/EmptyAnalysisState.js
import Link from 'next/link';

export default function EmptyAnalysisState() {
  return (
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-16 text-center">
      <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No analyses found</h3>
      <p className="text-white/50 mb-6">Start analyzing commits to see results here</p>
      <Link href="/analysis/quick">
        <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all duration-200">
          Quick Analysis
        </button>
      </Link>
    </div>
  );
}