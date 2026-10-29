
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p style={{ padding: 24 }}>Checking session…</p>;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: '64px auto', padding: 24 }}>
      <h1 className="font-heading">Welcome back to Chirp</h1>
      <p className="text-secondary">Log in to continue.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            style={{ display: 'block', width: '100%', marginTop: 6, padding: 12 }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ display: 'block', width: '100%', marginTop: 6, padding: 12 }}
          />
        </label>

        {error && <p role="alert" className="text-danger">{error}</p>}

        <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-secondary text-sm" style={{ marginTop: 20 }}>
        New to Chirp? <Link to="/">Continue to home</Link>
      </p>
    </main>
  );
}
