'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { taskApi } from '@/services/task.service';
import type { Task } from '@/types';

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const retryMutation = useMutation({
    mutationFn: (id: string) => taskApi.retry(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onSuccess: invalidate,
  });

  if (!tasks.length) {
    return <p className="empty">No tasks found. Create one to start the queue.</p>;
  }

  return (
    <div className="table-wrap" role="region" aria-label="Task list">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
            <th scope="col">Updated</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <Link href={`/tasks/${task.id}`} className="table-link">
                  {task.title}
                </Link>
                {task.fileName && <div className="muted tiny">📎 {task.fileName}</div>}
              </td>
              <td>
                <StatusBadge status={task.status} />
              </td>
              <td>
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="muted">
                {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
              </td>
              <td>
                <div className="row-actions">
                  {task.status === 'FAILED' && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => retryMutation.mutate(task.id)}
                      disabled={retryMutation.isPending}
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (confirm('Delete this task?')) deleteMutation.mutate(task.id);
                    }}
                    disabled={deleteMutation.isPending || task.status === 'PROCESSING'}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
