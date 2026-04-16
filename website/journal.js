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

// ---------------------------------------------------------------------------
// Hardcoded beginner phrase journals — always present, cannot be deleted.
// Each page: { leftText (English), rightText (target), leftLanguage, rightLanguage }
// ---------------------------------------------------------------------------
const _BEGINNER_PHRASE_PAGES = {
    es: [
        { left: 'hello',                  right: 'hola' },
        { left: 'goodbye',                right: 'adiós' },
        { left: 'yes',                    right: 'sí' },
        { left: 'no',                     right: 'no' },
        { left: 'please',                 right: 'por favor' },
        { left: 'thank you',              right: 'gracias' },
        { left: 'excuse me',              right: 'con permiso' },
        { left: 'I do not understand',    right: 'no entiendo' },
        { left: 'do you speak english?',  right: '¿hablas inglés?' },
        { left: 'are you okay?',          right: '¿estás bien?' },
        { left: 'what is the price?',     right: '¿cuánto cuesta?' },
        { left: 'where is the bathroom?', right: '¿dónde está el baño?' },
        { left: 'that was great!',        right: '¡estuvo genial!' },
    ],
    fr: [
        { left: 'hello',                  right: 'bonjour' },
        { left: 'goodbye',                right: 'au revoir' },
        { left: 'yes',                    right: 'oui' },
        { left: 'no',                     right: 'non' },
        { left: 'please',                 right: "s'il vous plaît" },
        { left: 'thank you',              right: 'merci' },
        { left: 'excuse me',              right: 'excusez-moi' },
        { left: 'I do not understand',    right: 'je ne comprends pas' },
        { left: 'do you speak english?',  right: 'parlez-vous anglais?' },
        { left: 'are you okay?',          right: 'ça va?' },
        { left: 'what is the price?',     right: 'quel est le prix?' },
        { left: 'where is the bathroom?', right: 'où sont les toilettes?' },
        { left: 'that was great!',        right: "c'était super!" },
    ],
    de: [
        { left: 'hello',                  right: 'hallo' },
        { left: 'goodbye',                right: 'auf Wiedersehen' },
        { left: 'yes',                    right: 'ja' },
        { left: 'no',                     right: 'nein' },
        { left: 'please',                 right: 'bitte' },
        { left: 'thank you',              right: 'danke' },
        { left: 'excuse me',              right: 'entschuldigung' },
        { left: 'I do not understand',    right: 'ich verstehe nicht' },
        { left: 'do you speak english?',  right: 'sprechen Sie Englisch?' },
        { left: 'are you okay?',          right: 'geht es dir gut?' },
        { left: 'what is the price?',     right: 'was kostet das?' },
        { left: 'where is the bathroom?', right: 'wo ist die Toilette?' },
        { left: 'that was great!',        right: 'das war toll!' },
    ],
    zh: [
        { left: 'hello',                  right: '你好' },
        { left: 'goodbye',                right: '再见' },
        { left: 'yes',                    right: '是' },
        { left: 'no',                     right: '不' },
        { left: 'please',                 right: '请' },
        { left: 'thank you',              right: '谢谢' },
        { left: 'excuse me',              right: '对不起' },
        { left: 'I do not understand',    right: '我不明白' },
        { left: 'do you speak english?',  right: '你说英语吗？' },
        { left: 'are you okay?',          right: '你还好吗？' },
        { left: 'what is the price?',     right: '价格是多少？' },
        { left: 'where is the bathroom?', right: '洗手间在哪里？' },
        { left: 'that was great!',        right: '太棒了！' },
    ],
    ja: [
        { left: 'hello',                  right: 'こんにちは' },
        { left: 'goodbye',                right: 'さようなら' },
        { left: 'yes',                    right: 'はい' },
        { left: 'no',                     right: 'いいえ' },
        { left: 'please',                 right: 'おねがいします' },
        { left: 'thank you',              right: 'ありがとう' },
        { left: 'excuse me',              right: 'すみません' },
        { left: 'I do not understand',    right: 'わかりません' },
        { left: 'do you speak english?',  right: '英語を話せますか？' },
        { left: 'are you okay?',          right: '大丈夫ですか？' },
        { left: 'what is the price?',     right: 'いくらですか？' },
        { left: 'where is the bathroom?', right: 'トイレはどこですか？' },
        { left: 'that was great!',        right: '素晴らしかったです！' },
    ],
    ko: [
        { left: 'hello',                  right: '안녕하세요' },
        { left: 'goodbye',                right: '안녕히 가세요' },
        { left: 'yes',                    right: '예' },
        { left: 'no',                     right: '아니요' },
        { left: 'please',                 right: '제발' },
        { left: 'thank you',              right: '감사합니다' },
        { left: 'excuse me',              right: '실례합니다' },
        { left: 'I do not understand',    right: '이해하지 못합니다' },
        { left: 'do you speak english?',  right: '영어를 할 수 있나요?' },
        { left: 'are you okay?',          right: '괜찮으세요?' },
        { left: 'what is the price?',     right: '가격이 얼마예요?' },
        { left: 'where is the bathroom?', right: '화장실이 어디예요?' },
        { left: 'that was great!',        right: '정말 좋았어요!' },
    ],
};

