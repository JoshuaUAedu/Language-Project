// Language names — limited to languages supported by the translation model
const languageNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
};

const MAX_JOURNAL_TITLE_LENGTH = 50;

// Placeholder text per language for each page side
const placeholderSource = {
    en: 'Waiting for transcription... Type or dictate here.',
    es: 'Esperando transcripción... Escriba o dicte aquí.',
    fr: 'En attente de transcription... Tapez ou dictez ici.',
    de: 'Warten auf Transkription... Tippen oder diktieren Sie hier.',
    zh: '等待转录... 在此输入或口述。',
    ja: '文字起こしを待っています... ここに入力または口述してください。',
    ko: '전사를 기다리는 중... 여기에 입력하거나 받아쓰세요.',
};

const placeholderTarget = {
    en: 'Translation pending...',
    es: 'Traducción pendiente...',
    fr: 'Traduction en attente...',
    de: 'Übersetzung ausstehend...',
    zh: '翻译待处理...',
    ja: '翻訳待ち...',
    ko: '번역 대기 중...',
};

// Journal state
const journalState = {
    pages: [{ leftText: '', rightText: '', locked: false }],
    currentPageIndex: 0,
    currentJournalId: null,
    isMicMuted: false,
    isLatinScript: true,
    leftLanguage: 'en',
    rightLanguage: 'es',
    isStudyMode: false,
    studyShowingSource: true,
    studyPageIndex: 0,
};

// Audio streaming state
const streamState = {
    mediaStream: null,
    audioContext: null,
    scriptProcessor: null,
    sampleBuffer: [],
    totalSamples: 0,
    isStreaming: false,
    overlapTail: null,   // Float32Array — tail of last sent chunk prepended for Whisper context
    prevWords: [],       // last N words sent, used for overlap dedup
    _typingTimeouts: [],
    _shrinkTimer: null,
};

const SERVER_URL = `http://${GPU_IP}:8000`;

// Live bar chunking parameters — mirrors test_librispeech_transcript.py
const MIN_CHUNK_SEC       = 2.0;
const MAX_CHUNK_SEC       = 6.0;   // force-cut ceiling — prevents unbounded buffers
const SILENCE_SEARCH_SEC  = 0.5;
const SILENCE_WINDOW_SEC  = 0.05;
const MIN_AUDIO_ENERGY    = 0.01;
const OVERLAP_SEC         = 0.5;   // seconds of previous chunk to prepend for Whisper context
const OVERLAP_MATCH_WORDS = 6;     // max words to try matching when stripping overlap
const WHISPER_HALLUCINATIONS = new Set(
    ['mbc', 'you', 'bye', 'thank', 'thanks', 'thank you', 'goodbye']
);

// Journal transcription parameters — mirrors full_transcript_typed.py
const FULL_MIN_CHUNK_SEC      = 5.0;
const FULL_SILENCE_SEARCH_SEC = 1.5;
const FULL_MAX_DURATION_MS    = 30000;

const transcribeState = {
    isTranscribing: false,
    audioContext: null,
    scriptProcessor: null,
    sampleBuffer: [],
    totalSamples: 0,
    _maxTimer: null,
    _typingTimeouts: [],
    pendingChunks: 0,  // tracks in-flight server requests
};

// DOM Elements
const englishTextEl         = document.getElementById('english-text');
const spanishTextEl         = document.getElementById('spanish-text');
const journalTitleEl        = document.getElementById('journal-title');
const saveJournalBtn        = document.getElementById('save-journal-btn');
const journalList           = document.getElementById('journal-list');
const profileBtn            = document.getElementById('profile-btn');
const settingsBtn           = document.getElementById('settings-btn');
const micToggleBtn          = document.getElementById('mic-toggle-btn');
const micIcon               = document.getElementById('mic-icon');
const micMutedIcon          = document.getElementById('mic-muted-icon');
const waveform              = document.getElementById('waveform');
const listeningIndicator    = document.getElementById('listening-indicator');
const listeningText         = document.getElementById('listening-text');
const langScriptBtn         = document.getElementById('lang-script-btn');
const langScriptAbc         = document.getElementById('lang-script-abc');
const langScriptChar        = document.getElementById('lang-script-char');
const languageLeftBtn       = document.getElementById('language-left-btn');
const languageLeftLabel     = document.getElementById('language-left-label');
const languageLeftDropdown  = document.getElementById('language-left-dropdown');
const languageRightBtn      = document.getElementById('language-right-btn');
const languageRightLabel    = document.getElementById('language-right-label');
const languageRightDropdown = document.getElementById('language-right-dropdown');
const swapLangBtn           = document.getElementById('swap-lang-btn');
const newJournalBtn         = document.getElementById('new-journal-btn');
const studyBtn              = document.getElementById('study-btn');
const transcribeBtn         = document.getElementById('transcribe-btn');
const transcribeIndicator   = document.getElementById('transcribe-indicator');
const notebookEl            = document.querySelector('.notebook');
const notebookSpread        = document.getElementById('notebook-spread');
const studyModeView         = document.getElementById('study-mode-view');
const studyCardInner        = document.getElementById('study-card-inner');
const studySourceLabel      = document.getElementById('study-source-label');
const studySourceText       = document.getElementById('study-source-text');
const studyTargetLabel      = document.getElementById('study-target-label');
const studyTargetText       = document.getElementById('study-target-text');
const flipPageBtn           = document.getElementById('flip-page-btn');
const flipPageBtnText       = document.getElementById('flip-page-btn-text');
const missedBtn             = document.getElementById('missed-btn');
const correctBtn            = document.getElementById('correct-btn');
const missedCountEl         = document.getElementById('missed-count');
const correctCountEl        = document.getElementById('correct-count');
const prevPageBtn           = document.getElementById('prev-page-btn');
const nextPageBtn           = document.getElementById('next-page-btn');
const deletePageBtn         = document.getElementById('delete-page-btn');
const confidenceToggleBtn   = document.getElementById('confidence-toggle-btn');
const bindingPageIndicator  = document.getElementById('binding-page-indicator');
const studyPrevPageBtn      = document.getElementById('study-prev-page-btn');
const studyNextPageBtn      = document.getElementById('study-next-page-btn');
const studyPageIndicator    = document.getElementById('study-page-indicator');
const speakBtn              = document.getElementById('speak-btn');
const speakBtnText          = document.getElementById('speak-btn-text');
const speakResult           = document.getElementById('speak-result');

// Languages that use non-Latin scripts and need romanization subtitles
const CJK_LANGS = new Set(['zh', 'ja', 'ko']);

// Config: set to true to enable the confidence % toggle button
const FEATURE_CONFIDENCE = false;

// Confidence display toggle
let showConfidence = false;

function confidenceColor(score) {
    if (score === null || score === undefined) return '#D1D5DB';
    if (score >= 0.65) return '#10B981'; // green — high
    if (score >= 0.35) return '#F59E0B'; // amber — medium
    return '#EF4444';                    // red   — low
}

