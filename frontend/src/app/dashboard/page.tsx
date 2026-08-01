'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { dashboardApi } from '@/services/task.service';
import { useTaskSocket } from '@/hooks/useTaskSocket';

function DashboardPage() {
  useTaskSocket();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.stats,
    refetchInterval: 15000,
  });

  return (
    <ProtectedRoute>
      <AppShell>
        <header className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Live overview of tasks and Redis queue health.</p>
          </div>
        </header>

        {isLoading && <p className="muted">Loading stats…</p>}
        {error && <p className="form-error">Failed to load dashboard stats.</p>}

        {data && (
          <>
            <section className="stats-grid" aria-label="Task statistics">
              <article className="stat-card">
                <div className="stat-label">Total Tasks</div>
                <div className="stat-value">{data.tasks.total}</div>
              </article>
              <article className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{data.tasks.completed}</div>
              </article>
              <article className="stat-card">
                <div className="stat-label">Failed</div>
                <div className="stat-value">{data.tasks.failed}</div>
              </article>
              <article className="stat-card">
                <div className="stat-label">Pending</div>
                <div className="stat-value">{data.tasks.pending}</div>
              </article>
              <article className="stat-card">
                <div className="stat-label">Processing</div>
                <div className="stat-value">{data.tasks.processing}</div>
              </article>
            </section>

            <section className="panel" aria-label="Queue status">
              <h2>Queue Status</h2>
              <div className="queue-list">
                <div className="queue-item">
                  <span>Waiting</span>
                  <strong>{data.queue.waiting}</strong>
                </div>
                <div className="queue-item">
                  <span>Active</span>
                  <strong>{data.queue.active}</strong>
                </div>
                <div className="queue-item">
                  <span>Delayed / Scheduled</span>
                  <strong>{data.queue.delayed}</strong>
                </div>
                <div className="queue-item">
                  <span>Completed (queue)</span>
                  <strong>{data.queue.completed}</strong>
                </div>
                <div className="queue-item">
                  <span>Failed (queue)</span>
                  <strong>{data.queue.failed}</strong>
                </div>
              </div>
            </section>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false });