const BUILTIN_JOURNALS = Object.entries(_BEGINNER_PHRASE_PAGES).map(([lang, phrases]) => ({
    id:            `builtin-${lang}`,
    title:         `Beginner Phrases - ${languageNames[lang]}`,
    builtin:       true,
    leftLanguage:  'en',
    rightLanguage: lang,
    pages: phrases.map(p => ({
        leftText:      p.left,
        rightText:     p.right,
        locked:        true,
        leftLanguage:  'en',
        rightLanguage: lang,
        missed:        0,
        correct:       0,
    })),
}));

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
const hintToggleBtn         = document.getElementById('hint-toggle-btn');
const studyHintText         = document.getElementById('study-hint-text');
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
    hintToggleBtn.addEventListener('click', toggleStudyHint);
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
    initExamListeners();
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
    // Apply locked state — locked pages and builtin journals are fully read-only
    const isBuiltin = !!(journalState.currentJournalId && journalState.currentJournalId.startsWith('builtin-'));
    const isLocked  = isBuiltin || page.locked || false;
    englishTextEl.contentEditable = isLocked ? 'false' : 'true';
    transcribeBtn.disabled        = isBuiltin;
    transcribeBtn.title           = isBuiltin ? 'Read-only journal' : '';
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
    const isBuiltin  = !!(journalState.currentJournalId && journalState.currentJournalId.startsWith('builtin-'));
    bindingPageIndicator.textContent = `Page ${current} of ${total}`;
    prevPageBtn.disabled   = journalState.currentPageIndex === 0;
    nextPageBtn.disabled   = isBuiltin && isLastPage;
    nextPageBtn.innerHTML  = (!isBuiltin && isLastPage) ? '+ New Page' : 'Next &#8594;';
    deletePageBtn.disabled = isBuiltin;
}

function deleteCurrentPage() {
    if (journalState.pages.length === 1) {
        // Only page — reset it instead of blocking
        journalState.pages[0] = { leftText: '', rightText: '', locked: false, leftLanguage: journalState.leftLanguage, rightLanguage: journalState.rightLanguage, missed: 0, correct: 0 };
        renderCurrentPage();
    } else {
        journalState.pages.splice(journalState.currentPageIndex, 1);
        journalState.currentPageIndex = Math.min(journalState.currentPageIndex, journalState.pages.length - 1);
        renderCurrentPage();
    }
    // Sync updated pages (and their scores) to the persisted journal entry
    if (journalState.currentJournalId) {
        const entries = getJournalEntries();
        const entry   = entries.find(e => e.id === journalState.currentJournalId);
        if (entry) {
            entry.pages = journalState.pages.map(p => ({ ...p }));
            saveJournalEntries(entries);
            loadJournalEntries();
        }
    }
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
    if (id.startsWith('builtin-')) return;  // builtin journals cannot be deleted
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
    // Stop live transcription if running
    if (transcribeState.isTranscribing) {
        stopTranscription();
    }
    // Auto-mute microphone, saving previous state for restore on exit
    journalState._preMicMuted = journalState.isMicMuted;
    if (!journalState.isMicMuted) {
        journalState.isMicMuted = true;
        updateMicrophoneUI();
    }
    saveCurrentPageToState();
    notebookEl.classList.add('study-mode');
    studyModeView.setAttribute('aria-hidden', 'false');
    studyBtn.textContent = 'Exit study';
    studyBtn.classList.add('in-study-mode');
    journalState.studyShowingSource = true;
    journalState.studyPageIndex     = 0;
    studyCardInner.classList.remove('flipped');
    resetStudyHint();
    syncStudyFaces();
    updateFlipButtonText();
}

