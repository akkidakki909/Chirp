import { FiSearch } from 'react-icons/fi';
import { trending, users } from '../../data/mockData';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RightPanel.css';

export default function RightPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const suggestedUsers = users
    .filter((user) => !user.isFollowing && user.id !== 1)
    .slice(0, 3);

  // Profile.jsx expects the username in /profile/:username.
  // Some mock users only provide a handle such as "@alex".
  const openProfile = (user) => {
    const username = user?.username || user?.handle?.replace(/^@/, '');
    if (username) navigate(`/profile/${encodeURIComponent(username)}`);
  };

  return (
    <aside className="right-panel" id="right-panel">
      <div className="rp-search-wrapper">
        <FiSearch className="rp-search-icon" />
        <input
          type="text"
          placeholder="Search Chirp"
          className="search-input"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          id="search-input"
        />
      </div>

      <div className="rp-card">
        <h2 className="rp-card-title font-heading">Trending</h2>
        {trending.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            className="rp-trending-item"
            onClick={() => navigate('/explore')}
            style={{ width: '100%', border: 0, textAlign: 'left', cursor: 'pointer', background: 'transparent', font: 'inherit' }}
          >
            <span className="rp-trending-category text-sm text-tertiary">{item.category}</span>
            <span className="rp-trending-tag font-semibold">{item.tag}</span>
            <span className="rp-trending-count text-sm text-tertiary">
              {item.postsCount.toLocaleString()} posts
            </span>
          </button>
        ))}
        <button type="button" className="rp-show-more" onClick={() => navigate('/explore')}>
          Show more
        </button>
      </div>

      <div className="rp-card">
        <h2 className="rp-card-title font-heading">Who to follow</h2>
        {suggestedUsers.map((user) => (
          <div key={user.id} className="rp-user-item">
            <button
              type="button"
              onClick={() => openProfile(user)}
              aria-label={`Open ${user.displayName || user.username || user.handle}'s profile`}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
            >
              <img
                src={user.avatar}
                alt={user.displayName || user.username || 'User avatar'}
                className="avatar avatar-md"
              />
            </button>

            <div className="rp-user-info">
              <button
                type="button"
                className="rp-user-name font-semibold truncate"
                onClick={() => openProfile(user)}
                style={{ cursor: 'pointer', background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit' }}
              >
                {user.displayName || user.username || user.handle}
              </button>
              <button
                type="button"
                className="rp-user-handle text-sm text-secondary truncate"
                onClick={() => openProfile(user)}
                style={{ cursor: 'pointer', background: 'none', border: 0, padding: 0, textAlign: 'left' }}
              >
                {user.handle || (user.username ? `@${user.username}` : '')}
              </button>
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openProfile(user)}>
              View
            </button>
          </div>
        ))}
        <button type="button" className="rp-show-more" onClick={() => navigate('/explore')}>
          Show more
        </button>
      </div>

      <div className="rp-footer text-xs text-tertiary">
        <span>Terms of Service</span>
        <span>Privacy Policy</span>
        <span>Cookie Policy</span>
        <span>Accessibility</span>
        <span>© 2026 Chirp, Inc.</span>
      </div>
    </aside>
  );
}
