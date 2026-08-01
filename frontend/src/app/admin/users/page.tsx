'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminApi } from '@/services/admin.service';
import { useAppSelector } from '@/hooks/redux';
import { format } from 'date-fns';

function AdminUsersPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.listUsers,
    enabled: user?.role === 'ADMIN',
  });

  return (
    <ProtectedRoute>
      <AppShell>
        <header className="page-header">
          <div>
            <h1>Admin · Users</h1>
            <p>Role-based access demo. Only ADMIN can open this page and call the API.</p>
          </div>
        </header>

        <section className="panel">
          {user?.role !== 'ADMIN' && <p className="muted">Redirecting…</p>}
          {isLoading && <p className="muted">Loading users…</p>}
          {error && (
            <p className="form-error" role="alert">
              Failed to load users. Confirm you are logged in as ADMIN.
            </p>
          )}

          {data && (
            <div className="table-wrap" role="region" aria-label="Users">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Active</th>
                    <th scope="col">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((u) => (
                    <tr key={u.id}>
                      <td>
                        {u.firstName} {u.lastName}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge badge-priority-medium">{u.role}</span>
                      </td>
                      <td>{u.isActive ? 'Yes' : 'No'}</td>
                      <td className="muted">
                        {u.createdAt ? format(new Date(u.createdAt), 'PP') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}

export default dynamic(() => Promise.resolve(AdminUsersPage), { ssr: false });
