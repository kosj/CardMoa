'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarRange } from 'lucide-react';

const TABS = [
  { href: '/dashboard', label: '개요', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: '월별 내역', icon: CalendarRange },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="flex gap-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
