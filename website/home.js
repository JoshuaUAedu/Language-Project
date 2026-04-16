const languageNames = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
};

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
        leftText: p.left, rightText: p.right,
        locked: true, leftLanguage: 'en', rightLanguage: lang,
        missed: 0, correct: 0,
    })),
}));

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// DOM
const journalGrid       = document.getElementById('journal-grid');
const emptyState        = document.getElementById('empty-state');
const sectionCount      = document.getElementById('section-count');
const folderGrid        = document.getElementById('folder-grid');
const emptyFoldersState = document.getElementById('empty-folders-state');
const folderCount       = document.getElementById('folder-count');
const newFolderBtn      = document.getElementById('new-folder-btn');
const recentSection     = document.getElementById('recent-section');

// Active drag state
let activeDrag = { journalId: null, sourceFolderId: null };

// Which folders are currently expanded
const expandedFolders = new Set();

document.addEventListener('DOMContentLoaded', () => {
    render();
    newFolderBtn.addEventListener('click', handleNewFolder);
    setupRecentDropZone();
});

// ── Data ──────────────────────────────────────────────────────────────────────

function getEntries() {
    try { return JSON.parse(localStorage.getItem('journalEntries')) || []; }
    catch { return []; }
}

function saveEntries(entries) {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
}

function getFolders() {
    try { return JSON.parse(localStorage.getItem('journalFolders')) || []; }
    catch { return []; }
}

function saveFolders(folders) {
    localStorage.setItem('journalFolders', JSON.stringify(folders));
}

function getFolderedIds() {
    return new Set(getFolders().flatMap(f => f.journalIds));
}

// ── Folder CRUD ───────────────────────────────────────────────────────────────

function createFolder(name) {
    const folders = getFolders();
    const folder  = { id: Date.now().toString(), name, journalIds: [] };
    folders.push(folder);
    saveFolders(folders);
    return folder;
}

function deleteFolder(folderId) {
    saveFolders(getFolders().filter(f => f.id !== folderId));
}

function renameFolder(folderId, newName) {
    const folders = getFolders();
    const f = folders.find(f => f.id === folderId);
    if (f) f.name = newName.trim() || f.name;
    saveFolders(folders);
}

function addJournalToFolder(folderId, journalId) {
    const folders = getFolders();
    // Remove from any existing folder first (a journal can only live in one folder)
    folders.forEach(f => { f.journalIds = f.journalIds.filter(id => id !== journalId); });
    const folder = folders.find(f => f.id === folderId);
    if (folder && !folder.journalIds.includes(journalId)) folder.journalIds.push(journalId);
    saveFolders(folders);
}

function removeJournalFromFolder(journalId) {
    const folders = getFolders();
    folders.forEach(f => { f.journalIds = f.journalIds.filter(id => id !== journalId); });
    saveFolders(folders);
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
    renderGrid();
    renderBeginnerPhrases();
    renderFolders();
}

function renderBeginnerPhrases() {
    const grid = document.getElementById('beginner-grid');
    if (!grid) return;
    grid.innerHTML = '';
    BUILTIN_JOURNALS.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'journal-card beginner-card';
        const langName = languageNames[entry.rightLanguage] || entry.rightLanguage;
        const preview  = entry.pages.map(p => p.rightText).join(' · ');
        card.innerHTML = `
            <div class="beginner-card-star" aria-label="Beginner phrase set">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#f59e0b" stroke="#d97706" stroke-width="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>
            <div class="beginner-card-lang">${langName}</div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(entry.title)}</div>
                <div class="card-preview">${escapeHtml(preview)}</div>
            </div>
            <div class="beginner-card-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Read-only
            </div>
        `;
        card.addEventListener('click', () => {
            sessionStorage.setItem('openJournalId', entry.id);
            window.location.href = 'journal.html';
        });
        grid.appendChild(card);
    });
}

