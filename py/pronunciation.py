import re
import librosa
import soundfile as sf
import epitran
from g2p_en import G2p
from Levenshtein import distance
from allosaurus.app import read_recognizer

# ---------------------------------------------------------------------------
# Models — loaded once at module import
# ---------------------------------------------------------------------------
_g2p = G2p()
_audio_model = read_recognizer()

# ---------------------------------------------------------------------------
# Language maps
# ---------------------------------------------------------------------------

# ISO 639-1 → Epitran tag (expected text, non-English)
EPITRAN_LANG_MAP = {
    'es': 'spa-Latn',
    'fr': 'fra-Latn',
    'de': 'deu-Latn',
    'zh': 'cmn-Hans',
    'ja': 'jpn-Hira',
    'ko': 'kor-Hang',
}

# ISO 639-1 → allosaurus lang_id (spoken audio, all languages)
ALLOSAURUS_LANG_MAP = {
    'en': 'eng',
    'es': 'spa',
    'fr': 'fra',
    'de': 'deu',
    'zh': 'cmn',
    'ja': 'jpn',
    'ko': 'kor',
}

# ARPAbet token (stress digit stripped) → IPA symbol
# Lets us compare G2P output against allosaurus IPA output on a level field
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
# Epitran cache
# ---------------------------------------------------------------------------
_epitran_cache: dict[str, epitran.Epitran] = {}

def _get_epitran(lang: str) -> epitran.Epitran:
    if lang not in _epitran_cache:
        _epitran_cache[lang] = epitran.Epitran(EPITRAN_LANG_MAP[lang])
    return _epitran_cache[lang]

# ---------------------------------------------------------------------------
# Text → IPA phoneme string  (expected side)
# ---------------------------------------------------------------------------

def clean_text_en(text: str) -> str:
    """Lowercase and strip non-alpha characters for G2P input."""
    return re.sub(r'[^a-z\s]', '', text.lower())


def text_to_phonemes(text: str, lang: str) -> str:
    """
    Convert expected text to a space-joined IPA phoneme string.

    English  → G2p (ARPAbet) → converted to IPA via ARPABET_TO_IPA
    Other    → Epitran (IPA), each character becomes its own token
    """
    if lang == 'en':
        arpabet_tokens = _g2p(clean_text_en(text))
        ipa_tokens = [
            ARPABET_TO_IPA[t.rstrip('012')]
            for t in arpabet_tokens
            if t.rstrip('012') in ARPABET_TO_IPA
        ]
        return ' '.join(ipa_tokens)

    epi = _get_epitran(lang)
    ipa = epi.transliterate(text)
    tokens = []
    for word in ipa.split():
        tokens.extend(list(word))
    return ' '.join(tokens)

# ---------------------------------------------------------------------------
# Audio → IPA phoneme string  (spoken side)
# ---------------------------------------------------------------------------

def convert_audio(in_path: str, out_path: str = 'temp_a2p.wav') -> str:
    """Resample audio to 16 kHz PCM_16 WAV — required by allosaurus."""
    y, sr = librosa.load(in_path, sr=16000)
    sf.write(out_path, y, sr, subtype='PCM_16')
    return out_path


def audio_to_phonemes(audio_path: str, lang: str = 'en') -> str:
    """
    Run allosaurus on a 16 kHz WAV and return a space-joined IPA phoneme string.
    The lang_id narrows allosaurus to that language's phoneme inventory.
    """
    lang_id = ALLOSAURUS_LANG_MAP.get(lang, 'ipa')
    return _audio_model.recognize(audio_path, lang_id=lang_id)

# ---------------------------------------------------------------------------
# Pronunciation scoring
# ---------------------------------------------------------------------------

def pronunciation_score(
    expected_text: str,
    audio_path: str,
    lang: str = 'en',
) -> tuple[float, str, str]:
    """
    Score pronunciation by comparing phonemes from two sources:
      - expected_text  → IPA via G2P + ARPAbet→IPA map (en) or Epitran (other)
      - audio_path     → IPA via allosaurus (all languages)

    Both sides end up as space-joined IPA strings so the Levenshtein
    distance is computed on a level playing field.

    Returns
    -------
    score : float        0.0 – 1.0, where 1.0 is a perfect phoneme match
    expected_phonemes : str
    spoken_phonemes : str
    """
    wav_path = convert_audio(audio_path)

    exp_phonemes = text_to_phonemes(expected_text, lang)
    spk_phonemes = audio_to_phonemes(wav_path, lang)

    max_len = max(len(exp_phonemes), len(spk_phonemes))
    if max_len == 0:
        return 0.0, exp_phonemes, spk_phonemes

    dist = distance(exp_phonemes, spk_phonemes)
    score = 1.0 - (dist / max_len)
    return round(max(score, 0.0), 2), exp_phonemes, spk_phonemes
