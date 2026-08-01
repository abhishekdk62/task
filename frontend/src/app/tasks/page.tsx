'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TaskTable } from '@/components/TaskTable';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setFilters } from '@/features/tasks/taskFiltersSlice';
import { taskApi } from '@/services/task.service';
import { useTaskSocket } from '@/hooks/useTaskSocket';

function TasksPage() {
  useTaskSocket();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.taskFilters);
  const [open, setOpen] = useState(false);

  const queryFilters = useMemo(
    () => ({
      ...filters,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      search: filters.search || undefined,
    }),
    [filters]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['tasks', queryFilters],
    queryFn: () => taskApi.list(queryFilters as never),
    placeholderData: (prev) => prev,
  });

  return (
    <ProtectedRoute>
      <AppShell>
        <header className="page-header">
          <div>
            <h1>Tasks</h1>
            <p>Search, filter, and manage queued jobs. {isFetching ? 'Refreshing…' : ''}</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            Create Task
          </button>
        </header>

        <section className="panel">
          <div className="filters" role="search">
            <input
              placeholder="Search title or description"
              value={filters.search || ''}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              aria-label="Search tasks"
            />
            <select
              value={filters.status || ''}
              onChange={(e) => dispatch(setFilters({ status: e.target.value as never }))}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              value={filters.priority || ''}
              onChange={(e) => dispatch(setFilters({ priority: e.target.value as never }))}
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <select
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => dispatch(setFilters({ sortBy: e.target.value }))}
              aria-label="Sort by"
            >
              <option value="createdAt">Created</option>
              <option value="updatedAt">Updated</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) =>
                dispatch(setFilters({ sortOrder: e.target.value as 'asc' | 'desc' }))
              }
              aria-label="Sort order"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button
              type="button"
              className="btn"
              onClick={() =>
                dispatch(
                  setFilters({
                    search: '',
                    status: '',
                    priority: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    page: 1,
                  })
                )
              }
            >
              Reset
            </button>
          </div>

          {isLoading ? <p className="muted">Loading tasks…</p> : <TaskTable tasks={data?.items || []} />}

          {data?.pagination && (
            <div className="pagination">
              <span className="muted">
                Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total}{' '}
                tasks
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={data.pagination.page <= 1}
                  onClick={() => dispatch(setFilters({ page: (filters.page || 1) - 1 }))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => dispatch(setFilters({ page: (filters.page || 1) + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {open && <CreateTaskModal onClose={() => setOpen(false)} />}
      </AppShell>
    </ProtectedRoute>
  );
}

export default dynamic(() => Promise.resolve(TasksPage), { ssr: false });
