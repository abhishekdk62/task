import clsx from 'clsx';
import type { TaskStatus, TaskPriority } from '@/types';

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={clsx('badge', `badge-${status.toLowerCase()}`)}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={clsx('badge', `badge-priority-${priority.toLowerCase()}`)}>
      {priority}
    </span>
  );
}
