// File: src/components/analysis/AnalysisStatCard.js
export default function AnalysisStatCard({ title, value, icon, gradient, textColor }) {
  return (
    <div className="group relative">
      <div className={`absolute -inset-0.5 ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300`}></div>
      <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/50 text-sm font-medium mb-2">{title}</p>
            <p className={`text-4xl font-bold ${textColor || 'text-white'}`}>{value}</p>
          </div>
          <div className={`p-3 ${gradient.replace('bg-gradient-to-r', 'bg-gradient-to-br').replace(/from-\w+-\d+/, '$&/10').replace(/to-\w+-\d+/, '$&/10')} rounded-xl group-hover:opacity-100 transition-opacity duration-300`}>
            {icon}
          </div>
        </div>
        <div className={`h-1 w-full ${gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      </div>
    </div>
  );
}