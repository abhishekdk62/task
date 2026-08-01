'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/auth.service';
import { setCredentials } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useEffect } from 'react';

function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('user@taskflow.com');
  const [password, setPassword] = useState('User@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace('/dashboard');
  }, [hydrated, isAuthenticated, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login({ email, password });
      dispatch(setCredentials(result));
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual" aria-hidden={false}>
        <h1>TaskFlow</h1>
        <p>
          Queue work, process jobs asynchronously, and watch status update in real time —
          built as a production-minded micro SaaS module.
        </p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to manage your automation queue.</p>
          <form className="form" onSubmit={onSubmit}>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
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
