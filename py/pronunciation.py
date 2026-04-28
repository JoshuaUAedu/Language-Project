import re
import unicodedata
import librosa
import soundfile as sf
import nltk
for _r in ('averaged_perceptron_tagger_eng', 'averaged_perceptron_tagger', 'cmudict'):
    try:
        nltk.data.find(f'taggers/{_r}') if 'tagger' in _r else nltk.data.find(f'corpora/{_r}')
    except LookupError:
        nltk.download(_r, quiet=True)
import epitran
from g2p_en import G2p
from allosaurus.app import read_recognizer
from pykakasi import kakasi as _Kakasi
from pypinyin import pinyin as _pypinyin, Style as _PinyinStyle

## Vibe assisted
# ---------------------------------------------------------------------------
# Models — loaded once
# ---------------------------------------------------------------------------
_g2p = G2p()
_audio_model = read_recognizer()
_kakasi = _Kakasi()

# ---------------------------------------------------------------------------
# Language maps
# ---------------------------------------------------------------------------
EPITRAN_LANG_MAP = {
    'es': 'spa-Latn',
    'fr': 'fra-Latn',
    'de': 'deu-Latn',
    # zh/ja/ko use direct lookup tables — Epitran not used for these
}

ALLOSAURUS_LANG_MAP = {
    'en': 'ipa',  # use universal IPA mode; 'eng' filter can mis-restrict phones
    'es': 'spa',
    'fr': 'fra',
    'de': 'deu',
    'zh': 'cmn',
    'ja': 'jpn',
    'ko': 'kor',
}

# ---------------------------------------------------------------------------
# ARPAbet → canonical IPA  (G2P output for English)
# ---------------------------------------------------------------------------
ARPABET_TO_IPA = {
    'AA': 'ɑ',  'AE': 'æ',  'AH': 'ə',  'AO': 'ɔ',
    'AW': 'aʊ', 'AY': 'aɪ', 'B':  'b',  'CH': 'tʃ',
    'D':  'd',  'DH': 'ð',  'EH': 'ɛ',  'ER': 'ɚ',
    'EY': 'eɪ', 'F':  'f',  'G':  'ɡ',  'HH': 'h',
    'IH': 'ɪ',  'IY': 'i',  'JH': 'dʒ', 'K':  'k',
    'L':  'l',  'M':  'm',  'N':  'n',  'NG': 'ŋ',
    'OW': 'oʊ', 'OY': 'ɔɪ', 'P':  'p',  'R':  'ɹ',
    'S':  's',  'SH': 'ʃ',  'T':  't',  'TH': 'θ',
    'UH': 'ʊ',  'UW': 'u',  'V':  'v',  'W':  'w',
    'Y':  'j',  'Z':  'z',  'ZH': 'ʒ',
}

# ---------------------------------------------------------------------------
# Canonical normalization
# Maps known Unicode variants and non-phonemic diacritics to a shared symbol.
# Applied to every token from every source so both sides use the same set.
# ---------------------------------------------------------------------------
_CANONICAL_CHAR = {
    # Unicode variants for the same sound
    'g':  'ɡ',   # U+0067 Latin g  → U+0261 script g
    'r':  'ɹ',   # plain r          → IPA approximant ɹ
    # Schwa variants
    'ɐ':  'ə',
    'ɜ':  'ə',
    'ɘ':  'ə',
    # Japanese: bilabial fricative ɸ can surface as f-like; keep as ɸ (in features)
    # Japanese: ç (palatal fricative before i) — kept, has feature entry
    # Chinese: ɨ (high central unrounded, post-retroflex vowel) — kept, has feature entry
    # Discard non-phonemic diacritics
    'ˈ':  '',    # primary stress
    'ˌ':  '',    # secondary stress
    'ː':  '',    # length
    'ʰ':  '',    # aspiration (Korean aspirates pʰ tʰ kʰ → p t k after stripping)
    'ʼ':  '',    # ejective
    '\u0303': '', # combining tilde (nasalisation)
    '\u032a': '', # combining dental (alveolar)
    '\u0329': '', # combining syllabic
    '\u0348': '', # combining double vertical line below — Korean tenseness mark ͈
    '\u031a': '', # combining left angle above — unreleased stops
    '\u033a': '', # combining inverted bridge below
}

def _normalize_phone(token: str) -> str:
    """NFC-normalize then apply canonical character map.  Returns '' to drop a token."""
    token = unicodedata.normalize('NFC', token)
    out = ''
    for ch in token:
        out += _CANONICAL_CHAR.get(ch, ch)
    return out.strip()

