const SERVER_URL = `http://${GPU_IP}:8000`;

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

const _INTERMEDIATE_PHRASE_PAGES = {
    es: [
        { left: 'It is nice to meet you',  right: 'Es un placer conocerte' },
        { left: 'What do you recommend?',  right: '¿Qué recomiendas?' },
        { left: 'My name is __',           right: 'Me llamo __' },
        { left: 'What does this mean?',    right: '¿Qué significa esto?' },
        { left: 'How do I get to __?',     right: '¿Cómo llego a __?' },
        { left: 'Can I see the menu?',     right: '¿Puedo ver el menú?' },
        { left: 'I am lost',               right: 'Estoy perdido' },
        { left: 'I like it!',              right: '¡Me gusta!' },
        { left: 'How are you?',            right: '¿Cómo estás?' },
        { left: 'Where are you from?',     right: '¿De dónde eres?' },
    ],
    fr: [
        { left: 'It is nice to meet you',  right: 'Enchanté de vous rencontrer' },
        { left: 'What do you recommend?',  right: 'Qu\'est-ce que vous recommandez?' },
        { left: 'My name is __',           right: 'Je m\'appelle __' },
        { left: 'What does this mean?',    right: 'Qu\'est-ce que cela signifie?' },
        { left: 'How do I get to __?',     right: 'Comment aller à __?' },
        { left: 'Can I see the menu?',     right: 'Puis-je voir le menu?' },
        { left: 'I am lost',               right: 'Je suis perdu' },
        { left: 'I like it!',              right: 'J\'aime ça!' },
        { left: 'How are you?',            right: 'Comment allez-vous?' },
        { left: 'Where are you from?',     right: 'D\'où venez-vous?' },
    ],
    de: [
        { left: 'It is nice to meet you',  right: 'Schön, Sie kennenzulernen' },
        { left: 'What do you recommend?',  right: 'Was empfehlen Sie?' },
        { left: 'My name is __',           right: 'Ich heiße __' },
        { left: 'What does this mean?',    right: 'Was bedeutet das?' },
        { left: 'How do I get to __?',     right: 'Wie komme ich zu __?' },
        { left: 'Can I see the menu?',     right: 'Kann ich die Speisekarte sehen?' },
        { left: 'I am lost',               right: 'Ich habe mich verlaufen' },
        { left: 'I like it!',              right: 'Es gefällt mir!' },
        { left: 'How are you?',            right: 'Wie geht es Ihnen?' },
        { left: 'Where are you from?',     right: 'Woher kommen Sie?' },
    ],
    zh: [
        { left: 'It is nice to meet you',  right: '很高兴认识你' },
        { left: 'What do you recommend?',  right: '你推荐什么？' },
        { left: 'My name is __',           right: '我叫 __' },
        { left: 'What does this mean?',    right: '这是什么意思？' },
        { left: 'How do I get to __?',     right: '我怎么去 __？' },
        { left: 'Can I see the menu?',     right: '我可以看菜单吗？' },
        { left: 'I am lost',               right: '我迷路了' },
        { left: 'I like it!',              right: '我喜欢！' },
        { left: 'How are you?',            right: '你好吗？' },
        { left: 'Where are you from?',     right: '你从哪里来？' },
    ],
    ja: [
        { left: 'It is nice to meet you',  right: 'はじめまして' },
        { left: 'What do you recommend?',  right: '何がおすすめですか？' },
        { left: 'My name is __',           right: '私の名前は __' },
        { left: 'What does this mean?',    right: 'これはどういう意味ですか？' },
        { left: 'How do I get to __?',     right: '__ へはどうやって行きますか？' },
        { left: 'Can I see the menu?',     right: 'メニューを見せてもらえますか？' },
        { left: 'I am lost',               right: '道に迷いました' },
        { left: 'I like it!',              right: '気に入りました！' },
        { left: 'How are you?',            right: 'お元気ですか？' },
        { left: 'Where are you from?',     right: 'どこの出身ですか？' },
    ],
    ko: [
        { left: 'It is nice to meet you',  right: '만나서 반갑습니다' },
        { left: 'What do you recommend?',  right: '무엇을 추천하시나요?' },
        { left: 'My name is __',           right: '제 이름은 __' },
        { left: 'What does this mean?',    right: '이게 무슨 뜻이에요?' },
        { left: 'How do I get to __?',     right: '__ 에 어떻게 가나요?' },
        { left: 'Can I see the menu?',     right: '메뉴를 볼 수 있을까요?' },
        { left: 'I am lost',               right: '길을 잃었어요' },
        { left: 'I like it!',              right: '마음에 들어요!' },
        { left: 'How are you?',            right: '잘 지내세요?' },
        { left: 'Where are you from?',     right: '어디서 오셨어요?' },
    ],
};

