
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

const badgeStyles = {
  pending: { background: '#fff7ed', color: '#9a3412' },
  reviewed: { background: '#eff6ff', color: '#1d4ed8' },
  resolved: { background: '#ecfdf5', color: '#047857' },
  dismissed: { background: '#f3f4f6', color: '#4b5563' },
};

export default function AdminPanel() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = isAdmin || user?.role === 'moderator';

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('reports');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!isStaff) return;

    setLoading(true);
    setError('');

    try {
      const reportsRequest = apiClient.get('/admin/reports', {
        params: { status: 'all' },
      });

      const requests = isAdmin
        ? [reportsRequest, apiClient.get('/admin/users')]
        : [reportsRequest];

      const responses = await Promise.all(requests);

      setReports(Array.isArray(responses[0].data) ? responses[0].data : []);
      if (isAdmin) {
        setUsers(Array.isArray(responses[1].data) ? responses[1].data : []);
      }
    } catch (e) {
      setError(
        e.response?.data?.error ||
        'Could not load admin data. Check your login and backend.'
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isStaff]);

  useEffect(() => {
    if (isStaff) load();
    else setLoading(false);
  }, [isStaff, load]);

  const updateReport = async (id, status) => {
    setError('');
    setNotice('');

    try {
      await apiClient.patch(`/admin/reports/${id}`, { status });
      setNotice(`Report marked ${status}.`);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not update report status.');
    }
  };

  const updateRole = async (id, role) => {
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role });
      setNotice('User role updated.');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not update role.');
    }
  };

  const disableUser = async (id, disabled) => {
    try {
      await apiClient.patch(`/admin/users/${id}/status`, { disabled });
      setNotice(disabled ? 'Account disabled.' : 'Account enabled.');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not update account status.');
    }
  };

  if (authLoading) return <p style={{ padding: 20 }}>Checking session…</p>;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }
  if (!isStaff) {
    return (
      <div className="feed-container" style={{ padding: 20 }}>
        <h1>Access denied</h1>
        <p>Your account does not have permission to access moderation.</p>
      </div>
    );
  }

  const visibleReports = statusFilter === 'all'
    ? reports
    : reports.filter((r) => r.status === statusFilter);

  return (
    <div className="feed-container page-enter" id="admin-panel">
      <div className="page-header">
        <h1>Chirp Admin</h1>
        <p className="text-secondary text-sm">
          {isAdmin ? 'Manage reports and user accounts.' : 'Review and manage reports.'}
        </p>
      </div>

      {error && <p role="alert" style={{ padding: 12, color: '#b91c1c' }}>{error}</p>}
      {notice && <p role="status" style={{ padding: 12, color: '#047857' }}>{notice}</p>}

      <div className="tabs" role="tablist">
        <button
          type="button"
          className={`tab ${tab === 'reports' ? 'active' : ''}`}
          onClick={() => setTab('reports')}
        >
          Reports ({reports.length})
        </button>

        {isAdmin && (
          <button
            type="button"
            className={`tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users ({users.length})
          </button>
        )}

        <button type="button" className="tab" onClick={load}>Refresh</button>
      </div>

      {tab === 'reports' && (
        <div style={{ margin: '16px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', ...STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              className={`tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}
              {status === 'all'
                ? ` (${reports.length})`
                : ` (${reports.filter((r) => r.status === status).length})`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-secondary" style={{ padding: 16 }}>Loading…</p>
      ) : tab === 'reports' ? (
        <div className="admin-list">
          {visibleReports.map((report) => (
            <article
              key={report.id}
              className="post-card post-border"
              style={{ display: 'block', padding: 16, marginBottom: 12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{report.reason || 'Report'}</strong>
                <span
                  style={{
                    ...badgeStyles[report.status || 'pending'],
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {(report.status || 'pending').toUpperCase()}
                </span>
              </div>

              <p className="text-secondary text-sm" style={{ marginTop: 8 }}>
                Reported by: @{report.reporter_username || 'unknown'}
                {' · '}
                {report.created_at
                  ? new Date(report.created_at).toLocaleString()
                  : 'Date unavailable'}
              </p>

              {report.details && (
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{report.details}</p>
              )}

              {report.target_type === 'tweet' && (
                <div style={{ border: '1px solid var(--color-border, #ddd)', borderRadius: 10, padding: 12, margin: '10px 0' }}>
                  <strong>Reported post</strong>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
                    {report.target_tweet_content || '[Post unavailable or deleted]'}
                  </p>
                  {report.target_tweet_author && (
                    <p className="text-secondary text-sm">By @{report.target_tweet_author}</p>
                  )}
                </div>
              )}

              {report.target_type === 'user' && (
                <p className="text-sm">
                  Reported user: @{report.target_username || report.target_user_id || 'unknown'}
                </p>
              )}

              <p className="text-secondary text-sm">
                Target type: {report.target_type || 'unknown'}
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {STATUSES.filter((s) => s !== report.status).map((status) => (
                  <button
                    type="button"
                    key={status}
                    className="btn btn-secondary"
                    onClick={() => updateReport(report.id, status)}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>

              {report.reviewed_at && (
                <p className="text-secondary text-sm" style={{ marginTop: 8 }}>
                  Last reviewed: {new Date(report.reviewed_at).toLocaleString()}
                </p>
              )}
            </article>
          ))}

          {!visibleReports.length && (
            <p className="text-secondary" style={{ padding: 16 }}>No reports in this filter.</p>
          )}
        </div>
      ) : isAdmin ? (
        <div className="admin-list">
          {users.map((account) => (
            <article
              key={account.id}
              className="post-card post-border"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, flexWrap: 'wrap', marginBottom: 10 }}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <strong>{account.displayName || account.username}</strong>
                <p className="text-secondary text-sm">
                  @{account.username} · {account.email}
                </p>
                {account.deletedAt && (
                  <span style={{ color: '#b91c1c' }} className="text-sm">Disabled</span>
                )}
              </div>

              <select
                aria-label={`Role for ${account.username}`}
                value={account.role || 'user'}
                onChange={(e) => updateRole(account.id, e.target.value)}
                disabled={account.id === user?.id}
              >
                <option value="user">user</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => disableUser(account.id, !account.deletedAt)}
                disabled={account.id === user?.id}
              >
                {account.deletedAt ? 'Enable' : 'Disable'}
              </button>
            </article>
          ))}

          {!users.length && (
            <p className="text-secondary" style={{ padding: 16 }}>No users returned.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