function applyConfidenceToDiv(div, score) {
    if (score === null || score === undefined || isNaN(score)) return;
    const color = confidenceColor(score);
    div.dataset.confidence = score.toFixed(3);
    let label = div.querySelector('.conf-label');
    if (!label) {
        label = document.createElement('span');
        label.className = 'conf-label';
        div.prepend(label);
    }
    label.textContent = `${Math.round(score * 100)}%`;
    label.style.background = color;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    buildLanguageDropdowns();
    initializeEventListeners();
    updatePlaceholders();
    loadJournalEntries();
    checkForExistingJournal();
    renderCurrentPage();
    if (!journalState.isMicMuted) startAudioStreaming();
});

// Event Listeners
function initializeEventListeners() {
    saveJournalBtn.addEventListener('click', saveJournal);

    englishTextEl.addEventListener('input', handleTextChange);
    englishTextEl.addEventListener('keydown', handleLeftPageEnter);

    journalTitleEl.addEventListener('keydown', handleJournalTitleKeydown);
    journalTitleEl.addEventListener('input', enforceJournalTitleLength);
    journalTitleEl.addEventListener('paste', handleJournalTitlePaste);

    micToggleBtn.addEventListener('click', toggleMicrophone);
    langScriptBtn.addEventListener('click', toggleLanguageScript);

    languageLeftBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLanguageDropdown('left');
    });
    languageRightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLanguageDropdown('right');
    });

    document.addEventListener('click', closeLanguageDropdowns);

    profileBtn.addEventListener('click', () => { alert('Profile settings coming soon!'); });
    settingsBtn.addEventListener('click', () => { alert('Settings coming soon!'); });

    swapLangBtn.addEventListener('click', swapLanguages);
    newJournalBtn.addEventListener('click', startNewJournal);

    studyBtn.addEventListener('click', toggleStudyMode);
    flipPageBtn.addEventListener('click', flipStudyPage);
    missedBtn.addEventListener('click', () => recordStudyScore('missed'));
    correctBtn.addEventListener('click', () => recordStudyScore('correct'));
    speakBtn.addEventListener('click', handleSpeakBtn);

    transcribeBtn.addEventListener('click', toggleTranscription);
    confidenceToggleBtn.style.display = FEATURE_CONFIDENCE ? '' : 'none';
    if (FEATURE_CONFIDENCE) confidenceToggleBtn.addEventListener('click', toggleConfidenceDisplay);

    // Page navigation
    deletePageBtn.addEventListener('click', deleteCurrentPage);
    prevPageBtn.addEventListener('click', () => goToPage(journalState.currentPageIndex - 1));
    nextPageBtn.addEventListener('click', () => {
        if (journalState.currentPageIndex === journalState.pages.length - 1) {
            addNewPage();
        } else {
            goToPage(journalState.currentPageIndex + 1);
        }
    });

    // Study mode page navigation
    studyPrevPageBtn.addEventListener('click', () => goToStudyPage(journalState.studyPageIndex - 1));
    studyNextPageBtn.addEventListener('click', () => goToStudyPage(journalState.studyPageIndex + 1));
}

// ── Page Management ───────────────────────────────────────────────────────────

function stripRomanized(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('.romanized').forEach(n => n.remove());
    return clone.innerHTML;
}

function saveCurrentPageToState() {
    const page = journalState.pages[journalState.currentPageIndex];
    page.leftText      = stripRomanized(englishTextEl);
    page.rightText     = stripRomanized(spanishTextEl);
    page.leftLanguage  = journalState.leftLanguage;
    page.rightLanguage = journalState.rightLanguage;
}

function renderCurrentPage() {
    const page = journalState.pages[journalState.currentPageIndex];
    // Restore per-page language pair before rendering
    if (page.leftLanguage)  journalState.leftLanguage  = page.leftLanguage;
    if (page.rightLanguage) journalState.rightLanguage = page.rightLanguage;
    updateLanguageButtonLabels();
    updateLanguageOptionSelected();
    updatePlaceholders();
    englishTextEl.innerHTML = page.leftText || '';
    spanishTextEl.innerHTML = page.rightText || '';
    // Apply locked state — locked pages are read-only on both sides
    const isLocked = page.locked || false;
    englishTextEl.contentEditable = isLocked ? 'false' : 'true';
    // Lock the source language button whenever there is content — swap still works
    languageLeftBtn.disabled = !!(englishTextEl.textContent.trim() || spanishTextEl.textContent.trim());
    // Re-apply confidence badge colors (inline style lost on innerHTML reset)
    Array.from(spanishTextEl.children).forEach(div => {
        const raw = div.dataset.confidence;
        if (!raw) return;
        const score = parseFloat(raw);
        if (!isNaN(score)) applyConfidenceToDiv(div, score);
    });
    spanishTextEl.classList.toggle('show-confidence', showConfidence);
    updatePageIndicator();
    // Add romanization subtitles for any CJK side
    romanizePageSide(englishTextEl, journalState.leftLanguage);
    romanizePageSide(spanishTextEl, journalState.rightLanguage);
}

function updatePageIndicator() {
    const total      = journalState.pages.length;
    const current    = journalState.currentPageIndex + 1;
    const isLastPage = journalState.currentPageIndex === total - 1;
    bindingPageIndicator.textContent = `Page ${current} of ${total}`;
    prevPageBtn.disabled    = journalState.currentPageIndex === 0;
    nextPageBtn.disabled    = false;
    nextPageBtn.innerHTML   = isLastPage ? '+ New Page' : 'Next &#8594;';
    deletePageBtn.disabled  = false;
}

function deleteCurrentPage() {
    if (journalState.pages.length === 1) {
        // Only page — reset it instead of blocking
        journalState.pages[0] = { leftText: '', rightText: '', locked: false, leftLanguage: journalState.leftLanguage, rightLanguage: journalState.rightLanguage, missed: 0, correct: 0 };
        renderCurrentPage();
        return;
    }
    journalState.pages.splice(journalState.currentPageIndex, 1);
    journalState.currentPageIndex = Math.min(journalState.currentPageIndex, journalState.pages.length - 1);
    renderCurrentPage();
}

function goToPage(index) {
    if (index < 0 || index >= journalState.pages.length) return;
    saveCurrentPageToState();
    journalState.currentPageIndex = index;
    renderCurrentPage();
}

function addNewPage() {
    saveCurrentPageToState();
    journalState.pages.push({ leftText: '', rightText: '', locked: false, leftLanguage: journalState.leftLanguage, rightLanguage: journalState.rightLanguage, missed: 0, correct: 0 });
    journalState.currentPageIndex = journalState.pages.length - 1;
    renderCurrentPage();
}

// ── Language Dropdowns ────────────────────────────────────────────────────────

