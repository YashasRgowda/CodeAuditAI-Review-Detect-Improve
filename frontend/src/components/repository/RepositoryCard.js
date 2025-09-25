// File: src/components/repository/RepositoryCard.js - REPLACE ENTIRE FILE
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function RepositoryCard({ repository, onDelete }) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-lg">{repository.repo_name}</h3>
        <Button
          variant="danger"
          onClick={() => onDelete(repository.id)}
          className="text-xs px-2 py-1"
        >
          Remove
        </Button>
      </div>
      
      {repository.description && (
        <p className="text-gray-600 text-sm mb-3">{repository.description}</p>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Added: {formatDate(repository.created_at)}
        </div>
        <Link href={`/repositories/${repository.id}`}>
          <Button variant="secondary">View Details</Button>
        </Link>
      </div>
    </Card>
  );
}