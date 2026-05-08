import React from 'react';

export default function Chat({
  contacts,
  activeChat,
  setActiveChat,
  loadMessages,
  showAdd,
  setShowAdd,
  addName,
  setAddName,
  addErr,
  setAddErr,
  addContact,
  messages,
  currentUser,
  msgInput,
  setMsgInput,
  sendMessage,
  bottomRef,
  keys,
  s
}) {
  return (
    <div style={s.chatLayout}>
      <div style={s.contactPanel} className="glass">
        <div style={s.contactHeader}>
          <span style={s.contactTitle}>Messages</span>
          <button
            style={s.addCircle}
            onClick={() => {
              setShowAdd((o) => !o);
              setAddErr('');
            }}
          >
            +
          </button>
        </div>
        {showAdd && (
          <div style={s.addBox}>
            <input
              style={s.addInput}
              placeholder="Enter username..."
              value={addName}
              onChange={(e) => setAddName(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === 'Enter' && addContact()}
              autoFocus
            />
            {addErr && <div style={s.addErrBox}>{addErr}</div>}
            <div style={s.rowEnd}>
              <button
                style={s.cancelBtn}
                onClick={() => {
                  setShowAdd(false);
                  setAddErr('');
                  setAddName('');
                }}
              >
                Cancel
              </button>
              <button style={s.primaryBtn} onClick={addContact}>
                Add
              </button>
            </div>
          </div>
        )}
        {contacts.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: 28 }}>💬</div>
            <div style={s.emptyTitle}>No chats</div>
            <div style={s.emptySub}>Tap + to start one</div>
          </div>
        ) : (
          contacts.map((c) => (
            <div
              key={c.uid}
              style={{
                ...s.contactItem,
                ...(activeChat?.uid === c.uid ? s.contactItemActive : {}),
              }}
              onClick={() => {
                setActiveChat(c);
                loadMessages(c);
              }}
            >
              <div style={s.contactAv}>{c.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.contactName}>{c.displayName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  @{c.username}
                </div>
              </div>
              <div style={s.onlineDot} />
            </div>
          ))
        )}
      </div>

      <div style={s.chatWin}>
        {!activeChat ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: 44 }}>🌌</div>
            <div style={s.emptyTitle}>Select a chat</div>
            <div style={s.emptySub}>or tap + to start one</div>
          </div>
        ) : (
          <>
            <div style={s.chatTopBar} className="glass">
              <div style={s.contactAv}>{activeChat.avatar}</div>
              <div>
                <div style={s.chatTopName}>{activeChat.displayName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  🔒 End-to-end encrypted
                </div>
              </div>
              <div style={s.e2eeChip}>E2EE</div>
            </div>
            <div style={s.msgArea}>
              {messages.length === 0 && (
                <div style={s.emptyState}>
                  <div style={{ fontSize: 32 }}>🔐</div>
                  <div style={s.emptyTitle}>Say hello!</div>
                  <div style={s.emptySub}>Messages are encrypted E2E</div>
                </div>
              )}
              {messages.map((m) => {
                const isMe = m.from === currentUser.uid;
                return (
                  <div
                    key={m.id}
                    style={{
                      ...s.msgRow,
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isMe && (
                      <div style={s.msgAv}>{activeChat.avatar}</div>
                    )}
                    <div
                      style={{
                        ...s.bubble,
                        ...(isMe ? s.bubbleMe : s.bubbleThem),
                        background: isMe ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        color: isMe ? '#fff' : '#fff',
                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.55,
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.text}
                      </div>
                      <div style={{...s.msgMeta, color: isMe ? 'rgba(255,255,255,0.6)' : '#94a3b8'}}>
                        <span>
                          {m.createdAt
                            ?.toDate?.()
                            ?.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            }) || ''}
                        </span>
                        {isMe && <span>✓✓</span>}
                        <span>🔒</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div style={s.inputRow} className="glass">
              <input
                style={s.msgInput}
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button style={s.sendBtn} onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
