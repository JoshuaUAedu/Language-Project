// Language names (same set as notebook/home)
const languageNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi'
};

const MAX_JOURNAL_TITLE_LENGTH = 50;

// Journal Page Functionality
const journalState = {
    englishText: '',
    spanishText: '',
    currentJournalId: null,
    isMicMuted: false,
    isLatinScript: true,
    leftLanguage: 'en',
    rightLanguage: 'es',
    isStudyMode: false,
    studyShowingSource: true,
    missedCount: 0,
    correctCount: 0
};

// DOM Elements
const englishTextEl = document.getElementById('english-text');
const spanishTextEl = document.getElementById('spanish-text');
const journalTitleEl = document.getElementById('journal-title');
const saveJournalBtn = document.getElementById('save-journal-btn');
const journalList = document.getElementById('journal-list');
const profileBtn = document.getElementById('profile-btn');
const settingsBtn = document.getElementById('settings-btn');
const micToggleBtn = document.getElementById('mic-toggle-btn');
const micIcon = document.getElementById('mic-icon');
const micMutedIcon = document.getElementById('mic-muted-icon');
const waveform = document.getElementById('waveform');
const listeningIndicator = document.getElementById('listening-indicator');
const listeningText = document.getElementById('listening-text');
const langScriptBtn = document.getElementById('lang-script-btn');
const langScriptAbc = document.getElementById('lang-script-abc');
const langScriptChar = document.getElementById('lang-script-char');
const languageLeftBtn = document.getElementById('language-left-btn');
const languageLeftLabel = document.getElementById('language-left-label');
const languageLeftDropdown = document.getElementById('language-left-dropdown');
const languageRightBtn = document.getElementById('language-right-btn');
const languageRightLabel = document.getElementById('language-right-label');
const languageRightDropdown = document.getElementById('language-right-dropdown');
const newJournalBtn = document.getElementById('new-journal-btn');
const studyBtn = document.getElementById('study-btn');
const transcribeBtn = document.getElementById('transcribe-btn');
const transcribeIndicator = document.getElementById('transcribe-indicator');
const notebookEl = document.querySelector('.notebook');
const notebookSpread = document.getElementById('notebook-spread');
const studyModeView = document.getElementById('study-mode-view');
const studyCardInner = document.getElementById('study-card-inner');
const studySourceLabel = document.getElementById('study-source-label');
const studySourceText = document.getElementById('study-source-text');
const studyTargetLabel = document.getElementById('study-target-label');
const studyTargetText = document.getElementById('study-target-text');
const flipPageBtn = document.getElementById('flip-page-btn');
const flipPageBtnText = document.getElementById('flip-page-btn-text');
const missedBtn = document.getElementById('missed-btn');
const correctBtn = document.getElementById('correct-btn');
const missedCountEl = document.getElementById('missed-count');
const correctCountEl = document.getElementById('correct-count');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    buildLanguageDropdowns();
    initializeEventListeners();
    loadJournalEntries();
    checkForExistingJournal();
});

// Event Listeners
function initializeEventListeners() {
    // Save button
    saveJournalBtn.addEventListener('click', saveJournal);
    
    // Text editing
    englishTextEl.addEventListener('input', handleTextChange);
    spanishTextEl.addEventListener('input', handleTextChange);

    // Normalize bare text nodes → divs on blur, then re-highlight
    englishTextEl.addEventListener('blur', () => {
        normalizeTextNodes(englishTextEl);
        highlightParagraphs(englishTextEl);
    });
    spanishTextEl.addEventListener('blur', () => {
        normalizeTextNodes(spanishTextEl);
        highlightParagraphs(spanishTextEl);
    });
    
    // Journal title: max length 30, no new lines
    journalTitleEl.addEventListener('keydown', handleJournalTitleKeydown);
    journalTitleEl.addEventListener('input', enforceJournalTitleLength);
    journalTitleEl.addEventListener('paste', handleJournalTitlePaste);
    
    // Microphone toggle
    micToggleBtn.addEventListener('click', toggleMicrophone);
    
    // Language script toggle (abc / 文)
    langScriptBtn.addEventListener('click', toggleLanguageScript);
    
    // Language buttons
    languageLeftBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLanguageDropdown('left');
    });
    languageRightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLanguageDropdown('right');
    });
    
    document.addEventListener('click', closeLanguageDropdowns);
    
    // Profile and settings buttons (placeholder)
    profileBtn.addEventListener('click', () => {
        alert('Profile settings coming soon!');
    });
    
    settingsBtn.addEventListener('click', () => {
        alert('Settings coming soon!');
    });
    
    // New journal button
    newJournalBtn.addEventListener('click', startNewJournal);
    
    // Study mode
    studyBtn.addEventListener('click', toggleStudyMode);
    flipPageBtn.addEventListener('click', flipStudyPage);
    missedBtn.addEventListener('click', () => recordStudyScore('missed'));
    correctBtn.addEventListener('click', () => recordStudyScore('correct'));

    // Transcribe toggle
    transcribeBtn.addEventListener('click', function () {
        const isTranscribing = transcribeBtn.classList.toggle('transcribing');
        transcribeBtn.textContent = isTranscribing ? 'End Transcription' : 'Transcribe';
        transcribeIndicator.classList.toggle('active', isTranscribing);
    });
    
    // Journal list items (delegated in loadJournalEntries via createJournalListItem)
}

