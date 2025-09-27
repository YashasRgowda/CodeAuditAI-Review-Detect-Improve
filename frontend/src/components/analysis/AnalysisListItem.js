// File: src/components/analysis/AnalysisListItem.js
import Link from 'next/link';
import RiskLevelBadge from './RiskLevelBadge';
import { formatDate } from '@/lib/utils';

export default function AnalysisListItem({ analysis }) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
      <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <RiskLevelBadge riskLevel={analysis.risk_level} />
              <span className="px-2 py-1 bg-white/5 rounded font-mono text-xs text-white/60">
                {analysis.commit_hash?.substring(0, 7)}
              </span>
              <span className="text-xs text-white/40">
                {formatDate(analysis.created_at)}
              </span>
            </div>
            
            <h3 className="font-medium text-white mb-3 line-clamp-2">{analysis.summary}</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-white/60">{analysis.files_changed} files</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-green-400">+{analysis.lines_added}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <span className="text-red-400">-{analysis.lines_removed}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-white/60">{analysis.security_score}/100</span>
              </div>
            </div>
          </div>
          
          <Link href={`/repositories/${analysis.repository_id}/analysis/${analysis.id}`}>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shrink-0">
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}