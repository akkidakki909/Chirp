import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trending, users, posts as mockPosts } from '../data/mockData';
import PostCard from '../components/Post/PostCard';
import { FiSearch, FiTrendingUp } from 'react-icons/fi';
import './Explore.css';

const categories = ['All', 'Technology', 'Education', 'Business', 'Lifestyle'];

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTrending = activeCategory === 'All'
    ? trending
    : trending.filter((t) => t.category === activeCategory);

  // Search posts by content
  const searchResults = searchQuery.trim()
    ? mockPosts.filter((p) =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="feed-container page-enter" id="explore-page">
      {/* Header */}
      <div className="page-header">
        <h1>Explore</h1>
      </div>

      {/* Search */}
      <div className="explore-search">
        <FiSearch className="explore-search-icon" />
        <input
          type="text"
          placeholder="Search posts, people, hashtags..."
          className="search-input explore-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="explore-search-input"
        />
      </div>

      {/* Search Results */}
      {searchQuery.trim() ? (
        <div className="explore-results">
          <h2 className="explore-section-title">
            Results for "{searchQuery}" <span className="text-tertiary text-sm">({searchResults.length})</span>
          </h2>
          {searchResults.length > 0 ? (
            searchResults.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="font-semibold">No results found</p>
              <p className="text-sm text-tertiary">Try searching for something else.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Category Tabs */}
          <div className="explore-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`explore-category-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Trending */}
          <div className="explore-trending">
            <h2 className="explore-section-title">
              <FiTrendingUp size={20} />
              Trending
            </h2>
            {filteredTrending.map((item, index) => (
              <div key={item.id} className="explore-trend-item">
                <span className="explore-trend-rank text-tertiary">{index + 1}</span>
                <div className="explore-trend-info">
                  <span className="explore-trend-category text-xs text-tertiary">{item.category}</span>
                  <span className="explore-trend-tag font-semibold">{item.tag}</span>
                  <span className="explore-trend-count text-sm text-tertiary">
                    {item.postsCount.toLocaleString()} posts
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Users */}
          <div className="explore-users">
            <h2 className="explore-section-title">People to follow</h2>
            {users.filter((u) => u.id !== 1).map((user) => {
              const openProfile = () => {
                if (user.username) {
                  navigate(`/profile/${encodeURIComponent(user.username)}`);
                }
              };

              return (
                <div key={user.id} className="explore-user-card">
                  <button
                    type="button"
                    onClick={openProfile}
                    aria-label={`Open ${user.displayName || user.username}'s profile`}
                    style={{ flexShrink: 0, padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
                  >
                    <img src={user.avatar} alt={user.displayName || 'User avatar'} className="avatar avatar-lg" />
                  </button>
                  <div className="explore-user-info">
                    <div className="explore-user-top">
                      <button
                        type="button"
                        className="font-semibold"
                        onClick={openProfile}
                        style={{ padding: 0, border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                      >
                        {user.displayName || user.username}
                      </button>
                      {user.isVerified && <span className="verified-badge" title="Verified">✓</span>}
                    </div>
                    <button
                      type="button"
                      className="text-sm text-secondary"
                      onClick={openProfile}
                      style={{ display: 'block', padding: 0, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {user.handle || (user.username ? `@${user.username}` : '')}
                    </button>
                    <p className="text-sm text-secondary explore-user-bio">{user.bio}</p>
                  </div>
                  <button
                    type="button"
                    className={`btn ${user.isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    onClick={openProfile}
                    aria-label={`View ${user.displayName || user.username}'s profile`}
                  >
                    View profile
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
