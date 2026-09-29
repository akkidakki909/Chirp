import { FiSearch } from 'react-icons/fi';
import { trending, users } from '../../data/mockData';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RightPanel.css';

export default function RightPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const suggestedUsers = users.filter((u) => !u.isFollowing && u.id !== 1).slice(0, 3);

  return (
    <aside className="right-panel" id="right-panel">
      {/* Search */}
      <div className="rp-search-wrapper">
        <FiSearch className="rp-search-icon" />
        <input
          type="text"
          placeholder="Search Chirp"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-input"
        />
      </div>

      {/* Trending */}
      <div className="rp-card">
        <h2 className="rp-card-title font-heading">Trending</h2>
        {trending.slice(0, 5).map((item) => (
          <div key={item.id} className="rp-trending-item" onClick={() => navigate('/explore')}>
            <span className="rp-trending-category text-sm text-tertiary">{item.category}</span>
            <span className="rp-trending-tag font-semibold">{item.tag}</span>
            <span className="rp-trending-count text-sm text-tertiary">
              {item.postsCount.toLocaleString()} posts
            </span>
          </div>
        ))}
        <button className="rp-show-more" onClick={() => navigate('/explore')}>Show more</button>
      </div>

      {/* Who to Follow */}
      <div className="rp-card">
        <h2 className="rp-card-title font-heading">Who to follow</h2>
        {suggestedUsers.map((user) => (
          <div key={user.id} className="rp-user-item">
            <img src={user.avatar} alt={user.displayName} className="avatar avatar-md" />
            <div className="rp-user-info">
              <span className="rp-user-name font-semibold truncate">{user.displayName}</span>
              <span className="rp-user-handle text-sm text-secondary truncate">{user.handle}</span>
            </div>
            <button className="btn btn-secondary btn-sm">Follow</button>
          </div>
        ))}
        <button className="rp-show-more" onClick={() => navigate('/explore')}>Show more</button>
      </div>

      {/* Footer */}
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
