import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import Feed from './components/Feed';
import Chat from './components/Chat';
import Profile from './components/Profile';
import F1Landing from './components/F1Landing';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Firebase Config ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyAvXzHmXGZWveePRitxrlWlwgpInX-YT2I',
  authDomain: 'cosmic-b78cc.firebaseapp.com',
  projectId: 'cosmic-b78cc',
  storageBucket: 'cosmic-b78cc.firebasestorage.app',
  messagingSenderId: '673894072759',
  appId: '1:673894072759:web:9af1d4e59d502f65e06832',
  measurementId: 'G-YZ7WBY9Y9L',
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ── E2EE ─────────────────────────────────────────────────────────────────────
const DB_NAME = 'CosmicKeys';
const STORE_NAME = 'keys';

async function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePrivateKey(uid, key) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(key, uid);
  return new Promise((resolve) => (tx.oncomplete = resolve));
}

async function getPrivateKey(uid) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const request = tx.objectStore(STORE_NAME).get(uid);
  return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)));
}

async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey('spki', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function importPublicKey(spkiB64) {
  const binaryDerString = atob(spkiB64);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptMsg(pubKey, text) {
  const buf = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKey,
    new TextEncoder().encode(text)
  );
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function decryptMsg(privKey, b64) {
  try {
    const binaryString = atob(b64);
    const buf = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) buf[i] = binaryString.charCodeAt(i);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privKey,
      buf
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return '[Decryption Error: Key mismatch or corrupted message]';
  }
}

function roomKey(a, b) {
  return [a, b].sort().join('_');
}

// ── Components ───────────────────────────────────────────────────────────────
function Starfield() {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    const s = [];
    for (let i = 0; i < 150; i++) {
      s.push({
        id: i,
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        size: Math.random() * 2 + 1 + 'px',
        delay: Math.random() * 5 + 's',
        duration: Math.random() * 3 + 2 + 's',
      });
    }
    setStars(s);
  }, []);

  return (
    <div className="starfield">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function CosmicApp() {
  const [page, setPage] = useState('landing');
  const [authTab, setAuthTab] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });
  const [authErr, setAuthErr] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [keys, setKeys] = useState(null);
  const [tab, setTab] = useState('feed');
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [liked, setLiked] = useState({});
  const [newPostText, setNewPostText] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [addName, setAddName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addErr, setAddErr] = useState('');
  const [storyView, setStoryView] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('cosmic-theme') || 'cosmic');
  const [accent, setAccent] = useState(localStorage.getItem('cosmic-accent') || '#7c3aed');
  const bottomRef = useRef(null);
  const unsubMsgs = useRef(null);
  const unsubPosts = useRef(null);

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cosmic-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accent);
    localStorage.setItem('cosmic-accent', accent);
  }, [accent]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          setUserProfile(profile);
          // Handle E2EE Keys
          let priv = await getPrivateKey(user.uid);
          if (!priv) {
            const kp = await generateKeyPair();
            await savePrivateKey(user.uid, kp.privateKey);
            priv = kp.privateKey;
            const pubB64 = await exportPublicKey(kp.publicKey);
            await setDoc(doc(db, 'users', user.uid), { publicKey: pubB64 }, { merge: true });
          }
          setKeys(priv);
        }
        setPage('app');
        loadPosts();
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setPage('landing');
      }
      setAppLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load posts realtime ───────────────────────────────────────────────────
  const loadPosts = () => {
    if (unsubPosts.current) unsubPosts.current();
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    unsubPosts.current = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  };

  // ── Load messages realtime ────────────────────────────────────────────────
  const loadMessages = (contact) => {
    if (unsubMsgs.current) unsubMsgs.current();
    const room = roomKey(currentUser.uid, contact.uid);
    const q = query(
      collection(db, 'chats', room, 'messages'),
      orderBy('createdAt', 'asc')
    );
    unsubMsgs.current = onSnapshot(q, async (snap) => {
      const msgs = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          let text = '[Encrypted Message]';
          if (data.from === currentUser.uid) {
            text = '[You sent an encrypted message]';
          } else if (keys) {
            text = await decryptMsg(keys, data.encrypted);
          }
          return { id: d.id, ...data, text };
        })
      );
      setMessages(msgs);
    });
  };

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = async () => {
    const { email, password, username, displayName } = form;
    if (!email || !password || !username || !displayName) {
      setAuthErr('All fields required');
      return;
    }
    if (password.length < 6) {
      setAuthErr('Password must be 6+ characters');
      return;
    }
    if (username.length < 3) {
      setAuthErr('Username must be 3+ characters');
      return;
    }
    setAuthLoading(true);
    setAuthErr('');
    try {
      // Check username taken
      const uSnap = await getDocs(
        query(
          collection(db, 'usernames'),
          where('username', '==', username.toLowerCase())
        )
      );
      if (!uSnap.empty) {
        setAuthErr('Username already taken');
        setAuthLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      const kp = await generateKeyPair();
      const pubB64 = await exportPublicKey(kp.publicKey);
      await savePrivateKey(cred.user.uid, kp.privateKey);

      const profile = {
        uid: cred.user.uid,
        email,
        username: username.toLowerCase(),
        displayName,
        bio: "Hey, I'm on COSMIC 🌌",
        avatar: displayName[0].toUpperCase(),
        publicKey: pubB64,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: cred.user.uid,
        username: username.toLowerCase(),
      });
      setUserProfile(profile);
    } catch (e) {
      setAuthErr(e.message.replace('Firebase: ', '').replace(/\(auth.*\)/, ''));
    }
    setAuthLoading(false);
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async () => {
    const { email, password } = form;
    if (!email || !password) {
      setAuthErr('Fill in all fields');
      return;
    }
    setAuthLoading(true);
    setAuthErr('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setAuthErr('Wrong email or password');
    }
    setAuthLoading(false);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (unsubMsgs.current) unsubMsgs.current();
    if (unsubPosts.current) unsubPosts.current();
    await signOut(auth);
    setContacts([]);
    setActiveChat(null);
    setMessages([]);
    setPosts([]);
    setLiked({});
    setTab('feed');
  };

  // ── Add Contact ───────────────────────────────────────────────────────────
  const addContact = async () => {
    const name = addName.trim().toLowerCase();
    if (!name) return;
    if (name === userProfile?.username) {
      setAddErr("That's you!");
      return;
    }
    if (contacts.find((c) => c.username === name)) {
      setAddErr('Already added');
      return;
    }
    try {
      const uSnap = await getDocs(
        query(collection(db, 'usernames'), where('username', '==', name))
      );
      if (uSnap.empty) {
        setAddErr('User not found — they must sign up first');
        return;
      }
      const uid = uSnap.docs[0].data().uid;
      const profileSnap = await getDoc(doc(db, 'users', uid));
      if (!profileSnap.exists()) {
        setAddErr('User not found');
        return;
      }
      const contact = { uid, ...profileSnap.data() };
      setContacts((prev) => [...prev, contact]);
      setActiveChat(contact);
      loadMessages(contact);
      setTab('chat');
      setAddName('');
      setShowAdd(false);
      setAddErr('');
    } catch (e) {
      setAddErr('Error finding user');
    }
  };

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!msgInput.trim() || !keys || !activeChat) return;
    const text = msgInput.trim();
    setMsgInput('');

    try {
      const recipientPubKey = await importPublicKey(activeChat.publicKey);
      const encrypted = await encryptMsg(recipientPubKey, text);
      const room = roomKey(currentUser.uid, activeChat.uid);
      await addDoc(collection(db, 'chats', room, 'messages'), {
        encrypted,
        from: currentUser.uid,
        fromName: userProfile?.displayName,
        fromAvatar: userProfile?.avatar,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Encryption failed', e);
    }
  };

  // ── Post ──────────────────────────────────────────────────────────────────
  const submitPost = async () => {
    if (!newPostText.trim()) return;
    await addDoc(collection(db, 'posts'), {
      uid: currentUser.uid,
      displayName: userProfile?.displayName,
      avatar: userProfile?.avatar,
      username: userProfile?.username,
      caption: newPostText.trim(),
      likes: 0,
      comments: 0,
      createdAt: serverTimestamp(),
    });
    setNewPostText('');
    setShowNewPost(false);
  };

  const toggleLike = (id) => {
    setLiked((p) => ({ ...p, [id]: !p[id] }));
    setPosts((p) =>
      p.map((x) =>
        x.id === id ? { ...x, likes: liked[id] ? x.likes - 1 : x.likes + 1 } : x
      )
    );
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (appLoading)
    return (
      <div style={s.loadRoot}>
        <Starfield />
        <div style={s.loadBox}>
          <div style={s.loadLogo}>🌌 COSMIC</div>
          <div style={s.loadBar}>
            <div style={s.loadBarFill} />
          </div>
          <div style={s.loadText}>Connecting securely...</div>
        </div>
      </div>
    );

  // ── Landing ───────────────────────────────────────────────────────────────
  if (page === 'landing')
    return (
      <F1Landing
        onGetStarted={() => {
          setAuthTab('signup');
          setPage('auth');
        }}
      />
    );

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (page === 'auth')
    return (
      <div style={s.authRoot}>
        <Starfield />
        <div style={s.authCard} className="glass">
          <div style={s.authLogo} onClick={() => setPage('landing')}>
            🌌 COSMIC
          </div>
          <div style={s.authTabs}>
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                style={{
                  ...s.authTab,
                  ...(authTab === t ? s.authTabActive : {}),
                }}
                onClick={() => {
                  setAuthTab(t);
                  setAuthErr('');
                }}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>
          {authErr && <div style={s.authErr}>⚠ {authErr}</div>}
          {authTab === 'signup' && (
            <>
              <input
                style={s.authInput}
                placeholder="Display name (e.g. Manoj K)"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
              />
              <input
                style={s.authInput}
                placeholder="Username (e.g. manoj2026)"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    username: e.target.value.toLowerCase().replace(/\s/g, ''),
                  }))
                }
              />
            </>
          )}
          <input
            style={s.authInput}
            placeholder="Email address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            style={s.authInput}
            placeholder="Password (6+ characters)"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            onKeyDown={(e) =>
              e.key === 'Enter' && (authTab === 'login' ? login() : signup())
            }
          />
          <button
            style={{ ...s.authBtn, ...(authLoading ? { opacity: 0.6 } : {}) }}
            onClick={authTab === 'login' ? login : signup}
            disabled={authLoading}
          >
            {authLoading
              ? 'Please wait...'
              : authTab === 'login'
              ? 'LOG IN →'
              : 'CREATE ACCOUNT →'}
          </button>
          <div style={s.authNote}>
            🔐 Keys generated on your device. Never sent to any server.
          </div>
          <div style={s.authBack} onClick={() => setPage('landing')}>
            ← Back to home
          </div>
        </div>
      </div>
    );

  // ── Story viewer ──────────────────────────────────────────────────────────
  if (storyView)
    return (
      <div style={s.storyOverlay} onClick={() => setStoryView(null)}>
        <style>{CSS}</style>
        <div style={s.storyBox}>
          <div style={s.storyBigAv}>{storyView.avatar}</div>
          <div style={s.storyBigName}>{storyView.displayName}</div>
          <div style={{ fontSize: 52, margin: '24px 0' }}>✨</div>
          <div style={{ fontSize: 11, color: '#333', marginTop: 24 }}>
            Tap anywhere to close
          </div>
        </div>
      </div>
    );

  const storyPeople = [userProfile, ...contacts].filter(Boolean);

  // ── Main App ──────────────────────────────────────────────────────────────
  return (
    <div style={s.appRoot}>
      <Starfield />

      {sideOpen && (
        <div style={s.sideOverlay} onClick={() => setSideOpen(false)} />
      )}

      {/* Sidebar */}
      <div style={{ ...s.sidebar, ...(sideOpen ? s.sidebarOpen : {}) }} className="glass">
        <div style={s.sideLogo}>🌌 COSMIC</div>
        <div style={s.sideProfile}>
          <div style={s.sideAv}>{userProfile?.avatar}</div>
          <div>
            <div style={s.sideName}>{userProfile?.displayName}</div>
            <div style={s.sideHandle}>@{userProfile?.username}</div>
          </div>
        </div>
        <nav style={s.sideNav}>
          {[
            { id: 'feed', icon: '⊞', label: 'Feed' },
            { id: 'chat', icon: '✉', label: 'Messages' },
            { id: 'profile', icon: '◯', label: 'Profile' },
          ].map((t) => (
            <button
              key={t.id}
              style={{
                ...s.sideNavBtn,
                ...(tab === t.id ? s.sideNavActive : {}),
              }}
              onClick={() => {
                setTab(t.id);
                setSideOpen(false);
              }}
            >
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={s.sideEncBox}>
          <div style={s.sideEncTitle}>⚙ ENCRYPTION</div>
          {[
            ['Algorithm', 'RSA-OAEP'],
            ['Key Size', '2048-bit'],
            ['Status', keys ? '✓ Active' : '...'],
          ].map(([k, v]) => (
            <div key={k} style={s.sideEncRow}>
              <span>{k}</span>
              <span
                style={{ color: k === 'Status' && keys ? '#fff' : 'inherit' }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
        <button style={s.sideLogout} onClick={logout}>
          Log out
        </button>
      </div>

      {/* Main */}
      <div style={s.appMain}>
        {/* Topbar */}
        <div style={s.topbar}>
          <button style={s.menuBtn} onClick={() => setSideOpen((o) => !o)}>
            ☰
          </button>
          <div style={s.topLogo}>🌌 COSMIC</div>
          <div style={s.topAv}>{userProfile?.avatar}</div>
        </div>

        {/* ── FEED ── */}
        {tab === 'feed' && (
          <Feed
            userProfile={userProfile}
            storyPeople={storyPeople}
            setStoryView={setStoryView}
            showNewPost={showNewPost}
            setShowNewPost={setShowNewPost}
            newPostText={newPostText}
            setNewPostText={setNewPostText}
            submitPost={submitPost}
            posts={posts}
            toggleLike={toggleLike}
            liked={liked}
            s={s}
          />
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <Chat
            contacts={contacts}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            loadMessages={loadMessages}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
            addName={addName}
            setAddName={setAddName}
            addErr={addErr}
            setAddErr={setAddErr}
            addContact={addContact}
            messages={messages}
            currentUser={currentUser}
            msgInput={msgInput}
            setMsgInput={setMsgInput}
            sendMessage={sendMessage}
            bottomRef={bottomRef}
            keys={keys}
            s={s}
          />
        )}

        {/* ── PROFILE ── */}
        {tab === 'profile' && (
          <Profile
            userProfile={userProfile}
            posts={posts}
            currentUser={currentUser}
            contacts={contacts}
            keys={keys}
            theme={theme}
            setTheme={setTheme}
            accent={accent}
            setAccent={setAccent}
            logout={logout}
            s={s}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={s.bottomNav}>
        {[
          { id: 'feed', icon: '⊞', label: 'Feed' },
          { id: 'chat', icon: '✉', label: 'Chat' },
          { id: 'profile', icon: '◯', label: 'Profile' },
        ].map((t) => (
          <button
            key={t.id}
            style={{
              ...s.bottomNavBtn,
              ...(tab === t.id ? s.bottomNavActive : {}),
            }}
            onClick={() => setTab(t.id)}
          >
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 1 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#000;color:#fff;}
  textarea{font-family:inherit;}
  input,button{font-family:inherit;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fillBar{from{width:0}to{width:100%}}
`;

const ff = "'Space Grotesk',sans-serif";
const mono = "'JetBrains Mono',monospace";

const s = {
  // Loading
  loadRoot: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: ff,
  },
  loadBox: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  loadLogo: { fontFamily: mono, fontSize: 28, color: '#fff', letterSpacing: 4 },
  loadBar: { width: 200, height: 2, background: '#111', overflow: 'hidden' },
  loadBarFill: {
    height: '100%',
    background: '#fff',
    animation: 'fillBar 1.5s ease forwards',
  },
  loadText: { fontSize: 12, color: '#333', letterSpacing: 2 },

  // Landing
  landRoot: {
    minHeight: '100vh',
    background: '#000',
    color: '#fff',
    fontFamily: ff,
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 32px',
    borderBottom: '1px solid #111',
  },
  navLogo: { fontFamily: mono, fontSize: 18, color: '#fff', letterSpacing: 3 },
  navR: { display: 'flex', gap: 10, alignItems: 'center' },
  navGhost: {
    background: 'transparent',
    border: 'none',
    color: '#666',
    fontFamily: ff,
    fontSize: 14,
    cursor: 'pointer',
    padding: '8px 16px',
  },
  navSolid: {
    background: '#fff',
    color: '#000',
    border: 'none',
    fontFamily: ff,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '9px 20px',
    borderRadius: 4,
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    textAlign: 'center',
    animation: 'fadeUp 0.5s ease',
  },
  heroBadge: {
    fontSize: 10,
    color: '#444',
    letterSpacing: 3,
    textTransform: 'uppercase',
    border: '1px solid #1a1a1a',
    padding: '6px 18px',
    borderRadius: 20,
    marginBottom: 28,
  },
  heroH1: {
    fontSize: 'clamp(30px,5vw,64px)',
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 20,
  },
  heroAccent: { color: '#555' },
  heroSub: {
    fontSize: 15,
    color: '#555',
    maxWidth: 500,
    lineHeight: 1.75,
    marginBottom: 40,
  },
  heroBtns: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 60,
  },
  heroPrimary: {
    background: '#fff',
    color: '#000',
    border: 'none',
    fontFamily: ff,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '13px 28px',
    borderRadius: 4,
  },
  heroSecondary: {
    background: 'transparent',
    color: '#777',
    border: '1px solid #222',
    fontFamily: ff,
    fontSize: 15,
    cursor: 'pointer',
    padding: '13px 28px',
    borderRadius: 4,
  },
  heroFeatures: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroFeature: { display: 'flex', alignItems: 'center', gap: 8 },
  landFooter: {
    padding: '18px 32px',
    borderTop: '1px solid #111',
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },

  // Auth
  authRoot: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: ff,
  },
  authCard: {
    width: 360,
    padding: 40,
    border: '1px solid #1a1a1a',
    background: '#060606',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    borderRadius: 6,
    animation: 'fadeUp 0.4s ease',
  },
  authLogo: {
    fontFamily: mono,
    fontSize: 22,
    color: '#fff',
    letterSpacing: 3,
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: 4,
  },
  authTabs: {
    display: 'flex',
    border: '1px solid #1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  authTab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#555',
    fontFamily: ff,
    fontSize: 13,
    fontWeight: 500,
    padding: '10px',
    cursor: 'pointer',
  },
  authTabActive: { background: '#fff', color: '#000' },
  authErr: {
    fontSize: 12,
    color: '#fff',
    background: '#111',
    padding: '10px 14px',
    borderRadius: 4,
    border: '1px solid #333',
  },
  authInput: {
    background: '#000',
    border: '1px solid #1a1a1a',
    color: '#fff',
    fontFamily: ff,
    fontSize: 14,
    padding: '12px 14px',
    outline: 'none',
    borderRadius: 4,
    width: '100%',
  },
  authBtn: {
    background: '#fff',
    color: '#000',
    border: 'none',
    fontFamily: ff,
    fontSize: 14,
    fontWeight: 700,
    padding: '13px',
    cursor: 'pointer',
    borderRadius: 4,
  },
  authNote: {
    fontSize: 11,
    color: '#2a2a2a',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  authBack: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    cursor: 'pointer',
  },

  // Story
  storyOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.97)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    fontFamily: ff,
  },
  storyBox: {
    width: 300,
    height: 500,
    border: '1px solid #1a1a1a',
    background: '#060606',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 6,
  },
  storyBigAv: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    fontWeight: 700,
  },
  storyBigName: { fontSize: 16, color: '#fff', fontWeight: 600 },

  // App
  appRoot: {
    display: 'flex',
    minHeight: '100vh',
    background: '#000',
    color: '#fff',
    fontFamily: ff,
    position: 'relative',
  },
  sideOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 40,
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: 250,
    background: '#050505',
    borderRight: '1px solid #111',
    zIndex: 50,
    transform: 'translateX(-100%)',
    transition: 'transform 0.24s ease',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
  },
  sidebarOpen: { transform: 'translateX(0)' },
  sideLogo: {
    fontFamily: mono,
    fontSize: 17,
    color: '#fff',
    letterSpacing: 3,
    padding: '0 20px',
    marginBottom: 20,
  },
  sideProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px',
    marginBottom: 20,
  },
  sideAv: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
  sideName: { fontSize: 14, fontWeight: 600 },
  sideHandle: { fontSize: 12, color: '#555' },
  sideNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 10px',
    flex: 1,
  },
  sideNavBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: 'transparent',
    border: 'none',
    color: '#555',
    fontFamily: ff,
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 6,
    textAlign: 'left',
    width: '100%',
  },
  sideNavActive: { background: '#111', color: '#fff' },
  sideEncBox: {
    margin: '16px',
    border: '1px solid #111',
    padding: 14,
    borderRadius: 6,
  },
  sideEncTitle: {
    fontSize: 10,
    color: '#333',
    letterSpacing: 2,
    marginBottom: 10,
  },
  sideEncRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#444',
    marginBottom: 6,
  },
  sideLogout: {
    margin: '0 16px',
    background: 'transparent',
    border: '1px solid #1a1a1a',
    color: '#555',
    fontFamily: ff,
    fontSize: 13,
    padding: '10px',
    cursor: 'pointer',
    borderRadius: 4,
  },

  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #111',
    background: '#000',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: 22,
    cursor: 'pointer',
    padding: '2px 8px',
  },
  topLogo: { fontFamily: mono, fontSize: 17, color: '#fff', letterSpacing: 3 },
  topAv: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
  },

  appMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    paddingBottom: 58,
    maxWidth: 700,
    margin: '0 auto',
    width: '100%',
  },

  // Feed
  feedWrap: { display: 'flex', flexDirection: 'column' },
  storiesRow: {
    display: 'flex',
    gap: 14,
    padding: '14px 16px',
    overflowX: 'auto',
  },
  storyItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    flexShrink: 0,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAv: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#fff',
    fontWeight: 600,
  },
  storyLabel: {
    fontSize: 10,
    color: '#555',
    maxWidth: 58,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  hr: { height: 1, background: '#111' },
  newPostTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid #111',
    cursor: 'pointer',
  },
  postAv: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },
  newPostBox: {
    padding: '14px 16px',
    borderBottom: '1px solid #111',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  newPostTA: {
    background: '#080808',
    border: '1px solid #1a1a1a',
    color: '#fff',
    fontFamily: ff,
    fontSize: 14,
    padding: 12,
    outline: 'none',
    resize: 'none',
    width: '100%',
    borderRadius: 4,
  },
  rowEnd: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #1a1a1a',
    color: '#666',
    fontFamily: ff,
    fontSize: 13,
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 4,
  },
  primaryBtn: {
    background: '#fff',
    color: '#000',
    border: 'none',
    fontFamily: ff,
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 20px',
    cursor: 'pointer',
    borderRadius: 4,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '60px 20px',
    flex: 1,
    textAlign: 'center',
  },
  emptyTitle: { fontSize: 15, color: '#444', fontWeight: 500 },
  emptySub: { fontSize: 12, color: '#2a2a2a' },
  postCard: { borderBottom: '1px solid #111', animation: 'fadeUp 0.3s ease' },
  postTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
  },
  postName: { fontSize: 14, fontWeight: 600 },
  postTime: { fontSize: 11, color: '#444' },
  postDots: {
    marginLeft: 'auto',
    color: '#333',
    cursor: 'pointer',
    fontSize: 18,
  },
  postImg: {
    width: '100%',
    height: 180,
    background: '#060606',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 60,
    borderTop: '1px solid #111',
    borderBottom: '1px solid #111',
  },
  postActions: { display: 'flex', gap: 0, padding: '8px 12px' },
  actBtn: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontFamily: ff,
    fontSize: 13,
    cursor: 'pointer',
    padding: '6px 10px',
  },
  postCaption: {
    padding: '4px 16px 16px',
    fontSize: 14,
    color: '#aaa',
    lineHeight: 1.6,
  },

  // Chat
  chatLayout: {
    display: 'flex',
    flex: 1,
    height: 'calc(100vh - 57px - 58px)',
    overflow: 'hidden',
  },
  contactPanel: {
    width: 200,
    borderRight: '1px solid #111',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
  },
  contactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 12px',
    borderBottom: '1px solid #111',
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#666',
    letterSpacing: 1,
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#fff',
    color: '#000',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    lineHeight: 1,
  },
  addBox: {
    padding: '12px',
    borderBottom: '1px solid #111',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  addInput: {
    background: '#000',
    border: '1px solid #1a1a1a',
    color: '#fff',
    fontFamily: ff,
    fontSize: 13,
    padding: '9px 12px',
    outline: 'none',
    borderRadius: 4,
  },
  addErrBox: {
    fontSize: 11,
    color: '#fff',
    background: '#111',
    padding: '7px 10px',
    borderRadius: 4,
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #0a0a0a',
  },
  contactItemActive: { background: '#0d0d0d', borderLeft: '2px solid #fff' },
  contactAv: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#111',
    border: '1px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    color: '#fff',
    fontWeight: 600,
    flexShrink: 0,
  },
  contactName: { fontSize: 13, fontWeight: 500, color: '#ddd' },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#555',
    flexShrink: 0,
  },
  chatWin: { flex: 1, display: 'flex', flexDirection: 'column' },
  chatTopBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderBottom: '1px solid #111',
  },
  chatTopName: { fontSize: 14, fontWeight: 600 },
  e2eeChip: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#444',
    border: '1px solid #1a1a1a',
    padding: '3px 10px',
    borderRadius: 20,
    fontFamily: mono,
  },
  msgArea: {
    flex: 1,
    overflowY: 'auto',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  msgAv: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#111',
    border: '1px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#fff',
    fontWeight: 600,
    flexShrink: 0,
  },
  bubble: { maxWidth: '68%', padding: '10px 14px', borderRadius: 4 },
  bubbleMe: { background: '#fff', color: '#000', borderBottomRightRadius: 0 },
  bubbleThem: {
    background: '#0d0d0d',
    border: '1px solid #1a1a1a',
    borderBottomLeftRadius: 0,
  },
  msgMeta: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginTop: 4,
    fontSize: 10,
    opacity: 0.45,
  },
  inputRow: {
    display: 'flex',
    padding: '12px 14px',
    borderTop: '1px solid #111',
  },
  msgInput: {
    flex: 1,
    background: '#060606',
    border: '1px solid #1a1a1a',
    borderRight: 'none',
    color: '#fff',
    fontFamily: ff,
    fontSize: 14,
    padding: '11px 14px',
    outline: 'none',
    borderRadius: '4px 0 0 4px',
  },
  sendBtn: {
    background: '#fff',
    color: '#000',
    border: 'none',
    fontFamily: ff,
    fontSize: 13,
    fontWeight: 600,
    padding: '11px 20px',
    cursor: 'pointer',
    borderRadius: '0 4px 4px 0',
  },

  // Profile
  profileWrap: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
    gap: 20,
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
  },
  profileHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: 28,
    border: '1px solid #111',
    borderRadius: 6,
  },
  profileBigAv: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: '#fff',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
    fontWeight: 700,
  },
  profileBigName: { fontSize: 20, fontWeight: 700 },
  profileStats: { display: 'flex', gap: 40, marginTop: 8 },
  profileStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  profileStatN: { fontSize: 22, fontWeight: 700 },
  encCard: {
    border: '1px solid #111',
    borderRadius: 6,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  encCardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 4,
  },
  encCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    padding: '5px 0',
    borderBottom: '1px solid #0d0d0d',
  },
  logoutBtnLg: {
    background: 'transparent',
    border: '1px solid #1a1a1a',
    color: '#555',
    fontFamily: ff,
    fontSize: 13,
    padding: 12,
    cursor: 'pointer',
    borderRadius: 4,
  },

  // Bottom nav
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    borderTop: '1px solid #111',
    background: '#000',
    zIndex: 20,
    maxWidth: 700,
    margin: '0 auto',
  },
  bottomNavBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '10px 0',
    background: 'transparent',
    border: 'none',
    color: '#333',
    fontFamily: ff,
    cursor: 'pointer',
  },
  bottomNavActive: { color: '#fff', borderTop: '1px solid #fff' },
};
