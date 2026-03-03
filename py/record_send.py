# client_local/record_and_send.py
import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
import threading
import time
import os
import requests

# ---------------- Configuration ---------------- #
GPU_IP = "149.165.169.155"  # e.g., "123.45.67.89"
SERVER_PORT = 8000
CHUNK_DURATION = 2         # seconds
SAMPLE_RATE = 16000
BLOCKSIZE = 512

AUDIO_DIR = "audio_chunks"
os.makedirs(AUDIO_DIR, exist_ok=True)

# ---------------- Globals ---------------- #
chunk_counter = 0
callback_buffer = []
rolling_transcript = ""
rolling_translation = ""

# ---------------- Helper Functions ---------------- #
def send_chunk_to_server(path):
    global rolling_transcript, rolling_translation
    url = f"http://{GPU_IP}:{SERVER_PORT}/transcribe"
    try:
        with open(path, "rb") as f:
            response = requests.post(url, files={"file": f})
        data = response.json()
        # Append rolling transcript and translation
        rolling_transcript += " " + data.get("transcription", "")
        rolling_translation += " " + data.get("translation", "")
        print("\n--- Rolling Transcript ---")
        print(rolling_transcript)
        print("\n--- Rolling Translation ---")
        print(rolling_translation)
        print("--------------------------\n")
    except Exception as e:
        print(f"Error sending chunk: {e}")

# ---------------- Callback for sounddevice ---------------- #
def callback(indata, frames, time_info, status):
    global chunk_counter, callback_buffer
    if status:
        print(status)
    callback_buffer.append(indata.copy())

    # Check if we have enough samples for a chunk
    total_samples = sum([len(c) for c in callback_buffer])
    if total_samples >= SAMPLE_RATE * CHUNK_DURATION:
        audio_chunk = np.concatenate(callback_buffer, axis=0)
        chunk_counter += 1
        chunk_path = os.path.join(AUDIO_DIR, f"temp_{chunk_counter}.wav")
        write(chunk_path, SAMPLE_RATE, audio_chunk)

        # Send to server in a separate thread
        threading.Thread(target=send_chunk_to_server, args=(chunk_path,)).start()

        # Clear buffer for next chunk
        callback_buffer = []

# ---------------- Main Recording Loop ---------------- #
def main():
    print("Recording... Press Enter to stop.\n")
    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype=np.float32,
            blocksize=BLOCKSIZE,
            callback=callback
        ):
            input()  # press Enter to stop
    except Exception as e:
        print(f"Error with recording: {e}")

    print("Recording stopped.")
    print("Final Rolling Transcript:")
    print(rolling_transcript)
    print("Final Rolling Translation:")
    print(rolling_translation)

if __name__ == "__main__":
    main()