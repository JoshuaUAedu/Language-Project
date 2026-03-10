// State Management
const state = {
    currentScreen: 'upload',
    audioFile: null,
    audioElement: null,
    targetLanguage: 'es',
    transcription: [],
    translation: [],
    currentSegment: null,
    isPlaying: false,
    journalEntryId: null,
    audioFileName: null
};

// Language names mapping
const languageNames = {
    'en': 'English Translation',
    'es': 'Spanish Translation',
    'fr': 'French Translation',
    'de': 'German Translation',
    'it': 'Italian Translation',
    'pt': 'Portuguese Translation',
    'zh': 'Chinese Translation',
    'ja': 'Japanese Translation',
    'ko': 'Korean Translation',
    'ar': 'Arabic Translation',
    'hi': 'Hindi Translation'
};

// DOM Elements
const uploadScreen = document.getElementById('upload-screen');
const processingScreen = document.getElementById('processing-screen');
const notebookScreen = document.getElementById('notebook-screen');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const targetLanguageSelect = document.getElementById('target-language');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const processingStatus = document.getElementById('processing-status');
const processingProgressFill = document.getElementById('processing-progress-fill');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');
const seekBar = document.getElementById('seek-bar');
const speedSelect = document.getElementById('speed-select');
const volumeSlider = document.getElementById('volume-slider');
const newUploadBtn = document.getElementById('new-upload-btn');
const leftPage = document.getElementById('left-page');
const rightPage = document.getElementById('right-page');
const transcriptionContent = document.getElementById('transcription-content');
const translationContent = document.getElementById('translation-content');
const targetLanguageHeader = document.getElementById('target-language-header');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadSavedLanguage();
    checkForExistingJournal();
});

// Event Listeners
function initializeEventListeners() {
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Language selection
    targetLanguageSelect.addEventListener('change', handleLanguageChange);
    
    // Audio controls
    playBtn.addEventListener('click', togglePlayback);
    seekBar.addEventListener('input', handleSeek);
    speedSelect.addEventListener('change', handleSpeedChange);
    volumeSlider.addEventListener('input', handleVolumeChange);
    
    // New upload
    newUploadBtn.addEventListener('click', resetToUpload);
    
    // Scroll synchronization
    leftPage.addEventListener('scroll', () => syncScroll(leftPage, rightPage));
    rightPage.addEventListener('scroll', () => syncScroll(rightPage, leftPage));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// File Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    // Validate file type
    if (!file.type.startsWith('audio/')) {
        alert('Please select a valid audio file.');
        return;
    }
    
    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB.');
        return;
    }
    
    state.audioFile = file;
    state.audioFileName = file.name;
    
    // Show upload progress
    showUploadProgress();
    
    // Simulate upload progress
    simulateUpload(() => {
        // After upload, show processing screen
        showScreen('processing');
        simulateProcessing();
    });
}

function showUploadProgress() {
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading...';
}

function simulateUpload(callback) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            progressText.textContent = 'Upload complete!';
            setTimeout(callback, 500);
        } else {
            progressFill.style.width = progress + '%';
            progressText.textContent = `Uploading... ${Math.round(progress)}%`;
        }
    }, 200);
}

function simulateProcessing() {
    let progress = 0;
    const steps = [
        { progress: 30, message: 'Transcribing audio...' },
        { progress: 60, message: 'Translating text...' },
        { progress: 90, message: 'Finalizing results...' },
        { progress: 100, message: 'Complete!' }
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex < steps.length) {
            const step = steps[stepIndex];
            progress = step.progress;
            processingStatus.textContent = step.message;
            processingProgressFill.style.width = progress + '%';
            stepIndex++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                loadMockData();
                showScreen('notebook');
                initializeAudio();
                saveJournalEntry();
            }, 1000);
        }
    }, 1500);
}

// Screen Management
function showScreen(screenName) {
    uploadScreen.classList.remove('active');
    processingScreen.classList.remove('active');
    notebookScreen.classList.remove('active');
    
    state.currentScreen = screenName;
    
    switch(screenName) {
        case 'upload':
            uploadScreen.classList.add('active');
            break;
        case 'processing':
            processingScreen.classList.add('active');
            break;
        case 'notebook':
            notebookScreen.classList.add('active');
            break;
    }
}

