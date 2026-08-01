'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { taskApi } from '@/services/task.service';
import { useTaskSocket } from '@/hooks/useTaskSocket';
import { useState } from 'react';

function TaskDetailPage() {
  useTaskSocket();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [scheduleValue, setScheduleValue] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getById(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', id] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const retryMutation = useMutation({
    mutationFn: () => taskApi.retry(id),
    onSuccess: invalidate,
  });

  const scheduleMutation = useMutation({
    mutationFn: () => taskApi.schedule(id, new Date(scheduleValue).toISOString()),
    onSuccess: invalidate,
  });

  return (
    <ProtectedRoute>
      <AppShell>
        <header className="page-header">
          <div>
            <p className="muted">
              <Link href="/tasks">← Back to tasks</Link>
            </p>
            <h1>{task?.title || 'Task details'}</h1>
            <p>Track execution history, attachments, and queue outcomes.</p>
          </div>
          {task?.status === 'FAILED' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
            >
              Retry Failed Task
            </button>
          )}
        </header>

        {isLoading && <p className="muted">Loading…</p>}

        {task && (
          <div className="detail-grid">
            <section className="panel">
              <h2>Overview</h2>
              <div className="kv">
                <div>
                  <span className="muted">Status</span>
                  <StatusBadge status={task.status} />
                </div>
                <div>
                  <span className="muted">Priority</span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div>
                  <span className="muted">Retries</span>
                  <strong>
                    {task.retries} / {task.maxRetries}
                  </strong>
                </div>
                <div>
                  <span className="muted">Created</span>
                  <strong>{format(new Date(task.createdAt), 'PPp')}</strong>
                </div>
                <div>
                  <span className="muted">Started</span>
                  <strong>
                    {task.startedAt ? format(new Date(task.startedAt), 'PPp') : '—'}
                  </strong>
                </div>
                <div>
                  <span className="muted">Completed</span>
                  <strong>
                    {task.completedAt ? format(new Date(task.completedAt), 'PPp') : '—'}
                  </strong>
                </div>
                <div>
                  <span className="muted">Scheduled</span>
                  <strong>
                    {task.scheduledAt ? format(new Date(task.scheduledAt), 'PPp') : '—'}
                  </strong>
                </div>
              </div>
              {task.description && (
                <>
                  <h2 style={{ marginTop: '1.2rem' }}>Description</h2>
                  <p className="muted">{task.description}</p>
                </>
              )}
              {task.error && (
                <>
                  <h2 style={{ marginTop: '1.2rem' }}>Error</h2>
                  <p className="form-error">{task.error}</p>
                </>
              )}
              {task.fileUrl && (
                <>
                  <h2 style={{ marginTop: '1.2rem' }}>Attachment</h2>
                  <a
                    className="table-link"
                    href={`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'}${task.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {task.fileName || 'Download file'}
                  </a>
                </>
              )}
            </section>

            <section className="panel">
              <h2>Schedule</h2>
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  scheduleMutation.mutate();
                }}
              >
                <label>
                  Run at
                  <input
                    type="datetime-local"
                    required
                    value={scheduleValue}
                    onChange={(e) => setScheduleValue(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    scheduleMutation.isPending ||
                    task.status === 'PROCESSING' ||
                    task.status === 'COMPLETED'
                  }
                >
                  Schedule Task
                </button>
              </form>

              <h2 style={{ marginTop: '1.4rem' }}>Payload</h2>
              <pre className="pre">{JSON.stringify(task.payload ?? {}, null, 2)}</pre>

              <h2 style={{ marginTop: '1.4rem' }}>Result</h2>
              <pre className="pre">{JSON.stringify(task.result ?? {}, null, 2)}</pre>
            </section>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

export default dynamic(() => Promise.resolve(TaskDetailPage), { ssr: false });
