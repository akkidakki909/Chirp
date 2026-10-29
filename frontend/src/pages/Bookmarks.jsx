import { useCallback, useEffect, useState } from 'react';
import PostCard from '../components/Post/PostCard';
import { apiClient } from '../api/client';
import { FiBookmark } from 'react-icons/fi';
import './Bookmarks.css';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setError(''); const response = await apiClient.get('/bookmarks'); setPosts(response.data.bookmarks || []); }
    catch (e) { setError(e.response?.data?.error || 'Could not load bookmarks'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <div className="feed-container page-enter" id="bookmarks-page">
    <div className="page-header"><h1>Bookmarks</h1></div>
    <div className="bm-collections"><button className="bm-collection-chip active"><FiBookmark size={14}/> All Bookmarks <span className="bm-chip-count">{posts.length}</span></button></div>
    {error && <div className="empty-state"><p>{error}</p><button className="btn btn-primary btn-sm" onClick={load}>Retry</button></div>}
    {loading ? <div className="empty-state">Loading bookmarks…</div> : !error && posts.length ? <div className="bm-posts">{posts.map(post => <PostCard key={post.id} post={post} onBookmark={load}/>)}</div> : !error && <div className="empty-state"><div className="empty-state-icon">🔖</div><p className="font-semibold">No bookmarks yet</p><p className="text-sm text-tertiary">Use the bookmark icon on a post to save it here.</p></div>}
  </div>;
}