function exitStudyMode() {
    // Restore microphone to pre-study state
    if (journalState._preMicMuted === false && journalState.isMicMuted) {
        journalState.isMicMuted = false;
        updateMicrophoneUI();
    }
    notebookEl.classList.remove('study-mode');
    studyModeView.setAttribute('aria-hidden', 'true');
    studyBtn.textContent = 'Study';
    studyBtn.classList.remove('in-study-mode');
    speakResult.textContent = '';
    speakResult.className   = 'speak-result';
    resetStudyHint();
    if (examState.active) exitExamMode();
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

function toggleStudyHint() {
    journalState.studyHintVisible = !journalState.studyHintVisible;
    studyHintText.classList.toggle('visible', journalState.studyHintVisible);
    hintToggleBtn.classList.toggle('active', journalState.studyHintVisible);
    hintToggleBtn.textContent = journalState.studyHintVisible ? 'Hide hint' : 'Hint';
}

function resetStudyHint() {
    journalState.studyHintVisible = false;
    studyHintText.classList.remove('visible');
    hintToggleBtn.classList.remove('active');
    hintToggleBtn.textContent = 'Hint';
}

async function setStudyHintText(text, lang) {
    studyHintText.textContent = text;
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
            studyHintText.appendChild(sub);
        }
    } catch (err) {
        console.warn('Hint romanization failed:', err);
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
    setStudyHintText(targetText, rightLang);

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
    resetStudyHint();
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
    isRecording:     false,
    audioContext:    null,
    scriptProcessor: null,
    sampleBuffer:    [],
    totalSamples:    0,
    sampleRate:      44100,
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
        const stream = streamState.mediaStream
            || await navigator.mediaDevices.getUserMedia({ audio: true });

        const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        speakState.audioContext    = new AudioCtx();
        speakState.sampleRate      = speakState.audioContext.sampleRate;
        const source               = speakState.audioContext.createMediaStreamSource(stream);
        const processor            = speakState.audioContext.createScriptProcessor(4096, 1, 1);
        speakState.scriptProcessor = processor;
        speakState.sampleBuffer    = [];
        speakState.totalSamples    = 0;
        speakState.isRecording     = true;

        processor.onaudioprocess = e => {
            if (!speakState.isRecording) return;
            const input = e.inputBuffer.getChannelData(0);
            speakState.sampleBuffer.push(new Float32Array(input));
            speakState.totalSamples += input.length;
        };

        const silentGain = speakState.audioContext.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(speakState.audioContext.destination);

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
    if (!speakState.isRecording) return;
    speakState.isRecording = false;

    const sampleRate = speakState.sampleRate || 44100;

    if (speakState.scriptProcessor) { speakState.scriptProcessor.disconnect(); speakState.scriptProcessor = null; }
    if (speakState.audioContext)    { speakState.audioContext.close();          speakState.audioContext    = null; }

    speakBtnText.textContent = 'Checking…';
    speakBtn.classList.remove('recording');
    speakBtn.disabled = true;

    if (!speakState.totalSamples) { resetSpeakUI(); speakBtn.disabled = false; return; }

    const flat = new Float32Array(speakState.totalSamples);
    let off = 0;
    for (const chunk of speakState.sampleBuffer) { flat.set(chunk, off); off += chunk.length; }
    speakState.sampleBuffer = [];
    speakState.totalSamples = 0;

    onSpeakRecordingDone(encodeWAV(flat, sampleRate));
}