const INTERMEDIATE_JOURNALS = Object.entries(_INTERMEDIATE_PHRASE_PAGES).map(([lang, phrases]) => ({
    id:            `intermediate-${lang}`,
    title:         `Intermediate Phrases - ${languageNames[lang]}`,
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

function getExamLevel(id) {
    try { return (JSON.parse(localStorage.getItem('journalExamLevels')) || {})[id] || 0; }
    catch { return 0; }
}

// ── Rank system ───────────────────────────────────────────────────────────────

const RANKS = [
    { passes: 10, name: 'Emerald',  key: 'emerald'  },
    { passes:  7, name: 'Sapphire', key: 'sapphire' },
    { passes:  6, name: 'Ruby',     key: 'ruby'     },
    { passes:  5, name: 'Diamond',  key: 'diamond'  },
    { passes:  4, name: 'Platinum', key: 'platinum' },
    { passes:  3, name: 'Gold',     key: 'gold'     },
    { passes:  2, name: 'Silver',   key: 'silver'   },
    { passes:  1, name: 'Bronze',   key: 'bronze'   },
];

function getRank(level) {
    return RANKS.find(r => level >= r.passes) || null;
}

function getRankBadgeSVG(level, uid) {
    const rank = getRank(level);
    if (!rank) return '';
    const g = `rbg-${rank.key}-${uid}`;
    const shapes = {
        bronze:   { def: `<linearGradient id="${g}" x1="0" y1="0" x2=".5" y2="1"><stop offset="0%" stop-color="#ffcc80"/><stop offset="55%" stop-color="#cd853f"/><stop offset="100%" stop-color="#7b3310"/></linearGradient>`, body: `<path d="M12 2L22 6V13C22 18.5 17.5 22 12 23C6.5 22 2 18.5 2 13V6Z" fill="url(#${g})" stroke="#8b4513" stroke-width="1.3"/><text x="12" y="16.5" text-anchor="middle" font-size="8.5" font-weight="bold" fill="rgba(255,255,255,0.75)" font-family="serif">B</text>` },
        silver:   { def: `<linearGradient id="${g}" x1="0" y1="0" x2=".5" y2="1"><stop offset="0%" stop-color="#fafafa"/><stop offset="50%" stop-color="#c0c0c0"/><stop offset="100%" stop-color="#6e6e6e"/></linearGradient>`, body: `<polygon points="12,2.5 21.5,7.75 21.5,16.25 12,21.5 2.5,16.25 2.5,7.75" fill="url(#${g})" stroke="#9e9e9e" stroke-width="1.3"/><polygon points="12,5.5 18.5,9.25 18.5,14.75 12,18.5 5.5,14.75 5.5,9.25" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.8"/>` },
        gold:     { def: `<radialGradient id="${g}" cx="45%" cy="35%"><stop offset="0%" stop-color="#fffde7"/><stop offset="45%" stop-color="#ffd740"/><stop offset="100%" stop-color="#e65100"/></radialGradient>`, body: `<polygon points="12,2 14.35,8.76 21.51,8.91 15.8,13.24 17.88,20.09 12,16 6.12,20.09 8.2,13.24 2.49,8.91 9.65,8.76" fill="url(#${g})" stroke="#f57f17" stroke-width="1.3"/>` },
        platinum: { def: `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#dce8f0"/><stop offset="100%" stop-color="#90a4ae"/></linearGradient>`, body: `<polygon points="12,2 22,12 12,22 2,12" fill="url(#${g})" stroke="#90a4ae" stroke-width="1.5"/><polygon points="12,5.5 18.5,12 12,18.5 5.5,12" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="0.9"/><polygon points="12,8.5 15.5,12 12,15.5 8.5,12" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.7"/>` },
        diamond:  { def: `<radialGradient id="${g}" cx="38%" cy="28%"><stop offset="0%" stop-color="#e0ffff"/><stop offset="40%" stop-color="#4dd0e1"/><stop offset="100%" stop-color="#00838f"/></radialGradient>`, body: `<polygon points="8,2 16,2 22,10 12,22 2,10" fill="url(#${g})" stroke="#00acc1" stroke-width="1.3"/><line x1="8" y1="2" x2="12" y2="10" stroke="rgba(255,255,255,0.55)" stroke-width="0.9"/><line x1="16" y1="2" x2="12" y2="10" stroke="rgba(255,255,255,0.55)" stroke-width="0.9"/><line x1="2" y1="10" x2="22" y2="10" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>` },
        ruby:     { def: `<radialGradient id="${g}" cx="38%" cy="32%"><stop offset="0%" stop-color="#ff8a80"/><stop offset="45%" stop-color="#e53935"/><stop offset="100%" stop-color="#6a0010"/></radialGradient>`, body: `<polygon points="12,2 19.07,4.93 22,12 19.07,19.07 12,22 4.93,19.07 2,12 4.93,4.93" fill="url(#${g})" stroke="#b71c1c" stroke-width="1.3"/><polygon points="12,5 17.2,7.2 19,12 17.2,16.8 12,19 6.8,16.8 5,12 6.8,7.2" fill="none" stroke="rgba(255,200,200,0.45)" stroke-width="0.8"/>` },
        sapphire: { def: `<radialGradient id="${g}" cx="38%" cy="28%"><stop offset="0%" stop-color="#b3d4ff"/><stop offset="45%" stop-color="#2979ff"/><stop offset="100%" stop-color="#0d1b6e"/></radialGradient>`, body: `<polygon points="12,2 14.5,7.67 20.66,7 17,12 20.66,17 14.5,16.33 12,22 9.5,16.33 3.34,17 7,12 3.34,7 9.5,7.67" fill="url(#${g})" stroke="#1565c0" stroke-width="1.3"/>` },
        emerald:  { def: `<radialGradient id="${g}" cx="38%" cy="28%"><stop offset="0%" stop-color="#b9fbc0"/><stop offset="40%" stop-color="#00e676"/><stop offset="100%" stop-color="#00600f"/></radialGradient>`, body: `<path d="M2,22 L2,11 L7,16 L12,4 L17,16 L22,11 L22,22 Z" fill="url(#${g})" stroke="#00600f" stroke-width="1.3"/><rect x="2" y="20" width="20" height="2.5" rx="1" fill="rgba(0,96,15,0.55)"/><circle cx="7" cy="19" r="1.2" fill="rgba(255,255,255,0.4)"/><circle cx="12" cy="19" r="1.2" fill="rgba(255,255,255,0.4)"/><circle cx="17" cy="19" r="1.2" fill="rgba(255,255,255,0.4)"/>` },
    };
    const s = shapes[rank.key];
    return `<svg class="rank-badge rank-${rank.key}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="${rank.name} rank" title="${rank.name}"><defs>${s.def}</defs>${s.body}</svg>`;
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
    renderRankings();
    renderGrid();
    renderBeginnerPhrases();
    renderIntermediatePhrases();
    renderFolders();
}

function renderRankings() {
    const track = document.getElementById('rankings-track');
    const totalEl = document.getElementById('rankings-total');
    if (!track) return;

    // Tally pass counts across all journals (builtins have no exam levels)
    let levels = {};
    try { levels = JSON.parse(localStorage.getItem('journalExamLevels')) || {}; } catch {}
    const allPasses = Object.values(levels);
    const totalPasses = allPasses.reduce((s, n) => s + n, 0);
    const highestLevel = allPasses.length ? Math.max(...allPasses) : 0;

    // For each rank tier, count journals at EXACTLY this rank (not passed beyond it)
    const rankCounts = RANKS.map(r => ({
        ...r,
        count: allPasses.filter(l => getRank(l)?.key === r.key).length,
        unlocked: highestLevel >= r.passes,
    }));

    // Total display
    totalEl.innerHTML = totalPasses > 0
        ? `<span class="rankings-total-num">${totalPasses}</span><span class="rankings-total-label"> total exam ${totalPasses === 1 ? 'pass' : 'passes'}</span>`
        : `<span class="rankings-total-label">Complete exams to earn ranks</span>`;

    // Render rank cards in reverse (Bronze → Emerald = left → right)
    track.innerHTML = '';
    const reversed = [...rankCounts].reverse();
    reversed.forEach((r, idx) => {
        const card = document.createElement('div');
        card.className = `rank-card ${r.unlocked ? 'rank-card-unlocked' : 'rank-card-locked'}`;
        card.style.animationDelay = `${idx * 0.06}s`;

        const badgeSVG = getRankBadgeSVG(r.passes, `track-${r.key}`);
        // Connector is filled only if the NEXT (higher) rank is also unlocked
        const nextUnlocked = idx < reversed.length - 1 && reversed[idx + 1].unlocked;
        const connector = idx < reversed.length - 1
            ? `<div class="rank-connector ${nextUnlocked ? 'connector-filled' : ''}"></div>` : '';

        card.innerHTML = `
            <div class="rank-card-glow rank-glow-${r.key}"></div>
            <div class="rank-badge-wrap">${badgeSVG}</div>
            <div class="rank-card-name">${r.name}</div>
            <div class="rank-card-req">${r.passes === 1 ? '1 pass' : `${r.passes} passes`}</div>
            <div class="rank-card-count">${r.count > 0 ? `${r.count} journal${r.count > 1 ? 's' : ''}` : r.unlocked ? '✓' : '—'}</div>
        `;
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openRankFilter(r, card));
        track.appendChild(card);
        if (connector) track.insertAdjacentHTML('beforeend', connector);
    });  // end reversed.forEach

    document.getElementById('rank-filter-close').addEventListener('click', closeRankFilter);
}

let _activeRankCard = null;

function openRankFilter(rank, cardEl) {
    // Toggle off if clicking the same rank again
    if (_activeRankCard === cardEl) { closeRankFilter(); return; }

    // Deselect previous
    if (_activeRankCard) _activeRankCard.classList.remove('rank-card-active');
    _activeRankCard = cardEl;
    cardEl.classList.add('rank-card-active');

    const panel     = document.getElementById('rank-filter-panel');
    const titleEl   = document.getElementById('rank-filter-title');
    const grid      = document.getElementById('rank-filter-grid');
    const emptyEl   = document.getElementById('rank-filter-empty');

    // Find journals (user + builtins) whose current rank exactly matches this tier
    const entries   = [...getEntries(), ...BUILTIN_JOURNALS];
    const matches   = entries.filter(e => getRank(getExamLevel(e.id))?.key === rank.key);

    titleEl.innerHTML = getRankBadgeSVG(rank.passes, `filter-${rank.key}`)
        + `<span>${rank.name} Journals</span>`;

    grid.innerHTML = '';
    matches.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'rank-filter-item';
        const leftLang  = languageNames[entry.leftLanguage]  || entry.leftLanguage  || 'English';
        const rightLang = languageNames[entry.rightLanguage] || entry.rightLanguage || 'Spanish';
        const level     = getExamLevel(entry.id);
        item.innerHTML = `
            ${getRankBadgeSVG(level, `fi-${entry.id}`)}
            <div class="rank-filter-item-info">
                <div class="rank-filter-item-title">${escapeHtml(entry.title || 'Untitled Journal')}</div>
                <div class="rank-filter-item-lang">${escapeHtml(leftLang)} → ${escapeHtml(rightLang)}</div>
            </div>
            <div class="rank-filter-item-passes">${level} pass${level === 1 ? '' : 'es'}</div>
        `;
        item.addEventListener('click', () => {
            sessionStorage.setItem('openJournalId', entry.id);
            window.location.href = 'journal.html';
        });
        grid.appendChild(item);
    });

    emptyEl.hidden = matches.length > 0;
    panel.hidden   = false;
    // Animate in
    panel.classList.remove('rank-filter-visible');
    requestAnimationFrame(() => panel.classList.add('rank-filter-visible'));
}

