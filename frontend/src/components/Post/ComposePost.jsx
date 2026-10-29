import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

import {
  FiImage,
  FiBarChart2,
  FiSmile,
  FiX,
} from 'react-icons/fi';

import './ComposePost.css';

export default function ComposePost({
  onPost,
  placeholder = "What's happening?",
}) {
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiGroups = [
    { name: 'Smileys', items: '😀 😃 😄 😁 😆 😅 😂 🙂 🙃 🫠 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 🥲 😋 😛 😜 🤪 😝 🤗 🤭 🫢 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐'.split(' ') },
    { name: 'Gestures', items: '👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🙏 ✍️ 💪 🦾 🫵'.split(' ') },
    { name: 'Hearts', items: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 🩷 🩵 🩶 💔 ❤️‍🔥 ❤️‍🩹 💕 💞 💓 💗 💖 💘 💝 💟 ❣️ 💌'.split(' ') },
    { name: 'Nature', items: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐬 🐳 🦖 🌵 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🌷 🌹 🌻 🌼 🌸 💐 🍁 🍂 🍃'.split(' ') },
    { name: 'Food', items: '🍎 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🍆 🥦 🥕 🌽 🌶️ 🥒 🥬 🥔 🍠 🥐 🍞 🧀 🍕 🍔 🍟 🌭 🌮 🌯 🥗 🍝 🍜 🍣 🍩 🍪 🎂 🍰 🍫 🍿 ☕ 🧋'.split(' ') },
    { name: 'Activities', items: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🎱 🏓 🏸 🥊 🥋 🏆 🥇 🥈 🥉 🎮 🎯 🎲 🎸 🎹 🎧 🎤 🎬 🎨 🧩 🚀 ✈️ 🚗 🚲 🏕️ 🌈 ☀️ 🌙 ⭐ 🌟 ✨ ⚡ 🔥 💯 🎉 🎊 🎈 🎁 🪄 💡 📚 💻 📱'.split(' ') },
    { name: 'Symbols', items: '✅ ☑️ ✔️ ❌ ❎ ➕ ➖ ➗ 💲 ♻️ ⚠️ 🚫 ⛔ 🔞 🔔 🔕 📣 💬 💭 🗯️ 💢 💥 💫 💤 🔥 💦 💨 🕊️ 🏳️‍🌈 🏳️‍⚧️'.split(' ') },
  ];
  const [showPollCreator, setShowPollCreator] = useState(false);

  const [pollOptions, setPollOptions] = useState([
    '',
    '',
  ]);

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const maxLength = 280;

  const charCount = content.length;
  const charPercent = (charCount / maxLength) * 100;

  const isOverLimit = charCount > maxLength;

  const canPost =
    content.trim().length > 0 &&
    !isOverLimit &&
    !posting;

  const handlePost = async () => {
    if (!canPost) return;

    setPosting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      images.forEach((file) => formData.append('images', file));
      const response = await apiClient.post('/tweets', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      /*
       * Backend returns the newly created tweet.
       * Convert it into the structure expected by PostCard.
       */
      const tweet = response.data;

      const newPost = {
        ...tweet,

        userId: tweet.userId || user?.id,

        likes: tweet.likes ?? tweet.likeCount ?? 0,
        reposts: tweet.reposts ?? tweet.retweetCount ?? 0,
        comments: tweet.comments ?? tweet.replyCount ?? 0,

        createdAt:
          tweet.createdAt ||
          new Date().toISOString(),

        isLiked: false,
        isReposted: false,
        isBookmarked: false,
        isEdited: false,

        images: (tweet.imageUrls || []).map((url) => url.startsWith('http') ? url : `http://localhost:5000${url}`),
        poll: null,
        editHistory: [],

        author: tweet.author || tweet.user || {
          id: user?.id,
          username: user?.username,
          displayName: user?.displayName,
          handle:
            user?.handle ||
            `@${user?.username}`,
          avatar: user?.avatar,
          isVerified: user?.isVerified,
        },
      };

      /*
       * IMPORTANT:
       * This immediately updates HomeFeed.jsx,
       * so the newly created post appears without
       * manually refreshing the browser.
       */
      onPost?.(newPost);

      // Clear composer
      setContent('');
      setImages([]);
      setShowPollCreator(false);
      setPollOptions(['', '']);
    } catch (err) {
      console.error('Post creation failed:', err);

      setError(
        err.response?.data?.error ||
          'Failed to create post. Please try again.'
      );
    } finally {
      setPosting(false);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([
        ...pollOptions,
        '',
      ]);
    }
  };

  const updatePollOption = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(
        pollOptions.filter(
          (_, i) => i !== index
        )
      );
    }
  };

  return (
    <div
      className="compose-post"
      id="compose-post"
    >
      <img
        src={user?.avatar}
        alt={user?.displayName || 'User'}
        className="avatar avatar-lg"
      />

      <div className="compose-body">

        {/* Text input */}
        <textarea
          ref={textareaRef}
          className="compose-textarea"
          placeholder={placeholder}
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          rows={3}
          id="compose-textarea"
        />

        {/* Error */}
        {error && (
          <div
            style={{
              color: 'var(--color-danger)',
              fontSize: '13px',
              marginTop: '8px',
            }}
          >
            {error}
          </div>
        )}

        {images.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0' }}>
          {images.map((file, index) => <div key={`${file.name}-${index}`} style={{ position: 'relative' }}>
            <img src={URL.createObjectURL(file)} alt={file.name} style={{ width: 92, height: 76, objectFit: 'cover', borderRadius: 10 }} />
            <button type="button" aria-label="Remove image" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))} style={{ position: 'absolute', top: 3, right: 3, borderRadius: '50%', border: 0, cursor: 'pointer' }}><FiX size={14} /></button>
          </div>)}
          <small style={{ width: '100%', color: 'var(--color-text-tertiary)' }}>{images.length}/4 images · 5 MB max each</small>
        </div>}

        {showEmojiPicker && <div className="compose-emoji-picker" style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 10, margin: '8px 0', maxHeight: 220, overflowY: 'auto' }}>
          {emojiGroups.map((group) => <div key={group.name} style={{ marginBottom: 8 }}><div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{group.name}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{group.items.map((emoji, i) => <button key={`${group.name}-${i}`} type="button" title={emoji} onClick={() => { const el = textareaRef.current; const start = el?.selectionStart ?? content.length; const end = el?.selectionEnd ?? content.length; const next = content.slice(0,start)+emoji+content.slice(end); setContent(next); requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start+emoji.length,start+emoji.length); }); }} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 21, padding: 3, borderRadius: 5 }}>{emoji}</button>)}</div></div>)}
        </div>}

        {/* Poll Creator */}
        {showPollCreator && (
          <div className="compose-poll animate-slide-down">

            {pollOptions.map((option, i) => (
              <div
                key={i}
                className="compose-poll-option"
              >
                <input
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  value={option}
                  onChange={(e) =>
                    updatePollOption(
                      i,
                      e.target.value
                    )
                  }
                  className="compose-poll-input"
                />

                {pollOptions.length > 2 && (
                  <button
                    className="compose-poll-remove"
                    onClick={() =>
                      removePollOption(i)
                    }
                    type="button"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            ))}

            {pollOptions.length < 4 && (
              <button
                className="compose-poll-add"
                onClick={addPollOption}
                type="button"
              >
                + Add option
              </button>
            )}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="compose-bottom">

          <div className="compose-tools">

            <button className="compose-tool" title="Add images from your device" type="button" onClick={() => fileInputRef.current?.click()}>
              <FiImage size={18} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              const valid = selected.filter((file) => file.size <= 5 * 1024 * 1024).slice(0, Math.max(0, 4 - images.length));
              if (selected.some((file) => file.size > 5 * 1024 * 1024)) setError('Each image must be 5 MB or smaller.');
              else setError('');
              setImages((prev) => [...prev, ...valid].slice(0, 4));
              e.target.value = '';
            }} />

            <button
              className={`compose-tool ${
                showPollCreator
                  ? 'active'
                  : ''
              }`}
              title="Create poll"
              onClick={() =>
                setShowPollCreator(
                  !showPollCreator
                )
              }
              type="button"
            >
              <FiBarChart2 size={18} />
            </button>

            <button className={`compose-tool ${showEmojiPicker ? 'active' : ''}`} title="Choose emoji" type="button" onClick={() => setShowEmojiPicker((v) => !v)}>
              <FiSmile size={18} />
            </button>

          </div>

          <div className="compose-right">

            {/* Character counter */}
            {content.length > 0 && (
              <div className="compose-counter">

                <svg
                  className="compose-counter-svg"
                  viewBox="0 0 36 36"
                >
                  <circle
                    className="compose-counter-bg"
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    strokeWidth="2"
                  />

                  <circle
                    className="compose-counter-fill"
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray={`${
                      Math.min(
                        charPercent,
                        100
                      )
                    } 100`}
                    style={{
                      stroke:
                        isOverLimit
                          ? 'var(--color-danger)'
                          : charPercent > 90
                          ? 'var(--color-warning)'
                          : 'var(--color-primary)',
                    }}
                  />
                </svg>

                {charPercent > 90 && (
                  <span
                    className={`compose-counter-text ${
                      isOverLimit
                        ? 'over'
                        : ''
                    }`}
                  >
                    {maxLength - charCount}
                  </span>
                )}

              </div>
            )}

            {/* Post button */}
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePost}
              disabled={!canPost}
              id="compose-post-btn"
              type="button"
            >
              {posting
                ? 'Posting...'
                : 'Post'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}