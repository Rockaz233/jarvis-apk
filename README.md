# 🤖 J.A.R.V.I.S. AI - Android Voice Assistant (100% Free)

A futuristic, Iron Man-inspired voice AI assistant app powered by **Google Gemini 2.0 / 1.5 Flash API**, built for Android.

---

## ✨ Features
- 🎙️ **Two-Way Voice Communication**: Bol kar baat karein (Speech-to-Text) aur Jarvis bol kar reply dega (Text-to-Speech).
- 🧠 **Google Gemini AI Brain**: Fast, intelligent reasoning powered by Google's free Gemini Flash models.
- 💬 **Bilingual Persona**: English aur Hindi/Hinglish dono samajhta hai aur fluent jawab deta hai.
- ⚛️ **Futuristic Arc Reactor HUD**: Dynamic glowing visualizer, soundwaves, and sci-fi theme.
- ⚡ **Zero Cost (100% Free)**: Google Gemini free tier ke through lifetime free usage without any credit card.
- 📦 **Automated GitHub Actions APK Build**: GitHub par push karte hi automatic `.apk` file compile hokar direct download ke liye mil jati hai.

---

## 🔑 Step 1: Free Gemini API Key Kaise Lein (1 Minute)
1. Apne phone ya computer ke browser mein [Google AI Studio](https://aistudio.google.com/app/apikey) open karein.
2. Apne Google account se sign in karein.
3. **"Create API Key"** button par click karein.
4. Apni API Key copy kar lein (e.g., `AIzaSy...`).

---

## 🚀 Step 2: Instant Phone Preview (Bina APK banaye abhi test karein)
Aap is app ko direct apne phone ke browser mein run karke voice aur Gemini test kar sakte hain:

```bash
cd /data/user/0/com.termux/files/home/.gemini/antigravity-cli/scratch/jarvis-android-app
node preview-server.js
```
Ab browser mein **`http://localhost:3000`** open karein:
- Settings (⚙) icon par click karein aur apni Gemini API Key paste karein.
- Center ke Arc Reactor / Mic button par tap karke baat karein!

---

## 📲 Step 3: Real Android APK File Kaise Banayein (GitHub Actions se)

Humne is project mein automated **GitHub Actions** CI/CD setup kiya hai. Aapko apne computer ya Termux mein koi heavy Android SDK ya Java install karne ki zaroorat nahi hai!

### 1. GitHub par ek naya repository banayein:
- [github.com/new](https://github.com/new) par jayein.
- Repository ka naam rakhein (e.g., `my-jarvis-apk`).
- Public ya Private select karein aur **Create repository** par click karein.

### 2. Termux se code push karein:
```bash
cd /data/user/0/com.termux/files/home/.gemini/antigravity-cli/scratch/jarvis-android-app
git init
git add .
git commit -m "Initialize Jarvis Android Voice Assistant"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### 3. APK Download karein:
1. Apne GitHub repository page par jayein aur upar **Actions** tab par click karein.
2. **Build Jarvis Android APK** workflow automatically run hona start ho jayega (~2 minutes).
3. Build complete hone ke baad run par click karein aur neeche **Artifacts** section se `Jarvis-AI-Android-APK` zip file download karein!
4. Ya fir repository ke **Releases** page par jayein, wahan direct installable `.apk` file attach milegi.
5. Apne Android phone par install karein aur open karein!

---

## 📁 Project Structure
```
jarvis-android-app/
├── .github/workflows/build-apk.yml   # Automatic GitHub Cloud APK compiler
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml       # Permissions (Mic, Internet, Audio)
│   │   ├── assets/web/               # Futuristic Sci-Fi UI + Voice Engine
│   │   │   ├── index.html            # Stark HUD UI
│   │   │   ├── style.css             # Arc Reactor glowing animations
│   │   │   ├── jarvis-core.js        # Gemini API & Voice Synthesis
│   │   │   └── app.js                # Event handlers & sound visualizer
│   │   ├── java/com/jarvis/ai/
│   │   │   ├── MainActivity.java     # Android Webview shell
│   │   │   └── WebAppInterface.java  # Native Android TTS & Speech bridge
│   │   └── res/                      # Android resources & vector icons
│   └── build.gradle                  # App build configuration
├── build.gradle                      # Root gradle build configuration
├── settings.gradle                   # Gradle project settings
├── preview-server.js                 # Zero-dependency local preview server
└── README.md
```