function buildLanguageDropdowns() {
    const options = Object.entries(languageNames)
        .map(([code, name]) => `<button type="button" class="language-option" data-lang="${code}" role="option">${name}</button>`)
        .join('');
    languageLeftDropdown.innerHTML  = options;
    languageRightDropdown.innerHTML = options;

    languageLeftDropdown.querySelectorAll('.language-option').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); selectLanguage('left', btn.dataset.lang); });
    });
    languageRightDropdown.querySelectorAll('.language-option').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); selectLanguage('right', btn.dataset.lang); });
    });

    updateLanguageButtonLabels();
    updateLanguageOptionSelected();
}

function toggleLanguageDropdown(side) {
    const btn      = side === 'left' ? languageLeftBtn      : languageRightBtn;
    const dropdown = side === 'left' ? languageLeftDropdown : languageRightDropdown;
    const isOpen   = btn.getAttribute('aria-expanded') === 'true';

    closeLanguageDropdowns();
    if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        dropdown.setAttribute('aria-hidden', 'false');
        dropdown.style.display = 'block';
        updateLanguageOptionSelected();
    }
}

function closeLanguageDropdowns() {
    languageLeftBtn.setAttribute('aria-expanded', 'false');
    languageLeftDropdown.setAttribute('aria-hidden', 'true');
    languageLeftDropdown.style.display = 'none';
    languageRightBtn.setAttribute('aria-expanded', 'false');
    languageRightDropdown.setAttribute('aria-hidden', 'true');
    languageRightDropdown.style.display = 'none';
}

function isCurrentPageLocked() {
    return !!(journalState.pages[journalState.currentPageIndex] || {}).locked;
}

function selectLanguage(side, code) {
    const hasContent = !!(englishTextEl.textContent.trim() || spanishTextEl.textContent.trim());
    if (side === 'left'  && hasContent)                          { closeLanguageDropdowns(); return; }
    if (side === 'left'  && code === journalState.rightLanguage) return;
    if (side === 'right' && code === journalState.leftLanguage)  return;

    if (side === 'left') {
        journalState.leftLanguage = code;
        languageLeftLabel.textContent = languageNames[code];
    } else {
        journalState.rightLanguage = code;
        languageRightLabel.textContent = languageNames[code];
        // If the left page has content, retranslate the right page
        if (englishTextEl.textContent.trim()) retranslateRightPage();
    }
    updateLanguageOptionSelected();
    updatePlaceholders();
    closeLanguageDropdowns();
}

function swapLanguages() {
    [journalState.leftLanguage, journalState.rightLanguage] =
        [journalState.rightLanguage, journalState.leftLanguage];
    updateLanguageButtonLabels();
    updateLanguageOptionSelected();
    updatePlaceholders();
    // If either side has content, swap the text as well
    if (englishTextEl.textContent.trim() || spanishTextEl.textContent.trim()) {
        const leftHTML = englishTextEl.innerHTML;
        englishTextEl.innerHTML = spanishTextEl.innerHTML;
        spanishTextEl.innerHTML = leftHTML;
        saveCurrentPageToState();
        renderCurrentPage();
    }
}

function updateLanguageButtonLabels() {
    languageLeftLabel.textContent  = languageNames[journalState.leftLanguage];
    languageRightLabel.textContent = languageNames[journalState.rightLanguage];
}

function updatePlaceholders() {
    englishTextEl.dataset.placeholder = placeholderSource[journalState.leftLanguage]  || placeholderSource.en;
    spanishTextEl.dataset.placeholder = placeholderTarget[journalState.rightLanguage] || placeholderTarget.en;
}

function updateLanguageOptionSelected() {
    languageLeftDropdown.querySelectorAll('.language-option').forEach(opt => {
        opt.classList.toggle('is-selected', opt.dataset.lang === journalState.leftLanguage);
        opt.disabled = opt.dataset.lang === journalState.rightLanguage;
    });
    languageRightDropdown.querySelectorAll('.language-option').forEach(opt => {
        opt.classList.toggle('is-selected', opt.dataset.lang === journalState.rightLanguage);
        opt.disabled = opt.dataset.lang === journalState.leftLanguage;
    });
}

// Toggle Confidence Display
function toggleConfidenceDisplay() {
    showConfidence = !showConfidence;
    spanishTextEl.classList.toggle('show-confidence', showConfidence);
    confidenceToggleBtn.classList.toggle('active', showConfidence);
}

// Toggle Microphone Mute
function toggleMicrophone() {
    journalState.isMicMuted = !journalState.isMicMuted;
    updateMicrophoneUI();
}

// Toggle Language Script (Latin abc ↔ International 文)
function toggleLanguageScript() {
    journalState.isLatinScript = !journalState.isLatinScript;
    updateLanguageScriptUI();

    if (!journalState.isMicMuted) {
        streamState._typingTimeouts.forEach(id => clearTimeout(id));
        streamState._typingTimeouts = [];
        clearTimeout(streamState._shrinkTimer);
        listeningText.textContent = journalState.isLatinScript
            ? 'Listening for transcription...'
            : 'Listening for translation...';
        listeningIndicator.style.maxWidth = '';
    }
}

function updateLanguageScriptUI() {
    if (journalState.isLatinScript) {
        langScriptAbc.style.display = '';
        langScriptChar.style.display = 'none';
        langScriptBtn.setAttribute('aria-label', 'Toggle script: Latin (current)');
    } else {
        langScriptAbc.style.display = 'none';
        langScriptChar.style.display = '';
        langScriptBtn.setAttribute('aria-label', 'Toggle script: International (current)');
    }
}

function updateMicrophoneUI() {
    if (journalState.isMicMuted) {
        micIcon.style.display = 'none';
        micMutedIcon.style.display = 'block';
        waveform.classList.add('muted');
        listeningIndicator.classList.add('muted');
        listeningText.textContent = 'Microphone muted';
        stopAudioStreaming();
    } else {
        micIcon.style.display = 'block';
        micMutedIcon.style.display = 'none';
        waveform.classList.remove('muted');
        listeningIndicator.classList.remove('muted');
        listeningText.textContent = journalState.isLatinScript
            ? 'Listening for transcription...'
            : 'Listening for translation...';
        startAudioStreaming();
    }
}

// ── Audio Streaming ─────────────────────────────────────────────────────────