# ---------------------------------------------------------------------------
# IPA multi-character phone table — for tokenizing Epitran's flat IPA string.
# Sorted longest-first so the greedy scan picks the right unit.
# ---------------------------------------------------------------------------
_IPA_MULTICHAR = sorted([
    # English diphthongs / affricates (also produced by G2P→IPA)
    'tʃ', 'dʒ', 'oʊ', 'aɪ', 'aʊ', 'eɪ', 'ɔɪ', 'ɛɪ', 'ɚr',
    # Common cross-language affricates
    'ts', 'dz', 'tɕ', 'dʑ', 'tʂ', 'dʐ',
    # Chinese retroflex affricates — must appear BEFORE their single-char parts
    'ʈʂ', 'ɖʐ',
    # Long vowels (Epitran sometimes emits these)
    'aː', 'eː', 'iː', 'oː', 'uː', 'ɑː', 'ɔː', 'ɛː', 'øː', 'yː',
    # Pre-nasalised stops
    'mb', 'nd', 'ŋɡ',
], key=len, reverse=True)

def _tokenize_ipa_string(ipa: str) -> list[str]:
    """
    Tokenize a concatenated IPA string (Epitran output) into a list of phone tokens.
    Greedily matches the longest known multi-character phone first, then falls back
    to single characters.  Spaces (word boundaries) are silently consumed.
    """
    tokens = []
    i = 0
    while i < len(ipa):
        if ipa[i] == ' ':
            i += 1
            continue
        matched = False
        for mc in _IPA_MULTICHAR:
            end = i + len(mc)
            if ipa[i:end] == mc:
                tokens.append(mc)
                i = end
                matched = True
                break
        if not matched:
            tokens.append(ipa[i])
            i += 1
    return tokens

