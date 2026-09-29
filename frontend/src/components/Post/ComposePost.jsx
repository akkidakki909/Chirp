import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiImage, FiBarChart2, FiSmile, FiX } from 'react-icons/fi';
import './ComposePost.css';

export default function ComposePost({ onPost, placeholder = "What's happening?" }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const maxLength = 500;

  const charCount = content.length;
  const charPercent = (charCount / maxLength) * 100;
  const isOverLimit = charCount > maxLength;
  const canPost = content.trim().length > 0 && !isOverLimit;

  const handlePost = () => {
    if (!canPost) return;
    const newPost = {
      id: Date.now(),
      userId: user.id,
      content,
      images,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      reposts: 0,
      bookmarks: 0,
      isLiked: false,
      isReposted: false,
      isBookmarked: false,
      isEdited: false,
      editHistory: [],
      poll: showPollCreator ? {
        id: Date.now(),
        options: pollOptions.filter(o => o.trim()).map((text, i) => ({ id: i + 1, text, votes: 0 })),
        totalVotes: 0,
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        hasVoted: false,
        votedOptionId: null,
      } : null,
    };
    onPost?.(newPost);
    setContent('');
    setImages([]);
    setShowPollCreator(false);
    setPollOptions(['', '']);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="compose-post" id="compose-post">
      <img src={user?.avatar} alt={user?.displayName} className="avatar avatar-lg" />
      <div className="compose-body">
        <textarea
          className="compose-textarea"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          id="compose-textarea"
        />

        {/* Poll Creator */}
        {showPollCreator && (
          <div className="compose-poll animate-slide-down">
            {pollOptions.map((option, i) => (
              <div key={i} className="compose-poll-option">
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={option}
                  onChange={(e) => updatePollOption(i, e.target.value)}
                  className="compose-poll-input"
                />
                {pollOptions.length > 2 && (
                  <button className="compose-poll-remove" onClick={() => removePollOption(i)}>
                    <FiX size={14} />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button className="compose-poll-add" onClick={addPollOption}>
                + Add option
              </button>
            )}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="compose-bottom">
          <div className="compose-tools">
            <button className="compose-tool" title="Add image">
              <FiImage size={18} />
            </button>
            <button
              className={`compose-tool ${showPollCreator ? 'active' : ''}`}
              title="Create poll"
              onClick={() => setShowPollCreator(!showPollCreator)}
            >
              <FiBarChart2 size={18} />
            </button>
            <button className="compose-tool" title="Emoji">
              <FiSmile size={18} />
            </button>
          </div>

          <div className="compose-right">
            {content.length > 0 && (
              <div className="compose-counter">
                <svg className="compose-counter-svg" viewBox="0 0 36 36">
                  <circle
                    className="compose-counter-bg"
                    cx="18" cy="18" r="16"
                    fill="none"
                    strokeWidth="2"
                  />
                  <circle
                    className="compose-counter-fill"
                    cx="18" cy="18" r="16"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray={`${Math.min(charPercent, 100)} 100`}
                    style={{
                      stroke: isOverLimit ? 'var(--color-danger)' : charPercent > 90 ? 'var(--color-warning)' : 'var(--color-primary)'
                    }}
                  />
                </svg>
                {charPercent > 90 && (
                  <span className={`compose-counter-text ${isOverLimit ? 'over' : ''}`}>
                    {maxLength - charCount}
                  </span>
                )}
              </div>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePost}
              disabled={!canPost}
              id="compose-post-btn"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
