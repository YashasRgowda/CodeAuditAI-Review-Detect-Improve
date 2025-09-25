// File: src/components/analysis/RiskLevelBadge.js
import Badge from '@/components/ui/Badge';

export default function RiskLevelBadge({ riskLevel }) {
  const variant = {
    'low': 'low',
    'medium': 'medium', 
    'high': 'high'
  }[riskLevel?.toLowerCase()] || 'default';

  return (
    <Badge variant={variant}>
      {riskLevel?.toUpperCase() || 'UNKNOWN'}
    </Badge>
  );
}
