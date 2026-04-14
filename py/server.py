
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

from translate import load_translate_model, translate, LANG_NNLB_MAP
from transcribe import load_transcription_model, transcription
from pronunciation import pronunciation_score
from pykakasi import kakasi
from pypinyin import pinyin, Style
from hangul_romanize import Transliter
from hangul_romanize.rule import academic

def _romanize(text: str, lang: str) -> str:
    if lang == 'ja':
        kks = kakasi()
        result = kks.convert(text)
        return ' '.join(x['hepburn'] for x in result if x['hepburn'])
    if lang == 'ko':
        return Transliter(academic).translit(text)
    if lang == 'zh':
        result = pinyin(text, style=Style.TONE)
        return ' '.join(x[0] for x in result)
    return ''

# Map Languages
LANG_CODE_TO_NAME = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
}


# Load server for model use on client side
# CTRL + C in terminal to end server

# Load models once at startup
transcriber_model = load_transcription_model()
translator_model = load_translate_model()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    target_lang: str = Form('es'),
    source_lang: str = Form(''),
):
    audio_bytes = await file.read()

    # Use the correct extension so ffmpeg/whisper can decode the stream
    content_type = file.content_type or "audio/webm"
    if "wav" in content_type:
        ext = "wav"
    elif "ogg" in content_type:
        ext = "ogg"
    elif "mp4" in content_type or "m4a" in content_type:
        ext = "mp4"
    else:
        ext = "webm"

    temp_path = f"temp.{ext}"
    with open(temp_path, "wb") as f:
        f.write(audio_bytes)

    # Transcription force language when provided else auto-detect
    text, src_lang = transcription(temp_path, transcriber_model, forced_lang=source_lang or None)

    # Resolve target language name from ISO code, default Spanish
    target_name = LANG_CODE_TO_NAME.get(target_lang, 'Spanish')

    # Only translate if both src and target are supported by the model
    confidence = None
    if src_lang in LANG_NNLB_MAP and target_name in LANG_NNLB_MAP and src_lang != target_name:
        translated, confidence = translate(text, src_lang, target_name, translator_model)
    else:
        translated = text  # unsupported language pair return transcription

    return {
        "transcription": text,
        "source_language": src_lang,
        "translation": translated,
        "confidence": confidence,
    }

@app.post("/translate")
async def translate_text(
    text: str = Form(...),
    source_lang: str = Form('en'),
    target_lang: str = Form('es'),
):
    src_name    = LANG_CODE_TO_NAME.get(source_lang, 'English')
    target_name = LANG_CODE_TO_NAME.get(target_lang, 'Spanish')

    confidence = None
    if src_name in LANG_NNLB_MAP and target_name in LANG_NNLB_MAP and src_name != target_name:
        translated, confidence = translate(text, src_name, target_name, translator_model)
    else:
        translated = text

    return {"translation": translated, "confidence": confidence}

@app.post("/pronunciation")
async def check_pronunciation(
    file: UploadFile = File(...),
    expected_text: str = Form(...),
    lang: str = Form('es'),
):
    audio_bytes = await file.read()
    content_type = file.content_type or "audio/webm"
    ext = "wav" if "wav" in content_type else "webm"
    temp_path = f"temp_speak.{ext}"
    with open(temp_path, "wb") as f:
        f.write(audio_bytes)

    # Score using raw audio → allosaurus IPA vs expected text → G2P/Epitran IPA
    score, exp_phonemes, spk_phonemes = pronunciation_score(expected_text, temp_path, lang=lang)
    return {"score": score, "expected_phonemes": exp_phonemes, "spoken_phonemes": spk_phonemes}

@app.post("/romanize")
async def romanize_text(
    text: str = Form(...),
    lang: str = Form('ja'),
):
    return {"romanized": _romanize(text, lang)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)