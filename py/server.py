
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

from translate import load_translate_model, translate, LANG_NNLB_MAP
from transcribe import load_transcription_model, transcription

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
    if src_lang in LANG_NNLB_MAP and target_name in LANG_NNLB_MAP and src_lang != target_name:
        translated = translate(text, src_lang, target_name, translator_model)
    else:
        translated = text  # unsupported language pair return transcription

    return {
        "transcription": text,
        "source_language": src_lang,
        "translation": translated
    }

@app.post("/translate")
async def translate_text(
    text: str = Form(...),
    source_lang: str = Form('en'),
    target_lang: str = Form('es'),
):
    src_name    = LANG_CODE_TO_NAME.get(source_lang, 'English')
    target_name = LANG_CODE_TO_NAME.get(target_lang, 'Spanish')

    if src_name in LANG_NNLB_MAP and target_name in LANG_NNLB_MAP and src_name != target_name:
        translated = translate(text, src_name, target_name, translator_model)
    else:
        translated = text

    return {"translation": translated}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)