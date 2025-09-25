// File: src/components/repository/RepositoryStats.js
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function RepositoryStats({ repository }) {
  return (
    <Card>
      <h3 className="font-medium mb-4">Repository Information</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Full Name:</span>
          <span className="font-medium">{repository.repo_name}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Added:</span>
          <span>{formatDate(repository.created_at)}</span>
        </div>
        
        {repository.last_analyzed_at && (
          <div className="flex justify-between">
            <span className="text-gray-600">Last Analyzed:</span>
            <span>{formatDate(repository.last_analyzed_at)}</span>
          </div>
        )}
        
        <div className="pt-3 border-t">
          <a 
            href={repository.repo_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </Card>
  );
}