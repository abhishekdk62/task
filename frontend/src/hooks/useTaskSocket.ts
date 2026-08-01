'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/hooks/redux';
import type { Task } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function useTaskSocket() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const onUpdate = (task: Task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.setQueryData(['task', task.id], task);
    };

    socket.on('task:updated', onUpdate);
    socket.on('task:status', onUpdate);

    return () => {
      socket?.off('task:updated', onUpdate);
      socket?.off('task:status', onUpdate);
      socket?.disconnect();
      socket = null;
    };
  }, [isAuthenticated, token, queryClient]);
}
