
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

from translate import load_translate_model, translate
from transcribe import load_transcription_model, transcription


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
async def transcribe_audio(file: UploadFile = File(...)):
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

    # Transcription
    text, src_lang = transcription(temp_path, transcriber_model)

    # Translation 
    translated = translate(text, src_lang, "Spanish", translator_model)

    return {
        "transcription": text,
        "source_language": src_lang,
        "translation": translated
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)