// File: src/components/pull-requests/PRCard.js
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function PRCard({ pullRequest, onAnalyze }) {
  const stateColors = {
    'open': 'bg-green-100 text-green-800',
    'closed': 'bg-red-100 text-red-800',
    'merged': 'bg-purple-100 text-purple-800'
  };

  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">#{pullRequest.number}: {pullRequest.title}</h4>
            <Badge className={stateColors[pullRequest.state] || 'bg-gray-100 text-gray-800'}>
              {pullRequest.state.toUpperCase()}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            <div>by {pullRequest.user}</div>
            <div>{pullRequest.head_branch} → {pullRequest.base_branch}</div>
            <div>Updated: {formatDate(pullRequest.updated_at)}</div>
          </div>
          
          <div className="text-sm text-gray-500">
            <span className="text-green-600">+{pullRequest.additions}</span>
            <span className="mx-2">|</span>
            <span className="text-red-600">-{pullRequest.deletions}</span>
            <span className="mx-2">|</span>
            <span>{pullRequest.changed_files} files</span>
          </div>
        </div>
        
        <div className="ml-4">
          <Button 
            onClick={() => onAnalyze(pullRequest)}
            className="text-xs px-3 py-1"
          >
            Analyze PR
          </Button>
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <a 
          href={pullRequest.html_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          View on GitHub →
        </a>
      </div>
    </Card>
  );
}
