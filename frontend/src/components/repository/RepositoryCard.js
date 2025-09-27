// File: src/components/repository/RepositoryCard.js
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function RepositoryCard({ repository, onDelete }) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
      <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors shrink-0">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-violet-400 transition-colors">{repository.repo_name}</h3>
            </div>
          </div>
          <button
            onClick={() => onDelete(repository.id)}
            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {repository.description && (
          <p className="text-sm text-white/50 mb-4 line-clamp-2">{repository.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-white/40 mb-4">
          <span>Added {formatDate(repository.created_at)}</span>
        </div>

        <Link href={`/repositories/${repository.id}`}>
          <button className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 group/btn">
            View Details
            <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Link>
      </div>
    </div>
  );
}