async function startAudioStreaming() {
    if (streamState.isStreaming) return;
    try {
        streamState.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        streamState.audioContext = new AudioCtx();

        const sampleRate = streamState.audioContext.sampleRate;
        const source     = streamState.audioContext.createMediaStreamSource(streamState.mediaStream);
        const processor  = streamState.audioContext.createScriptProcessor(4096, 1, 1);
        streamState.scriptProcessor = processor;
        streamState.sampleBuffer    = [];
        streamState.totalSamples    = 0;
        streamState.isStreaming     = true;

        const minSamples    = Math.floor(sampleRate * MIN_CHUNK_SEC);
        const maxSamples    = Math.floor(sampleRate * MAX_CHUNK_SEC);
        const searchSamples = Math.floor(sampleRate * SILENCE_SEARCH_SEC);
        streamState.overlapTail = null;
        streamState.prevWords   = [];

        processor.onaudioprocess = e => {
            if (!streamState.isStreaming) return;
            const input = e.inputBuffer.getChannelData(0);
            streamState.sampleBuffer.push(new Float32Array(input));
            streamState.totalSamples += input.length;
            const naturalTrigger = streamState.totalSamples >= minSamples + searchSamples;
            const forceCut       = streamState.totalSamples >= maxSamples;
            if (naturalTrigger || forceCut) {
                processBuffer(sampleRate, minSamples, maxSamples, forceCut);
            }
        };

        const silentGain = streamState.audioContext.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(streamState.audioContext.destination);

    } catch (err) {
        console.warn('Microphone access denied:', err);
        listeningText.textContent = 'Microphone access denied';
    }
}

function stopAudioStreaming() {
    streamState.isStreaming = false;
    streamState._typingTimeouts.forEach(id => clearTimeout(id));
    streamState._typingTimeouts = [];
    clearTimeout(streamState._shrinkTimer);

    if (streamState.scriptProcessor) { streamState.scriptProcessor.disconnect(); streamState.scriptProcessor = null; }
    if (streamState.audioContext)    { streamState.audioContext.close();         streamState.audioContext    = null; }
    if (streamState.mediaStream)     { streamState.mediaStream.getTracks().forEach(t => t.stop()); streamState.mediaStream = null; }
    streamState.sampleBuffer = [];
    streamState.totalSamples = 0;
    streamState.overlapTail  = null;
    streamState.prevWords    = [];
}

// ── Chunking (mirrors test_librispeech_transcript.py logic) ──────────────────

function processBuffer(sampleRate, minSamples, maxSamples, forceCut) {
    const flat = new Float32Array(streamState.totalSamples);
    let offset = 0;
    for (const chunk of streamState.sampleBuffer) { flat.set(chunk, offset); offset += chunk.length; }

    // On a forced max-duration cut, search near the max boundary rather than min
    const cutTarget = forceCut
        ? Math.max(minSamples, maxSamples - Math.floor(sampleRate * SILENCE_SEARCH_SEC / 2))
        : minSamples;
    const cutPoint  = findCutPoint(flat, cutTarget, sampleRate);
    const sendAudio = flat.slice(0, cutPoint);
    const remaining = flat.slice(cutPoint);

    streamState.sampleBuffer = [remaining];
    streamState.totalSamples = remaining.length;

    if (computeRMS(sendAudio) < MIN_AUDIO_ENERGY) return;

    // Prepend overlap tail from previous chunk so Whisper has context
    const overlapSamples = Math.floor(sampleRate * OVERLAP_SEC);
    const audioWithOverlap = streamState.overlapTail
        ? concatFloat32(streamState.overlapTail, sendAudio)
        : sendAudio;

    // Save the tail of this chunk for the next iteration
    streamState.overlapTail = sendAudio.length > overlapSamples
        ? sendAudio.slice(sendAudio.length - overlapSamples)
        : sendAudio.slice();

    const chunkSeconds = audioWithOverlap.length / sampleRate;
    sendAudioChunk(encodeWAV(audioWithOverlap, sampleRate), chunkSeconds);
}

function concatFloat32(a, b) {
    const out = new Float32Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}

function findCutPoint(audio, targetSample, sampleRate) {
    const win        = Math.floor(sampleRate * SILENCE_WINDOW_SEC);
    const searchSpan = Math.floor(sampleRate * SILENCE_SEARCH_SEC);
    const lo   = Math.max(0, targetSample - searchSpan);
    const hi   = Math.min(audio.length - win, targetSample + Math.floor(searchSpan / 2));
    const step = Math.max(1, Math.floor(win / 2));
    let bestPos = targetSample, minRms = Infinity;
    for (let i = lo; i < hi; i += step) {
        const rms = computeRMS(audio.subarray(i, i + win));
        if (rms < minRms) { minRms = rms; bestPos = i; }
    }
    return bestPos;
}

function computeRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    return Math.sqrt(sum / samples.length);
}

function encodeWAV(samples, sampleRate) {
    const dataLen = samples.length * 2;
    const buf  = new ArrayBuffer(44 + dataLen);
    const view = new DataView(buf);
    const str  = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

    str(0, 'RIFF'); view.setUint32(4,  36 + dataLen, true);
    str(8, 'WAVE'); str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20,  1, true);
    view.setUint16(22,  1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32,  2, true);
    view.setUint16(34, 16, true);
    str(36, 'data'); view.setUint32(40, dataLen, true);

    let off = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
    }
    return new Blob([buf], { type: 'audio/wav' });
}

async function sendAudioChunk(blob, chunkSeconds) {
    try {
        const formData = new FormData();
        formData.append('file', blob, 'chunk.wav');
        formData.append('source_lang', journalState.leftLanguage);
        formData.append('target_lang', journalState.rightLanguage);
        const response = await fetch(`${SERVER_URL}/transcribe`, { method: 'POST', body: formData });
        if (!response.ok) return;
        const data = await response.json();
        const text = (journalState.isLatinScript ? data.transcription : data.translation || '').trim();
        if (text) showTranscriptionChunk(text, chunkSeconds);
    } catch (err) {
        console.warn('Chunk send failed:', err);
    }
}

// ── Overlap deduplication (mirrors strip_overlap in test_librispeech_transcript.py) ──

function stripOverlap(prevWords, newWords) {
    const canonical = ws => ws.map(w => w.toLowerCase().replace(/[.,!?;:]/g, ''));
    for (let len = Math.min(OVERLAP_MATCH_WORDS, prevWords.length, newWords.length); len > 0; len--) {
        if (canonical(prevWords.slice(-len)).join(' ') === canonical(newWords.slice(0, len)).join(' ')) {
            return newWords.slice(len);
        }
    }
    return newWords;
}

// ── Typing animation (mirrors typing_worker in live_transcript_typed.py) ────

function showTranscriptionChunk(text, chunkSeconds) {
    let words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return;

    const cleaned = words.map(w => w.replace(/[.,!?]/g, '').toLowerCase());
    if (words.length <= 3 && cleaned.every(w => WHISPER_HALLUCINATIONS.has(w))) return;

    // Strip words already shown from the prepended overlap region
    words = stripOverlap(streamState.prevWords, words);
    if (!words.length) return;

    // Keep the tail of these words for the next chunk's dedup
    streamState.prevWords = words.slice(-OVERLAP_MATCH_WORDS);

    streamState._typingTimeouts.forEach(id => clearTimeout(id));
    streamState._typingTimeouts = [];
    clearTimeout(streamState._shrinkTimer);

    listeningText.textContent = '';
    const delayPerWord = Math.max(50, Math.min(500, (chunkSeconds / words.length) * 1000));

    words.forEach((word, i) => {
        const id = setTimeout(() => {
            listeningText.textContent += (i > 0 ? ' ' : '') + word;
            const extra = Math.min(listeningText.textContent.length * 7, 700);
            listeningIndicator.style.maxWidth = `${320 + extra}px`;
        }, i * delayPerWord);
        streamState._typingTimeouts.push(id);
    });

    const resetId = setTimeout(() => {
        listeningText.textContent = journalState.isLatinScript
            ? 'Listening for transcription...'
            : 'Listening for translation...';
        listeningIndicator.style.maxWidth = '';
    }, words.length * delayPerWord + 5000);
    streamState._shrinkTimer = resetId;
}

