'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/auth.service';
import { setCredentials } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { PasswordInput } from '@/components/PasswordInput';
import { getApiErrorMessage, getFieldErrors } from '@/lib/errors';

function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace('/dashboard');
  }, [hydrated, isAuthenticated, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const result = await authApi.register(form);
      dispatch(setCredentials(result));
      router.push('/dashboard');
    } catch (err: unknown) {
      const fields = getFieldErrors(err);
      setFieldErrors(fields);
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <h1>TaskFlow</h1>
        <p>Manage tasks. Queue jobs. Ship work on autopilot.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Create account</h2>
          <p className="subtitle">Set up your workspace and start managing tasks.</p>
          <form className="form" onSubmit={onSubmit} noValidate>
            <div className="form-row">
              <label>
                First name
                <input
                  required
                  value={form.firstName}
                  aria-invalid={!!fieldErrors.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                {fieldErrors.firstName && (
                  <span className="field-error">{fieldErrors.firstName}</span>
                )}
              </label>
              <label>
                Last name
                <input
                  required
                  value={form.lastName}
                  aria-invalid={!!fieldErrors.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
                {fieldErrors.lastName && (
                  <span className="field-error">{fieldErrors.lastName}</span>
                )}
              </label>
            </div>
            <label>
              Email
              <input
                type="email"
                required
                value={form.email}
                aria-invalid={!!fieldErrors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </label>
            <label>
              Password
              <PasswordInput
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
              <span className="field-hint">
                At least 8 characters, with uppercase, lowercase, and a number.
              </span>
            </label>
            {error && !Object.keys(fieldErrors).length && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Register'}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(RegisterPage), { ssr: false });
