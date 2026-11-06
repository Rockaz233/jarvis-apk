/**
 * J.A.R.V.I.S. Core Engine
 * Integrates Google Gemini API, Hybrid Speech Recognition & TTS
 */

class JarvisCore {
    constructor() {
        this.apiKey = localStorage.getItem('jarvis_gemini_api_key') || '';
        this.model = localStorage.getItem('jarvis_gemini_model') || 'gemini-2.0-flash';
        this.voicePitch = parseFloat(localStorage.getItem('jarvis_voice_pitch') || '0.95');
        this.voiceRate = parseFloat(localStorage.getItem('jarvis_voice_rate') || '1.05');
        this.autoSpeak = localStorage.getItem('jarvis_auto_speak') !== 'false';

        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synth = window.speechSynthesis || null;

        this.conversationHistory = [];
        this.systemInstruction = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the legendary AI assistant originally created by Tony Stark.
Personality traits:
- Sophisticated, polite, supremely intelligent, slightly witty and British in manner.
- Address the user respectfully as 'Sir' or 'Boss'.
- Keep your answers concise, impactful, and conversational because your response will be read aloud via voice synthesis.
- If the user talks to you in Hindi or Hinglish (e.g., 'kya haal hai', 'weather kaisa hai'), respond in friendly, polished Hindi/Hinglish with your signature Jarvis charm.
- Never output long markdown tables or bulky raw code unless explicitly requested. Give direct, sharp answers.`;

        this.initSpeechRecognition();
    }

    saveConfig(apiKey, model, pitch, rate, autoSpeak) {
        this.apiKey = apiKey.trim();
        this.model = model;
        this.voicePitch = parseFloat(pitch);
        this.voiceRate = parseFloat(rate);
        this.autoSpeak = autoSpeak;

        localStorage.setItem('jarvis_gemini_api_key', this.apiKey);
        localStorage.setItem('jarvis_gemini_model', this.model);
        localStorage.setItem('jarvis_voice_pitch', this.voicePitch.toString());
        localStorage.setItem('jarvis_voice_rate', this.voiceRate.toString());
        localStorage.setItem('jarvis_auto_speak', this.autoSpeak.toString());
    }

    initSpeechRecognition() {
        // Fallback for browser if not inside Android native app
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                if (this.onListeningChange) this.onListeningChange(true);
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (this.onSpeechResult) this.onSpeechResult(transcript);
            };

            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                this.isListening = false;
                if (this.onListeningChange) this.onListeningChange(false);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.onListeningChange) this.onListeningChange(false);
            };
        }
    }

    startListening() {
        // 1. If running inside Android APK with native Android interface:
        if (window.Android && typeof window.Android.startListening === 'function') {
            this.isListening = true;
            if (this.onListeningChange) this.onListeningChange(true);
            window.Android.startListening();
            return;
        }

        // 2. Otherwise use browser Web Speech API:
        if (this.recognition) {
            try {
                this.recognition.start();
            } catch (e) {
                console.warn('Recognition start error:', e);
            }
        } else {
            alert('Speech Recognition is not supported on this browser. In Android APK, native speech is used.');
        }
    }

    stopListening() {
        if (window.Android && typeof window.Android.stopListening === 'function') {
            window.Android.stopListening();
        } else if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        if (this.onListeningChange) this.onListeningChange(false);
    }

    speak(text) {
        if (!this.autoSpeak || !text) return;

        // Clean text for speech (remove markdown asterisks, urls, etc.)
        const cleanText = text
            .replace(/[*_#`~\[\]]/g, '')
            .replace(/https?:\/\/\S+/g, 'link')
            .trim();

        // 1. If running in Android native APK
        if (window.Android && typeof window.Android.speak === 'function') {
            this.isSpeaking = true;
            if (this.onSpeakingChange) this.onSpeakingChange(true);
            window.Android.speak(cleanText);
            return;
        }

        // 2. Browser SpeechSynthesis fallback
        if (!this.synth) return;
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.pitch = this.voicePitch;
        utterance.rate = this.voiceRate;

        // Try selecting a good English voice
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Male'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (this.onSpeakingChange) this.onSpeakingChange(true);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (this.onSpeakingChange) this.onSpeakingChange(false);
        };

        utterance.onerror = () => {
            this.isSpeaking = false;
            if (this.onSpeakingChange) this.onSpeakingChange(false);
        };

        this.synth.speak(utterance);
    }

    stopSpeaking() {
        if (window.Android && typeof window.Android.stopSpeaking === 'function') {
            window.Android.stopSpeaking();
        } else if (this.synth) {
            this.synth.cancel();
        }
        this.isSpeaking = false;
        if (this.onSpeakingChange) this.onSpeakingChange(false);
    }

    // Call Google Gemini API (100% Free API)
    async queryGemini(userPrompt) {
        if (!this.apiKey) {
            return "Sir, I require an active Google Gemini API key to access full cognitive functions. Please open Settings (⚙) and paste your free API key.";
        }

        // Add user message to history
        this.conversationHistory.push({
            role: "user",
            parts: [{ text: userPrompt }]
        });

        // Keep last 10 messages for memory context
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const payload = {
            contents: this.conversationHistory,
            systemInstruction: {
                parts: [{ text: this.systemInstruction }]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
                topP: 0.95
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${response.status}`;
                console.error("Gemini API Error:", errMsg);
                return `Sir, diagnostic error detected: ${errMsg}. Please verify your API key in Settings.`;
            }

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (reply) {
                this.conversationHistory.push({
                    role: "model",
                    parts: [{ text: reply }]
                });
                return reply.trim();
            } else {
                return "I processed your request, Sir, but received an empty transmission from the neural network.";
            }
        } catch (error) {
            console.error("Network / Fetch Error:", error);
            return "Sir, communications network failure. Unable to reach satellite relay. Please check your internet connection.";
        }
    }
}