// ── Journal Transcription (Transcribe button) ────────────────────────────────

function toggleTranscription() {
    if (transcribeBtn.disabled) return;
    if (transcribeState.isTranscribing) {
        stopTranscription();
    } else {
        startTranscription();
    }
}

async function startTranscription() {
    if (transcribeState.isTranscribing) return;
    try {
        // If current page already has content, start a fresh page
        saveCurrentPageToState();
        const page = journalState.pages[journalState.currentPageIndex];
        if (page.leftText.trim() || page.rightText.trim()) {
            addNewPage();
        }

        const stream = streamState.mediaStream
            || await navigator.mediaDevices.getUserMedia({ audio: true });

        const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        transcribeState.audioContext = new AudioCtx();
        const sampleRate = transcribeState.audioContext.sampleRate;

        const source    = transcribeState.audioContext.createMediaStreamSource(stream);
        const processor = transcribeState.audioContext.createScriptProcessor(4096, 1, 1);
        transcribeState.scriptProcessor = processor;
        transcribeState.sampleBuffer    = [];
        transcribeState.totalSamples    = 0;
        transcribeState.isTranscribing  = true;

        const minSamples    = Math.floor(sampleRate * FULL_MIN_CHUNK_SEC);
        const searchSamples = Math.floor(sampleRate * FULL_SILENCE_SEARCH_SEC);

        processor.onaudioprocess = e => {
            if (!transcribeState.isTranscribing) return;
            const input = e.inputBuffer.getChannelData(0);
            transcribeState.sampleBuffer.push(new Float32Array(input));
            transcribeState.totalSamples += input.length;
            if (transcribeState.totalSamples >= minSamples + searchSamples) {
                processTranscribeBuffer(sampleRate, minSamples);
            }
        };

        const silentGain = transcribeState.audioContext.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(transcribeState.audioContext.destination);

        transcribeBtn.classList.add('transcribing');
        transcribeBtn.textContent = 'End Transcription';
        transcribeIndicator.classList.add('active');

        transcribeState._maxTimer = setTimeout(() => {
            if (transcribeState.isTranscribing) stopTranscription();
        }, FULL_MAX_DURATION_MS);

    } catch (err) {
        console.warn('Could not start transcription:', err);
    }
}

function stopTranscription() {
    transcribeState.isTranscribing = false;
    clearTimeout(transcribeState._maxTimer);

    // Flush any remaining buffered audio as a final chunk before tearing down
    if (transcribeState.sampleBuffer.length && transcribeState.totalSamples > 0) {
        const sampleRate = transcribeState.audioContext
            ? transcribeState.audioContext.sampleRate
            : 44100;
        const flat = new Float32Array(transcribeState.totalSamples);
        let off = 0;
        for (const c of transcribeState.sampleBuffer) { flat.set(c, off); off += c.length; }
        if (computeRMS(flat) >= MIN_AUDIO_ENERGY) {
            const chunkSeconds = flat.length / sampleRate;
            sendTranscribeChunk(encodeWAV(flat, sampleRate), chunkSeconds);
        }
    }

    // Stop hardware immediately — let in-flight requests and typing animations finish
    if (transcribeState.scriptProcessor) { transcribeState.scriptProcessor.disconnect(); transcribeState.scriptProcessor = null; }
    if (transcribeState.audioContext)    { transcribeState.audioContext.close();         transcribeState.audioContext    = null; }
    transcribeState.sampleBuffer = [];
    transcribeState.totalSamples = 0;

    // Show processing state — button resets via checkTranscriptionDone() when all chunks are done
    transcribeBtn.classList.replace('transcribing', 'processing');
    transcribeBtn.textContent = 'Processing...';
    transcribeBtn.disabled    = true;
    transcribeIndicator.classList.remove('active');

    checkTranscriptionDone();
}

function checkTranscriptionDone() {
    if (transcribeState.isTranscribing || transcribeState.pendingChunks > 0) return;
    transcribeBtn.classList.remove('processing');
    transcribeBtn.textContent = 'Transcribe';
    transcribeBtn.disabled    = false;
    // Lock the page if transcription produced content
    if (englishTextEl.textContent.trim()) {
        const page = journalState.pages[journalState.currentPageIndex];
        page.locked = true;
        englishTextEl.contentEditable = 'false';
    }
    saveCurrentPageToState();
}

function processTranscribeBuffer(sampleRate, minSamples) {
    const flat = new Float32Array(transcribeState.totalSamples);
    let offset = 0;
    for (const chunk of transcribeState.sampleBuffer) { flat.set(chunk, offset); offset += chunk.length; }

    const cutPoint  = findCutPoint(flat, minSamples, sampleRate);
    const sendAudio = flat.slice(0, cutPoint);
    const remaining = flat.slice(cutPoint);

    transcribeState.sampleBuffer = [remaining];
    transcribeState.totalSamples = remaining.length;

    const chunkSeconds = cutPoint / sampleRate;
    sendTranscribeChunk(encodeWAV(sendAudio, sampleRate), chunkSeconds);
}

async function sendTranscribeChunk(blob, chunkSeconds) {
    transcribeState.pendingChunks++;
    try {
        const formData = new FormData();
        formData.append('file', blob, 'chunk.wav');
        formData.append('source_lang', journalState.leftLanguage);
        formData.append('target_lang', journalState.rightLanguage);

        const response = await fetch(`${SERVER_URL}/transcribe`, { method: 'POST', body: formData });
        if (!response.ok) return;

        const data = await response.json();
        const transcriptWords  = (data.transcription || '').trim().split(/\s+/).filter(Boolean);
        const translationWords = (data.translation   || '').trim().split(/\s+/).filter(Boolean);

        if (!transcriptWords.length) return;
        const cleaned = transcriptWords.map(w => w.replace(/[.,!?]/g, '').toLowerCase());
        if (transcriptWords.length <= 3 && cleaned.every(w => WHISPER_HALLUCINATIONS.has(w))) return;
        typeChunkIntoPages(transcriptWords, translationWords, chunkSeconds, data.confidence ?? null);
    } catch (err) {
        console.warn('Transcribe chunk failed:', err);
    } finally {
        transcribeState.pendingChunks--;
        checkTranscriptionDone();
    }
}

