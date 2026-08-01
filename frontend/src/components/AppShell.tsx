'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/features/auth/authSlice';
import { authApi } from '@/services/auth.service';
import clsx from 'clsx';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tasks', label: 'Tasks' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const onLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    dispatch(logout());
    router.replace('/login');
  };

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/dashboard" className="brand" aria-label="TaskFlow home">
          <span className="brand-mark" aria-hidden />
          <span>TaskFlow</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx('nav-link', pathname.startsWith(link.href) && 'active')}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
