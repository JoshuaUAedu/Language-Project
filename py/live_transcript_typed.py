import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
import threading
import queue
import time
import os
import requests
import sys
import msvcrt
import config


# Live Transcription - Closed Caption Typed Mode

# ---------------- Configuration ---------------- #
GPU_IP = config.GPU_IP
SERVER_PORT = 8000
MIN_CHUNK_DURATION = 1.5  # minimum seconds before listening for a pause
SILENCE_SEARCH_WINDOW = 1.0 # seconds to scan for silence after min duration
SILENCE_WINDOW_SIZE = 0.05   # RMS window size in seconds
SAMPLE_RATE = 16000
BLOCKSIZE = 512
MAX_RECORD_DURATION = 30
MIN_AUDIO_ENERGY = 0.01  # RMS threshold — chunks below this are silent, skip them

# Known Whisper hallucinations on silent/near-silent audio
WHISPER_HALLUCINATIONS = {'mbc', 'you', 'bye', 'thank', 'thanks', 'thank you', 'goodbye'}

AUDIO_DIR = "audio_chunks"
MAX_AUDIO_FILES = 15
os.makedirs(AUDIO_DIR, exist_ok=True)


# ---------------- Globals ---------------- #
chunk_counter = 0
callback_buffer = []
stop_event = threading.Event()
typing_queue = queue.Queue()
full_transcript_words = []
send_threads = []


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


def sanitize(word):
    """Drop characters the terminal can't encode; return empty string if nothing remains."""
    enc = sys.stdout.encoding or 'utf-8'
    return word.encode(enc, errors='ignore').decode(enc).strip()


# ---------------- Typing Worker ---------------- #
def typing_worker():
    """Pulls word batches from the queue and prints them at speech-rate delays."""
    while True:
        item = typing_queue.get()
        if item is None:  # sentinel — stop
            typing_queue.task_done()
            break
        words, delay = item
        try:
            for word in words:
                safe = sanitize(word)
                if safe:
                    full_transcript_words.append(safe)
                    print(safe, end=' ', flush=True)
                else:
                    print(' ', end='', flush=True)  # unclear word — print space
                time.sleep(delay)
        finally:
            typing_queue.task_done()


# ---------------- Callback ---------------- #
def callback(indata, frames, time_info, status):
    global chunk_counter, callback_buffer
    if status:
        print(status)

    callback_buffer.append(indata.copy())

    total_samples = sum(len(c) for c in callback_buffer)
    required_samples = int(SAMPLE_RATE * MIN_CHUNK_DURATION)
    search_samples = int(SAMPLE_RATE * SILENCE_SEARCH_WINDOW)

    if total_samples >= required_samples + search_samples:
        audio_chunk = np.concatenate(callback_buffer, axis=0)

        # Cut at the quietest point after the minimum duration
        cut_point = find_cut_point(audio_chunk, required_samples)
        send_audio = audio_chunk[:cut_point]

        # Skip silent chunks before doing anything else
        rms = float(np.sqrt(np.mean(send_audio.astype(np.float64) ** 2)))
        if rms < MIN_AUDIO_ENERGY:
            callback_buffer = [audio_chunk[cut_point:]]
            return

        chunk_counter += 1
        slot = (chunk_counter - 1) % MAX_AUDIO_FILES + 1
        chunk_path = os.path.join(AUDIO_DIR, f"temp_{slot}.wav")
        write(chunk_path, SAMPLE_RATE, send_audio)

        # No overlap — next chunk starts clean from after the cut point
        callback_buffer = [audio_chunk[cut_point:]]

        t = threading.Thread(
            target=send_chunk_to_server,
            args=(chunk_path, cut_point),
            daemon=True
        )
        send_threads.append(t)
        t.start()


# ---------------- Send Chunk ---------------- #
def send_chunk_to_server(path, total_samples):
    url = f"http://{GPU_IP}:{SERVER_PORT}/transcribe"
    try:
        with open(path, "rb") as f:
            response = requests.post(url, files={"file": f})
        try:
            data = response.json()
        except ValueError:
            return  # server returned empty/non-JSON — skip this chunk silently

        words = data.get("transcription", "").split()

        if not words:
            return

        # Drop responses that are entirely known Whisper hallucinations
        cleaned = [w.strip('.,!?').lower() for w in words]
        if len(words) <= 3 and all(w in WHISPER_HALLUCINATIONS for w in cleaned):
            return

        # Delay per word based on actual chunk duration (all samples are new)
        chunk_seconds = total_samples / SAMPLE_RATE
        delay = max(0.05, min(0.5, chunk_seconds / len(words)))

        typing_queue.put((words, delay))

    except Exception as e:
        print(f"\nError sending chunk: {e}")


# ---------------- Stop Listener ---------------- #
def listen_for_enter():
    while not stop_event.is_set():
        if msvcrt.kbhit():
            if msvcrt.getwch() == '\r':  # Enter key
                stop_event.set()
                break
        time.sleep(0.05)


# ---------------- Main Loop ---------------- #
def main():
    print(f"Recording... Will automatically stop after {MAX_RECORD_DURATION} seconds.")
    print("Press Enter to stop early.\n")

    worker_thread = threading.Thread(target=typing_worker, daemon=False)
    worker_thread.start()

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

    print("\nRecording stopped. Finishing transcription...")

    # Wait for all in-flight HTTP requests to complete
    for t in send_threads:
        t.join()

    # Wait for the typing worker to finish printing everything
    typing_queue.join()
    typing_queue.put(None)  # signal worker to exit
    worker_thread.join()

    print("\n\n=== Full Transcript ===")
    print(' '.join(full_transcript_words))
    print("=======================\n")


if __name__ == "__main__":
    main()
