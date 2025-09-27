// File: src/components/analysis/RiskLevelBadge.js - RAILWAY THEME
export default function RiskLevelBadge({ riskLevel }) {
  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'bg-green-500/10 text-green-400 border-green-500/50';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50';
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/50';
      default:
        return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(riskLevel)}`}>
      {riskLevel?.toUpperCase() || 'UNKNOWN'}
    </span>
  );
}