function renderGrid() {
    const entries    = getEntries();
    const foldered   = getFolderedIds();
    const unfoldered = entries.filter(e => !foldered.has(e.id));

    journalGrid.innerHTML = '';

    if (unfoldered.length === 0) {
        emptyState.style.display = 'flex';
        sectionCount.textContent = '';
    } else {
        emptyState.style.display = 'none';
        sectionCount.textContent = `${unfoldered.length} ${unfoldered.length === 1 ? 'journal' : 'journals'}`;
        unfoldered.forEach(entry => journalGrid.appendChild(buildCard(entry, null)));
    }
}

function renderFolders() {
    const folders = getFolders();
    folderGrid.innerHTML = '';

    if (folders.length === 0) {
        emptyFoldersState.style.display = 'block';
        folderCount.textContent = '';
    } else {
        emptyFoldersState.style.display = 'none';
        folderCount.textContent = `${folders.length} ${folders.length === 1 ? 'folder' : 'folders'}`;
        folders.forEach(folder => folderGrid.appendChild(buildFolderCard(folder)));
    }
}

// ── Journal Card ──────────────────────────────────────────────────────────────

function getPreview(entry) {
    const source = (entry.pages && entry.pages[0])
        ? entry.pages[0].leftText
        : (entry.englishText || '');
    const text = stripHtml(source).trim();
    return text.length > 120 ? text.slice(0, 120) + '…' : text;
}