// Mock Data (for demonstration)
function loadMockData() {
    // Mock transcription data
    state.transcription = [
        { id: 1, start_time: 0.0, end_time: 3.2, text: "Hello, welcome to our presentation. Today we'll be discussing the future of artificial intelligence and its impact on various industries." },
        { id: 2, start_time: 3.2, end_time: 8.5, text: "Artificial intelligence has revolutionized the way we work, communicate, and solve problems. From healthcare to finance, AI is transforming every sector." },
        { id: 3, start_time: 8.5, end_time: 12.8, text: "One of the most exciting developments is in natural language processing. Machines can now understand and generate human language with remarkable accuracy." },
        { id: 4, start_time: 12.8, end_time: 18.2, text: "However, with great power comes great responsibility. We must ensure that AI is developed ethically and used for the benefit of all humanity." },
        { id: 5, start_time: 18.2, end_time: 22.5, text: "Thank you for your attention. I'm happy to answer any questions you might have about this fascinating topic." }
    ];
    
    // Mock translation data (Spanish by default)
    state.translation = [
        { id: 1, text: "Hola, bienvenido a nuestra presentación. Hoy hablaremos sobre el futuro de la inteligencia artificial y su impacto en diversas industrias." },
        { id: 2, text: "La inteligencia artificial ha revolucionado la forma en que trabajamos, nos comunicamos y resolvemos problemas. Desde la atención médica hasta las finanzas, la IA está transformando todos los sectores." },
        { id: 3, text: "Uno de los desarrollos más emocionantes es en el procesamiento del lenguaje natural. Las máquinas ahora pueden entender y generar lenguaje humano con una precisión notable." },
        { id: 4, text: "Sin embargo, con gran poder viene una gran responsabilidad. Debemos asegurarnos de que la IA se desarrolle de manera ética y se use para el beneficio de toda la humanidad." },
        { id: 5, text: "Gracias por su atención. Estoy feliz de responder cualquier pregunta que puedan tener sobre este tema fascinante." }
    ];
    
    renderNotebook();
}

// Render Notebook Content
function renderNotebook() {
    // Clear existing content
    transcriptionContent.innerHTML = '';
    translationContent.innerHTML = '';
    
    // Render transcription
    state.transcription.forEach((segment, index) => {
        const segmentEl = createSegmentElement(segment, index, 'transcription');
        transcriptionContent.appendChild(segmentEl);
    });
    
    // Render translation
    state.translation.forEach((segment, index) => {
        const segmentEl = createSegmentElement(segment, index, 'translation');
        translationContent.appendChild(segmentEl);
    });
}

