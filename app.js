document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const attachBtn = document.getElementById('attach-btn');
    const videoEditBtn = document.getElementById('video-edit-btn');
    const mediaUpload = document.getElementById('media-upload');
    const typingIndicator = document.getElementById('typing-indicator');
    const badge = document.getElementById('detected-lang-badge');
    const languageDropdown = document.getElementById('user-language');
    const muteBtn = document.getElementById('mute-btn');
    
    // Sidebar
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const chatTitleHeader = document.getElementById('chat-title-header');

    // Modals
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const openAiKeyInput = document.getElementById('openai-key-input');
    const supabaseUrlInput = document.getElementById('supabase-url-input');
    const supabaseKeyInput = document.getElementById('supabase-key-input');
    const cloudStatus = document.getElementById('cloud-status');
    
    const mediaModal = document.getElementById('media-modal');
    const closeMedia = document.getElementById('close-media');
    const mediaCanvas = document.getElementById('media-canvas');
    const mediaVideo = document.getElementById('media-video');
    const filterBright = document.getElementById('filter-bright');
    const filterContrast = document.getElementById('filter-contrast');
    const filterGray = document.getElementById('filter-gray');
    const sendMediaBtn = document.getElementById('send-media-btn');
    const groupMembersContainer = document.getElementById('group-members-container');
    const addMemberBtn = document.getElementById('add-member-btn');
    const shareRoomBtn = document.getElementById('share-room-btn');
    const aiAssistToggle = document.getElementById('ai-assist-toggle');
    const translateToggle = document.getElementById('translate-toggle');
    const videoControls = document.getElementById('video-controls');
    const videoSpeed = document.getElementById('video-speed');
    const videoStart = document.getElementById('video-start');
    const videoEnd = document.getElementById('video-end');
    const muteVideoToggle = document.getElementById('mute-video-toggle');

    // Architecture State
    let sessions = JSON.parse(localStorage.getItem('chatzenChatSessions')) || [];
    let currentSessionId = localStorage.getItem('chatzenCurrentSessionId') || null;
    let geminiApiKey = localStorage.getItem('chatzenGeminiKey') || '';
    let openAiApiKey = localStorage.getItem('chatzenOpenAIKey') || '';
    let gnewsKey = localStorage.getItem('chatzenGnewsKey') || '';
    let p2pUsername = localStorage.getItem('chatzenP2PUsername') || null;
    
    // Serverless WebRTC State (PeerJS)
    let peer = null;
    let p2pConnections = [];
    let isHost = false;
    
    let synth = window.speechSynthesis;
    let isMuted = false;
    let mdCtx = null; // Initialized lazily when media modal opens
    let currentMediaSrc = null;
    let currentMediaType = null;
    let currentImageData = null;
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 200 ? this.scrollHeight : 200) + 'px';
        sendBtn.classList.toggle('disabled', this.value.trim() === '');
    });

    // Sidebar & Session Logic
    async function saveSessions() {
        localStorage.setItem('chatzenChatSessions', JSON.stringify(sessions));
        localStorage.setItem('chatzenCurrentSessionId', currentSessionId);
        
        renderSidebar();
    }

    function createNewSession() {
        const id = Date.now().toString();
        const session = { 
            id, 
            title: 'New Chat', 
            messages: [],
            tags: [],
            members: [{ id: 'default', name: 'You', avatar: 'fa-user' }],
            activeMemberId: 'default'
        };
        sessions.unshift(session);
        currentSessionId = id;
        chatContainer.innerHTML = '';
        chatTitleHeader.textContent = 'New Chat';
        saveSessions();
    }

    function loadSession(id) {
        currentSessionId = id;
        chatContainer.innerHTML = '';
        const session = sessions.find(s => s.id === id);
        if (session) {
            chatTitleHeader.textContent = session.title;
            session.messages.forEach(msg => addMessage(msg.text, msg.sender, false, msg.media, msg.memberName));
            renderGroupMembers();
        }
        saveSessions();
    }

    function renderSidebar() {
        chatHistoryList.innerHTML = '';
        sessions.forEach(s => {
            const div = document.createElement('div');
            div.className = `history-item ${s.id === currentSessionId ? 'active' : ''}`;
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = s.title;
            div.appendChild(titleSpan);

            const metaDiv = document.createElement('div');
            metaDiv.className = 'history-item-meta';
            (s.tags || []).forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = `tag-pill ${tag.toLowerCase()}`;
                tagSpan.textContent = `#${tag}`;
                metaDiv.appendChild(tagSpan);
            });
            div.appendChild(metaDiv);

            div.addEventListener('click', () => {
                loadSession(s.id);
                sidebar.classList.remove('open');
            });
            chatHistoryList.appendChild(div);
        });
    }

    function renderGroupMembers() {
        const session = sessions.find(s => s.id === currentSessionId);
        if (!session) return;
        
        groupMembersContainer.innerHTML = '';
        if (session.members && session.members.length > 1) {
            groupMembersContainer.classList.remove('hidden');
            session.members.forEach(m => {
                const div = document.createElement('div');
                div.className = `member-avatar ${session.activeMemberId === m.id ? 'active' : ''}`;
                div.innerHTML = `<i class="fa-solid ${m.avatar}"></i>`;
                div.title = m.name;
                div.addEventListener('click', () => {
                    session.activeMemberId = m.id;
                    saveSessions();
                    renderGroupMembers();
                });
                groupMembersContainer.appendChild(div);
            });
        } else {
            groupMembersContainer.classList.add('hidden');
        }
    }

    addMemberBtn.addEventListener('click', () => {
        const session = sessions.find(s => s.id === currentSessionId);
        if (!session) return;
        const name = prompt("Enter Collaborator Name:");
        if (name) {
            const id = Date.now().toString();
            session.members.push({ id, name, avatar: 'fa-user-ninja' });
            session.activeMemberId = id;
            saveSessions();
            renderGroupMembers();
        }
    });

    newChatBtn.addEventListener('click', () => { createNewSession(); sidebar.classList.remove('open'); });
    clearAllBtn.addEventListener('click', () => { 
        if (p2pConnections.length > 0 && !isHost) {
            alert("Only the Room Host can wipe the network.");
            return;
        }
        sessions = []; 
        createNewSession(); 
        const s = sessions[0];
        p2pConnections.forEach(c => c.send({ type: 'clear_chat', newSession: s }));
    });
    openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    // Initialization & Collab-Link Deep Linking
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');

    function initPeerJS(hostId = null) {
        if (!window.Peer) { console.error("PeerJS not loaded"); return; }
        const p2pStatus = document.getElementById('p2p-status-box');
        
        if (hostId) {
            // Client Mode
            peer = new window.Peer();
            isHost = false;
            peer.on('open', (id) => {
                if(p2pStatus) p2pStatus.textContent = "Status: Connecting to Host WebRTC...";
                cloudStatus.classList.replace('offline', 'online');
                cloudStatus.title = "P2P WebRTC Connected";
                
                const conn = peer.connect(hostId);
                conn.on('open', () => {
                    p2pConnections.push(conn);
                    if(p2pStatus) p2pStatus.textContent = "Status: Connected to Room Host.";
                });
                setupConnectionListeners(conn);
            });
        } else {
            // Host Mode
            if (sessions.length === 0 || !currentSessionId) createNewSession();
            else loadSession(currentSessionId);
            
            const hostPeerId = "chatzen-host-" + currentSessionId;
            peer = new window.Peer(hostPeerId);
            isHost = true;
            
            peer.on('open', (id) => {
                if(p2pStatus) p2pStatus.textContent = "Status: Hosting P2P Room.";
                cloudStatus.classList.replace('offline', 'online');
                cloudStatus.title = "Hosting P2P Room";
            });
            
            peer.on('connection', (conn) => {
                console.log("New Client Connected via P2P");
                p2pConnections.push(conn);
                setupConnectionListeners(conn);
                const s = sessions.find(sid => sid.id === currentSessionId);
                if(s) conn.send({ type: 'sync_history', session: s });
            });
        }
    }
    
    function setupConnectionListeners(conn) {
        conn.on('data', (data) => {
            if (data.type === 'sync_history') {
                const s = data.session;
                let localSession = sessions.find(sid => sid.id === s.id);
                if (!localSession) {
                    sessions.unshift(s);
                    saveSessions();
                    renderSidebar();
                }
                loadSession(s.id);
                setTimeout(() => alert("You have joined the P2P Room!"), 500);
            } else if (data.type === 'chat_message') {
                const m = data.msg;
                const s = sessions.find(sid => sid.id === m.session_id);
                if (s && m.session_id === currentSessionId) {
                    if (!s.messages.find(ms => ms.id === m.id)) {
                        addMessage(m.text, m.sender, true, m.media, m.member_name, m.id, false);
                    }
                }
                if (isHost) p2pConnections.filter(c => c !== conn).forEach(c => c.send(data));
            } else if (data.type === 'clear_chat') {
                if (data.newSession) {
                    sessions = [data.newSession];
                    currentSessionId = data.newSession.id;
                    saveSessions();
                    renderSidebar();
                    loadSession(currentSessionId);
                } else {
                    sessions = [];
                    createNewSession();
                }
                if (isHost) p2pConnections.filter(c => c !== conn).forEach(c => c.send(data));
                setTimeout(() => alert("The Host cleared the shared workspace."), 100);
            } else if (data.type === 'typing') {
                const typingBox = document.getElementById('p2p-typing-indicator');
                if (typingBox) {
                    typingBox.textContent = `${data.name} is typing...`;
                    typingBox.classList.remove('hidden');
                    if (window.p2pTypingTimeout) clearTimeout(window.p2pTypingTimeout);
                    window.p2pTypingTimeout = setTimeout(() => { typingBox.classList.add('hidden'); }, 2500);
                }
                if (isHost) p2pConnections.filter(c => c !== conn).forEach(c => c.send(data));
            }
        });
        conn.on('close', () => { p2pConnections = p2pConnections.filter(c => c !== conn); });
    }

    function checkP2PLogin(hostId) {
        if (hostId && !p2pUsername) {
            const modal = document.getElementById('p2p-login-modal');
            modal.classList.remove('hidden');
            document.getElementById('p2p-join-btn').addEventListener('click', () => {
                const val = document.getElementById('p2p-username-input').value.trim();
                if (val) {
                    p2pUsername = val;
                    localStorage.setItem('chatzenP2PUsername', p2pUsername);
                    modal.classList.add('hidden');
                    initPeerJS(hostId);
                }
            });
        } else {
            initPeerJS(hostId);
        }
    }

    if (roomId) {
         currentSessionId = roomId; 
         setTimeout(() => checkP2PLogin("chatzen-host-" + roomId), 1000);
    } else {
         setTimeout(() => checkP2PLogin(null), 1000);
    }

    sendBtn.classList.add('disabled');
    
    if (shareRoomBtn) {
        shareRoomBtn.addEventListener('click', () => {
            if (!currentSessionId) return;
            const url = window.location.origin + window.location.pathname + '?room=' + currentSessionId;
            navigator.clipboard.writeText(url).then(() => {
                const originalTitle = shareRoomBtn.title;
                shareRoomBtn.title = "Link Copied!";
                shareRoomBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(() => { shareRoomBtn.title = originalTitle; shareRoomBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i>'; }, 2000);
            });
        });
    }

    settingsBtn.addEventListener('click', () => {
        apiKeyInput.value = geminiApiKey;
        if (openAiKeyInput) openAiKeyInput.value = openAiApiKey;
        const gnewsInput = document.getElementById('gnews-key-input');
        if (gnewsInput) gnewsInput.value = gnewsKey;
        settingsModal.classList.remove('hidden');
    });

    closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

    saveKeyBtn.addEventListener('click', () => {
        geminiApiKey = apiKeyInput.value.trim();
        localStorage.setItem('chatzenGeminiKey', geminiApiKey);
        openAiApiKey = openAiKeyInput.value.trim();
        localStorage.setItem('chatzenOpenAIKey', openAiApiKey);
        const gnewsInput = document.getElementById('gnews-key-input');
        if (gnewsInput) { gnewsKey = gnewsInput.value.trim(); localStorage.setItem('chatzenGnewsKey', gnewsKey); }
        settingsModal.classList.add('hidden');
    });

    // Mute Toggle
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
        if (isMuted) synth.cancel();
    });

    // Media Upload & Canvas functionality
    attachBtn.addEventListener('click', () => mediaUpload.click());
    if (videoEditBtn) videoEditBtn.addEventListener('click', () => mediaUpload.click());
    
    mediaUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        
        if (file.type.startsWith('image/')) {
            currentMediaType = 'image';
            mediaVideo.classList.add('hidden');
            videoControls.classList.add('hidden');
            mediaCanvas.classList.remove('hidden');
            
            const img = new Image();
            img.onload = () => {
                if (!mdCtx) mdCtx = mediaCanvas.getContext('2d');
                mediaCanvas.width = img.width;
                mediaCanvas.height = img.height;
                currentImageData = img;
                applyCanvasFilters();
                mediaModal.classList.remove('hidden');
            };
            img.src = url;
            currentMediaSrc = url;
        } else if (file.type.startsWith('video/')) {
            currentMediaType = 'video';
            mediaCanvas.classList.add('hidden');
            mediaVideo.classList.remove('hidden');
            videoControls.classList.remove('hidden');
            mediaVideo.src = url;
            
            mediaVideo.onloadedmetadata = () => {
                videoStart.value = 0;
                videoEnd.value = Math.floor(mediaVideo.duration);
                videoEnd.max = Math.floor(mediaVideo.duration);
            };
            
            applyCanvasFilters();
            mediaModal.classList.remove('hidden');
        }
        e.target.value = ''; // Reset
    });
    
    closeMedia.addEventListener('click', () => {
        mediaModal.classList.add('hidden');
        if (currentMediaType === 'video') mediaVideo.pause();
    });

    function applyCanvasFilters() {
        const b = filterBright.value;
        const c = filterContrast.value;
        const g = filterGray.value;
        const filterStr = `brightness(${b}%) contrast(${c}%) grayscale(${g}%)`;

        if (currentMediaType === 'image' && currentImageData && mdCtx) {
            mdCtx.filter = filterStr;
            mdCtx.drawImage(currentImageData, 0, 0);
        } else if (currentMediaType === 'video') {
            mediaVideo.style.filter = filterStr;
        }
    }

    [filterBright, filterContrast, filterGray].forEach(el => el.addEventListener('input', applyCanvasFilters));

    videoSpeed.addEventListener('change', () => {
        mediaVideo.playbackRate = parseFloat(videoSpeed.value);
    });

    muteVideoToggle.addEventListener('click', () => {
        mediaVideo.muted = !mediaVideo.muted;
        muteVideoToggle.innerHTML = mediaVideo.muted ? '<i class="fa-solid fa-volume-xmark"></i> Unmute Video' : '<i class="fa-solid fa-volume-mute"></i> Mute Video';
    });

    mediaVideo.addEventListener('timeupdate', () => {
        const start = parseFloat(videoStart.value);
        const end = parseFloat(videoEnd.value);
        if (mediaVideo.currentTime < start) mediaVideo.currentTime = start;
        if (mediaVideo.currentTime > end) mediaVideo.currentTime = start;
    });

    sendMediaBtn.addEventListener('click', () => {
        let mediaData = '';
        let metadata = { type: currentMediaType, edits: {} };
        
        if (currentMediaType === 'image') {
            mediaData = mediaCanvas.toDataURL('image/jpeg', 0.8);
        } else {
            mediaData = mediaVideo.src; 
            metadata.edits = {
                speed: videoSpeed.value,
                start: videoStart.value,
                end: videoEnd.value,
                muted: mediaVideo.muted
            };
        }
        mediaModal.classList.add('hidden');
        
        const s = sessions.find(s => s.id === currentSessionId);
        const fallbackName = s ? (s.members.find(m => m.id === s.activeMemberId)?.name || s.members[0]?.name) : 'Guest';
        const senderName = isHost ? fallbackName : (p2pUsername || fallbackName);
        
        addMessage(`Uploaded ${currentMediaType} via VidGen Studio`, 'user', true, { type: currentMediaType, data: mediaData, metadata }, senderName);
        
        if (!aiAssistToggle || aiAssistToggle.checked) {
            triggerAIResponse(`I just edited a ${currentMediaType} with: Speed=${videoSpeed.value}x, Trim=${videoStart.value}s-${videoEnd.value}s.`);
        }
    });

    // Chat Logic
    let lastTypingTime = 0;
    chatInput.addEventListener('input', () => {
        if (chatInput.value.length > 0 && p2pConnections.length > 0) {
            const now = Date.now();
            if (now - lastTypingTime > 1500) {
                lastTypingTime = now;
                const s = sessions.find(sid => sid.id === currentSessionId);
                const fallbackName = s ? (s.members.find(m => m.id === s.activeMemberId)?.name || s.members[0]?.name) : 'Someone';
                const activeName = isHost ? fallbackName : (p2pUsername || fallbackName);
                p2pConnections.forEach(c => c.send({ type: 'typing', name: activeName }));
            }
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    sendBtn.addEventListener('click', handleSend);

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.classList.add('disabled');
        
        const s = sessions.find(s => s.id === currentSessionId);
        const fallbackName = s ? (s.members.find(m => m.id === s.activeMemberId)?.name || s.members[0]?.name) : 'Guest';
        const senderName = isHost ? fallbackName : (p2pUsername || fallbackName);
        
        addMessage(text, 'user', true, null, senderName);
        
        // Auto-tag & Title
        if (s && s.messages.length === 1) {
            s.title = text.substring(0, 20) + '...';
            s.tags = detectSessionTags(text);
            chatTitleHeader.textContent = s.title;
            saveSessions();
        }

        if (!aiAssistToggle || aiAssistToggle.checked) {
            triggerAIResponse(text);
        }
    }

    function subscribeToGroupSync() {
        if (!supabaseClient) return;
        
        const channel = supabaseClient.channel('chatzen-all-messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chatzen_messages' }, payload => {
                const msg = payload.new;
                const s = sessions.find(s => s.id === msg.session_id);
                if (s && msg.session_id === currentSessionId) {
                    // Check if message already exists locally
                    if (!s.messages.find(m => m.id === msg.id)) {
                        addMessage(msg.text, msg.sender, true, msg.media, msg.member_name, msg.id, false);
                    }
                }
            })
            .subscribe();
    }

    function detectSessionTags(text) {
        const tags = [];
        const lower = text.toLowerCase();
        if (lower.match(/(code|function|const|var|async|api|debug|error|script)/)) tags.push('Code');
        if (lower.match(/(write|story|poem|imagine|art|creative|design)/)) tags.push('Creative');
        if (lower.match(/(how|what|explain|research|define|why|who)/)) tags.push('Research');
        if (tags.length === 0) tags.push('General');
        return tags;
    }

    async function triggerAIResponse(text) {
        typingIndicator.classList.remove('hidden');
        chatContainer.scrollTop = chatContainer.scrollHeight;

        const detectedCode = detectLanguage(text);

        // 1) Try smart intent detection FIRST for speed (weather, translate, currency, etc.)
        const intent = CHATZEN_APIS.detectIntent(text);
        if (intent.type !== 'chat') {
            try {
                const richResponse = await CHATZEN_APIS.handleIntent(intent, gnewsKey);
                if (richResponse) {
                    finalizeResponse(richResponse, detectedCode);
                    return;
                }
            } catch (e) { /* fall through to LLM */ }
        }

        // 2) Fallback to LLM (Tiered System)
        if (openAiApiKey) {
            getOpenAIResponse(text, detectedCode).then(res => finalizeResponse(res, detectedCode));
        } else if (geminiApiKey) {
            getGeminiResponse(text, detectedCode).then(res => finalizeResponse(res, detectedCode));
        } else {
            getPollinationsResponse(text, detectedCode).then(res => finalizeResponse(res, detectedCode));
        }
    }

    function finalizeResponse(responseText, detectedCode) {
        typingIndicator.classList.add('hidden');
        addMessage(responseText, 'ai');
        const aiRespLang = detectLanguage(responseText) || detectedCode;
        speakAIText(responseText, SUPPORTED_LANGUAGES[aiRespLang]?.code || 'en-US');
    }

    async function getPollinationsResponse(userText, targetLang) {
        let historyStr = "";
        const s = sessions.find(s => s.id === currentSessionId);
        if (s) {
            s.messages.slice(-6).forEach(msg => {
                historyStr += `${msg.sender.toUpperCase()}: ${msg.text}\n`;
            });
        }
        
        const systemPrompt = `You are LAY, a super friendly, warm, and chill AI buddy. You talk exactly like a close human friend having a real conversation - casual, cheerful, caring, and expressive. Use emojis naturally when it feels right. Be genuinely enthusiastic and fun! 
IMPORTANT: ALWAYS reply in the EXACT SAME LANGUAGE the user types in. If they use Hindi, reply in Hindi. Telugu means Telugu. Spanish means Spanish. NEVER switch to English unless they wrote in English.
Image generation: If the user wants to see a picture of something, embed it like: ![description](https://image.pollinations.ai/prompt/URL_ENCODED_DESCRIPTION)
You can also format code nicely in markdown code blocks. But mostly - just be real, warm, and totally human!`;
        
        const fullPrompt = `${historyStr}USER: ${userText}\nLAY:`;
        const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?system=${encodeURIComponent(systemPrompt)}`;
        
        try {
            const res = await fetch(url);
            let aiText = await res.text();
            
            // Background change mock hack since it's fun
            const cmdRegex = /<EXECUTE_CMD>CHANGE_BG:(.*?)<\/EXECUTE_CMD>/g;
            let match;
            while ((match = cmdRegex.exec(aiText)) !== null) {
                document.getElementById('dynamic-bg').style.backgroundImage = `url('${match[1].trim()}')`;
            }
            aiText = aiText.replace(/<EXECUTE_CMD>.*?<\/EXECUTE_CMD>/g, '').trim();

            return aiText;
        } catch (e) {
            return "Connection offline.";
        }
    }

    async function getOpenAIResponse(userText, targetLang) {
        let messages = [];
        const s = sessions.find(s => s.id === currentSessionId);
        if (s) {
            s.messages.slice(-10).forEach(msg => {
                messages.push({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.text });
            });
        }
        
        const systemPrompt = `You are ChatZen, a powerful, chill and supportive collaborative AI team member. 
IMPORTANT: ALWAYS reply in the EXACT SAME LANGUAGE the user types in. Language detected: ${targetLang}.
Response rules: Format with MD, use emojis naturally, be genuinely enthusiastic!`;
        
        messages.unshift({ role: "system", content: systemPrompt });
        if (!messages.find(m => m.content === userText)) messages.push({ role: "user", content: userText });

        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openAiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: messages
                })
            });
            const data = await res.json();
            return data.choices[0].message.content;
        } catch (e) {
            console.error("OpenAI Error:", e);
            return "OpenAI Error. Checked your key? I'll fallback to other engines if needed.";
        }
    }

    async function getGeminiResponse(userText, targetLang) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
        const systemPrompt = `You are LAY, a super friendly, warm, and chill AI buddy. You talk exactly like a close human friend having a real conversation - casual, cheerful, caring, and expressive. Use emojis naturally when it feels right. Be genuinely enthusiastic and fun! 
IMPORTANT: ALWAYS reply in the EXACT SAME LANGUAGE the user types in. If they use Hindi, reply in Hindi. Telugu means Telugu. Spanish means Spanish. NEVER switch to English unless they wrote in English.
Image generation: If the user wants to see a picture of something, embed it like: ![description](https://image.pollinations.ai/prompt/URL_ENCODED_DESCRIPTION)
You can also format code nicely in markdown code blocks. But mostly - just be real, warm, and totally human!`;
        const payload = { systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [] };
        
        const s = sessions.find(s => s.id === currentSessionId);
        if (s) {
            s.messages.slice(-10).forEach(msg => {
                payload.contents.push({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] });
            });
        }

        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (data.error) return "API Error: " + data.error.message;
            return data.candidates[0].content.parts[0].text;
        } catch (e) { return "Network Error."; }
    }

    // Markdown Parser
    function parseMarkdown(text) {
        let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Code blocks
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        html = html.replace(codeBlockRegex, (match, lang, code) => {
            return `<div class="code-block-wrapper"><div class="code-header"><div class="mac-dots"><span></span><span></span><span></span></div><span>${lang || 'code'}</span><button class="copy-code-btn" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText)"><i class="fa-regular fa-copy"></i> Copy code</button></div><pre><code>${code}</code></pre></div>`;
        });
        
        // Generative AI Image tags ![alt](url)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="chat-image" />');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
        html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        html = html.replace(/\n\n/g, "<p></p>");
        html = html.replace(/\n/g, "<br>");
        
        return html;
    }

    async function addMessage(text, sender, save = true, media = null, memberName = null, msgId = null, pushToCloud = true) {
        const id = msgId || Date.now().toString() + Math.random().toString(36).substr(2, 5);
        
        const s = sessions.find(s => s.id === currentSessionId);
        
        let alignmentClass = '';
        if (sender === 'user') {
            const fallbackName = s ? (s.members.find(m => m.id === s.activeMemberId)?.name || s.members[0]?.name) : 'You';
            const myRecognizedName = isHost ? fallbackName : (p2pUsername || fallbackName);
            
            const realMemberName = memberName || myRecognizedName;
            const isMine = (realMemberName === myRecognizedName);
            alignmentClass = isMine ? 'my-message' : 'their-message';
        }

        const msgRow = document.createElement('div');
        msgRow.className = `message-row ${sender}-message ${alignmentClass}`;
        msgRow.dataset.msgId = id;
        
        let contentHtml = '';
        if (media) {
            if (media.type === 'image') contentHtml += `<img src="${media.data}" class="chat-image"/>`;
            if (media.type === 'video') contentHtml += `<video src="${media.data}" class="chat-video" controls></video>`;
        }
        
        if (text) contentHtml += parseMarkdown(text);

        const avatarIcon = sender === 'user' ? 'fa-user' : 'fa-robot';
        const displayName = sender === 'user' ? (memberName || 'You') : 'ChatZen';
        
        msgRow.innerHTML = `
            <div class="message">
                <div class="avatar-container">
                    <div class="avatar"><i class="fa-solid ${avatarIcon}"></i></div>
                    <span class="sender-name">${displayName}</span>
                </div>
                <div class="message-content">
                    ${contentHtml}
                    ${sender === 'ai' ? '<div class="action-bar"><button class="action-btn" onclick="navigator.clipboard.writeText(this.parentElement.parentElement.innerText)"><i class="fa-regular fa-copy"></i></button></div>' : ''}
                </div>
            </div>
        `;
        
        chatContainer.appendChild(msgRow);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (save) {
            const s = sessions.find(s => s.id === currentSessionId);
            if (s) {
                const msgObj = { id, text, sender, media, memberName };
                // Prevent duplicates
                if (!s.messages.find(m => m.id === id)) {
                    s.messages.push(msgObj);
                    saveSessions();

                    if (pushToCloud) {
                        const payload = { type: 'chat_message', msg: { id, session_id: currentSessionId, text, sender, media, member_name: memberName } };
                        if (isHost) {
                            p2pConnections.forEach(c => c.send(payload));
                        } else if (peer && p2pConnections.length > 0) {
                            p2pConnections[0].send(payload);
                        }
                    }
                }
            }
        }
    }

    function speakAIText(text, langCode) {
        if (!synth || isMuted) return;
        synth.cancel();
        
        // Strip markdown from speech
        const cleanText = text.replace(/```[\s\S]*?```/g, "Code block.").replace(/[*`_]/g, "").replace(/!\[.*?\]\(.*?\)/g, "Generated image.");
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = langCode;
        utterance.rate = 0.95; utterance.pitch = 1.3; utterance.volume = 1.0;
        
        const voices = synth.getVoices();
        const langVoices = voices.filter(v => v.lang.includes(langCode) || v.lang.includes(langCode.split('-')[0]));
        let idealVoice = langVoices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google'));
        if (!idealVoice && langVoices.length > 0) idealVoice = langVoices[0];
        
        if (idealVoice) utterance.voice = idealVoice;
        synth.speak(utterance);
    }

    // Voice Input setup (similar to before, omitted for length if not needed, but critical for mic-btn)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.onresult = function(event) {
            chatInput.value = event.results[0][0].transcript;
            handleSend();
        };
    }
    document.getElementById('mic-btn').addEventListener('click', () => {
        if(recognition) recognition.start();
    });

    // Make global for inline regenerate click (mock)
    window.handleRegenerate = function() {
        triggerAIResponse("Please generate another response for that last query.");
    };
});