function typeChunkIntoPages(transcriptWords, translationWords, chunkSeconds, confidence = null) {
    const delay = Math.max(50, Math.min(500, (chunkSeconds / transcriptWords.length) * 1000));

    if (englishTextEl.children.length > 0) englishTextEl.appendChild(document.createElement('div'));
    if (spanishTextEl.children.length > 0) spanishTextEl.appendChild(document.createElement('div'));

    const leftDiv  = document.createElement('div');
    const rightDiv = document.createElement('div');
    applyConfidenceToDiv(rightDiv, confidence);
    englishTextEl.appendChild(leftDiv);
    spanishTextEl.appendChild(rightDiv);

    transcriptWords.forEach((word, i) => {
        const id = setTimeout(() => {
            leftDiv.textContent += (leftDiv.textContent ? ' ' : '') + word;
        }, i * delay);
        transcribeState._typingTimeouts.push(id);
    });

    const rightTextNode = document.createTextNode('');
    rightDiv.appendChild(rightTextNode);
    translationWords.forEach((word, i) => {
        const id = setTimeout(() => {
            rightTextNode.textContent += (rightTextNode.textContent ? ' ' : '') + word;
        }, i * delay);
        transcribeState._typingTimeouts.push(id);
    });

    const doneMs = Math.max(transcriptWords.length, translationWords.length) * delay;
    const id = setTimeout(() => {
        saveCurrentPageToState();
        romanizePageSide(englishTextEl, journalState.leftLanguage);
        romanizePageSide(spanishTextEl, journalState.rightLanguage);
    }, doneMs);
    transcribeState._typingTimeouts.push(id);
}

// ── Enter-to-translate (left page typing) ────────────────────────────────────

function getCurrentLineText() {
    return englishTextEl.textContent.trim();
}

function handleLeftPageEnter(e) {
    if (e.key !== 'Enter') return;

    const lineText = getCurrentLineText();
    if (!lineText) {
        e.preventDefault(); // don't insert a blank line
        return;
    }

    // Prevent the default newline — we lock the page instead
    e.preventDefault();

    // Lock both pages immediately
    const page = journalState.pages[journalState.currentPageIndex];
    page.locked = true;
    englishTextEl.contentEditable = 'false';

    // Trigger translation on the right page
    const rightDiv = document.createElement('div');
    rightDiv.classList.add('translation-pending');
    rightDiv.textContent = '…';
    spanishTextEl.appendChild(rightDiv);
    translateLine(lineText, rightDiv);

    saveCurrentPageToState();
}

async function translateLine(text, targetDiv) {
    try {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('source_lang', journalState.leftLanguage);
        formData.append('target_lang', journalState.rightLanguage);

        const response = await fetch(`${SERVER_URL}/translate`, { method: 'POST', body: formData });
        if (!response.ok) { targetDiv.textContent = ''; return; }

        const data = await response.json();
        targetDiv.classList.remove('translation-pending');
        targetDiv.textContent = data.translation || '';
        saveCurrentPageToState();
        romanizePageSide(englishTextEl, journalState.leftLanguage);
        romanizePageSide(spanishTextEl, journalState.rightLanguage);
    } catch (err) {
        console.warn('Translation failed:', err);
        targetDiv.textContent = '';
        targetDiv.classList.remove('translation-pending');
    }
}

// Re-translate the right page when the target language changes on a locked page
async function retranslateRightPage() {
    const sourceText = englishTextEl.textContent.trim();
    if (!sourceText) return;

    spanishTextEl.innerHTML = '';
    const pendingDiv = document.createElement('div');
    pendingDiv.classList.add('translation-pending');
    pendingDiv.textContent = '…';
    spanishTextEl.appendChild(pendingDiv);

    try {
        const formData = new FormData();
        formData.append('text', sourceText);
        formData.append('source_lang', journalState.leftLanguage);
        formData.append('target_lang', journalState.rightLanguage);

        const response = await fetch(`${SERVER_URL}/translate`, { method: 'POST', body: formData });
        if (!response.ok) { pendingDiv.textContent = ''; return; }

        const data = await response.json();
        pendingDiv.classList.remove('translation-pending');
        pendingDiv.textContent = data.translation || '';
        saveCurrentPageToState();
        romanizePageSide(englishTextEl, journalState.leftLanguage);
        romanizePageSide(spanishTextEl, journalState.rightLanguage);
    } catch (err) {
        console.warn('Retranslation failed:', err);
        pendingDiv.textContent = '';
        pendingDiv.classList.remove('translation-pending');
    }
}

// ── Romanization (CJK → Latin subtitles) ─────────────────────────────────────

async function romanizeDiv(div, lang) {
    // Clone and strip injected spans so they don't contaminate the romanization input
    const clone = div.cloneNode(true);
    clone.querySelectorAll('.conf-label, .romanized').forEach(n => n.remove());
    const text = clone.textContent.trim();
    if (!text) return;
    // Remove any existing romanized subtitle on this div
    div.querySelectorAll('.romanized').forEach(n => n.remove());
    try {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('lang', lang);
        const response = await fetch(`${SERVER_URL}/romanize`, { method: 'POST', body: formData });
        if (!response.ok) return;
        const data = await response.json();
        if (data.romanized) {
            const sub = document.createElement('span');
            sub.className = 'romanized';
            sub.textContent = data.romanized;
            div.appendChild(sub);
        }
    } catch (err) {
        console.warn('Romanization failed:', err);
    }
}

async function romanizePageSide(el, lang) {
    if (!CJK_LANGS.has(lang)) return;
    const divs = Array.from(el.children).filter(n => n.tagName === 'DIV');
    for (const div of divs) await romanizeDiv(div, lang);
}

// Handle text changes
function handleTextChange(e) {
    if (e.target.id === 'english-text') {
        journalState.pages[journalState.currentPageIndex].leftText = e.target.innerHTML;
        languageLeftBtn.disabled = !!englishTextEl.textContent.trim();
    }
}

// Journal title handlers
function handleJournalTitleKeydown(e) {
    if (e.key === 'Enter') e.preventDefault();
}

function enforceJournalTitleLength() {
    const el   = journalTitleEl;
    const text = el.textContent;
    if (text.length > MAX_JOURNAL_TITLE_LENGTH) {
        el.textContent = text.slice(0, MAX_JOURNAL_TITLE_LENGTH);
        placeCaretAtEnd(el);
    }
}

function handleJournalTitlePaste(e) {
    e.preventDefault();
    const pasted  = (e.clipboardData || /** @type {any} */ (window).clipboardData).getData('text');
    const plain   = pasted.replace(/\r?\n/g, ' ');
    const current = journalTitleEl.textContent;
    const sel     = window.getSelection();
    const start   = Math.min(sel.anchorOffset, sel.focusOffset);
    const end     = Math.max(sel.anchorOffset, sel.focusOffset);
    const combined = current.slice(0, start) + plain + current.slice(end);
    journalTitleEl.textContent = combined.slice(0, MAX_JOURNAL_TITLE_LENGTH);
    placeCaretAtEnd(journalTitleEl);
}

