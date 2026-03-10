const languageNames = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
    ko: 'Korean', ar: 'Arabic', hi: 'Hindi'
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const journalGrid  = document.getElementById('journal-grid');
const emptyState   = document.getElementById('empty-state');
const sectionCount = document.getElementById('section-count');

document.addEventListener('DOMContentLoaded', renderGrid);

function getEntries() {
    try {
        return JSON.parse(localStorage.getItem('journalEntries')) || [];
    } catch {
        return [];
    }
}

function saveEntries(entries) {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
}

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

function renderGrid() {
    const entries = getEntries();
    journalGrid.innerHTML = '';

    if (entries.length === 0) {
        emptyState.style.display = 'flex';
        sectionCount.textContent = '';
        return;
    }

    emptyState.style.display = 'none';
    sectionCount.textContent = `${entries.length} ${entries.length === 1 ? 'journal' : 'journals'}`;

    entries.forEach(entry => journalGrid.appendChild(buildCard(entry)));
}

function buildCard(entry) {
    const date  = new Date(entry.date || Date.now());
    const day   = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year  = date.getFullYear();

    const leftLang  = languageNames[entry.leftLanguage]  || entry.leftLanguage  || 'English';
    const rightLang = languageNames[entry.rightLanguage] || entry.rightLanguage || 'Spanish';

    const rawPreview = stripHtml(entry.englishText || '').trim();
    const preview    = rawPreview.length > 140 ? rawPreview.slice(0, 140) + '…' : rawPreview;

    const missed  = entry.missedCount  || 0;
    const correct = entry.correctCount || 0;
    const hasScores = missed > 0 || correct > 0;

    const card = document.createElement('div');
    card.className = 'journal-card';

    card.innerHTML = `
        <button class="card-delete-btn" aria-label="Delete journal" data-id="${escapeHtml(entry.id)}">
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

    // Open journal on click (but not delete button)
    card.addEventListener('click', e => {
        if (e.target.closest('.card-delete-btn')) return;
        sessionStorage.setItem('openJournalId', entry.id);
        window.location.href = 'journal.html';
    });

    // Delete
    card.querySelector('.card-delete-btn').addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Delete "${entry.title || 'Untitled Journal'}"?`)) {
            const updated = getEntries().filter(en => en.id !== entry.id);
            saveEntries(updated);
            renderGrid();
        }
    });

    return card;
}
