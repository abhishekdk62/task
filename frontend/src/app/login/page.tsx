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

function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('user@taskflow.com');
  const [password, setPassword] = useState('User@123');
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
      const result = await authApi.login({ email, password });
      dispatch(setCredentials(result));
      router.push('/dashboard');
    } catch (err: unknown) {
      const fields = getFieldErrors(err);
      setFieldErrors(fields);
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual" aria-hidden={false}>
        <h1>TaskFlow</h1>
        <p>Manage tasks. Queue jobs. Watch status update live.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to manage your tasks and queue.</p>
          <form className="form" onSubmit={onSubmit} noValidate>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                aria-invalid={!!fieldErrors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </label>
            <label>
              Password
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                required
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </label>
            {error && !Object.keys(fieldErrors).length && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="auth-switch">
            New here? <Link href="/register">Create an account</Link>
          </p>
          <div className="demo-creds">
            Demo: <strong>user@taskflow.com / User@123</strong>
            <br />
            Admin: <strong>admin@taskflow.com / Admin@123</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(LoginPage), { ssr: false });
