'use client';
// LoadingSpinner.js — Full-page and inline loading states

export default function LoadingSpinner({ size = 'md', text = null, fullScreen = false }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size] || sizes.md} border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin`} />
      {text && <p className="text-sm text-white/40">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#080808] flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function SkeletonLine({ className = '' }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-3">
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <SkeletonLine className="h-6 w-16 rounded-full" />
        <SkeletonLine className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