function closeRankFilter() {
    if (_activeRankCard) { _activeRankCard.classList.remove('rank-card-active'); _activeRankCard = null; }
    const panel = document.getElementById('rank-filter-panel');
    panel.classList.remove('rank-filter-visible');
    panel.addEventListener('transitionend', () => { panel.hidden = true; }, { once: true });
}

function renderBeginnerPhrases() {
    const grid = document.getElementById('beginner-grid');
    if (!grid) return;
    grid.innerHTML = '';
    BUILTIN_JOURNALS.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'journal-card beginner-card';
        const langName   = languageNames[entry.rightLanguage] || entry.rightLanguage;
        const preview    = entry.pages.map(p => p.rightText).join(' · ');
        const isCJK      = ['zh', 'ja', 'ko'].includes(entry.rightLanguage);
        const rankBadge  = getRankBadgeSVG(getExamLevel(entry.id), entry.id);

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
                ${isCJK ? `<div class="card-preview card-romanized" data-lang="${entry.rightLanguage}"></div>` : ''}
            </div>
            <div class="beginner-card-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Read-only
            </div>
            ${rankBadge ? `<div class="card-rank-badge">${rankBadge}</div>` : ''}
        `;

        card.addEventListener('click', () => {
            sessionStorage.setItem('openJournalId', entry.id);
            window.location.href = 'journal.html';
        });
        grid.appendChild(card);

        // Async: fetch romanization for CJK cards after render
        if (isCJK) {
            const romEl = card.querySelector('.card-romanized');
            fetchBeginnerRomanized(preview, entry.rightLanguage).then(rom => {
                if (rom && romEl) romEl.textContent = rom;
            });
        }
    });
    updateMasteryBar(BUILTIN_JOURNALS, 'mastery-fill', 'mastery-pct');
}

function renderIntermediatePhrases() {
    const grid = document.getElementById('intermediate-grid');
    if (!grid) return;
    grid.innerHTML = '';
    INTERMEDIATE_JOURNALS.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'journal-card intermediate-card';
        const langName  = languageNames[entry.rightLanguage] || entry.rightLanguage;
        const preview   = entry.pages.map(p => p.rightText).join(' · ');
        const isCJK     = ['zh', 'ja', 'ko'].includes(entry.rightLanguage);
        const rankBadge = getRankBadgeSVG(getExamLevel(entry.id), entry.id);

        card.innerHTML = `
            <div class="intermediate-card-icon" aria-label="Intermediate phrase set">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#6b21a8" stroke="#3b0764" stroke-width="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="#6b21a8" stroke="#3b0764" stroke-width="1" style="margin-left:-6px;margin-top:4px;">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>
            <div class="intermediate-card-lang">${langName}</div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(entry.title)}</div>
                <div class="card-preview">${escapeHtml(preview)}</div>
                ${isCJK ? `<div class="card-preview card-romanized intermediate-romanized" data-lang="${entry.rightLanguage}"></div>` : ''}
            </div>
            <div class="beginner-card-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Read-only
            </div>
            ${rankBadge ? `<div class="card-rank-badge">${rankBadge}</div>` : ''}
        `;

        card.addEventListener('click', () => {
            sessionStorage.setItem('openJournalId', entry.id);
            window.location.href = 'journal.html';
        });
        grid.appendChild(card);

        if (isCJK) {
            const romEl = card.querySelector('.intermediate-romanized');
            fetchBeginnerRomanized(preview, entry.rightLanguage).then(rom => {
                if (rom && romEl) romEl.textContent = rom;
            });
        }
    });
    updateMasteryBar(INTERMEDIATE_JOURNALS, 'intermediate-mastery-fill', 'intermediate-mastery-pct');
}

function updateMasteryBar(journals, fillId, pctId) {
    const completed = journals.filter(j => getExamLevel(j.id) >= 1).length;
    const pct = completed === journals.length ? 100 : Math.floor((completed / journals.length) * 100);
    const fill = document.getElementById(fillId);
    const pctEl = document.getElementById(pctId);
    if (fill) fill.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
}

async function fetchBeginnerRomanized(text, lang) {
    try {
        const fd = new FormData();
        fd.append('text', text);
        fd.append('lang', lang);
        const res = await fetch(`${SERVER_URL}/romanize`, { method: 'POST', body: fd });
        if (!res.ok) return null;
        const data = await res.json();
        return data.romanized || null;
    } catch { return null; }
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
    const rankBadge = getRankBadgeSVG(getExamLevel(entry.id), entry.id);

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
            <span class="card-day">${String(day).padStart(2, '0')}</span>
            <span class="card-month">${month}</span>
            <span class="card-year">${year}</span>
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
        ${rankBadge ? `<div class="card-rank-badge">${rankBadge}</div>` : ''}
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