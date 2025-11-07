'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Protected } from './_components/protected';
import { useAuth } from '../../../providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Services', href: '/dashboard/services' },
  { label: 'Incidents', href: '/dashboard/incidents' },
];

function DesktopSidebar() {
  const pathname = usePathname();
  const { organization, user, logout } = useAuth();

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Organization</p>
          <p className="font-semibold">{organization?.name ?? 'My Workspace'}</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 text-sm">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border px-6 py-4">
        <p className="text-sm font-medium">{user?.name}</p>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={logout}>
          Log out
        </Button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const { organization, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 flex-col p-0">
        <div className="border-b border-border px-6 py-5">
          <p className="text-xs uppercase text-muted-foreground">Organization</p>
          <p className="font-semibold">{organization?.name ?? 'My Workspace'}</p>
        </div>
        <nav className="flex-1 px-4 py-6 text-sm">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Protected>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <DesktopSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8">
            <div>
              <p className="text-lg font-semibold">Status Dashboard</p>
              <p className="text-sm text-muted-foreground">
                Manage services, incidents, and team members.
              </p>
            </div>
            <MobileNav />
          </header>
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </Protected>
  );
}
