'use client';

import { useEffect } from 'react';
import { hydrateAuth } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/hooks/redux';

export function AuthHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  return null;
}
