
from fastapi import FastAPI, UploadFile, File
import uvicorn

app = FastAPI()

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    # save temporarily
    with open("temp.wav", "wb") as f:
        f.write(audio_bytes)

    text = transcription("temp.wav")
    translated = translate(text)

    return {
        "transcription": text,
        "translation": translated
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)