async function onSpeakRecordingDone(wavBlob) {
    const page         = journalState.pages[journalState.studyPageIndex];
    const targetLang   = page.rightLanguage || journalState.rightLanguage;
    const expectedText = getTextFromHTML(page.rightText);

    try {
        const formData = new FormData();
        formData.append('file', wavBlob, 'speak.wav');
        formData.append('expected_text', expectedText);
        formData.append('lang', targetLang);

        const response = await fetch(`${SERVER_URL}/pronunciation`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Server error');

        const data   = await response.json();
        const passed = data.score >= PRONUNCIATION_PASS_THRESHOLD;

        speakResult.innerHTML =
            `<div class="speak-score ${passed ? 'correct' : 'missed'}">${Math.round(data.score * 100)}%</div>` +
            `<div class="speak-phonemes"><span class="ph-label">Expected:</span> <span class="ph-text">${data.expected_phonemes}</span></div>` +
            `<div class="speak-phonemes"><span class="ph-label">Heard:</span>    <span class="ph-text">${data.spoken_phonemes}</span></div>`;
        speakResult.className = `speak-result ${passed ? 'correct' : 'missed'}`;

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

// ── Exam Mode ─────────────────────────────────────────────────────────────────

const EXAM_PASS_THRESHOLD  = 0.70;
const EXAM_SPEAK_THRESHOLD = 0.55; // pronunciation score to count as correct

// Exam DOM refs (resolved once after DOMContentLoaded)
let examStartBtn, examOverlay, examQuestionScreen, examResultsScreen,
    examProgressText, examRetryChip, examQtype, examPromptText,
    examSpeakWrap, examTypeWrap, examMicBtn, examMicLabel, examSpeakFeedback,
    examTypeInput, examFeedbackRow, examFeedbackIcon, examFeedbackMsg,
    examCorrectAns, examSubmitBtn, examNextBtn,
    examResultScore, examResultVerdict, examResultLevel, examExitBtn;

const examState = {
    active:               false,
    questions:            [],   // { pageIndex, type, prompt, promptLang, expected, expectedLang, isRetry }
    currentIndex:         0,
    firstAttemptCorrect:  0,
    retryQueue:           [],
    isRetryPhase:         false,
    retryCorrect:         0,
    totalOriginal:        0,
    answered:             false,
    isRecording:          false,
};

function initExamDOMRefs() {
    examStartBtn        = document.getElementById('exam-start-btn');
    examOverlay         = document.getElementById('exam-overlay');
    examQuestionScreen  = document.getElementById('exam-question-screen');
    examResultsScreen   = document.getElementById('exam-results-screen');
    examProgressText    = document.getElementById('exam-progress-text');
    examRetryChip       = document.getElementById('exam-retry-chip');
    examQtype           = document.getElementById('exam-qtype');
    examPromptText      = document.getElementById('exam-prompt-text');
    examSpeakWrap       = document.getElementById('exam-speak-wrap');
    examTypeWrap        = document.getElementById('exam-type-wrap');
    examMicBtn          = document.getElementById('exam-mic-btn');
    examMicLabel        = document.getElementById('exam-mic-label');
    examSpeakFeedback   = document.getElementById('exam-speak-feedback');
    examTypeInput       = document.getElementById('exam-type-input');
    examFeedbackRow     = document.getElementById('exam-feedback-row');
    examFeedbackIcon    = document.getElementById('exam-feedback-icon');
    examFeedbackMsg     = document.getElementById('exam-feedback-msg');
    examCorrectAns      = document.getElementById('exam-correct-ans');
    examSubmitBtn       = document.getElementById('exam-submit-btn');
    examNextBtn         = document.getElementById('exam-next-btn');
    examResultScore     = document.getElementById('exam-result-score');
    examResultVerdict   = document.getElementById('exam-result-verdict');
    examResultLevel     = document.getElementById('exam-result-level');
    examExitBtn         = document.getElementById('exam-exit-btn');
}

// ── Level storage ─────────────────────────────────────────────────────────────

function getExamLevels() {
    try { return JSON.parse(localStorage.getItem('journalExamLevels')) || {}; }
    catch { return {}; }
}
function getExamLevel(id) { return getExamLevels()[id] || 0; }
function setExamLevel(id, level) {
    const levels = getExamLevels();
    levels[id] = level;
    localStorage.setItem('journalExamLevels', JSON.stringify(levels));
}

// ── Question generation ───────────────────────────────────────────────────────

const EXAM_QUESTION_TYPES = ['speak-target', 'speak-source', 'type-target', 'type-source'];

function buildExamQuestions() {
    const pages = journalState.pages;
    // Shuffle page order
    const indices = pages.map((_, i) => i).sort(() => Math.random() - 0.5);
    return indices.map(i => {
        const page    = pages[i];
        const lLang   = page.leftLanguage  || journalState.leftLanguage;
        const rLang   = page.rightLanguage || journalState.rightLanguage;
        const src     = getTextFromHTML(page.leftText)  || '';
        const tgt     = getTextFromHTML(page.rightText) || '';
        const type    = EXAM_QUESTION_TYPES[Math.floor(Math.random() * 4)];
        const isSpeak = type.startsWith('speak-');
        const srcLang = type.endsWith('-target') ? lLang : rLang;
        const expLang = type.endsWith('-target') ? rLang : lLang;
        return {
            pageIndex:    i,
            type,
            prompt:       type.endsWith('-target') ? src : tgt,
            promptLang:   srcLang,
            expected:     type.endsWith('-target') ? tgt : src,
            expectedLang: expLang,
            isRetry:      false,
        };
    }).filter(q => q.prompt && q.expected);
}

// ── Enter / exit ──────────────────────────────────────────────────────────────

function enterExamMode() {
    examState.questions           = buildExamQuestions();
    examState.currentIndex        = 0;
    examState.firstAttemptCorrect = 0;
    examState.retryQueue          = [];
    examState.isRetryPhase        = false;
    examState.retryCorrect        = 0;
    examState.totalOriginal       = examState.questions.length;
    examState.active              = true;

    examOverlay.setAttribute('aria-hidden', 'false');
    examOverlay.classList.add('visible');
    examResultsScreen.hidden = true;
    examQuestionScreen.hidden = false;
    examStartBtn.textContent = '✕ Exit Exam';

    showExamQuestion();
}

function exitExamMode() {
    examState.active = false;
    stopExamRecording();
    examOverlay.classList.remove('visible');
    examOverlay.setAttribute('aria-hidden', 'true');
    examStartBtn.textContent = '🎓 Exam';
}

function toggleExamMode() {
    if (examState.active) { exitExamMode(); return; }
    if (examState.questions.length === 0 && !examState.active) {
        // start fresh
    }
    enterExamMode();
}

// ── Render question ───────────────────────────────────────────────────────────

const EXAM_QTYPE_LABELS = {
    'speak-target': 'Speak the translation',
    'speak-source': 'Speak the original',
    'type-target':  'Type the translation',
    'type-source':  'Type the original',
};

function showExamQuestion() {
    const q     = examState.questions[examState.currentIndex];
    const total = examState.questions.length;
    const num   = examState.currentIndex + 1;

    examProgressText.textContent = `Question ${num} of ${total}`;
    examRetryChip.hidden         = !q.isRetry;
    examQtype.textContent        = EXAM_QTYPE_LABELS[q.type];
    examPromptText.textContent   = q.prompt;
    examState.answered           = false;

    // Show correct input mode
    const isSpeak = q.type.startsWith('speak-');
    examSpeakWrap.hidden = !isSpeak;
    examTypeWrap.hidden  = isSpeak;

    // Reset
    examSpeakFeedback.textContent = '';
    examSpeakFeedback.className   = 'speak-result';
    examTypeInput.value           = '';
    examFeedbackRow.hidden        = true;
    examFeedbackIcon.textContent  = '';
    examFeedbackMsg.textContent   = '';
    examCorrectAns.textContent    = '';
    examSubmitBtn.hidden          = false;
    examSubmitBtn.disabled        = false;
    examNextBtn.hidden            = true;
    examMicLabel.textContent      = 'Speak';
    examMicBtn.classList.remove('recording');
    examMicBtn.disabled           = false;
    examState.isRecording         = false;

    if (!isSpeak) examTypeInput.focus();
}

// ── Answer submission ─────────────────────────────────────────────────────────

async function submitExamAnswer() {
    if (examState.answered) return;
    const q = examState.questions[examState.currentIndex];
    if (q.type.startsWith('speak-')) {
        // speak answers are submitted via the mic button flow
        return;
    }
    const input = examTypeInput.value.trim();
    if (!input) return;
    const correct = examTypingCorrect(input, q.expected);
    resolveExamAnswer(correct, q);
}

function examTypingCorrect(input, expected) {
    const norm = s => s.toLowerCase().trim()
        .replace(/[.,!?¿¡"""]/g, '').replace(/\s+/g, ' ');
    const a = norm(input), b = norm(expected);
    if (a === b) return true;
    // Allow small typos: Levenshtein distance ≤ 15% of expected length
    return levenshtein(a, b) / Math.max(b.length, 1) <= 0.15;
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

function resolveExamAnswer(correct, q) {
    examState.answered = true;
    if (!q.isRetry) {
        if (correct) examState.firstAttemptCorrect++;
        else         examState.retryQueue.push({ ...q, isRetry: true });
    } else {
        if (correct) examState.retryCorrect++;
    }
    showExamFeedback(correct, q.expected);
}

function showExamFeedback(correct, correctAnswer) {
    examFeedbackRow.hidden       = false;
    examFeedbackIcon.textContent = correct ? '✅' : '❌';
    examFeedbackMsg.textContent  = correct ? 'Correct!' : 'Incorrect';
    examCorrectAns.textContent   = correct ? '' : `Answer: ${correctAnswer}`;
    examSubmitBtn.hidden         = true;
    examNextBtn.hidden           = false;
}

function advanceExam() {
    examState.currentIndex++;
    if (examState.currentIndex < examState.questions.length) {
        showExamQuestion();
        return;
    }
    // First pass done — append retry queue if any
    if (!examState.isRetryPhase && examState.retryQueue.length) {
        examState.isRetryPhase = true;
        examState.questions    = examState.retryQueue;
        examState.currentIndex = 0;
        showExamQuestion();
        return;
    }
    showExamResults();
}

// ── Results ───────────────────────────────────────────────────────────────────

function showExamResults() {
    const total    = examState.totalOriginal;
    const correct  = examState.firstAttemptCorrect + examState.retryCorrect;
    const pct      = total > 0 ? correct / total : 0;
    const passed   = pct >= EXAM_PASS_THRESHOLD;
    const jid      = journalState.currentJournalId;
    let   newLevel = getExamLevel(jid);
    if (passed && jid) {
        newLevel++;
        setExamLevel(jid, newLevel);
    }

    examQuestionScreen.hidden = true;
    examResultsScreen.hidden  = false;

    examResultScore.textContent   = `${correct} / ${total} — ${Math.round(pct * 100)}%`;
    examResultVerdict.textContent = passed ? '🎉 Passed!' : '😔 Not quite — keep practising!';
    examResultVerdict.className   = `exam-result-verdict ${passed ? 'passed' : 'failed'}`;
    examResultLevel.textContent   = jid
        ? (passed ? `⬆ Level Up! Now Level ${newLevel}` : `Level ${newLevel}`)
        : '';
}

// ── Exam speak recording (reuses speakState hardware) ─────────────────────────

async function startExamRecording() {
    if (speakState.isRecording) return;
    try {
        const stream = streamState.mediaStream
            || await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        speakState.audioContext    = new AudioCtx();
        speakState.sampleRate      = speakState.audioContext.sampleRate;
        const source               = speakState.audioContext.createMediaStreamSource(stream);
        const processor            = speakState.audioContext.createScriptProcessor(4096, 1, 1);
        speakState.scriptProcessor = processor;
        speakState.sampleBuffer    = [];
        speakState.totalSamples    = 0;
        speakState.isRecording     = true;
        examState.isRecording      = true;

        processor.onaudioprocess = e => {
            if (!speakState.isRecording) return;
            const input = e.inputBuffer.getChannelData(0);
            speakState.sampleBuffer.push(new Float32Array(input));
            speakState.totalSamples += input.length;
        };
        const silentGain = speakState.audioContext.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(speakState.audioContext.destination);

        examMicLabel.textContent = 'Stop';
        examMicBtn.classList.add('recording');
    } catch (err) {
        examSpeakFeedback.textContent = 'Microphone unavailable.';
        examSpeakFeedback.className   = 'speak-result missed';
    }
}

function stopExamRecording() {
    if (!speakState.isRecording) return;
    speakState.isRecording = false;
    examState.isRecording  = false;

    const sampleRate = speakState.sampleRate || 44100;
    if (speakState.scriptProcessor) { speakState.scriptProcessor.disconnect(); speakState.scriptProcessor = null; }
    if (speakState.audioContext)    { speakState.audioContext.close();          speakState.audioContext    = null; }

    examMicLabel.textContent = 'Checking…';
    examMicBtn.disabled      = true;

    if (!speakState.totalSamples) {
        examMicLabel.textContent = 'Speak';
        examMicBtn.disabled      = false;
        return;
    }
    const flat = new Float32Array(speakState.totalSamples);
    let off = 0;
    for (const chunk of speakState.sampleBuffer) { flat.set(chunk, off); off += chunk.length; }
    speakState.sampleBuffer = [];
    speakState.totalSamples = 0;

    onExamRecordingDone(encodeWAV(flat, sampleRate));
}

async function onExamRecordingDone(wavBlob) {
    const q = examState.questions[examState.currentIndex];
    try {
        const formData = new FormData();
        formData.append('file', wavBlob, 'speak.wav');
        formData.append('expected_text', q.expected);
        formData.append('lang', q.expectedLang);

        const response = await fetch(`${SERVER_URL}/pronunciation`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Server error');

        const data    = await response.json();
        const correct = data.score >= EXAM_SPEAK_THRESHOLD;

        examSpeakFeedback.innerHTML =
            `<div class="speak-score ${correct ? 'correct' : 'missed'}">${Math.round(data.score * 100)}%</div>` +
            `<div class="speak-phonemes"><span class="ph-label">Expected:</span> <span class="ph-text">${data.expected_phonemes}</span></div>` +
            `<div class="speak-phonemes"><span class="ph-label">Heard:</span> <span class="ph-text">${data.spoken_phonemes}</span></div>`;
        examSpeakFeedback.className = `speak-result ${correct ? 'correct' : 'missed'}`;

        resolveExamAnswer(correct, q);
    } catch (err) {
        examSpeakFeedback.textContent = 'Could not check. Try again.';
        examSpeakFeedback.className   = 'speak-result missed';
        examMicBtn.disabled = false;
        examMicLabel.textContent = 'Speak';
    }
}

// ── Event wiring (called from initializeEventListeners) ───────────────────────

function initExamListeners() {
    initExamDOMRefs();
    examStartBtn.addEventListener('click', toggleExamMode);
    examMicBtn.addEventListener('click', () => {
        if (examState.isRecording) stopExamRecording();
        else                       startExamRecording();
    });
    examTypeInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitExamAnswer();
    });
    examSubmitBtn.addEventListener('click', submitExamAnswer);
    examNextBtn.addEventListener('click',   advanceExam);
    examExitBtn.addEventListener('click',   exitExamMode);
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
    if (notebookEl.classList.contains('study-mode')) exitStudyMode();

    const entry = journalId.startsWith('builtin-')
        ? BUILTIN_JOURNALS.find(e => e.id === journalId)
        : getJournalEntries().find(e => e.id === journalId);

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