function createSegmentElement(segment, index, type) {
    const container = document.createElement('div');
    container.className = 'text-segment';
    container.dataset.segmentId = segment.id;
    container.dataset.index = index;
    
    if (type === 'transcription') {
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = formatTime(segment.start_time);
        timestamp.addEventListener('click', () => seekToTime(segment.start_time));
        
        const text = document.createElement('span');
        text.className = 'segment-text';
        text.textContent = segment.text;
        
        container.appendChild(timestamp);
        container.appendChild(text);
    } else {
        const text = document.createElement('span');
        text.className = 'segment-text';
        text.textContent = segment.text;
        container.appendChild(text);
    }
    
    // Add click handler for highlighting
    container.addEventListener('click', () => highlightSegment(index));
    
    return container;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Audio Management
function initializeAudio() {
    if (!state.audioFile) return;
    
    // Create audio element from file
    const audioUrl = URL.createObjectURL(state.audioFile);
    state.audioElement = new Audio(audioUrl);
    
    // Set up audio event listeners
    state.audioElement.addEventListener('loadedmetadata', () => {
        totalTimeDisplay.textContent = formatTime(state.audioElement.duration);
        seekBar.max = state.audioElement.duration;
    });
    
    state.audioElement.addEventListener('timeupdate', updateAudioUI);
    state.audioElement.addEventListener('ended', () => {
        state.isPlaying = false;
        updatePlayButton();
    });
    
    // Set initial volume
    state.audioElement.volume = volumeSlider.value / 100;
    
    // Update segment highlighting based on current time
    state.audioElement.addEventListener('timeupdate', updateActiveSegment);
}

function togglePlayback() {
    if (!state.audioElement) return;
    
    if (state.isPlaying) {
        state.audioElement.pause();
    } else {
        state.audioElement.play();
    }
    
    state.isPlaying = !state.isPlaying;
    updatePlayButton();
}

function updatePlayButton() {
    if (state.isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

function updateAudioUI() {
    if (!state.audioElement) return;
    
    const currentTime = state.audioElement.currentTime;
    currentTimeDisplay.textContent = formatTime(currentTime);
    seekBar.value = currentTime;
}

function handleSeek(e) {
    if (!state.audioElement) return;
    const time = parseFloat(e.target.value);
    state.audioElement.currentTime = time;
}

function seekToTime(time) {
    if (!state.audioElement) return;
    state.audioElement.currentTime = time;
    if (!state.isPlaying) {
        togglePlayback();
    }
}

function handleSpeedChange(e) {
    if (!state.audioElement) return;
    state.audioElement.playbackRate = parseFloat(e.target.value);
}

function handleVolumeChange(e) {
    if (!state.audioElement) return;
    state.audioElement.volume = e.target.value / 100;
}

function updateActiveSegment() {
    if (!state.audioElement) return;
    
    const currentTime = state.audioElement.currentTime;
    const activeIndex = state.transcription.findIndex(segment => 
        currentTime >= segment.start_time && currentTime < segment.end_time
    );
    
    if (activeIndex !== -1 && activeIndex !== state.currentSegment) {
        state.currentSegment = activeIndex;
        highlightSegment(activeIndex);
    }
}

function highlightSegment(index) {
    // Remove active class from all segments
    document.querySelectorAll('.text-segment').forEach(el => {
        el.classList.remove('active');
    });
    
    // Add active class to corresponding segments
    const leftSegments = transcriptionContent.querySelectorAll('.text-segment');
    const rightSegments = translationContent.querySelectorAll('.text-segment');
    
    if (leftSegments[index]) {
        leftSegments[index].classList.add('active');
        leftSegments[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (rightSegments[index]) {
        rightSegments[index].classList.add('active');
        rightSegments[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Scroll Synchronization
function syncScroll(sourcePage, targetPage) {
    const sourceScrollTop = sourcePage.scrollTop;
    const sourceScrollHeight = sourcePage.scrollHeight - sourcePage.clientHeight;
    const sourceScrollRatio = sourceScrollHeight > 0 ? sourceScrollTop / sourceScrollHeight : 0;
    
    const targetScrollHeight = targetPage.scrollHeight - targetPage.clientHeight;
    const targetScrollTop = sourceScrollRatio * targetScrollHeight;
    
    // Temporarily remove listener to prevent infinite loop
    targetPage.removeEventListener('scroll', syncScroll);
    targetPage.scrollTop = targetScrollTop;
    
    // Re-add listener after a short delay
    setTimeout(() => {
        targetPage.addEventListener('scroll', () => syncScroll(targetPage, sourcePage));
    }, 50);
}

// Language Management
function handleLanguageChange(e) {
    state.targetLanguage = e.target.value;
    saveLanguagePreference();
    updateLanguageHeader();
    
    // In a real app, this would trigger a new translation API call
    // For now, we'll just update the header
    updateLanguageHeader();
}

function updateLanguageHeader() {
    targetLanguageHeader.textContent = languageNames[state.targetLanguage] || 'Translation';
}

function saveLanguagePreference() {
    localStorage.setItem('targetLanguage', state.targetLanguage);
}

function loadSavedLanguage() {
    const saved = localStorage.getItem('targetLanguage');
    if (saved && languageNames[saved]) {
        state.targetLanguage = saved;
        targetLanguageSelect.value = saved;
        updateLanguageHeader();
    }
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    if (state.currentScreen !== 'notebook') return;
    
    // Spacebar for play/pause
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlayback();
    }
    
    // Arrow keys for seeking (when not focused on input)
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            if (state.audioElement) {
                state.audioElement.currentTime = Math.max(0, state.audioElement.currentTime - 5);
            }
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (state.audioElement) {
                state.audioElement.currentTime = Math.min(
                    state.audioElement.duration,
                    state.audioElement.currentTime + 5
                );
            }
        }
    }
}

// Reset to Upload Screen / Navigate to Home
function resetToUpload() {
    if (state.audioElement) {
        state.audioElement.pause();
        state.audioElement = null;
    }
    
    if (state.audioFile) {
        URL.revokeObjectURL(state.audioFile);
        state.audioFile = null;
    }
    
    state.transcription = [];
    state.translation = [];
    state.currentSegment = null;
    state.isPlaying = false;
    state.journalEntryId = null;
    state.audioFileName = null;
    
    fileInput.value = '';
    uploadProgress.style.display = 'none';
    
    // Navigate back to home page
    window.location.href = 'index.html';
}

// Save Journal Entry
function saveJournalEntry() {
    if (state.transcription.length === 0) return;
    
    const entryData = {
        title: state.audioFileName ? 
            state.audioFileName.replace(/\.[^/.]+$/, '') : 
            `Journal ${new Date().toLocaleDateString()}`,
        language: state.targetLanguage,
        transcription: state.transcription,
        translation: state.translation,
        audioFileName: state.audioFileName
    };
    
    // Save to sessionStorage so home page can pick it up
    sessionStorage.setItem('newJournalEntry', JSON.stringify(entryData));
}

// Check for existing journal to load
function checkForExistingJournal() {
    const journalId = sessionStorage.getItem('openJournalId');
    if (journalId) {
        // Load the journal entry
        loadJournalEntry(journalId);
        sessionStorage.removeItem('openJournalId');
    }
}

// Load a journal entry
function loadJournalEntry(journalId) {
    // Get journal entries from localStorage
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const entry = entries.find(e => e.id === journalId);
    
    if (entry) {
        state.transcription = entry.transcription || [];
        state.translation = entry.translation || [];
        state.targetLanguage = entry.language || 'es';
        state.audioFileName = entry.audioFileName;
        state.journalEntryId = entry.id;
        
        // Update UI
        targetLanguageSelect.value = state.targetLanguage;
        updateLanguageHeader();
        
        // Skip upload and processing, go straight to notebook
        showScreen('notebook');
        renderNotebook();
        
        // Note: Audio won't be available since we don't store the actual file
        // In a real implementation, you'd need to store/retrieve the audio file
    }
}
