import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { users as mockUsers, posts as mockPosts } from '../data/mockData';
import PostCard from '../components/Post/PostCard';
import { FiArrowLeft, FiMessageCircle, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import './Profile.css';

const mapPost = (p) => ({
  ...p,
  userId: p.userId ?? p.user_id,
  createdAt: p.createdAt ?? p.created_at,
  likes: p.likes ?? p.likeCount ?? p.like_count ?? 0,
  reposts: p.reposts ?? p.retweetCount ?? p.retweet_count ?? 0,
  comments: p.comments ?? p.replyCount ?? p.reply_count ?? 0,
  images: p.images ?? p.imageUrls ?? p.image_urls ?? [],
  user: p.user || {
    id: p.userId ?? p.user_id,
    username: p.username,
    displayName: p.displayName ?? p.display_name ?? p.username,
    handle: `@${p.username}`,
    avatar: p.avatar ?? p.avatar_url ?? '',
    isVerified: !!(p.isVerified ?? p.is_verified),
  },
});

function mockProfileFor(username) {
  const user = mockUsers.find((u) => u.username?.toLowerCase() === String(username || '').toLowerCase());
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    display_name: user.displayName || user.username,
    avatar_url: user.avatar || '',
    banner_url: user.banner || '',
    bio: user.bio || '',
    followers_count: user.followersCount || 0,
    following_count: user.followingCount || 0,
    is_verified: !!user.isVerified,
    isMockProfile: true,
  };
}

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const target = username || currentUser?.username;
      if (!target) {
        if (alive) setError('Please sign in to view this profile.');
        return;
      }
      setProfile(null);
      setPosts([]);
      setError('');
      try {
        const { data } = await apiClient.get(`/profiles/${encodeURIComponent(target)}`);
        if (!alive) return;
        const loadedProfile = data.user || data.profile || null;
        if (!loadedProfile) throw new Error('Profile response was empty.');
        setProfile(loadedProfile);
        setFollowing(!!(loadedProfile.is_following ?? loadedProfile.isFollowing));
        setPosts((data.posts || []).map(mapPost));
      } catch (e) {
        if (!alive) return;
        // The suggested “Who to follow” list currently includes demo users.
        // If a demo user is not in PostgreSQL, show their local demo profile instead
        // of a misleading “User not found” page. Real database profiles still use the API.
        const status = e.response?.status;
        const message = String(e.response?.data?.error || e.message || '').toLowerCase();
        const isNotFound = status === 404 || message.includes('not found') || message.includes('does not exist');
        const demo = isNotFound ? mockProfileFor(target) : null;
        if (demo) {
          setProfile(demo);
          setFollowing(!!mockUsers.find((u) => u.username === target)?.isFollowing);
          const demoUser = mockUsers.find((u) => u.username === target);
          setPosts(mockPosts.filter((p) => p.userId === demoUser?.id).map(mapPost));
          setError('');
        } else {
          setError(e.response?.data?.error || 'Could not load profile.');
        }
      }
    })();
    return () => { alive = false; };
  }, [username, currentUser?.username]);

  const isOwnProfile = String(profile?.id) === String(currentUser?.id) && !profile?.isMockProfile;
  const toggleFollow = async () => {
    if (!profile || profile.isMockProfile || busy) return;
    setBusy(true);
    try {
      if (following) await apiClient.delete(`/profiles/${profile.id}/follow`);
      else await apiClient.post(`/profiles/${profile.id}/follow`);
      setFollowing(!following);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not update follow status.');
    } finally {
      setBusy(false);
    }
  };

  const displayName = profile?.display_name || profile?.displayName || profile?.username || 'Profile';
  const usernameLabel = profile?.username || '';
  const avatar = profile?.avatar_url || profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(usernameLabel)}`;

  return (
    <div className="feed-container page-enter" id="profile-page">
      <div className="page-header">
        <button className="btn-ghost" onClick={() => navigate(-1)} aria-label="Go back"><FiArrowLeft /></button>
        <h1>{displayName}</h1>
      </div>
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}
      {profile && <section className="profile-summary" style={{ padding: '16px 0' }}>
        {(profile.banner_url || profile.banner) && <img src={profile.banner_url || profile.banner} alt="Profile banner" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 12 }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={avatar} alt={`${displayName}'s avatar`} className="avatar avatar-lg" />
            <div><strong>{displayName}</strong><div className="text-secondary text-sm">@{usernameLabel}</div></div>
          </div>
          {!isOwnProfile && !profile.isMockProfile && <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/messages?user=${profile.id}`)}><FiMessageCircle /> Message</button>
            <button className="btn btn-primary btn-sm" onClick={toggleFollow} disabled={busy}>{following ? <FiUserCheck /> : <FiUserPlus />}{following ? ' Following' : ' Follow'}</button>
          </div>}
          {profile.isMockProfile && <span className="text-secondary text-sm">Demo profile</span>}
        </div>
        {profile.bio && <p style={{ marginTop: 12 }}>{profile.bio}</p>}
        <p className="text-secondary text-sm" style={{ marginTop: 8 }}>{profile.followers_count ?? profile.followersCount ?? 0} followers · {profile.following_count ?? profile.followingCount ?? 0} following</p>
      </section>}
      <div className="tabs"><button className="tab active">Posts</button></div>
      {posts.length ? posts.map((post) => <PostCard key={`${post.id}-${post.createdAt || post.created_at || ''}`} post={post} />) : profile && <div className="empty-state"><div className="empty-state-icon">👤</div><p className="font-semibold">No posts yet</p></div>}
    </div>
  );
}