# ---------------------------------------------------------------------------
# Phonetic feature tables
#
# Every canonical phone is described by 3 features.
# Consonants : (type='C', place, manner, voiced)
# Vowels     : (type='V', height, backness, rounded)
#
# _phone_similarity() returns 0.0–1.0 based on how many features match.
# This replaces the binary MATCH/MISMATCH cost in the aligner so that
# phonetically close pairs (ɪ→i, p→b, ɛ→æ) receive partial credit
# instead of the full mismatch penalty.
# ---------------------------------------------------------------------------
_PHONE_FEATURES: dict[str, tuple] = {
    # Stops
    'p':  ('C', 'bilabial',     'stop',        False),
    'b':  ('C', 'bilabial',     'stop',        True),
    't':  ('C', 'alveolar',     'stop',        False),
    'd':  ('C', 'alveolar',     'stop',        True),
    'k':  ('C', 'velar',        'stop',        False),
    'ɡ':  ('C', 'velar',        'stop',        True),
    # Fricatives
    'f':  ('C', 'labiodental',  'fricative',   False),
    'v':  ('C', 'labiodental',  'fricative',   True),
    'θ':  ('C', 'dental',       'fricative',   False),
    'ð':  ('C', 'dental',       'fricative',   True),
    's':  ('C', 'alveolar',     'fricative',   False),
    'z':  ('C', 'alveolar',     'fricative',   True),
    'ʃ':  ('C', 'palatal',      'fricative',   False),
    'ʒ':  ('C', 'palatal',      'fricative',   True),
    'h':  ('C', 'glottal',      'fricative',   False),
    # Affricates
    'tʃ': ('C', 'palatal',      'affricate',   False),
    'dʒ': ('C', 'palatal',      'affricate',   True),
    'ts': ('C', 'alveolar',     'affricate',   False),
    'dz': ('C', 'alveolar',     'affricate',   True),
    'tɕ': ('C', 'palatal',      'affricate',   False),
    'dʑ': ('C', 'palatal',      'affricate',   True),
    # Nasals
    'm':  ('C', 'bilabial',     'nasal',       True),
    'n':  ('C', 'alveolar',     'nasal',       True),
    'ŋ':  ('C', 'velar',        'nasal',       True),
    # Approximants / liquids
    'l':  ('C', 'alveolar',     'lateral',     True),
    'ɹ':  ('C', 'alveolar',     'approximant', True),
    'w':  ('C', 'bilabial',     'glide',       True),
    'j':  ('C', 'palatal',      'glide',       True),
    # ── Japanese ──────────────────────────────────────────────────────────────
    # Alveolar flap — Japanese/Korean "r" (also Korean ㄹ between vowels)
    'ɾ':  ('C', 'alveolar',     'flap',        True),
    # Moraic nasal — Japanese ん (place assimilates to following consonant,
    # but we treat it as uvular nasal for feature comparison)
    'ɴ':  ('C', 'uvular',       'nasal',       True),
    # Bilabial fricative — Japanese ふ (fu)
    'ɸ':  ('C', 'bilabial',     'fricative',   False),
    # Palatal fricative — Japanese ひ (hi)
    'ç':  ('C', 'palatal',      'fricative',   False),
    # Alveolo-palatal fricatives — Japanese し/じ, also Chinese x/j
    'ɕ':  ('C', 'palatal',      'fricative',   False),
    'ʑ':  ('C', 'palatal',      'fricative',   True),
    # ── Chinese ───────────────────────────────────────────────────────────────
    # Retroflex affricates — Chinese 知/zh, 吃/ch (voiceless already in table as tʂ/tʃ)
    'ʈʂ': ('C', 'retroflex',    'affricate',   False),
    'ɖʐ': ('C', 'retroflex',    'affricate',   True),
    # Retroflex fricatives — Chinese 师/sh, 日/r (fricative)
    'ʂ':  ('C', 'retroflex',    'fricative',   False),
    'ʐ':  ('C', 'retroflex',    'fricative',   True),
    # Retroflex approximant — Chinese 日/r (approximant variant)
    'ɻ':  ('C', 'retroflex',    'approximant', True),
    # Velar fricative — Chinese 喝/h, Korean ㅎ
    'x':  ('C', 'velar',        'fricative',   False),
    'ɣ':  ('C', 'velar',        'fricative',   True),
    # ── Korean ────────────────────────────────────────────────────────────────
    # Velar approximant — Korean ㅇ (intervocalic)
    'ɰ':  ('C', 'velar',        'approximant', True),
    # Vowels — (type, height, backness, rounded)
    'i':  ('V', 'high',  'front',   False),
    'ɪ':  ('V', 'high',  'front',   False),
    'e':  ('V', 'mid',   'front',   False),
    'eɪ': ('V', 'mid',   'front',   False),
    'ɛ':  ('V', 'mid',   'front',   False),
    'æ':  ('V', 'low',   'front',   False),
    'ə':  ('V', 'mid',   'central', False),
    'ɚ':  ('V', 'mid',   'central', False),
    'ɑ':  ('V', 'low',   'back',    False),
    'a':  ('V', 'low',   'central', False),
    'ɔ':  ('V', 'mid',   'back',    True),
    'o':  ('V', 'mid',   'back',    True),
    'oʊ': ('V', 'mid',   'back',    True),
    'u':  ('V', 'high',  'back',    True),
    'ʊ':  ('V', 'high',  'back',    True),
    'aɪ': ('V', 'low',   'front',   False),
    'aʊ': ('V', 'low',   'back',    False),
    'ɔɪ': ('V', 'mid',   'back',    True),
    'y':  ('V', 'high',  'front',   True),
    'ø':  ('V', 'mid',   'front',   True),
    # ── Chinese vowels ────────────────────────────────────────────────────────
    # High central unrounded — post-retroflex "i" in 知/吃/师/日
    'ɨ':  ('V', 'high',  'central', False),
    # Mid back unrounded — Chinese 歌/e in some analyses
    'ɤ':  ('V', 'mid',   'back',    False),
    # ── Korean vowels ─────────────────────────────────────────────────────────
    # High back unrounded — Korean ㅡ (eu)
    'ɯ':  ('V', 'high',  'back',    False),
    # Open-mid front rounded — Korean ㅚ (oe) alternate
    'œ':  ('V', 'mid',   'front',   True),
}

def _phone_similarity(a: str, b: str) -> float:
    """
    Phonetic feature similarity between two canonical phones (0.0–1.0).

    Phones that share more articulatory features score higher:
      - p / b  → differ only in voicing        → 0.67
      - ɪ / i  → same height + backness         → 0.67  (vowel shift)
      - ɛ / æ  → differ only in height          → 0.67
      - s / m  → differ in place, manner, voice → 0.0
      - C vs V → always 0.0 (different type)
    """
    if a == b:
        return 1.0
    fa = _PHONE_FEATURES.get(a)
    fb = _PHONE_FEATURES.get(b)
    if fa is None or fb is None:
        return 0.0
    if fa[0] != fb[0]:          # consonant vs vowel — no partial credit
        return 0.0
    # Compare the 3 articulatory features (skip index 0 = type)
    matches = sum(1 for x, y in zip(fa[1:], fb[1:]) if x == y)
    return matches / (len(fa) - 1)  # 3 features → 0, 0.33, 0.67, or 1.0

