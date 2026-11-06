package com.jarvis.ai;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Locale;

public class WebAppInterface {
    private final Context context;
    private final WebView webView;
    private TextToSpeech tts;
    private SpeechRecognizer speechRecognizer;
    private final Handler mainHandler;
    private boolean isTtsInitialized = false;

    public WebAppInterface(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
        this.mainHandler = new Handler(Looper.getMainLooper());
        initTTS();
    }

    private void initTTS() {
        tts = new TextToSpeech(context, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int result = tts.setLanguage(Locale.US);
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setLanguage(Locale.getDefault());
                }
                tts.setPitch(0.95f);
                tts.setSpeechRate(1.05f);
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {}

                    @Override
                    public void onDone(String utteranceId) {
                        runJs("window.onAndroidTTSFinished && window.onAndroidTTSFinished();");
                    }

                    @Override
                    public void onError(String utteranceId) {
                        runJs("window.onAndroidTTSFinished && window.onAndroidTTSFinished();");
                    }
                });
                isTtsInitialized = true;
            }
        });
    }

    @JavascriptInterface
    public void speak(final String text) {
        mainHandler.post(() -> {
            if (tts != null && isTtsInitialized) {
                Bundle params = new Bundle();
                params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "JARVIS_TTS_" + System.currentTimeMillis());
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "JARVIS_TTS");
            }
        });
    }

    @JavascriptInterface
    public void stopSpeaking() {
        mainHandler.post(() -> {
            if (tts != null) {
                tts.stop();
            }
        });
    }

    @JavascriptInterface
    public void startListening() {
        mainHandler.post(() -> {
            if (!SpeechRecognizer.isRecognitionAvailable(context)) {
                Toast.makeText(context, "Speech recognition not available on this device", Toast.LENGTH_SHORT).show();
                runJs("window.onAndroidSpeechError && window.onAndroidSpeechError('Not available');");
                return;
            }

            if (speechRecognizer != null) {
                speechRecognizer.destroy();
            }

            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context);
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(Bundle params) {}

                @Override
                public void onBeginningOfSpeech() {}

                @Override
                public void onRmsChanged(float rmsdB) {}

                @Override
                public void onBufferReceived(byte[] buffer) {}

                @Override
                public void onEndOfSpeech() {}

                @Override
                public void onError(int error) {
                    runJs("window.onAndroidSpeechError && window.onAndroidSpeechError('Error code: " + error + "');");
                }

                @Override
                public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        String recognizedText = matches.get(0).replace("'", "\\'").replace("\n", " ");
                        runJs("window.onAndroidSpeechResult && window.onAndroidSpeechResult('" + recognizedText + "');");
                    }
                }

                @Override
                public void onPartialResults(Bundle partialResults) {}

                @Override
                public void onEvent(int eventType, Bundle params) {}
            });

            speechRecognizer.startListening(intent);
        });
    }

    @JavascriptInterface
    public void stopListening() {
        mainHandler.post(() -> {
            if (speechRecognizer != null) {
                speechRecognizer.stopListening();
            }
        });
    }

    @JavascriptInterface
    public void showToast(String message) {
        mainHandler.post(() -> Toast.makeText(context, message, Toast.LENGTH_SHORT).show());
    }

    private void runJs(String script) {
        mainHandler.post(() -> {
            if (webView != null) {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
        }
    }
}
