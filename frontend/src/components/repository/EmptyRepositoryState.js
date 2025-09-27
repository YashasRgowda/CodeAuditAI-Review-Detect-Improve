// File: src/components/repository/EmptyRepositoryState.js
import Link from 'next/link';

export default function EmptyRepositoryState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  actionHref 
}) {
  return (
    <div className="bg-[#161616] border border-white/10 rounded-2xl p-16 text-center">
      <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
        {icon || (
          <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200">
            {actionLabel}
          </button>
        </Link>
      )}
    </div>
  );
}