# ---------------------------------------------------------------------------
# Needleman-Wunsch global alignment with phonetic substitution scoring
#
# Substitution score interpolates between _MATCH and _MISMATCH_MAX by
# phonetic similarity, so closely related phones (vowel shifts, voicing
# pairs) are penalised less than completely different sounds.
#
#   sub(a, b) = _MATCH * sim  +  _MISMATCH_MAX * (1 - sim)
#
#   sim=1.0  → sub = +1.0  (exact match, identical to _MATCH)
#   sim=0.67 → sub = -0.33 (one feature wrong, e.g. p→b)
#   sim=0.0  → sub = -2.0  (maximally different)
#
# GAP = -1 stays between a near-match and a full mismatch, so the aligner
# prefers gaps over completely wrong substitutions but prefers near-matches
# over gaps.
# ---------------------------------------------------------------------------
_MATCH        =  1.0
_GAP          = -1.0
_MISMATCH_MAX = -2.0

# Minimum similarity to count a near-miss as correct and fix the Heard display.
# 0.67 = two of three articulatory features match (e.g. æ vs a, p vs b).
_TRIPHONE_CORRECTION_THRESHOLD = 2 / 3

# ---------------------------------------------------------------------------
# Cross-system phoneme normalization
#
# Allosaurus (heard) and Epitran/G2P (expected) use overlapping but inconsistent
# symbol sets for the same sounds.  This map collapses known inter-system
# variants to a shared canonical before alignment, so the aligner and triphone
# scorer see genuine pronunciation differences rather than symbol mismatches.
#
# Applied to BOTH sides so the displayed sequences are always comparable.
# Groups are motivated by the user's examples (b↔w, p↔f, a↔ɔ↔o) plus
# standard allophonic pairs that the two systems commonly disagree on.
# ---------------------------------------------------------------------------
_PHONEME_NORM_MAP: dict[str, str] = {
    # Bilabial group — Allosaurus often emits w where Epitran/G2P gives b
    'w':  'b',
    # Labial obstruent voiceless — f and p share labial place of articulation
    'f':  'p',
    # Back / low vowel group (a ↔ ɑ ↔ ɔ ↔ o)
    'a':  'ɑ',
    'ɔ':  'ɑ',
    'o':  'ɑ',
    'oʊ': 'ɑ',
    # Front mid / low vowel group (æ ↔ ɛ ↔ e ↔ eɪ)
    'æ':  'ɛ',
    'e':  'ɛ',
    'eɪ': 'ɛ',
    # High front lax / tense pair (ɪ ↔ i)
    'ɪ':  'i',
    # High back lax / tense pair (ʊ ↔ u)
    'ʊ':  'u',
    # R-coloured schwa → plain schwa
    'ɚ':  'ə',
}

def _norm_seq(phones: list[str]) -> list[str]:
    """Map both sides to shared canonical symbols before alignment."""
    return [_PHONEME_NORM_MAP.get(p, p) for p in phones]

def _sub_score(a: str, b: str) -> float:
    """Graded substitution cost based on phonetic feature similarity."""
    sim = _phone_similarity(a, b)
    return _MATCH * sim + _MISMATCH_MAX * (1.0 - sim)

_EPS = 1e-9   # tolerance for all float comparisons in alignment

def _feq(a: float, b: float) -> bool:
    """Float equality with tolerance."""
    return abs(a - b) < _EPS

