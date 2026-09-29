import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { posts as mockPosts, getCommentsByPost, getUserById } from '../data/mockData';
import PostCard from '../components/Post/PostCard';
import ComposePost from '../components/Post/ComposePost';
import { formatDistanceToNow } from 'date-fns';
import './PostDetail.css';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const postId = Number(id);

  const post = mockPosts.find((p) => p.id === postId);
  const [commentsList, setCommentsList] = useState(() => getCommentsByPost(postId));

  if (!post) {
    return (
      <div className="feed-container page-enter">
        <div className="page-header">
          <button className="back-btn btn-ghost" onClick={() => navigate(-1)}>
            <FiArrowLeft size={20} />
          </button>
          <h1>Post</h1>
        </div>
        <div className="empty-state">
          <p className="font-semibold">Post not found</p>
        </div>
      </div>
    );
  }

  const handleReply = (newPost) => {
    const newComment = {
      id: Date.now(),
      postId,
      userId: newPost.userId,
      content: newPost.content,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    setCommentsList([newComment, ...commentsList]);
  };

  return (
    <div className="feed-container page-enter" id="post-detail">
      <div className="page-header">
        <button className="back-btn btn-ghost" onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
        </button>
        <h1>Post</h1>
      </div>

      <PostCard post={post} />

      <div className="reply-composer-section">
        <ComposePost
          onPost={handleReply}
          placeholder="Post your reply"
        />
      </div>

      <div className="replies-list">
        {commentsList.map((c) => {
          const commentUser = getUserById(c.userId);
          if (!commentUser) return null;
          const timeAgo = formatDistanceToNow(new Date(c.createdAt), { addSuffix: true });
          return (
            <div key={c.id} className="reply-card post-border">
              <img src={commentUser.avatar} alt={commentUser.displayName} className="avatar avatar-md" />
              <div className="reply-body">
                <div className="reply-header">
                  <span className="font-semibold">{commentUser.displayName}</span>
                  <span className="text-secondary">{commentUser.handle}</span>
                  <span className="text-tertiary">·</span>
                  <span className="text-tertiary text-sm">{timeAgo}</span>
                </div>
                <p className="reply-content">{c.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
