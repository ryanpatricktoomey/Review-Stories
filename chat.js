(function () {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAdBI_1FG1JnY-NAopcx6YnApNq7l7OcKA",
        authDomain: "review-stories-f251f.firebaseapp.com",
        projectId: "review-stories-f251f",
        storageBucket: "review-stories-f251f.firebasestorage.app",
        messagingSenderId: "974755614972",
        appId: "1:974755614972:web:3e21c5c7ccdfa5f9824779"
    };

    const COLOR_PALETTE = [
        { name: 'Teal',    hex: '#14b8a6' },
        { name: 'Amber',   hex: '#f59e0b' },
        { name: 'Rose',    hex: '#f43f5e' },
        { name: 'Violet',  hex: '#8b5cf6' },
        { name: 'Sky',     hex: '#38bdf8' },
        { name: 'Emerald', hex: '#10b981' },
        { name: 'Orange',  hex: '#f97316' },
        { name: 'Pink',    hex: '#ec4899' },
        { name: 'Indigo',  hex: '#6366f1' },
        { name: 'Lime',    hex: '#84cc16' },
        { name: 'Cyan',    hex: '#06b6d4' },
        { name: 'Fuchsia', hex: '#d946ef' },
    ];

    const pageId = decodeURIComponent(
        window.location.pathname.split('/').pop().replace('.html', '')
    ).replace(/[\s\.]/g, '_');

    let auth, db, currentUser, userColor, unsubscribe;

    function getColorFromUid(uid) {
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
            hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0;
        }
        return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
    }

    function escapeHtml(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #chat-section { width: 100%; }
            #chat-messages { height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 1rem; scroll-behavior: smooth; }
            #chat-messages::-webkit-scrollbar { width: 4px; }
            #chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            .chat-msg { display: flex; flex-direction: column; max-width: 80%; }
            .chat-msg.own { align-self: flex-end; align-items: flex-end; }
            .chat-msg.other { align-self: flex-start; align-items: flex-start; }
            .chat-name { font-size: 0.7rem; font-weight: 800; margin-bottom: 4px; letter-spacing: 0.05em; text-transform: uppercase; }
            .chat-bubble { padding: 9px 14px; border-radius: 18px; font-size: 0.9rem; line-height: 1.5; word-break: break-word; color: #f1f5f9; }
            .chat-msg.own .chat-bubble { background: rgba(20,184,166,0.15); border: 1px solid rgba(20,184,166,0.3); border-bottom-right-radius: 4px; }
            .chat-msg.other .chat-bubble { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-bottom-left-radius: 4px; }
            #chat-input { font-size: 16px; -webkit-appearance: none; }
        `;
        document.head.appendChild(style);
    }

    function injectHTML() {
        const section = document.createElement('div');
        section.id = 'chat-section';
        section.innerHTML = `
            <div style="background: rgba(15,23,42,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 1.5rem; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                <div style="background: rgba(30,41,59,0.5); padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.1rem;">💬</span>
                        <span style="color: #14b8a6; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Class Chat</span>
                    </div>
                    <span id="chat-user-badge" style="display:none; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;"></span>
                </div>

                <div id="chat-messages"></div>

                <div id="chat-signin-area" style="display:none; padding: 1rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 0.75rem;">Sign in to join the chat</p>
                    <button id="chat-signin-btn" style="background: white; color: #0f172a; font-weight: 700; padding: 0.5rem 1.5rem; border-radius: 1rem; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 1rem; height: 1rem;">
                        Sign in with Google
                    </button>
                </div>

                <div id="chat-input-area" style="display:none; padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; gap: 0.5rem;">
                        <input id="chat-input" type="text" placeholder="Say something..." maxlength="200"
                            style="flex:1; background: rgba(30,41,59,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 0.6rem 1rem; color: #f1f5f9; outline: none; font-family: inherit;">
                        <button id="chat-send-btn"
                            style="background: #14b8a6; color: #0f172a; font-weight: 800; padding: 0.6rem 1.25rem; border-radius: 1.5rem; border: none; cursor: pointer; font-size: 0.85rem; white-space: nowrap;">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        `;
        const quizBtn = document.getElementById('quizBtn');
        if (quizBtn) {
            quizBtn.parentElement.insertAdjacentElement('afterend', section);
        } else {
            document.body.appendChild(section);
        }

        document.getElementById('chat-signin-btn').onclick = () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(err => alert('Sign in failed: ' + err.message));
        };

        document.getElementById('chat-send-btn').onclick = sendMessage;
        document.getElementById('chat-input').addEventListener('keydown', e => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    async function sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !currentUser) return;
        input.value = '';
        try {
            await db.collection('chats').doc(pageId).collection('messages').add({
                text,
                colorName: userColor.name,
                colorHex: userColor.hex,
                uid: currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.error('Chat send failed:', e);
        }
    }

    function renderMessages(docs) {
        const container = document.getElementById('chat-messages');
        const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 60;

        container.innerHTML = '';
        docs.forEach(doc => {
            const msg = doc.data();
            if (!msg.text || !msg.colorName) return;
            const isOwn = currentUser && msg.uid === currentUser.uid;
            const div = document.createElement('div');
            div.className = `chat-msg ${isOwn ? 'own' : 'other'}`;
            div.innerHTML = `
                <span class="chat-name" style="color: ${msg.colorHex}">${escapeHtml(msg.colorName)}</span>
                <div class="chat-bubble">${escapeHtml(msg.text)}</div>
            `;
            container.appendChild(div);
        });

        if (atBottom) container.scrollTop = container.scrollHeight;
    }

    function subscribeToMessages() {
        if (unsubscribe) unsubscribe();
        unsubscribe = db.collection('chats').doc(pageId).collection('messages')
            .orderBy('timestamp', 'asc')
            .limit(100)
            .onSnapshot(snapshot => renderMessages(snapshot.docs));
    }

    async function onSignedIn(user) {
        currentUser = user;

        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists && userDoc.data().colorName) {
            userColor = { name: userDoc.data().colorName, hex: userDoc.data().colorHex };
        } else {
            userColor = getColorFromUid(user.uid);
            await userRef.set({ colorName: userColor.name, colorHex: userColor.hex }, { merge: true });
        }

        const badge = document.getElementById('chat-user-badge');
        badge.textContent = userColor.name;
        badge.style.color = userColor.hex;
        badge.style.display = 'block';

        document.getElementById('chat-signin-area').style.display = 'none';
        document.getElementById('chat-input-area').style.display = 'block';

        subscribeToMessages();
    }

    function onSignedOut() {
        currentUser = null;
        userColor = null;
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }

        document.getElementById('chat-user-badge').style.display = 'none';
        document.getElementById('chat-signin-area').style.display = 'block';
        document.getElementById('chat-input-area').style.display = 'none';

        subscribeToMessages();
    }

    function initChat() {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        auth = firebase.auth();
        db = firebase.firestore();

        injectStyles();
        injectHTML();

        auth.onAuthStateChanged(user => {
            if (user) onSignedIn(user);
            else onSignedOut();
        });
    }

    function loadSequential(urls, i, callback) {
        if (i >= urls.length) { callback(); return; }
        if (document.querySelector(`script[src="${urls[i]}"]`)) {
            loadSequential(urls, i + 1, callback); return;
        }
        const s = document.createElement('script');
        s.src = urls[i];
        s.onload = () => loadSequential(urls, i + 1, callback);
        document.head.appendChild(s);
    }

    const FB_SCRIPTS = [
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
    ];

    if (typeof firebase !== 'undefined' && firebase.apps !== undefined) {
        initChat();
    } else {
        loadSequential(FB_SCRIPTS, 0, initChat);
    }
})();
