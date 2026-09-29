import { useState } from 'react';
import { posts as mockPosts } from '../data/mockData';
import ComposePost from '../components/Post/ComposePost';
import PostCard from '../components/Post/PostCard';
import './HomeFeed.css';

export default function HomeFeed() {
  const [activeTab, setActiveTab] = useState('foryou');
  const [feedPosts, setFeedPosts] = useState(mockPosts);

  const handleNewPost = (newPost) => {
    setFeedPosts([newPost, ...feedPosts]);
  };

  const handleDelete = (postId) => {
    setFeedPosts(feedPosts.filter((p) => p.id !== postId));
  };

  // "Following" tab shows posts from users the current user follows (userId 2, 3, 5)
  const followingIds = [2, 3, 5];
  const displayPosts = activeTab === 'following'
    ? feedPosts.filter((p) => followingIds.includes(p.userId))
    : feedPosts;

  return (
    <div className="feed-container page-enter" id="home-feed">
      {/* Header */}
      <div className="page-header">
        <h1>Home</h1>
        <div className="tabs home-tabs">
          <button
            className={`tab ${activeTab === 'foryou' ? 'active' : ''}`}
            onClick={() => setActiveTab('foryou')}
            id="tab-foryou"
          >
            For you
          </button>
          <button
            className={`tab ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
            id="tab-following"
          >
            Following
          </button>
        </div>
      </div>

      {/* Compose */}
      <ComposePost onPost={handleNewPost} />

      {/* Feed */}
      <div className="home-feed-list">
        {displayPosts.length > 0 ? (
          displayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="font-semibold">No posts yet</p>
            <p className="text-sm text-tertiary">When people you follow post, it'll show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