function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

// ── Save / Load ───────────────────────────────────────────────────────────────

function saveJournal() {
    saveCurrentPageToState();
    const hasContent = journalState.pages.some(p => p.leftText.trim() || p.rightText.trim());
    if (!hasContent) {
        alert('Please add some content before saving.');
        return;
    }

    const entries = getJournalEntries();
    const title   = journalTitleEl.textContent.trim() || generateJournalTitle();

    const entry = {
        id:           journalState.currentJournalId || Date.now().toString(),
        title,
        date:         new Date().toISOString(),
        pages:        journalState.pages,
        leftLanguage:  journalState.leftLanguage,
        rightLanguage: journalState.rightLanguage,
    };

    if (journalState.currentJournalId) {
        const filtered = entries.filter(e => e.id !== journalState.currentJournalId);
        entries.length = 0;
        entries.push(...filtered);
    }

    entries.unshift(entry);
    saveJournalEntries(entries);

    journalState.currentJournalId = entry.id;
    loadJournalEntries();
    showSaveFeedback();
}

function generateJournalTitle() {
    const firstPage = journalState.pages[0];
    const tempDiv   = document.createElement('div');
    tempDiv.innerHTML = firstPage.leftText || '';
    const text = tempDiv.textContent.trim();
    if (text) {
        const firstWords = text.split(' ').slice(0, 5).join(' ');
        return firstWords.length > 30 ? firstWords.substring(0, 30) + '...' : firstWords;
    }
    return `Journal - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function showSaveFeedback() {
    const span = saveJournalBtn.querySelector('span');
    const orig = span.textContent;
    span.textContent = 'Saved!';
    saveJournalBtn.style.background = '#10B981';
    setTimeout(() => { span.textContent = orig; saveJournalBtn.style.background = ''; }, 2000);
}

const SIDEBAR_JOURNAL_LIMIT = 7;

function loadJournalEntries() {
    const entries = getJournalEntries().slice(0, SIDEBAR_JOURNAL_LIMIT);
    journalList.innerHTML = '';
    entries.forEach(entry => journalList.appendChild(createJournalListItem(entry)));
}

function createJournalListItem(entry) {
    const pages       = entry.pages || [];
    const totalCorrect = pages.reduce((s, p) => s + (p.correct || 0), 0);
    const totalMissed  = pages.reduce((s, p) => s + (p.missed  || 0), 0);
    const hasScores    = totalCorrect > 0 || totalMissed > 0;

    const div = document.createElement('div');
    div.className = 'journal-item';
    div.dataset.journalId = entry.id;
    div.innerHTML = `
        <svg class="journal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="journal-name">${escapeHtml(entry.title)}</span>
        ${hasScores ? `<span class="journal-scores">
            <span class="journal-score correct-score">${totalCorrect}</span>
            <span class="journal-score missed-score">${totalMissed}</span>
        </span>` : ''}
        <button type="button" class="journal-delete-btn" aria-label="Delete journal" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path><path d="M14 11v6"></path>
                <path d="M9 6V4h6v2"></path>
            </svg>
        </button>
    `;
    div.addEventListener('click', () => openJournal(entry.id));
    div.querySelector('.journal-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteJournalEntry(entry.id);
    });
    return div;
}

function deleteJournalEntry(id) {
    const entries = getJournalEntries().filter(e => e.id !== id);
    saveJournalEntries(entries);
    if (journalState.currentJournalId === id) {
        journalState.currentJournalId = null;
    }
    loadJournalEntries();
}

// ── Study Mode ────────────────────────────────────────────────────────────────

function toggleStudyMode() {
    journalState.isStudyMode = !journalState.isStudyMode;
    if (journalState.isStudyMode) {
        enterStudyMode();
    } else {
        exitStudyMode();
    }
}

function enterStudyMode() {
    saveCurrentPageToState();
    notebookEl.classList.add('study-mode');
    studyModeView.setAttribute('aria-hidden', 'false');
    studyBtn.textContent = 'Exit study';
    studyBtn.classList.add('in-study-mode');
    journalState.studyShowingSource = true;
    journalState.studyPageIndex     = 0;
    studyCardInner.classList.remove('flipped');
    syncStudyFaces();
    updateFlipButtonText();
}

function exitStudyMode() {
    notebookEl.classList.remove('study-mode');
    studyModeView.setAttribute('aria-hidden', 'true');
    studyBtn.textContent = 'Study';
    studyBtn.classList.remove('in-study-mode');
}

function getTextFromHTML(html) {
    const el = document.createElement('div');
    el.innerHTML = html || '';
    el.querySelectorAll('.conf-label, .romanized').forEach(s => s.remove());
    return el.textContent.trim().replace(/\n{3,}/g, '\n\n');
}

async function setStudyFaceText(el, text, lang) {
    el.textContent = text;
    if (!text || !CJK_LANGS.has(lang)) return;
    try {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('lang', lang);
        const response = await fetch(`${SERVER_URL}/romanize`, { method: 'POST', body: formData });
        if (!response.ok) return;
        const data = await response.json();
        if (data.romanized) {
            const sub = document.createElement('span');
            sub.className = 'romanized';
            sub.textContent = data.romanized;
            el.appendChild(sub);
        }
    } catch (err) {
        console.warn('Study romanization failed:', err);
    }
}

function syncStudyFaces() {
    const page = journalState.pages[journalState.studyPageIndex];
    const leftLang  = page.leftLanguage  || journalState.leftLanguage;
    const rightLang = page.rightLanguage || journalState.rightLanguage;

    studySourceLabel.textContent = languageNames[leftLang]  || 'English';
    studyTargetLabel.textContent = languageNames[rightLang] || 'Spanish';

    const sourceText = getTextFromHTML(page.leftText)  || 'No content on this page.';
    const targetText = getTextFromHTML(page.rightText) || 'No translation on this page.';

    setStudyFaceText(studySourceText, sourceText, leftLang);
    setStudyFaceText(studyTargetText, targetText, rightLang);

    missedCountEl.textContent  = page.missed  || 0;
    correctCountEl.textContent = page.correct || 0;

    updateStudyPageIndicator();
}

function updateStudyPageIndicator() {
    const total   = journalState.pages.length;
    const current = journalState.studyPageIndex + 1;
    studyPageIndicator.textContent = `Page ${current} of ${total}`;
    studyPrevPageBtn.disabled = journalState.studyPageIndex === 0;
    studyNextPageBtn.disabled = journalState.studyPageIndex === total - 1;
}

function goToStudyPage(index) {
    if (index < 0 || index >= journalState.pages.length) return;
    stopSpeakRecording();
    journalState.studyPageIndex     = index;
    journalState.studyShowingSource = true;
    studyCardInner.classList.remove('flipped');
    syncStudyFaces();
    updateFlipButtonText();
    resetSpeakUI();
}

function flipStudyPage() {
    journalState.studyShowingSource = !journalState.studyShowingSource;
    studyCardInner.classList.toggle('flipped', !journalState.studyShowingSource);
    updateFlipButtonText();
}

function updateFlipButtonText() {
    flipPageBtnText.textContent = journalState.studyShowingSource ? 'Show translation' : 'Show original';
    // Speak is only available while looking at the source (challenge mode)
    speakBtn.disabled = !journalState.studyShowingSource;
    if (!journalState.studyShowingSource) resetSpeakUI();
}

// ── Pronunciation check ───────────────────────────────────────────────────────

const PRONUNCIATION_PASS_THRESHOLD = 0.6; // 60% word match = correct

const speakState = {
    isRecording: false,
    mediaStream: null,
    recorder: null,
    chunks: [],
};

function resetSpeakUI() {
    speakBtnText.textContent = 'Speak';
    speakBtn.classList.remove('recording');
    speakResult.textContent  = '';
    speakResult.className    = 'speak-result';
}

async function handleSpeakBtn() {
    if (speakState.isRecording) {
        stopSpeakRecording();
    } else {
        await startSpeakRecording();
    }
}

async function startSpeakRecording() {
    try {
        speakState.mediaStream = streamState.mediaStream
            || await navigator.mediaDevices.getUserMedia({ audio: true });
        speakState.chunks   = [];
        speakState.recorder = new MediaRecorder(speakState.mediaStream);
        speakState.recorder.ondataavailable = e => { if (e.data.size) speakState.chunks.push(e.data); };
        speakState.recorder.onstop = onSpeakRecordingDone;
        speakState.recorder.start();
        speakState.isRecording  = true;
        speakBtnText.textContent = 'Stop';
        speakBtn.classList.add('recording');
        speakResult.textContent  = '';
        speakResult.className    = 'speak-result';
    } catch (err) {
        console.warn('Speak recording failed:', err);
        speakResult.textContent = 'Microphone unavailable.';
        speakResult.className   = 'speak-result missed';
    }
}

function stopSpeakRecording() {
    if (speakState.recorder && speakState.isRecording) {
        speakState.recorder.stop();
        speakState.isRecording   = false;
        speakBtnText.textContent  = 'Checking…';
        speakBtn.classList.remove('recording');
        speakBtn.disabled         = true;
    }
}

async function onSpeakRecordingDone() {
    const blob = new Blob(speakState.chunks, { type: 'audio/webm' });
    const page = journalState.pages[journalState.studyPageIndex];
    const targetLang = page.rightLanguage || journalState.rightLanguage;
    const expectedText = getTextFromHTML(page.rightText);

    try {
        const formData = new FormData();
        formData.append('file', blob, 'speak.webm');
        formData.append('expected_text', expectedText);
        formData.append('lang', targetLang);

        const response = await fetch(`${SERVER_URL}/pronunciation`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Server error');

        const data = await response.json();
        const passed = data.score >= PRONUNCIATION_PASS_THRESHOLD;

        speakResult.textContent = `"${data.spoken}" — ${Math.round(data.score * 100)}%`;
        speakResult.className   = `speak-result ${passed ? 'correct' : 'missed'}`;

        recordStudyScore(passed ? 'correct' : 'missed');
    } catch (err) {
        console.warn('Pronunciation check failed:', err);
        speakResult.textContent = 'Could not check. Try again.';
        speakResult.className   = 'speak-result missed';
    } finally {
        speakBtnText.textContent = 'Speak';
        speakBtn.disabled        = false;
    }
}

function recordStudyScore(type) {
    const page = journalState.pages[journalState.studyPageIndex];
    if (type === 'missed') {
        page.missed = (page.missed || 0) + 1;
        missedCountEl.textContent = page.missed;
    } else {
        page.correct = (page.correct || 0) + 1;
        correctCountEl.textContent = page.correct;
    }
    if (journalState.currentJournalId) {
        const entries = getJournalEntries();
        const entry   = entries.find(e => e.id === journalState.currentJournalId);
        if (entry && entry.pages && entry.pages[journalState.studyPageIndex]) {
            entry.pages[journalState.studyPageIndex].missed  = page.missed  || 0;
            entry.pages[journalState.studyPageIndex].correct = page.correct || 0;
            saveJournalEntries(entries);
            loadJournalEntries();
        }
    }
}

function updateScoreDisplay() {
    missedCountEl.textContent  = 0;
    correctCountEl.textContent = 0;
}

// ── Journal CRUD ──────────────────────────────────────────────────────────────

function startNewJournal() {
    journalState.currentJournalId  = null;
    journalTitleEl.textContent      = 'Journal';
    journalState.pages              = [{ leftText: '', rightText: '', locked: false, leftLanguage: journalState.leftLanguage, rightLanguage: journalState.rightLanguage, missed: 0, correct: 0 }];
    journalState.currentPageIndex   = 0;
    updateScoreDisplay();
    renderCurrentPage();
    journalTitleEl.focus();
    window.scrollTo(0, 0);
}

function openJournal(journalId) {
    const entries = getJournalEntries();
    const entry   = entries.find(e => e.id === journalId);

    if (!entry) return;

    journalTitleEl.textContent = (entry.title || 'Journal').slice(0, MAX_JOURNAL_TITLE_LENGTH);

    const entryLeft  = entry.leftLanguage  || 'en';
    const entryRight = entry.rightLanguage || 'es';

    // Support both new pages format and legacy englishText/spanishText
    if (entry.pages && entry.pages.length) {
        // Normalise pages saved before the lock/per-page-language features existed
        journalState.pages = entry.pages.map(p => ({
            leftText:      p.leftText  || '',
            rightText:     p.rightText || '',
            locked:        p.leftText ? true : (p.locked || false),
            leftLanguage:  p.leftLanguage  || entryLeft,
            rightLanguage: p.rightLanguage || entryRight,
            missed:        p.missed  || 0,
            correct:       p.correct || 0,
        }));
    } else {
        journalState.pages = [{ leftText: entry.englishText || '', rightText: entry.spanishText || '', locked: !!(entry.englishText), leftLanguage: entryLeft, rightLanguage: entryRight }];
    }
    journalState.currentPageIndex  = 0;
    journalState.currentJournalId  = entry.id;
    renderCurrentPage(); // restores per-page languages and updates UI

    updateScoreDisplay();

    window.scrollTo(0, 0);
}

function checkForExistingJournal() {
    const journalId = sessionStorage.getItem('openJournalId');
    if (journalId) {
        openJournal(journalId);
        sessionStorage.removeItem('openJournalId');
    }
}

// ── Local Storage ─────────────────────────────────────────────────────────────

function getJournalEntries() {
    const entries = localStorage.getItem('journalEntries');
    return entries ? JSON.parse(entries) : [];
}

function saveJournalEntries(entries) {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