def _align(exp: list[str], spk: list[str]) -> tuple[list[str], list[str]]:
    """
    Needleman-Wunsch global alignment of two phone sequences.

    Every phone on both sides is placed in the output — either matched/
    substituted against a phone on the other side, or paired with a '-' gap.
    The aligned lists are guaranteed to be the same length and to contain
    every input phone exactly once.

    Returns only the aligned sequences — scoring is done separately by
    _score_alignment so that the NW gap/mismatch penalties (which guide
    alignment quality) don't corrupt the final pronunciation score.

    Returns
    -------
    aligned_exp  : phone list with '-' for gaps
    aligned_spk  : phone list with '-' for gaps (same length as aligned_exp)
    """
    m, n = len(exp), len(spk)

    # DP table — explicit floats so all comparisons stay in float space
    dp: list[list[float]] = [[0.0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i * _GAP
    for j in range(n + 1):
        dp[0][j] = j * _GAP

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            diag = dp[i-1][j-1] + _sub_score(exp[i-1], spk[j-1])
            up   = dp[i-1][j]   + _GAP   # gap in spk  (exp phone unmatched)
            left = dp[i][j-1]   + _GAP   # gap in exp  (extra spoken phone)
            dp[i][j] = max(diag, up, left)

    # Traceback — explicit priority: diagonal > up > left
    # Using _feq() throughout to avoid float equality bugs.
    aligned_exp: list[str] = []
    aligned_spk: list[str] = []
    i, j = m, n
    while i > 0 or j > 0:
        if i > 0 and j > 0:
            diag = dp[i-1][j-1] + _sub_score(exp[i-1], spk[j-1])
            if _feq(dp[i][j], diag):
                # match or substitution
                aligned_exp.append(exp[i-1])
                aligned_spk.append(spk[j-1])
                i -= 1; j -= 1
                continue

        if i > 0 and _feq(dp[i][j], dp[i-1][j] + _GAP):
            # gap in spk — expected phone has no partner
            aligned_exp.append(exp[i-1])
            aligned_spk.append('-')
            i -= 1
        elif j > 0:
            # gap in exp — extra spoken phone has no partner
            aligned_exp.append('-')
            aligned_spk.append(spk[j-1])
            j -= 1
        else:
            # should never reach here, but guards against infinite loop
            break

    aligned_exp.reverse()
    aligned_spk.reverse()

    assert len(aligned_exp) == len(aligned_spk), "alignment length mismatch"
    return aligned_exp, aligned_spk


def _score_triphones(
    aligned_exp: list[str],
    aligned_spk: list[str],
) -> tuple[float, list[str], list[str]]:
    """
    Triphone-based scoring with near-miss correction and extra-phoneme tolerance.

    Groups expected phoneme positions (non-gap) into windows of 3 (triphones).
    For each expected phone in a window:
      - sim >= threshold  → correct the Heard display to expected, full credit
      - sim < threshold   → scan ±2 adjacent gap slots (extra spoken phonemes)
                            for a better match; if found above threshold, absorb
                            the extra and give full credit
      - otherwise         → partial credit equal to raw similarity

    Extra spoken phonemes (exp='-' slots) that are not absorbed are ignored.

    Returns (score, aligned_exp_unchanged, corrected_spk).
    """
    exp_positions = [i for i, p in enumerate(aligned_exp) if p != '-']
    corrected_spk = list(aligned_spk)
    n_expected = len(exp_positions)
    if n_expected == 0:
        return 0.0, aligned_exp, corrected_spk

    total_credit = 0.0

    for group_start in range(0, n_expected, 3):
        group = exp_positions[group_start:group_start + 3]

        for pos in group:
            e = aligned_exp[pos]
            s = corrected_spk[pos]
            sim = _phone_similarity(e, s) if s != '-' else 0.0

            if sim >= _TRIPHONE_CORRECTION_THRESHOLD:
                corrected_spk[pos] = e          # fix near-miss in Heard display
                total_credit += 1.0
            else:
                # Look in adjacent gap slots for a better-matching spoken phone.
                best_neighbor: int | None = None
                best_sim = sim
                for offset in range(-2, 3):
                    if offset == 0:
                        continue
                    nb = pos + offset
                    if (0 <= nb < len(aligned_exp)
                            and aligned_exp[nb] == '-'
                            and corrected_spk[nb] != '-'):
                        nb_sim = _phone_similarity(e, corrected_spk[nb])
                        if nb_sim > best_sim:
                            best_sim = nb_sim
                            best_neighbor = nb

                if best_neighbor is not None and best_sim >= _TRIPHONE_CORRECTION_THRESHOLD:
                    corrected_spk[pos] = e
                    corrected_spk[best_neighbor] = '-'
                    total_credit += 1.0
                else:
                    total_credit += best_sim

    return round(total_credit / n_expected, 2), aligned_exp, corrected_spk


# ---------------------------------------------------------------------------
# Epitran cache
# ---------------------------------------------------------------------------
_epitran_cache: dict[str, epitran.Epitran] = {}

def _get_epitran(lang: str) -> epitran.Epitran:
    if lang not in _epitran_cache:
        _epitran_cache[lang] = epitran.Epitran(EPITRAN_LANG_MAP[lang])
    return _epitran_cache[lang]

# ---------------------------------------------------------------------------
# Japanese: hiragana/katakana mora → IPA
# pykakasi converts kanji → hiragana first, then we map each mora directly.
# This bypasses Epitran jpn-Hira which silently drops kanji as '?'.
# ---------------------------------------------------------------------------
_HIRA_TO_IPA: dict[str, list[str]] = {
    'あ':['a'],  'い':['i'],  'う':['ɯ'],  'え':['e'],  'お':['o'],
    'か':['k','a'], 'き':['k','i'], 'く':['k','ɯ'], 'け':['k','e'], 'こ':['k','o'],
    'さ':['s','a'], 'し':['ɕ','i'], 'す':['s','ɯ'], 'せ':['s','e'], 'そ':['s','o'],
    'た':['t','a'], 'ち':['tɕ','i'],'つ':['ts','ɯ'],'て':['t','e'], 'と':['t','o'],
    'な':['n','a'], 'に':['n','i'], 'ぬ':['n','ɯ'], 'ね':['n','e'], 'の':['n','o'],
    'は':['h','a'], 'ひ':['ç','i'], 'ふ':['ɸ','ɯ'], 'へ':['h','e'], 'ほ':['h','o'],
    'ま':['m','a'], 'み':['m','i'], 'む':['m','ɯ'], 'め':['m','e'], 'も':['m','o'],
    'や':['j','a'],                  'ゆ':['j','ɯ'],                  'よ':['j','o'],
    'ら':['ɾ','a'], 'り':['ɾ','i'], 'る':['ɾ','ɯ'], 'れ':['ɾ','e'], 'ろ':['ɾ','o'],
    'わ':['w','a'],                                                    'を':['o'],
    'ん':['n'],
    # Voiced
    'が':['ɡ','a'], 'ぎ':['ɡ','i'], 'ぐ':['ɡ','ɯ'], 'げ':['ɡ','e'], 'ご':['ɡ','o'],
    'ざ':['z','a'], 'じ':['dʑ','i'],'ず':['z','ɯ'], 'ぜ':['z','e'], 'ぞ':['z','o'],
    'だ':['d','a'], 'ぢ':['dʑ','i'],'づ':['dz','ɯ'],'で':['d','e'], 'ど':['d','o'],
    'ば':['b','a'], 'び':['b','i'], 'ぶ':['b','ɯ'], 'べ':['b','e'], 'ぼ':['b','o'],
    # Semi-voiced
    'ぱ':['p','a'], 'ぴ':['p','i'], 'ぷ':['p','ɯ'], 'ぺ':['p','e'], 'ぽ':['p','o'],
    # Compound mora (digraphs)
    'きゃ':['k','j','a'], 'きゅ':['k','j','ɯ'], 'きょ':['k','j','o'],
    'しゃ':['ɕ','a'],     'しゅ':['ɕ','ɯ'],     'しょ':['ɕ','o'],
    'ちゃ':['tɕ','a'],    'ちゅ':['tɕ','ɯ'],    'ちょ':['tɕ','o'],
    'にゃ':['n','j','a'], 'にゅ':['n','j','ɯ'], 'にょ':['n','j','o'],
    'ひゃ':['ç','a'],     'ひゅ':['ç','ɯ'],     'ひょ':['ç','o'],
    'みゃ':['m','j','a'], 'みゅ':['m','j','ɯ'], 'みょ':['m','j','o'],
    'りゃ':['ɾ','j','a'], 'りゅ':['ɾ','j','ɯ'], 'りょ':['ɾ','j','o'],
    'ぎゃ':['ɡ','j','a'], 'ぎゅ':['ɡ','j','ɯ'], 'ぎょ':['ɡ','j','o'],
    'じゃ':['dʑ','a'],    'じゅ':['dʑ','ɯ'],    'じょ':['dʑ','o'],
    'びゃ':['b','j','a'], 'びゅ':['b','j','ɯ'], 'びょ':['b','j','o'],
    'ぴゃ':['p','j','a'], 'ぴゅ':['p','j','ɯ'], 'ぴょ':['p','j','o'],
}
# Katakana offset: katakana codepoints = hiragana + 0x60
_KATA_OFFSET = 0x60

def _ja_to_phones(text: str) -> list[str]:
    """Kanji/kana text → IPA phone list via pykakasi + mora table."""
    # Step 1: convert everything to hiragana
    hira = ''.join(item['hira'] or item['orig'] for item in _kakasi.convert(text))
    phones: list[str] = []
    i = 0
    while i < len(hira):
        ch = hira[i]
        # Katakana → hiragana
        if '\u30A0' <= ch <= '\u30FF':
            ch = chr(ord(ch) - _KATA_OFFSET)
        # Try digraph first (2-char compound mora)
        digraph = ch + (hira[i+1] if i+1 < len(hira) else '')
        if digraph in _HIRA_TO_IPA:
            phones.extend(_HIRA_TO_IPA[digraph])
            i += 2
        elif ch in _HIRA_TO_IPA:
            phones.extend(_HIRA_TO_IPA[ch])
            i += 1
        else:
            i += 1  # skip punctuation / unknown
    return phones

# ---------------------------------------------------------------------------
# Korean: jamo → IPA
# Hangul syllable blocks are decomposed to jamo (NFD), then each jamo mapped.
# This bypasses Epitran kor-Hang which struggles with uncommon syllables.
# ---------------------------------------------------------------------------
_JAMO_TO_IPA: dict[str, str] = {
    # Initial consonants (choseong)
    'ᄀ': 'k',  'ᄁ': 'k',  'ᄂ': 'n',  'ᄃ': 't',  'ᄄ': 't',
    'ᄅ': 'ɾ',  'ᄆ': 'm',  'ᄇ': 'p',  'ᄈ': 'p',  'ᄉ': 's',
    'ᄊ': 's',  'ᄋ': '',   'ᄌ': 'tɕ', 'ᄍ': 'tɕ', 'ᄎ': 'tɕ',
    'ᄏ': 'k',  'ᄐ': 't',  'ᄑ': 'p',  'ᄒ': 'h',
    # Vowels (jungseong)
    'ᅡ': 'a',  'ᅢ': 'ɛ',  'ᅣ': 'ja', 'ᅤ': 'jɛ', 'ᅥ': 'ə',
    'ᅦ': 'e',  'ᅧ': 'jə', 'ᅨ': 'je', 'ᅩ': 'o',  'ᅪ': 'wa',
    'ᅫ': 'wɛ', 'ᅬ': 'ø',  'ᅭ': 'jo', 'ᅮ': 'u',  'ᅯ': 'wə',
    'ᅰ': 'we', 'ᅱ': 'y',  'ᅲ': 'ju', 'ᅳ': 'ɯ',  'ᅴ': 'ɯi',
    'ᅵ': 'i',
    # Final consonants (jongseong)
    'ᆨ': 'k',  'ᆩ': 'k',  'ᆪ': 'k',  'ᆫ': 'n',  'ᆬ': 'n',
    'ᆭ': 'n',  'ᆮ': 't',  'ᆯ': 'l',  'ᆰ': 'k',  'ᆱ': 'm',
    'ᆲ': 'l',  'ᆳ': 'l',  'ᆴ': 'l',  'ᆵ': 'p',  'ᆶ': 'l',
    'ᆷ': 'm',  'ᆸ': 'p',  'ᆹ': 'p',  'ᆺ': 't',  'ᆻ': 't',
    'ᆼ': 'ŋ',  'ᆽ': 't',  'ᆾ': 't',  'ᆿ': 'k',  'ᇀ': 't',
    'ᇁ': 'p',  'ᇂ': 't',
}

def _ko_to_phones(text: str) -> list[str]:
    """Korean Hangul text → IPA phone list via jamo decomposition table."""
    jamo = unicodedata.normalize('NFD', text)
    phones: list[str] = []
    for ch in jamo:
        ipa = _JAMO_TO_IPA.get(ch)
        if ipa is not None:
            if ipa:  # empty string = silent ᄋ initial
                phones.extend(_tokenize_ipa_string(ipa))
        # else: punctuation/space — skip
    return phones

# ---------------------------------------------------------------------------
# Chinese: hanzi → pinyin → IPA
# pypinyin converts hanzi to pinyin (tone-stripped), then we map initials
# and finals to IPA. This bypasses Epitran cmn-Hans which needs flite/espeak.
# ---------------------------------------------------------------------------
_PINYIN_INITIAL_TO_IPA: dict[str, str] = {
    'b':'p',  'p':'p',  'm':'m',  'f':'f',
    'd':'t',  't':'t',  'n':'n',  'l':'l',
    'g':'ɡ',  'k':'k',  'h':'x',
    'j':'tɕ', 'q':'tɕ', 'x':'ɕ',
    'zh':'ʈʂ','ch':'ʈʂ','sh':'ʂ', 'r':'ɻ',
    'z':'ts', 'c':'ts', 's':'s',
    'y':'j',  'w':'w',
}
_PINYIN_FINAL_TO_IPA: dict[str, str] = {
    'a':'a',   'o':'o',   'e':'ɤ',   'i':'i',   'u':'u',   'ü':'y',
    'ai':'aɪ', 'ei':'eɪ', 'ui':'weɪ','ao':'aʊ', 'ou':'oʊ', 'iu':'joʊ',
    'ie':'je', 'üe':'yɛ', 'er':'ɚ',
    'an':'an', 'en':'ən', 'in':'in', 'un':'wən', 'ün':'yn',
    'ang':'aŋ','eng':'əŋ','ing':'iŋ','ong':'ʊŋ',
    'ia':'ja', 'iao':'jaʊ','ian':'jɛn','iang':'jaŋ','iong':'jʊŋ',
    'ua':'wa', 'uo':'wo', 'uai':'waɪ','uan':'wan','uang':'waŋ',
    'üan':'yɛn',
    # Bare vowels when no initial
    'yi':'i',  'wu':'u',  'yu':'y',
    'ya':'ja', 'ye':'jɛ', 'yao':'jaʊ','you':'joʊ','yan':'jɛn',
    'yang':'jaŋ','ying':'jiŋ','yong':'jʊŋ',
    'wa':'wa', 'wo':'wo', 'wai':'waɪ','wei':'weɪ','wan':'wan',
    'wen':'wən','wang':'waŋ','weng':'wəŋ',
    'yuan':'yɛn','yue':'yɛ','yun':'yn',
}

def _zh_to_phones(text: str) -> list[str]:
    """Chinese hanzi → IPA phone list via pypinyin + initial/final tables."""
    result = _pypinyin(text, style=_PinyinStyle.NORMAL, heteronym=False)
    phones: list[str] = []
    for syllable_list in result:
        py = syllable_list[0].lower().replace('v', 'ü')
        # Strip tone digit if any
        py = re.sub(r'[1-5]', '', py)
        # Try two-char initials first
        initial_ipa = ''
        rest = py
        for init in ('zh', 'ch', 'sh'):
            if py.startswith(init):
                initial_ipa = _PINYIN_INITIAL_TO_IPA[init]
                rest = py[len(init):]
                break
        else:
            if py and py[0] in _PINYIN_INITIAL_TO_IPA:
                initial_ipa = _PINYIN_INITIAL_TO_IPA[py[0]]
                rest = py[1:]
        final_ipa = _PINYIN_FINAL_TO_IPA.get(rest, '')
        if initial_ipa:
            phones.append(initial_ipa)
        if final_ipa:
            phones.extend(_tokenize_ipa_string(final_ipa))
    return phones

# ---------------------------------------------------------------------------
# Text → phone token list  (expected side)
# ---------------------------------------------------------------------------
def _clean_en(text: str) -> str:
    return re.sub(r'[^a-z\s]', '', text.lower())

def text_to_phones(text: str, lang: str) -> list[str]:
    """
    Convert expected text to a list of canonical IPA phone tokens.

    en → G2p (ARPAbet) → ARPABET_TO_IPA → normalize
    ja → pykakasi (kanji→hira) → mora table → normalize
    ko → NFD jamo decomposition → jamo table → normalize
    zh → pypinyin → initial/final table → normalize
    es/fr/de → Epitran → greedy IPA tokenizer → normalize
    """
    if lang == 'en':
        raw = _g2p(_clean_en(text))
        tokens = [
            ARPABET_TO_IPA[t.rstrip('012')]
            for t in raw
            if t.rstrip('012') in ARPABET_TO_IPA
        ]
    elif lang == 'ja':
        tokens = _ja_to_phones(text)
    elif lang == 'ko':
        tokens = _ko_to_phones(text)
    elif lang == 'zh':
        tokens = _zh_to_phones(text)
    else:
        epi = _get_epitran(lang)
        ipa = epi.transliterate(text)
        tokens = _tokenize_ipa_string(ipa)

    return [n for t in tokens for n in [_normalize_phone(t)] if n]

# ---------------------------------------------------------------------------
# Audio → phone token list  (spoken side)
# ---------------------------------------------------------------------------
def convert_audio(in_path: str, out_path: str = 'temp_a2p.wav') -> str:
    """Resample to 16 kHz PCM_16 WAV — required by allosaurus."""
    y, sr = librosa.load(in_path, sr=16000)
    sf.write(out_path, y, sr, subtype='PCM_16')
    return out_path

def audio_to_phones(audio_path: str, lang: str = 'en') -> list[str]:
    """
    Run allosaurus on a 16 kHz WAV.
    Allosaurus returns space-separated IPA tokens — split, then normalize
    each token through the same canonical map used for the expected side.
    """
    lang_id = ALLOSAURUS_LANG_MAP.get(lang, 'ipa')
    raw = _audio_model.recognize(audio_path, lang_id=lang_id)
    return [n for t in raw.split() for n in [_normalize_phone(t)] if n]

# ---------------------------------------------------------------------------
# Pronunciation scoring
# ---------------------------------------------------------------------------
def pronunciation_score(
    expected_text: str,
    audio_path: str,
    lang: str = 'en',
) -> tuple[float, str, str]:
    """
    Score pronunciation accuracy.

    Both sides are reduced to canonical IPA token lists, then globally
    aligned with Needleman-Wunsch before scoring.  Mismatches are penalised
    more heavily than gaps so a wrong phoneme hurts more than an extra or
    missing one.

    Returns
    -------
    score            : float, 0.0–1.0
    expected_phonemes: str  (aligned, space-joined; '-' marks gaps)
    spoken_phonemes  : str  (aligned, space-joined; '-' marks gaps)
    """
    wav_path = convert_audio(audio_path)

    _cjk = lang in ('zh', 'ja', 'ko')
    exp_phones = text_to_phones(expected_text, lang) if _cjk else _norm_seq(text_to_phones(expected_text, lang))
    spk_phones = audio_to_phones(wav_path, lang) if _cjk else _norm_seq(audio_to_phones(wav_path, lang))

    aligned_exp, aligned_spk = _align(exp_phones, spk_phones)
    score, aligned_exp, corrected_spk = _score_triphones(aligned_exp, aligned_spk)

    return score, ' '.join(aligned_exp), ' '.join(corrected_spk)
