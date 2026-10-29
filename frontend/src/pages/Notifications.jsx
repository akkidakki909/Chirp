
import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  FiHeart,
  FiRepeat,
  FiMessageCircle,
  FiUserPlus,
  FiAtSign,
  FiFeather,
} from 'react-icons/fi';
import { apiClient } from '../api/client';
import './Notifications.css';

const icons = {
  like: FiHeart,
  retweet: FiRepeat,
  reply: FiMessageCircle,
  follow: FiUserPlus,
  mention: FiAtSign,
  post: FiFeather,
};

const labels = {
  like: 'liked your post',
  retweet: 'reposted your post',
  reply: 'replied to your post',
  follow: 'followed you',
  mention: 'mentioned you',
  post: 'published a post',
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/notifications');
      setItems(response.data.notifications || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (notification) => {
    if (notification.is_read) return;

    try {
      await apiClient.patch(`/notifications/${notification.id}/read`);
      setItems((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      );
    } catch (e) {
      setError(e.response?.data?.error || 'Could not mark notification as read.');
    }
  };

  const filtered = tab === 'mentions'
    ? items.filter((n) => ['mention', 'reply'].includes(n.type))
    : items;

  return (
    <div className="feed-container page-enter" id="notifications-page">
      <div className="page-header">
        <h1>Notifications</h1>
        <div className="tabs" style={{ marginTop: 'var(--space-sm)', borderBottom: 'none' }}>
          <button
            className={`tab ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            All
          </button>
          <button
            className={`tab ${tab === 'mentions' ? 'active' : ''}`}
            onClick={() => setTab('mentions')}
          >
            Mentions
          </button>
          <button className="tab" onClick={loadNotifications}>
            Refresh
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-danger">{error}</p>}

      {loading ? (
        <p className="text-secondary">Loading notifications…</p>
      ) : (
        <div className="notif-list">
          {!filtered.length ? (
            <div className="empty-state">
              <p className="font-semibold">You're all caught up</p>
              <p className="text-sm text-tertiary">
                Likes, replies, follows, and posts will appear here.
              </p>
            </div>
          ) : filtered.map((n) => {
            const Icon = icons[n.type] || FiAtSign;

            return (
              <button
                type="button"
                key={n.id}
                className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                onClick={async () => {
                  await markRead(n);

                  if (n.tweet_id) {
                    navigate(`/post/${n.tweet_id}`);
                  } else if (n.username) {
                    navigate(`/profile/${encodeURIComponent(n.username)}`);
                  }
                }}
              >
                <span className="notif-icon-wrapper">
                  <Icon size={18} />
                </span>

                <div className="notif-body">
                  <div className="notif-main">
                    {n.avatar_url && (
                      <img
                        src={n.avatar_url}
                        alt=""
                        className="avatar avatar-sm"
                      />
                    )}
                    <div className="notif-text">
                      <strong>{n.display_name || n.username}</strong>{' '}
                      <span className="text-secondary">
                        {labels[n.type] || 'interacted with you'}
                      </span>
                    </div>
                  </div>

                  {n.tweet_content && (
                    <p className="notif-content text-sm text-secondary">
                      {n.tweet_content}
                    </p>
                  )}

                  <span className="notif-time text-xs text-tertiary">
                    {n.created_at
                      ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                      : 'Recently'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