// Build language dropdown options
function buildLanguageDropdowns() {
    const options = Object.entries(languageNames)
        .map(([code, name]) => `<button type="button" class="language-option" data-lang="${code}" role="option">${name}</button>`)
        .join('');
    languageLeftDropdown.innerHTML = options;
    languageRightDropdown.innerHTML = options;
    
    languageLeftDropdown.querySelectorAll('.language-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectLanguage('left', btn.dataset.lang);
        });
    });
    languageRightDropdown.querySelectorAll('.language-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectLanguage('right', btn.dataset.lang);
        });
    });
    
    updateLanguageButtonLabels();
    updateLanguageOptionSelected();
}

function toggleLanguageDropdown(side) {
    const btn = side === 'left' ? languageLeftBtn : languageRightBtn;
    const dropdown = side === 'left' ? languageLeftDropdown : languageRightDropdown;
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    
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

function selectLanguage(side, code) {
    // Prevent same language on both sides
    if (side === 'left' && code === journalState.rightLanguage) return;
    if (side === 'right' && code === journalState.leftLanguage) return;

    if (side === 'left') {
        journalState.leftLanguage = code;
        languageLeftLabel.textContent = languageNames[code];
    } else {
        journalState.rightLanguage = code;
        languageRightLabel.textContent = languageNames[code];
    }
    updateLanguageOptionSelected();
    closeLanguageDropdowns();
}

function updateLanguageButtonLabels() {
    languageLeftLabel.textContent = languageNames[journalState.leftLanguage];
    languageRightLabel.textContent = languageNames[journalState.rightLanguage];
}

function updateLanguageOptionSelected() {
    languageLeftDropdown.querySelectorAll('.language-option').forEach(opt => {
        const code = opt.dataset.lang;
        opt.classList.toggle('is-selected', code === journalState.leftLanguage);
        opt.disabled = code === journalState.rightLanguage;
    });
    languageRightDropdown.querySelectorAll('.language-option').forEach(opt => {
        const code = opt.dataset.lang;
        opt.classList.toggle('is-selected', code === journalState.rightLanguage);
        opt.disabled = code === journalState.leftLanguage;
    });
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

// Update Microphone UI based on mute state
function updateMicrophoneUI() {
    if (journalState.isMicMuted) {
        // Show muted icon, hide normal icon
        micIcon.style.display = 'none';
        micMutedIcon.style.display = 'block';
        
        // Add muted class to waveform and indicator
        waveform.classList.add('muted');
        listeningIndicator.classList.add('muted');
        
        // Update text
        listeningText.textContent = 'Microphone muted';
    } else {
        // Show normal icon, hide muted icon
        micIcon.style.display = 'block';
        micMutedIcon.style.display = 'none';
        
        // Remove muted class from waveform and indicator
        waveform.classList.remove('muted');
        listeningIndicator.classList.remove('muted');
        
        // Update text
        listeningText.textContent = 'Listening for transcription...';
    }
}

// Paragraph highlight boxes
const paraTimers = new WeakMap();

// Wrap any bare text-node children in divs so the highlighter can target them.
// Called on blur only — cursor is gone so DOM changes are safe.
function normalizeTextNodes(el) {
    Array.from(el.childNodes).forEach(node => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const text = node.textContent;
        if (!text.trim()) { el.removeChild(node); return; }
        const div = document.createElement('div');
        div.textContent = text;
        el.replaceChild(div, node);
    });
}

function highlightParagraphs(el) {
    const divs = Array.from(el.querySelectorAll(':scope > div'));
    divs.forEach(d => d.classList.remove('para-start', 'para-middle', 'para-end', 'para-solo'));

    const isBlank = d => !d.textContent.trim();
    let group = [];

    function flush() {
        if (!group.length) return;
        if (group.length === 1) {
            group[0].classList.add('para-solo');
        } else {
            group[0].classList.add('para-start');
            group[group.length - 1].classList.add('para-end');
            group.slice(1, -1).forEach(d => d.classList.add('para-middle'));
        }
        group = [];
    }

    divs.forEach(d => isBlank(d) ? flush() : group.push(d));
    flush();
}

function scheduleHighlight(el) {
    clearTimeout(paraTimers.get(el));
    paraTimers.set(el, setTimeout(() => highlightParagraphs(el), 250));
}

// Handle text changes
function handleTextChange(e) {
    if (e.target.id === 'english-text') {
        journalState.englishText = e.target.innerHTML;
        scheduleHighlight(e.target);
    } else if (e.target.id === 'spanish-text') {
        journalState.spanishText = e.target.innerHTML;
        scheduleHighlight(e.target);
    }
}

// Journal title: block Enter (no new lines)
function handleJournalTitleKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
}

