import React from 'react';

export default function Profile({
  userProfile,
  posts,
  currentUser,
  contacts,
  keys,
  theme,
  setTheme,
  accent,
  setAccent,
  logout,
  s
}) {
  return (
    <div style={s.profileWrap}>
      <div style={s.profileHero} className="glass-card">
        <div style={s.profileBigAv}>{userProfile?.avatar}</div>
        <div style={s.profileBigName}>{userProfile?.displayName}</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          @{userProfile?.username}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          {userProfile?.bio}
        </div>
        <div style={s.profileStats}>
          {[
            [
              posts.filter((p) => p.uid === currentUser?.uid).length,
              'Posts',
            ],
            [contacts.length, 'Contacts'],
          ].map(([n, l]) => (
            <div key={l} style={s.profileStat}>
              <div style={s.profileStatN}>{n}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.encCard} className="glass-card">
        <div style={s.encCardTitle}>🎨 Customization</div>
        <div style={s.encCardRow}>
          <span style={{ color: '#94a3b8' }}>Theme</span>
          <select
            style={{ ...s.authInput, width: 'auto', padding: '4px 8px', background: 'rgba(0,0,0,0.3)' }}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="cosmic">Cosmic (Default)</option>
            <option value="nebula">Nebula (Pink)</option>
            <option value="nova">Nova (Amber)</option>
          </select>
        </div>
        <div style={s.encCardRow}>
          <span style={{ color: '#94a3b8' }}>Accent Color</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={s.encCard} className="glass-card">
        <div style={s.encCardTitle}>🔑 Encryption Details</div>
        {[
          ['Algorithm', 'RSA-OAEP'],
          ['Key Size', '2048-bit'],
          ['Hash', 'SHA-256'],
          ['Private Key', 'On this device only'],
          ['Firebase', 'cosmic-b78cc'],
          ['Status', keys ? '✓ Active' : 'Generating...'],
        ].map(([k, v]) => (
          <div key={k} style={s.encCardRow}>
            <span style={{ color: '#94a3b8' }}>{k}</span>
            <span style={{ color: '#fff' }}>{v}</span>
          </div>
        ))}
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            marginTop: 8,
            lineHeight: 1.7,
          }}
        >
          Your private key is generated locally and never leaves your
          device. Even COSMIC cannot read your messages.
        </div>
      </div>

      <button style={s.logoutBtnLg} onClick={logout} className="glass-card">
        Log out
      </button>
    </div>
  );
}
