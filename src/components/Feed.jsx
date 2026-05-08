import React from 'react';

export default function Feed({
  userProfile,
  storyPeople,
  setStoryView,
  showNewPost,
  setShowNewPost,
  newPostText,
  setNewPostText,
  submitPost,
  posts,
  toggleLike,
  liked,
  s
}) {
  return (
    <div style={s.feedWrap}>
      <div style={s.storiesRow}>
        {storyPeople.map((u, i) => (
          <div
            key={i}
            style={s.storyItem}
            onClick={() => setStoryView(u)}
          >
            <div
              style={{
                ...s.storyRing,
                borderColor: i === 0 ? 'var(--accent-color)' : '#333',
              }}
            >
              <div style={s.storyAv}>{u?.avatar}</div>
            </div>
            <div style={s.storyLabel}>
              {i === 0 ? 'Your story' : u?.displayName}
            </div>
          </div>
        ))}
      </div>
      <div style={s.hr} />

      {showNewPost ? (
        <div style={s.newPostBox} className="glass-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={s.postAv}>{userProfile?.avatar}</div>
            <span style={{ color: '#888', fontSize: 13 }}>
              {userProfile?.displayName}
            </span>
          </div>
          <textarea
            style={s.newPostTA}
            placeholder="What's on your mind?"
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div style={s.rowEnd}>
            <button
              style={s.cancelBtn}
              onClick={() => setShowNewPost(false)}
            >
              Cancel
            </button>
            <button style={s.primaryBtn} onClick={submitPost}>
              Post
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{ ...s.newPostTrigger, margin: '14px 16px', borderRadius: 12 }}
          onClick={() => setShowNewPost(true)}
          className="glass-card"
        >
          <div style={s.postAv}>{userProfile?.avatar}</div>
          <div style={{ flex: 1, fontSize: 14, color: '#94a3b8' }}>
            What's on your mind?
          </div>
          <span>📸</span>
        </div>
      )}

      {posts.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: 44 }}>📭</div>
          <div style={s.emptyTitle}>No posts yet</div>
          <div style={s.emptySub}>Be the first to post!</div>
        </div>
      ) : (
        posts.map((p) => (
          <div key={p.id} style={{...s.postCard, margin: '14px 16px', borderRadius: 12}} className="fade-in glass-card">
            <div style={s.postTop}>
              <div style={s.postAv}>{p.avatar}</div>
              <div>
                <div style={s.postName}>{p.displayName}</div>
                <div style={s.postTime}>
                  {p.createdAt
                    ?.toDate?.()
                    ?.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) || 'just now'}
                </div>
              </div>
              <div style={s.postDots}>···</div>
            </div>
            <div style={s.postImg}>📸</div>
            <div style={s.postActions}>
              <button style={{...s.actBtn, color: liked[p.id] ? 'var(--accent-color)' : '#888'}} onClick={() => toggleLike(p.id)}>
                {liked[p.id] ? '♥' : '♡'} {p.likes}
              </button>
              <button style={s.actBtn}>💬 {p.comments}</button>
              <button style={s.actBtn}>↗</button>
              <button style={{ ...s.actBtn, marginLeft: 'auto' }}>
                🔖
              </button>
            </div>
            <div style={s.postCaption}>
              <b>{p.displayName}</b> {p.caption}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
