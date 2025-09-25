// File: src/components/commits/CommitCard.js
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function CommitCard({ commit, onAnalyze, onViewDiff }) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-2">{commit.message}</h4>
          <div className="text-xs text-gray-600">
            <div>by {commit.author.name}</div>
            <div>{formatDate(commit.author.date)}</div>
            <div className="mt-1">
              <span className="text-green-600">+{commit.stats?.additions || 0}</span>
              <span className="mx-2">|</span>
              <span className="text-red-600">-{commit.stats?.deletions || 0}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <Button 
            variant="secondary" 
            onClick={() => onViewDiff(commit)}
            className="text-xs px-2 py-1"
          >
            View Diff
          </Button>
          <Button 
            onClick={() => onAnalyze(commit)}
            className="text-xs px-2 py-1"
          >
            Analyze
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        SHA: {commit.sha.substring(0, 8)}...
      </div>
    </Card>
  );
}