// File: src/components/auth/UserProfile.js
'use client';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card>
      <div className="flex items-center space-x-4">
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <h3 className="font-medium">{user.username}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>
    </Card>
  );
}