function buildCard(entry, sourceFolderId) {
    const date  = new Date(entry.date || Date.now());
    const day   = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year  = date.getFullYear();

    const leftLang  = languageNames[entry.leftLanguage]  || entry.leftLanguage  || 'English';
    const rightLang = languageNames[entry.rightLanguage] || entry.rightLanguage || 'Spanish';
    const preview   = getPreview(entry);
    const missed    = entry.missedCount  || 0;
    const correct   = entry.correctCount || 0;
    const hasScores = missed > 0 || correct > 0;

    const card = document.createElement('div');
    card.className     = 'journal-card';
    card.draggable     = true;
    card.dataset.journalId = entry.id;

    card.innerHTML = `
        <button class="card-delete-btn" aria-label="Delete journal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <div class="card-date-header">
            <span class="card-day">${day}</span>
            <div class="card-month-year">
                <span class="card-month">${month}</span>
                <span class="card-year">${year}</span>
            </div>
        </div>
        <div class="card-body">
            <div class="card-title">${escapeHtml(entry.title || 'Untitled Journal')}</div>
            <div class="card-languages">
                ${escapeHtml(leftLang)}
                <em class="card-lang-arrow">→</em>
                ${escapeHtml(rightLang)}
            </div>
            ${preview ? `<div class="card-preview">${escapeHtml(preview)}</div>` : ''}
            ${hasScores ? `
            <div class="card-scores">
                <span class="score-pill correct">✓ ${correct}</span>
                <span class="score-pill missed">✗ ${missed}</span>
            </div>` : ''}
        </div>
    `;

    card.addEventListener('click', e => {
        if (e.target.closest('.card-delete-btn')) return;
        sessionStorage.setItem('openJournalId', entry.id);
        window.location.href = 'journal.html';
    });

    card.querySelector('.card-delete-btn').addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Delete "${entry.title || 'Untitled Journal'}"?`)) {
            saveEntries(getEntries().filter(en => en.id !== entry.id));
            if (sourceFolderId) removeJournalFromFolder(entry.id);
            render();
        }
    });

    // Drag
    card.addEventListener('dragstart', e => {
        activeDrag = { journalId: entry.id, sourceFolderId };
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
        activeDrag = { journalId: null, sourceFolderId: null };
        card.classList.remove('dragging');
    });

    return card;
}

// ── Folder Card ───────────────────────────────────────────────────────────────

function buildFolderCard(folder) {
    const entries       = getEntries();
    const folderEntries = folder.journalIds.map(id => entries.find(e => e.id === id)).filter(Boolean);
    const isExpanded    = expandedFolders.has(folder.id);
    const count         = folderEntries.length;

    const card = document.createElement('div');
    card.className     = 'folder-card' + (isExpanded ? ' expanded' : '');
    card.dataset.folderId = folder.id;

    card.innerHTML = `
        <div class="folder-header">
            <svg class="folder-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
            </svg>
            <span class="folder-name">${escapeHtml(folder.name)}</span>
            <span class="folder-badge">${count}</span>
            <div class="folder-actions">
                <button class="folder-rename-btn" title="Rename" aria-label="Rename folder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="folder-delete-btn" title="Delete folder" aria-label="Delete folder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path><path d="M14 11v6"></path>
                        <path d="M9 6V4h6v2"></path>
                    </svg>
                </button>
            </div>
            <svg class="folder-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </div>
        <div class="folder-body">
            ${isExpanded
                ? (count === 0
                    ? '<p class="folder-empty-msg">No journals in this folder yet. Drag one here.</p>'
                    : '<div class="folder-journal-grid"></div>')
                : ''}
        </div>
    `;

    // Toggle expand / collapse
    card.querySelector('.folder-header').addEventListener('click', e => {
        if (e.target.closest('.folder-rename-btn') || e.target.closest('.folder-delete-btn')) return;
        isExpanded ? expandedFolders.delete(folder.id) : expandedFolders.add(folder.id);
        render();
    });

    // Populate journal cards inside
    if (isExpanded && count > 0) {
        const grid = card.querySelector('.folder-journal-grid');
        folderEntries.forEach(entry => grid.appendChild(buildCard(entry, folder.id)));
    }

    // Double-click name to rename
    card.querySelector('.folder-name').addEventListener('dblclick', e => {
        e.stopPropagation();
        startRename(card, folder);
    });

    card.querySelector('.folder-rename-btn').addEventListener('click', e => {
        e.stopPropagation();
        startRename(card, folder);
    });

    card.querySelector('.folder-delete-btn').addEventListener('click', e => {
        e.stopPropagation();
        const msg = count > 0
            ? `Delete "${folder.name}"? The ${count} journal(s) inside will move back to Recent Journals.`
            : `Delete "${folder.name}"?`;
        if (confirm(msg)) {
            deleteFolder(folder.id);
            expandedFolders.delete(folder.id);
            render();
        }
    });

    // Drop target — accept dragged journals
    card.addEventListener('dragover', e => {
        if (!activeDrag.journalId) return;
        e.preventDefault();
        card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', e => {
        if (!card.contains(e.relatedTarget)) card.classList.remove('drag-over');
    });
    card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (!activeDrag.journalId) return;
        addJournalToFolder(folder.id, activeDrag.journalId);
        expandedFolders.add(folder.id);
        render();
    });

    return card;
}

// ── Inline rename ─────────────────────────────────────────────────────────────

function startRename(card, folder) {
    const nameEl = card.querySelector('.folder-name');
    const input  = document.createElement('input');
    input.type      = 'text';
    input.value     = folder.name;
    input.className = 'folder-rename-input';
    input.maxLength = 40;
    nameEl.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
        const newName = input.value.trim() || folder.name;
        renameFolder(folder.id, newName);
        render();
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  input.blur();
        if (e.key === 'Escape') { input.value = folder.name; input.blur(); }
    });
}

// ── New Folder ────────────────────────────────────────────────────────────────

function handleNewFolder() {
    const folder = createFolder('New Folder');
    expandedFolders.add(folder.id);
    render();
    const card = folderGrid.querySelector(`[data-folder-id="${folder.id}"]`);
    if (card) startRename(card, folder);
}

// ── Recent section as drop zone (to remove from folder) ───────────────────────

function setupRecentDropZone() {
    recentSection.addEventListener('dragover', e => {
        if (!activeDrag.journalId || !activeDrag.sourceFolderId) return;
        e.preventDefault();
        recentSection.classList.add('drop-target');
    });
    recentSection.addEventListener('dragleave', e => {
        if (!recentSection.contains(e.relatedTarget)) recentSection.classList.remove('drop-target');
    });
    recentSection.addEventListener('drop', e => {
        e.preventDefault();
        recentSection.classList.remove('drop-target');
        if (activeDrag.journalId && activeDrag.sourceFolderId) {
            removeJournalFromFolder(activeDrag.journalId);
            render();
        }
    });
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