// Journal title: enforce max 30 characters after input
function enforceJournalTitleLength() {
    const el = journalTitleEl;
    const text = el.textContent;
    if (text.length > MAX_JOURNAL_TITLE_LENGTH) {
        el.textContent = text.slice(0, MAX_JOURNAL_TITLE_LENGTH);
        placeCaretAtEnd(el);
    }
}

// Journal title: paste truncated so total length ≤ 30
function handleJournalTitlePaste(e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const plain = pasted.replace(/\r?\n/g, ' ');
    const current = journalTitleEl.textContent;
    const sel = window.getSelection();
    const start = Math.min(sel.anchorOffset, sel.focusOffset);
    const end = Math.max(sel.anchorOffset, sel.focusOffset);
    const before = current.slice(0, start);
    const after = current.slice(end);
    const combined = before + plain + after;
    const truncated = combined.slice(0, MAX_JOURNAL_TITLE_LENGTH);
    journalTitleEl.textContent = truncated;
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

// Save Journal
function saveJournal() {
    const englishPlain = englishTextEl.textContent.trim();
    const spanishPlain = spanishTextEl.textContent.trim();

    if (!englishPlain && !spanishPlain) {
        alert('Please add some content before saving.');
        return;
    }

    // Get existing entries
    const entries = getJournalEntries();

    const title = journalTitleEl.textContent.trim() || generateJournalTitle();

    // Create new entry or update existing
    const entry = {
        id: journalState.currentJournalId || Date.now().toString(),
        title: title,
        date: new Date().toISOString(),
        englishText: englishTextEl.innerHTML,
        spanishText: spanishTextEl.innerHTML,
        language: 'es',
        leftLanguage: journalState.leftLanguage,
        rightLanguage: journalState.rightLanguage,
        missedCount: journalState.missedCount,
        correctCount: journalState.correctCount
    };
    
    // Remove old entry if updating
    if (journalState.currentJournalId) {
        const filtered = entries.filter(e => e.id !== journalState.currentJournalId);
        entries.length = 0;
        entries.push(...filtered);
    }
    
    // Add new entry at the beginning
    entries.unshift(entry);
    saveJournalEntries(entries);
    
    // Update UI
    journalState.currentJournalId = entry.id;
    loadJournalEntries();
    
    // Show success feedback
    showSaveFeedback();
}

// Generate journal title
function generateJournalTitle() {
    const englishText = englishTextEl.textContent.trim();
    if (englishText) {
        const firstWords = englishText.split(' ').slice(0, 5).join(' ');
        return firstWords.length > 30 ? firstWords.substring(0, 30) + '...' : firstWords;
    }
    return `Journal - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

// Show save feedback
function showSaveFeedback() {
    const originalText = saveJournalBtn.querySelector('span').textContent;
    saveJournalBtn.querySelector('span').textContent = 'Saved!';
    saveJournalBtn.style.background = '#10B981';
    
    setTimeout(() => {
        saveJournalBtn.querySelector('span').textContent = originalText;
        saveJournalBtn.style.background = '';
    }, 2000);
}

// Load Journal Entries (sidebar shows only most recent 7)
const SIDEBAR_JOURNAL_LIMIT = 7;

function loadJournalEntries() {
    const entries = getJournalEntries().slice(0, SIDEBAR_JOURNAL_LIMIT);
    
    // Clear existing list
    journalList.innerHTML = '';
    
    // Add entries to list
    entries.forEach(entry => {
        const item = createJournalListItem(entry);
        journalList.appendChild(item);
    });
}

// Create journal list item
function createJournalListItem(entry) {
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
    `;
    
    div.addEventListener('click', () => openJournal(entry.id));
    
    return div;
}

// Study mode: toggle between normal journal and single-page study view
function toggleStudyMode() {
    journalState.isStudyMode = !journalState.isStudyMode;
    if (journalState.isStudyMode) {
        enterStudyMode();
    } else {
        exitStudyMode();
    }
}

function enterStudyMode() {
    notebookEl.classList.add('study-mode');
    studyModeView.setAttribute('aria-hidden', 'false');
    studyBtn.textContent = 'Exit study';
    studyBtn.classList.add('in-study-mode');
    journalState.studyShowingSource = true;
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

function getTextWithLineBreaks(el) {
    let result = '';
    for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.nodeName === 'BR') {
            result += '\n';
        } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
            result += getTextWithLineBreaks(node) + '\n';
        } else {
            result += getTextWithLineBreaks(node);
        }
    }
    return result;
}

