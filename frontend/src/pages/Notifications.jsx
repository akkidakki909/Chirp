import { useState } from 'react';
import { notifications as mockNotifications, getUserById } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiRepeat, FiMessageCircle, FiUserPlus, FiAtSign } from 'react-icons/fi';
import './Notifications.css';

const notifIcons = {
  like: { icon: FiHeart, color: '#E0466A', bg: 'rgba(224, 70, 106, 0.1)' },
  repost: { icon: FiRepeat, color: 'var(--color-secondary)', bg: 'var(--color-secondary-light)' },
  reply: { icon: FiMessageCircle, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  follow: { icon: FiUserPlus, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  mention: { icon: FiAtSign, color: 'var(--color-warning)', bg: 'rgba(232, 168, 50, 0.1)' },
};

function getNotifText(type) {
  switch (type) {
    case 'like': return 'liked your post';
    case 'repost': return 'reposted your post';
    case 'reply': return 'replied to your post';
    case 'follow': return 'followed you';
    case 'mention': return 'mentioned you';
    default: return '';
  }
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const filteredNotifs = activeTab === 'mentions'
    ? mockNotifications.filter((n) => n.type === 'mention' || n.type === 'reply')
    : mockNotifications;

  return (
    <div className="feed-container page-enter" id="notifications-page">
      {/* Header */}
      <div className="page-header">
        <h1>Notifications</h1>
        <div className="tabs" style={{ marginTop: 'var(--space-sm)', borderBottom: 'none' }}>
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === 'mentions' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentions')}
          >
            Mentions
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="notif-list">
        {filteredNotifs.map((notif) => {
          const fromUser = getUserById(notif.fromUserId);
          if (!fromUser) return null;
          const cfg = notifIcons[notif.type] || notifIcons.like;
          const IconComp = cfg.icon;
          const timeAgo = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true });

          return (
            <div
              key={notif.id}
              className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => notif.postId ? navigate(`/post/${notif.postId}`) : navigate(`/profile/${fromUser.username}`)}
              id={`notif-${notif.id}`}
            >
              <div className="notif-icon-wrapper" style={{ background: cfg.bg }}>
                <IconComp size={18} style={{ color: cfg.color }} />
              </div>
              <div className="notif-body">
                <div className="notif-main">
                  <img src={fromUser.avatar} alt={fromUser.displayName} className="avatar avatar-sm" />
                  <div className="notif-text">
                    <span className="font-semibold">{fromUser.displayName}</span>{' '}
                    <span className="text-secondary">{getNotifText(notif.type)}</span>
                  </div>
                </div>
                {notif.content && (
                  <p className="notif-content text-sm text-secondary">{notif.content}</p>
                )}
                <span className="notif-time text-xs text-tertiary">{timeAgo}</span>
              </div>
              {!notif.isRead && <div className="notif-unread-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
