'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { taskApi } from '@/services/task.service';
import { useTaskSocket } from '@/hooks/useTaskSocket';
import type { TaskPriority } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

function TaskDetailPage() {
  useTaskSocket();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [scheduleValue, setScheduleValue] = useState('');
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
  });

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getById(id),
  });

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
      });
    }
  }, [task]);

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

  const updateMutation = useMutation({
    mutationFn: () =>
      taskApi.update(id, {
        title: editForm.title,
        description: editForm.description || null,
        priority: editForm.priority,
      }),
    onSuccess: () => {
      setEditError('');
      invalidate();
    },
    onError: (err) => setEditError(getApiErrorMessage(err, 'Failed to update task')),
  });

  const onUpdate = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const canEdit = task && task.status !== 'PROCESSING';

  return (
    <ProtectedRoute>
      <AppShell>
        <header className="page-header">
          <div>
            <p className="muted">
              <Link href="/tasks">← Back to tasks</Link>
            </p>
            <h1>{task?.title || 'Task details'}</h1>
            <p>Track execution history, update details, and manage queue outcomes.</p>
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
              </div>

              <h2 style={{ marginTop: '1.2rem' }}>Task History</h2>
              <ol className="timeline" aria-label="Task status history">
                <li>
                  <strong>Created</strong>
                  <span className="muted">{format(new Date(task.createdAt), 'PPp')}</span>
                </li>
                {task.scheduledAt && (
                  <li>
                    <strong>Scheduled</strong>
                    <span className="muted">{format(new Date(task.scheduledAt), 'PPp')}</span>
                  </li>
                )}
                {task.startedAt && (
                  <li>
                    <strong>Processing started</strong>
                    <span className="muted">{format(new Date(task.startedAt), 'PPp')}</span>
                  </li>
                )}
                {task.completedAt && (
                  <li>
                    <strong>{task.status === 'FAILED' ? 'Failed' : 'Completed'}</strong>
                    <span className="muted">{format(new Date(task.completedAt), 'PPp')}</span>
                  </li>
                )}
                <li>
                  <strong>Last updated</strong>
                  <span className="muted">{format(new Date(task.updatedAt), 'PPp')}</span>
                </li>
              </ol>

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

              <h2 style={{ marginTop: '1.4rem' }}>Update Task</h2>
              <form className="form" onSubmit={onUpdate}>
                <label>
                  Title
                  <input
                    required
                    value={editForm.title}
                    disabled={!canEdit}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={3}
                    value={editForm.description}
                    disabled={!canEdit}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={editForm.priority}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value as TaskPriority })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>
                {editError && (
                  <p className="form-error" role="alert">
                    {editError}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canEdit || updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
                {!canEdit && (
                  <p className="field-hint">Cannot edit a task while it is processing.</p>
                )}
              </form>
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
