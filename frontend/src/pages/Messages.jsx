import { useState } from 'react';
import { conversations, getUserById } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiArrowLeft, FiEdit } from 'react-icons/fi';
import './Messages.css';

export default function Messages() {
  const { user: currentUser } = useAuth();
  const [activeConvo, setActiveConvo] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [convoData, setConvoData] = useState(conversations);

  const handleSend = () => {
    if (!messageText.trim() || !activeConvo) return;
    const newMsg = {
      id: Date.now(),
      senderId: currentUser.id,
      content: messageText.trim(),
      createdAt: new Date().toISOString(),
    };
    setConvoData((prev) =>
      prev.map((c) =>
        c.id === activeConvo.id
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: messageText.trim(),
              lastMessageAt: new Date().toISOString(),
            }
          : c
      )
    );
    setActiveConvo((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
    setMessageText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Conversation List View
  if (!activeConvo) {
    return (
      <div className="feed-container page-enter" id="messages-page">
        <div className="page-header">
          <div className="flex items-center justify-between w-full">
            <h1>Messages</h1>
            <button className="btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
              <FiEdit size={18} />
            </button>
          </div>
        </div>

        <div className="msg-list">
          {convoData.map((convo) => {
            const participant = getUserById(convo.participantId);
            if (!participant) return null;
            const timeAgo = formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: false });

            return (
              <div
                key={convo.id}
                className="msg-convo-item"
                onClick={() => setActiveConvo(convo)}
                id={`convo-${convo.id}`}
              >
                <div className="relative">
                  <img src={participant.avatar} alt={participant.displayName} className="avatar avatar-lg" />
                  {convo.unreadCount > 0 && <div className="online-indicator" />}
                </div>
                <div className="msg-convo-info">
                  <div className="msg-convo-top">
                    <span className="font-semibold">{participant.displayName}</span>
                    <span className="text-sm text-tertiary msg-convo-handle">{participant.handle}</span>
                    <span className="text-tertiary">·</span>
                    <span className="text-sm text-tertiary">{timeAgo}</span>
                  </div>
                  <p className={`msg-convo-last text-sm ${convo.unreadCount > 0 ? 'font-semibold' : 'text-secondary'}`}>
                    {convo.lastMessage}
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <span className="msg-unread-badge">{convo.unreadCount}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Message Thread View
  const participant = getUserById(activeConvo.participantId);
  const currentMessages = convoData.find((c) => c.id === activeConvo.id)?.messages || activeConvo.messages;

  return (
    <div className="feed-container page-enter" id="message-thread">
      <div className="page-header">
        <div className="flex items-center gap-md">
          <button
            className="btn-ghost"
            style={{ padding: '8px', borderRadius: '50%' }}
            onClick={() => setActiveConvo(null)}
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-sm">
            <img src={participant?.avatar} alt={participant?.displayName} className="avatar avatar-sm" />
            <div>
              <span className="font-semibold text-sm">{participant?.displayName}</span>
              <span className="text-xs text-tertiary" style={{ display: 'block' }}>{participant?.handle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="msg-thread">
        {currentMessages.map((msg) => {
          const isMine = msg.senderId === currentUser.id;
          const timeAgo = formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true });

          return (
            <div key={msg.id} className={`msg-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
              <div className={`msg-bubble ${isMine ? 'mine' : 'theirs'}`}>
                <p>{msg.content}</p>
              </div>
              <span className="msg-time text-xs text-tertiary">{timeAgo}</span>
            </div>
          );
        })}
      </div>

      {/* Compose */}
      <div className="msg-compose">
        <input
          type="text"
          placeholder="Start a new message"
          className="msg-compose-input"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          id="msg-compose-input"
        />
        <button
          className="msg-send-btn"
          onClick={handleSend}
          disabled={!messageText.trim()}
          id="msg-send-btn"
        >
          <FiSend size={18} />
        </button>
      </div>
    </div>
  );
}
