// File: src/components/analysis/AnalysisCard.js
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RiskLevelBadge from './RiskLevelBadge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function AnalysisCard({ analysis }) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium mb-2">{analysis.summary}</h4>
          <div className="flex items-center space-x-3 mb-2">
            <RiskLevelBadge riskLevel={analysis.risk_level} />
            <span className="text-sm text-gray-600">
              {analysis.files_changed} files changed
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-600">Lines Added:</span>
          <div className="font-medium text-green-600">+{analysis.lines_added}</div>
        </div>
        <div>
          <span className="text-gray-600">Lines Removed:</span>
          <div className="font-medium text-red-600">-{analysis.lines_removed}</div>
        </div>
        <div>
          <span className="text-gray-600">Security Score:</span>
          <div className="font-medium">{analysis.security_score}/100</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {formatDate(analysis.created_at)}
        </span>
        <Link href={`/repositories/${analysis.repository_id}/analysis/${analysis.id}`}>
          <Button variant="secondary" className="text-xs px-3 py-1">
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}