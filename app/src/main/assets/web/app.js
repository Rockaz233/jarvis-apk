/**
 * J.A.R.V.I.S. Front-end Application Controller
 * Handles UI animations, soundwave canvas, inputs, and events
 */

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    const jarvis = new JarvisCore();

    // DOM Elements
    const clockEl = document.getElementById('hud-clock');
    const batteryEl = document.getElementById('battery-level');
    const reactorTrigger = document.getElementById('reactor-trigger');
    const reactorContainer = document.querySelector('.reactor-container');
    const reactorStatus = document.getElementById('reactor-status');
    const feedMessages = document.getElementById('feed-messages');
    const clearFeedBtn = document.getElementById('clear-feed-btn');
    const userTextInput = document.getElementById('user-text-input');
    const sendBtn = document.getElementById('send-btn');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const modelSelect = document.getElementById('gemini-model-select');
    const voiceEngineSelect = document.getElementById('voice-engine-select');
    const elevenVoiceInput = document.getElementById('eleven-voice-id');
    const elevenKeyInput = document.getElementById('eleven-api-key');
    const voicePitchInput = document.getElementById('voice-pitch');
    const voiceRateInput = document.getElementById('voice-rate');
    const autoSpeakToggle = document.getElementById('auto-speak-toggle');
    const quickChips = document.querySelectorAll('.quick-chip');
    const canvas = document.getElementById('sound-waves');
    const ctx = canvas.getContext('2d');

    // Load initial settings into inputs
    apiKeyInput.value = jarvis.apiKey;
    modelSelect.value = jarvis.model;
    if (voiceEngineSelect) voiceEngineSelect.value = jarvis.voiceEngine;
    if (elevenVoiceInput) elevenVoiceInput.value = jarvis.elevenLabsVoiceId || 'r1KmysJdVYZjJCm4mL3b';
    if (elevenKeyInput) elevenKeyInput.value = jarvis.elevenLabsApiKey;
    voicePitchInput.value = jarvis.voicePitch;
    voiceRateInput.value = jarvis.voiceRate;
    autoSpeakToggle.checked = jarvis.autoSpeak;

    // HUD Clock
    function updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${hrs}:${mins}:${secs}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Battery API
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateBattery() {
                const level = Math.round(battery.level * 100);
                batteryEl.textContent = `${level}%`;
            }
            updateBattery();
            battery.addEventListener('levelchange', updateBattery);
        }).catch(() => {
            batteryEl.textContent = '100%';
        });
    } else {
        batteryEl.textContent = '100%';
    }

    // Audio Visualizer Canvas
    let wavePhase = 0;
    function drawWave() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width;
        const h = canvas.height;
        const centerY = h / 2;

        const isActive = jarvis.isListening || jarvis.isSpeaking;
        const amplitude = jarvis.isListening ? 14 : (jarvis.isSpeaking ? 18 : 3);
        const waveColor = jarvis.isListening ? '#ff3d00' : (jarvis.isSpeaking ? '#00e676' : '#00e5ff');
        const speed = isActive ? 0.22 : 0.05;

        wavePhase += speed;

        ctx.beginPath();
        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = isActive ? 12 : 4;
        ctx.shadowColor = waveColor;

        for (let x = 0; x < w; x++) {
            const freq = 0.04;
            const y = centerY + Math.sin(x * freq + wavePhase) * amplitude * Math.sin((x / w) * Math.PI);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        requestAnimationFrame(drawWave);
    }
    drawWave();

    // UI Message Appender
    function appendMessage(sender, text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-msg' : 'jarvis-msg'}`;

        const senderDiv = document.createElement('div');
        senderDiv.className = 'msg-sender';
        senderDiv.textContent = sender;

        const textDiv = document.createElement('div');
        textDiv.className = 'msg-text';
        if (isUser) {
            textDiv.textContent = text;
        } else {
            textDiv.innerHTML = text;
        }

        const timeDiv = document.createElement('div');
        timeDiv.className = 'msg-time';
        const now = new Date();
        timeDiv.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        msgDiv.appendChild(senderDiv);
        msgDiv.appendChild(textDiv);
        msgDiv.appendChild(timeDiv);

        feedMessages.appendChild(msgDiv);
        feedMessages.scrollTop = feedMessages.scrollHeight;
    }

    // Process User Query
    async function handleUserQuery(query) {
        if (!query || !query.trim()) return;
        const cleanQuery = query.trim();

        appendMessage('YOU', cleanQuery, true);
        userTextInput.value = '';

        // Local shortcuts
        const lower = cleanQuery.toLowerCase();
        if (lower.includes('clear screen') || lower.includes('clear feed') || lower.includes('clear chat')) {
            feedMessages.innerHTML = '';
            jarvis.speak('Screen cleared, Sir.');
            return;
        }

        if (lower.includes('setting') || lower.includes('api key') || lower.includes('config') || lower.includes('key')) {
            settingsModal.classList.add('active');
            appendMessage('J.A.R.V.I.S.', 'Opening System Configuration for you, Sir. Paste your Gemini API key and tap SAVE CONFIG.<br><button onclick="document.getElementById(\'open-settings-btn\').click()" style="margin-top:8px; display:inline-block; background:#00e5ff; color:#030812; font-family:\'Orbitron\',sans-serif; font-weight:bold; font-size:0.75rem; padding:6px 12px; border:none; border-radius:4px; cursor:pointer;">⚙️ OPEN SETTINGS</button>', false);
            jarvis.speak('Opening System Configuration for you, Sir.');
            return;
        }

        reactorStatus.textContent = 'PROCESSING QUERY...';
        reactorContainer.classList.add('speaking');

        try {
            const reply = await jarvis.queryGemini(cleanQuery);
            appendMessage('J.A.R.V.I.S.', reply, false);
            jarvis.speak(reply);
        } catch (e) {
            console.error(e);
            appendMessage('J.A.R.V.I.S.', 'Apologies, Sir. An internal exception occurred.', false);
        } finally {
            if (!jarvis.isSpeaking) {
                reactorContainer.classList.remove('speaking');
                reactorStatus.textContent = 'STANDBY // TAP TO SPEAK';
            }
        }
    }

    // Voice State Callbacks
    jarvis.onListeningChange = (listening) => {
        if (listening) {
            reactorContainer.classList.add('listening');
            reactorContainer.classList.remove('speaking');
            reactorStatus.textContent = 'LISTENING // SPEAK NOW';
        } else {
            reactorContainer.classList.remove('listening');
            reactorStatus.textContent = 'STANDBY // TAP TO SPEAK';
        }
    };

    jarvis.onSpeakingChange = (speaking) => {
        if (speaking) {
            reactorContainer.classList.add('speaking');
            reactorContainer.classList.remove('listening');
            reactorStatus.textContent = 'AUDIO TRANSMISSION ACTIVE';
        } else {
            reactorContainer.classList.remove('speaking');
            reactorStatus.textContent = 'STANDBY // TAP TO SPEAK';
        }
    };

    jarvis.onSpeechResult = (text) => {
        handleUserQuery(text);
    };

    // Global hook for Android Native Bridge to pass speech results
    window.onAndroidSpeechResult = (text) => {
        jarvis.isListening = false;
        jarvis.onListeningChange(false);
        handleUserQuery(text);
    };

    window.onAndroidSpeechError = (err) => {
        jarvis.isListening = false;
        jarvis.onListeningChange(false);
        console.warn('Android speech error:', err);
    };

    window.onAndroidTTSFinished = () => {
        jarvis.isSpeaking = false;
        jarvis.onSpeakingChange(false);
    };

    // Reactor Core Click -> Toggle Mic
    reactorTrigger.addEventListener('click', () => {
        if (jarvis.isListening) {
            jarvis.stopListening();
        } else if (jarvis.isSpeaking) {
            jarvis.stopSpeaking();
        } else {
            jarvis.startListening();
        }
    });

    // Send text button & Enter key
    sendBtn.addEventListener('click', () => {
        handleUserQuery(userTextInput.value);
    });

    userTextInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleUserQuery(userTextInput.value);
        }
    });

    // Quick chips
    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const cmd = chip.getAttribute('data-cmd');
            handleUserQuery(cmd);
        });
    });

    // Clear feed
    clearFeedBtn.addEventListener('click', () => {
        feedMessages.innerHTML = '';
        appendMessage('J.A.R.V.I.S.', 'Display buffer purged, Sir.', false);
    });

    // Settings Modal
    openSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    const quickSettingsBtn = document.getElementById('quick-settings-btn');
    if (quickSettingsBtn) {
        quickSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        jarvis.saveConfig(
            apiKeyInput.value,
            modelSelect.value,
            voicePitchInput.value,
            voiceRateInput.value,
            autoSpeakToggle.checked,
            elevenKeyInput ? elevenKeyInput.value : '',
            elevenVoiceInput ? elevenVoiceInput.value : 'r1KmysJdVYZjJCm4mL3b',
            voiceEngineSelect ? voiceEngineSelect.value : 'elevenlabs'
        );
        settingsModal.classList.remove('active');
        appendMessage('J.A.R.V.I.S.', 'Configuration updated and verified, Sir. Voice engine set to: ' + (voiceEngineSelect ? voiceEngineSelect.value : 'elevenlabs'), false);
        jarvis.speak('Configuration parameters saved.');
    });
});
