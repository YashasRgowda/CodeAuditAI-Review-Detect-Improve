'use client';
// Input.js — Styled input with icon support and dark theme

export default function Input({
  label,
  icon: Icon,
  error,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        )}
        <input
          className={`
            w-full bg-white/4 border border-white/8 rounded-lg
            text-sm text-white/90 placeholder:text-white/25
            focus:outline-none focus:border-violet-500/50 focus:bg-white/5
            transition-all duration-200
            ${Icon ? 'pl-9 pr-4 py-2.5' : 'px-4 py-2.5'}
            ${error ? 'border-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
