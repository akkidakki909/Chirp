import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { users, posts as mockPosts, formatCount } from '../data/mockData';
import PostCard from '../components/Post/PostCard';
import { format } from 'date-fns';
import { FiCalendar, FiMapPin, FiLink, FiArrowLeft } from 'react-icons/fi';
import './Profile.css';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');

  // Find the user: if no username param, show current user's profile
  const profileUser = username
    ? users.find((u) => u.username === username)
    : currentUser;

  if (!profileUser) {
    return (
      <div className="feed-container page-enter">
        <div className="page-header">
          <div className="flex items-center gap-md">
            <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding: '8px', borderRadius: '50%' }}>
              <FiArrowLeft size={20} />
            </button>
            <h1>Profile</h1>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p className="font-semibold">User not found</p>
          <p className="text-sm text-tertiary">This account doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = profileUser.id === currentUser.id;
  const userPosts = mockPosts.filter((p) => p.userId === profileUser.id);
  const likedPosts = mockPosts.filter((p) => p.isLiked);
  const displayPosts = activeTab === 'likes' ? likedPosts : userPosts;
  const joinDate = format(new Date(profileUser.joinedDate), 'MMMM yyyy');

  // Use the full user data from users array for non-current users
  const fullUser = users.find((u) => u.id === profileUser.id) || profileUser;

  return (
    <div className="feed-container page-enter" id="profile-page">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-md">
          <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding: '8px', borderRadius: '50%' }}>
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-lg)', lineHeight: '1.2' }}>{fullUser.displayName}</h1>
            <span className="page-header-sub">{formatCount(fullUser.postsCount || userPosts.length)} posts</span>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="profile-banner">
        <img src={fullUser.banner} alt="Profile banner" className="profile-banner-img" />
      </div>

      {/* Avatar + Actions */}
      <div className="profile-avatar-row">
        <img src={fullUser.avatar} alt={fullUser.displayName} className="avatar avatar-3xl profile-avatar" />
        <div className="profile-actions">
          {isOwnProfile ? (
            <button className="btn btn-secondary">Edit profile</button>
          ) : (
            <button className={`btn ${fullUser.isFollowing ? 'btn-secondary' : 'btn-primary'}`}>
              {fullUser.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="profile-info">
        <div className="profile-name-row">
          <h2 className="profile-display-name font-heading">{fullUser.displayName}</h2>
          {fullUser.isVerified && <span className="verified-badge" title="Verified">✓</span>}
        </div>
        <span className="profile-handle text-secondary">{fullUser.handle}</span>

        {fullUser.bio && <p className="profile-bio">{fullUser.bio}</p>}

        <div className="profile-meta">
          {fullUser.location && (
            <span className="profile-meta-item text-secondary">
              <FiMapPin size={14} /> {fullUser.location}
            </span>
          )}
          {fullUser.website && (
            <a href={`https://${fullUser.website}`} target="_blank" rel="noopener noreferrer" className="profile-meta-item">
              <FiLink size={14} /> {fullUser.website}
            </a>
          )}
          <span className="profile-meta-item text-secondary">
            <FiCalendar size={14} /> Joined {joinDate}
          </span>
        </div>

        <div className="profile-stats">
          <span className="profile-stat">
            <strong>{formatCount(fullUser.followingCount)}</strong>
            <span className="text-secondary">Following</span>
          </span>
          <span className="profile-stat">
            <strong>{formatCount(fullUser.followersCount)}</strong>
            <span className="text-secondary">Followers</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={`tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          Likes
        </button>
      </div>

      {/* Posts */}
      <div className="profile-posts">
        {displayPosts.length > 0 ? (
          displayPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">{activeTab === 'likes' ? '❤️' : '📝'}</div>
            <p className="font-semibold">
              {activeTab === 'likes' ? 'No likes yet' : 'No posts yet'}
            </p>
            <p className="text-sm text-tertiary">
              {activeTab === 'likes'
                ? "Posts this user has liked will show up here."
                : "When they post, it'll show up here."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