function syncStudyFaces() {
    studySourceLabel.textContent = languageNames[journalState.leftLanguage] || 'English';
    studyTargetLabel.textContent = languageNames[journalState.rightLanguage] || 'Spanish';
    const sourceText = getTextWithLineBreaks(englishTextEl).trim().replace(/\n{3,}/g, '\n\n');
    const targetText = getTextWithLineBreaks(spanishTextEl).trim().replace(/\n{3,}/g, '\n\n');
    studySourceText.textContent = sourceText || 'Waiting for transcription... Type or dictate here.';
    studyTargetText.textContent = targetText || 'Traducción pendiente... Escriba o dicte aquí.';
}

function flipStudyPage() {
    journalState.studyShowingSource = !journalState.studyShowingSource;
    studyCardInner.classList.toggle('flipped', !journalState.studyShowingSource);
    updateFlipButtonText();
}

function updateFlipButtonText() {
    flipPageBtnText.textContent = journalState.studyShowingSource ? 'Show translation' : 'Show original';
}

function recordStudyScore(type) {
    if (type === 'missed') {
        journalState.missedCount++;
        missedCountEl.textContent = journalState.missedCount;
    } else {
        journalState.correctCount++;
        correctCountEl.textContent = journalState.correctCount;
    }
    // Persist immediately to the current journal entry if one exists
    if (journalState.currentJournalId) {
        const entries = getJournalEntries();
        const entry = entries.find(e => e.id === journalState.currentJournalId);
        if (entry) {
            entry.missedCount = journalState.missedCount;
            entry.correctCount = journalState.correctCount;
            saveJournalEntries(entries);
        }
    }
}

function updateScoreDisplay() {
    missedCountEl.textContent = journalState.missedCount;
    correctCountEl.textContent = journalState.correctCount;
}

// Start a brand new journal (clear current, reset to blank)
function startNewJournal() {
    journalState.currentJournalId = null;
    journalTitleEl.textContent = 'Journal';
    englishTextEl.textContent = 'Waiting for transcription... Type or dictate here.';
    spanishTextEl.textContent = 'Traducción pendiente... Escriba o dicte aquí.';
    journalState.englishText = '';
    journalState.spanishText = '';
    journalState.missedCount = 0;
    journalState.correctCount = 0;
    updateScoreDisplay();
    highlightParagraphs(englishTextEl);
    highlightParagraphs(spanishTextEl);
    journalTitleEl.focus();
    window.scrollTo(0, 0);
}

// Open Journal
function openJournal(journalId) {
    const entries = getJournalEntries();
    const entry = entries.find(e => e.id === journalId);
    
    if (entry) {
        const savedTitle = (entry.title || 'Journal').slice(0, MAX_JOURNAL_TITLE_LENGTH);
        journalTitleEl.textContent = savedTitle;
        englishTextEl.innerHTML = entry.englishText || 'Waiting for transcription... Type or dictate here.';
        spanishTextEl.innerHTML = entry.spanishText || 'Traducción pendiente... Escriba o dicte aquí.';
        highlightParagraphs(englishTextEl);
        highlightParagraphs(spanishTextEl);
        journalState.currentJournalId = entry.id;
        journalState.englishText = entry.englishText || '';
        journalState.spanishText = entry.spanishText || '';
        if (entry.leftLanguage) {
            journalState.leftLanguage = entry.leftLanguage;
            languageLeftLabel.textContent = languageNames[entry.leftLanguage] || 'English';
        }
        if (entry.rightLanguage) {
            journalState.rightLanguage = entry.rightLanguage;
            languageRightLabel.textContent = languageNames[entry.rightLanguage] || 'Spanish';
        }
        // Ensure left and right are never the same
        if (journalState.leftLanguage === journalState.rightLanguage) {
            const other = Object.keys(languageNames).find(code => code !== journalState.leftLanguage);
            journalState.rightLanguage = other || 'es';
            languageRightLabel.textContent = languageNames[journalState.rightLanguage];
        }
        updateLanguageOptionSelected();

        journalState.missedCount = entry.missedCount || 0;
        journalState.correctCount = entry.correctCount || 0;
        updateScoreDisplay();

        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// Check for existing journal to load
function checkForExistingJournal() {
    const journalId = sessionStorage.getItem('openJournalId');
    if (journalId) {
        openJournal(journalId);
        sessionStorage.removeItem('openJournalId');
    }
}

// Local Storage Helpers
function getJournalEntries() {
    const entries = localStorage.getItem('journalEntries');
    return entries ? JSON.parse(entries) : [];
}

function saveJournalEntries(entries) {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
