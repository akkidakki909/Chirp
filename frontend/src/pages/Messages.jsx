import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { FiSend, FiArrowLeft, FiEdit } from 'react-icons/fi';
import './Messages.css';

const mapConversation = (c) => ({
  userId: c.userId ?? c.participant_id ?? c.participantId,
  username: c.username ?? c.participant?.username ?? 'user',
  displayName: c.displayName ?? c.display_name ?? c.participant?.display_name ?? c.username ?? 'User',
  avatar: c.avatar_url ?? c.avatar ?? '',
  lastMessage: c.lastMessage ?? c.last_message ?? '',
  lastMessageAt: c.lastMessageAt ?? c.last_message_at ?? null,
  unreadCount: Number(c.unreadCount ?? c.unread_count ?? 0),
});
const mapMessage = (m) => ({ ...m, senderId: m.senderId ?? m.sender_id, recipientId: m.recipientId ?? m.recipient_id, createdAt: m.createdAt ?? m.created_at });

export default function Messages() {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadConversations = async () => {
    try {
      const { data } = await apiClient.get('/messages/conversations');
      setConversations((data.conversations || []).map(mapConversation));
      setError('');
    } catch (e) {
      console.error('Load conversations failed:', e.response?.data || e.message);
      setError(e.response?.data?.error || 'Could not load conversations. Check that the backend and direct_messages migration are running.');
    }
  };
  useEffect(() => { loadConversations(); }, []);

  const openThread = async (convo) => {
    setActive(convo); setMessages([]); setError('');
    try {
      const { data } = await apiClient.get(`/messages/with/${convo.userId}`);
      setMessages((data.messages || []).map(mapMessage));
      if (data.participant) setActive({ ...convo, username: data.participant.username, displayName: data.participant.display_name || data.participant.displayName || convo.displayName });
      await loadConversations();
    } catch (e) {
      console.error('Load message thread failed:', e.response?.data || e.message);
      setError(e.response?.data?.error || 'Could not load this conversation.');
    }
  };

  const startConversation = async () => {
    const username = window.prompt('Enter the exact username (without @):');
    if (!username?.trim()) return;
    try {
      const { data } = await apiClient.get(`/profiles/${encodeURIComponent(username.trim().replace(/^@/, ''))}`);
      const u = data.user;
      if (!u?.id) { window.alert('No user found with that username.'); return; }
      await openThread(mapConversation({ userId: u.id, username: u.username, displayName: u.display_name || u.displayName }));
    } catch (e) { window.alert(e.response?.data?.error || 'Could not find user.'); }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !active || busy) return;
    setBusy(true); setError('');
    try {
      const { data } = await apiClient.post(`/messages/with/${active.userId}`, { content: messageText.trim() });
      const sent = data.message || data;
      setMessages((prev) => [...prev, mapMessage(sent)]); setMessageText(''); await loadConversations();
    } catch (e) {
      console.error('Send message failed:', e.response?.data || e.message);
      setError(e.response?.data?.error || 'Message could not be sent.');
    } finally { setBusy(false); }
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  if (!active) return <div className="feed-container page-enter" id="messages-page"><div className="page-header"><div className="flex items-center justify-between w-full"><h1>Messages</h1><button className="btn-ghost" onClick={startConversation} title="New message" style={{ padding: '8px', borderRadius: '50%' }}><FiEdit size={18} /></button></div></div>
    {error && <p className="text-danger text-sm" role="alert">{error}</p>}
    <div className="msg-list">{conversations.map((convo) => <div key={convo.userId} className="msg-convo-item" role="button" tabIndex={0} onClick={() => openThread(convo)} onKeyDown={(e) => { if (e.key === 'Enter') openThread(convo); }}><div className="msg-convo-info"><div className="msg-convo-top"><span className="font-semibold">{convo.displayName || convo.username}</span><span className="text-sm text-tertiary msg-convo-handle">@{convo.username}</span><span className="text-tertiary">·</span><span className="text-sm text-tertiary">{convo.lastMessageAt ? formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true }) : ''}</span></div><p className={`msg-convo-last text-sm ${convo.unreadCount > 0 ? 'font-semibold' : 'text-secondary'}`}>{convo.lastMessage || 'Start a conversation'}</p></div>{convo.unreadCount > 0 && <span className="msg-unread-badge">{convo.unreadCount}</span>}</div>)}</div>
    {!conversations.length && !error && <p className="text-secondary text-sm">No conversations yet. Use the pencil icon to start one.</p>}
  </div>;

  return <div className="feed-container page-enter" id="message-thread"><div className="page-header"><div className="flex items-center gap-md"><button className="btn-ghost" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => { setActive(null); loadConversations(); }}><FiArrowLeft size={20} /></button><div><span className="font-semibold text-sm">{active.displayName || active.username}</span><span className="text-xs text-tertiary" style={{ display: 'block' }}>@{active.username}</span></div></div></div>
    {error && <p className="text-danger text-sm" role="alert">{error}</p>}
    <div className="msg-thread">{messages.map((msg) => { const mine = String(msg.senderId) === String(currentUser?.id); return <div key={msg.id} className={`msg-bubble-wrapper ${mine ? 'mine' : 'theirs'}`}><div className={`msg-bubble ${mine ? 'mine' : 'theirs'}`}><p>{msg.content}</p></div><span className="msg-time text-xs text-tertiary">{msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'Just now'}</span></div>; })}</div>
    <div className="msg-compose"><input type="text" placeholder="Write a message…" className="msg-compose-input" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={handleKeyDown} /><button className="msg-send-btn" onClick={handleSend} disabled={!messageText.trim() || busy}><FiSend size={18} /></button></div>
  </div>;
}
