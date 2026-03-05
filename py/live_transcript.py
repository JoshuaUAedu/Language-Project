# client_local/record_and_send.py
import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
import threading
import time
import os
import requests
import config


#Live Transcription Logic

# ---------------- Configuration ---------------- #
GPU_IP = config.GPU_IP
SERVER_PORT = 8000
CHUNK_DURATION = 3      # minimum seconds before looking for a cut point
OVERLAP_DURATION = 1.0  # seconds of overlap carried into next chunk for context
SILENCE_SEARCH_WINDOW = 0.8  # seconds around cut point to scan for silence
SILENCE_WINDOW_SIZE = 0.05   # RMS window size in seconds
SAMPLE_RATE = 16000
BLOCKSIZE = 512
MAX_RECORD_DURATION = 30

AUDIO_DIR = "audio_chunks"
MAX_AUDIO_FILES = 15
os.makedirs(AUDIO_DIR, exist_ok=True)


# ---------------- Globals ---------------- #
chunk_counter = 0
callback_buffer = []
rolling_transcript = ""
rolling_translation = ""
stop_event = threading.Event()

# ---------------- Helper Functions ---------------- #
def find_cut_point(audio, target_sample):
    """Return the index of the lowest-energy point near target_sample."""
    win = int(SAMPLE_RATE * SILENCE_WINDOW_SIZE)
    search = int(SAMPLE_RATE * SILENCE_SEARCH_WINDOW)
    lo = max(0, target_sample - search)
    hi = min(len(audio) - win, target_sample + search // 2)
    best_pos, min_rms = target_sample, float('inf')
    for i in range(lo, hi, max(1, win // 2)):
        rms = float(np.sqrt(np.mean(audio[i:i + win].astype(np.float64) ** 2)))
        if rms < min_rms:
            min_rms, best_pos = rms, i
    return best_pos

# ---------------- Callback ---------------- #
def callback(indata, frames, time_info, status):
    global chunk_counter, callback_buffer
    if status:
        print(status)

    callback_buffer.append(indata.copy())

    total_samples = sum(len(c) for c in callback_buffer)
    required_samples = int(SAMPLE_RATE * CHUNK_DURATION)

    overlap_samples = int(SAMPLE_RATE * OVERLAP_DURATION)
    search_samples = int(SAMPLE_RATE * SILENCE_SEARCH_WINDOW)

    if total_samples >= required_samples + search_samples:
        audio_chunk = np.concatenate(callback_buffer, axis=0)

        # Cut at the quietest point near the target, not mid-word
        cut_point = find_cut_point(audio_chunk, required_samples)
        send_audio = audio_chunk[:cut_point]

        chunk_counter += 1
        slot = (chunk_counter - 1) % MAX_AUDIO_FILES + 1
        chunk_path = os.path.join(AUDIO_DIR, f"temp_{slot}.wav")
        write(chunk_path, SAMPLE_RATE, send_audio)

        # Keep overlap before cut + any audio recorded after cut point
        overlap_start = max(0, cut_point - overlap_samples)
        callback_buffer = [audio_chunk[overlap_start:]]

        # Samples that are genuinely new (not overlap from previous chunk)
        new_samples = cut_point if chunk_counter == 1 else max(0, cut_point - overlap_samples)

        threading.Thread(
            target=send_chunk_to_server,
            args=(chunk_path, new_samples, cut_point),
            daemon=True
        ).start()

# ---------------- Send Chunk ---------------- #
def send_chunk_to_server(path, new_samples, total_samples):
    """
    path: audio file to send
    new_samples: samples that are genuinely new (not overlap from previous chunk)
    total_samples: total samples in this chunk
    """
    global rolling_transcript, rolling_translation
    url = f"http://{GPU_IP}:{SERVER_PORT}/transcribe"
    try:
        with open(path, "rb") as f:
            response = requests.post(url, files={"file": f})
        data = response.json()
        transcription = data.get("transcription", "")
        translation = data.get("translation", "")

        # Trim overlapping portion from transcription using actual chunk length
        if OVERLAP_DURATION > 0 and total_samples > 0:
            proportion_new = new_samples / total_samples
            words = transcription.split()
            new_words_count = max(1, int(len(words) * proportion_new))
            transcription = " ".join(words[-new_words_count:])

        rolling_transcript += " " + transcription
        rolling_translation += " " + translation

        print("\n--- Rolling Transcript ---")
        print(rolling_transcript)
        print("\n--- Rolling Translation ---")
        print(rolling_translation)
        print("--------------------------\n")
    except Exception as e:
        print(f"Error sending chunk: {e}")

# ---------------- Stop Listener ---------------- #
def listen_for_enter():
    input("Press Enter to stop recording...\n")
    stop_event.set()

# ---------------- Main Loop ---------------- #
def main():
    global rolling_transcript, rolling_translation
    print(f"Recording... Will automatically stop after {MAX_RECORD_DURATION} seconds.")
    print("Press Enter to stop early.\n")

    threading.Thread(target=listen_for_enter, daemon=True).start()
    start_time = time.time()
    
    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype=np.float32,
            blocksize=BLOCKSIZE,
            callback=callback
        ):
            while not stop_event.is_set():
                time.sleep(0.1)
                if time.time() - start_time >= MAX_RECORD_DURATION:
                    print(f"\nMaximum recording duration ({MAX_RECORD_DURATION}s) reached.")
                    break
    except KeyboardInterrupt:
        print("\nKeyboardInterrupt received. Stopping recording.")
    except Exception as e:
        print(f"Error with recording: {e}")

    print("Recording stopped.")
    print("Final Rolling Transcript:")
    print(rolling_transcript)
    print("Final Rolling Translation:")
    print(rolling_translation)

if __name__ == "__main__":
    main()