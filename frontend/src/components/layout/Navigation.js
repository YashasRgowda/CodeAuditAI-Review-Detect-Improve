// File: src/components/layout/Navigation.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/repositories', label: 'Repositories' },
  { href: '/analysis', label: 'Analysis' },
  { href: '/analysis/quick', label: 'Quick Analysis' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-50 border-r border-gray-200 w-64 min-h-screen p-4">
      <div className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              pathname === item.href
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}