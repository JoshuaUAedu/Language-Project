
from fastapi import FastAPI, UploadFile, File
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

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    temp_path = "temp.wav"
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