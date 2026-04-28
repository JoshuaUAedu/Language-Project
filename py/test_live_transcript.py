import re
import numpy as np
from scipy.io.wavfile import write as wav_write
import threading
import queue
import time
import os
import requests
import sys
import librosa
from jiwer import wer
import config
from datasets import load_dataset


# Vibe Assisted
# Test harness for live_transcript_typed pipeline
# Runs pre-recorded audio files through the same chunking/transcription logic
# and computes WER against a reference transcript.

# ---------------- Configuration ---------------- #
GPU_IP = config.GPU_IP
SERVER_PORT = 8000
MIN_CHUNK_DURATION = 2.0    # must match live_transcript_typed  # test different windows #1.5 default
MAX_CHUNK_DURATION = 6.0    # force-cut ceiling (seconds); prevents unbounded buffers on continuous speech; 0 = disabled
SILENCE_SEARCH_WINDOW = .5 #1.0 default
SILENCE_WINDOW_SIZE = 0.05
SAMPLE_RATE = 16000
MIN_AUDIO_ENERGY = 0.01
OVERLAP_DURATION = 0.5      # seconds of previous chunk to prepend for Whisper context
OVERLAP_MATCH_WORDS = 6     # max words to try matching when stripping overlap
VERBOSE = False             # True: show transcripts and WER; False: averages only
VERBOSE_SHOW_NORMALIZED = False  # TRUE = additionally print normalized text in verbose mode
SAMPLES_PER_LANGUAGE = 500


WHISPER_HALLUCINATIONS = {'mbc', 'you', 'bye', 'thank', 'thanks', 'thank you', 'goodbye'}

AUDIO_DIR = "audio_chunks"
os.makedirs(AUDIO_DIR, exist_ok=True)

# Anchor paths relative to this script's location, not the working directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ---- FLEURS language configs ----
FLEURS_LANGUAGES = {
    # "English (en_us)":   "en_us",
    "Spanish (es_419)":  "es_419",
    # "Japanese (ja_jp)":  "ja_jp", #unicode glitching #cer
    # "German (de_de)":    "de_de",
    "French (fr_fr)":    "fr_fr",
}

# Loaded lazily in main() to avoid slow startup when not all languages are needed
_fleurs_cache: dict = {}

def load_fleurs(lang_code: str):
    if lang_code not in _fleurs_cache:
        _fleurs_cache[lang_code] = load_dataset(
            "google/fleurs", lang_code,
            split=f"train[:{SAMPLES_PER_LANGUAGE}]",
            trust_remote_code=True,
        )
    return _fleurs_cache[lang_code]


# ---- Static files to test (optional) ----
# Each entry: (path, "reference transcript or None")
TEST_FILES = [
    # (os.path.join(BASE_DIR, '..', 'audio', 'recording2.wav'), "I am testing for Dr. Li my language transcription project"),
]


# ---------------- Globals ---------------- #
chunk_counter = 0
typing_queue = queue.Queue()
full_transcript_words = []
send_threads = []


# ---------------- Helper Functions ---------------- #
def find_cut_point(audio, target_sample):
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


def normalize(text: str) -> str:
    """Lowercase, strip punctuation, and collapse whitespace for fair WER comparison."""
    text = text.lower()
    text = re.sub(r"[.,!?;:\-'\"()]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

#whisper normalizer apply

def strip_overlap(prev_words: list, new_words: list) -> list:
    """
    Remove words at the start of new_words that were already output at the end
    of prev_words (the overlap region).  Tries progressively shorter matches so
    a single mis-transcribed word in the overlap doesn't prevent dedup entirely.
    """
    canonical = lambda ws: [w.lower().strip('.,!?;:') for w in ws]
    for match_len in range(min(OVERLAP_MATCH_WORDS, len(prev_words), len(new_words)), 0, -1):
        if canonical(prev_words[-match_len:]) == canonical(new_words[:match_len]):
            return new_words[match_len:]
    return new_words


def sanitize(word):
    enc = sys.stdout.encoding or 'utf-8'
    return word.encode(enc, errors='ignore').decode(enc).strip()


# ---------------- Typing Worker ---------------- #
def typing_worker():
    while True:
        item = typing_queue.get()
        if item is None:
            typing_queue.task_done()
            break
        words, delay = item
        try:
            for word in words:
                safe = sanitize(word)
                if safe:
                    full_transcript_words.append(safe)
                    if VERBOSE:
                        print(safe, end=' ', flush=True)
                else:
                    if VERBOSE:
                        print(' ', end='', flush=True)
                if VERBOSE:
                    time.sleep(delay)
        finally:
            typing_queue.task_done()


# ---------------- Send Chunk ---------------- #
def send_chunk_to_server(path, total_samples, results, index):
    """Send a chunk and store (words, delay) at results[index] to preserve order."""
    url = f"http://{GPU_IP}:{SERVER_PORT}/transcribe"
    try:
        with open(path, "rb") as f:
            response = requests.post(url, files={"file": f})
        try:
            data = response.json()
        except ValueError:
            results[index] = None
            return

        words = data.get("transcription", "").split()
        if not words:
            results[index] = None
            return

        cleaned = [w.strip('.,!?').lower() for w in words]
        if len(words) <= 3 and all(w in WHISPER_HALLUCINATIONS for w in cleaned):
            results[index] = None
            return

        chunk_seconds = total_samples / SAMPLE_RATE
        delay = max(0.05, min(0.5, chunk_seconds / len(words)))
        results[index] = (words, delay)

    except Exception as e:
        print(f"\nError sending chunk: {e}")
        results[index] = None
    finally:
        # Clean up the unique temp file now that the server has received it
        try:
            os.remove(path)
        except OSError:
            pass


# ---------------- Send Full File (full_transcript comparison) ---------------- #
def send_full_file_to_server(path):
    """Send the entire audio file as one chunk — mirrors full_transcript.py behavior."""
    url = f"http://{GPU_IP}:{SERVER_PORT}/transcribe"
    try:
        with open(path, "rb") as f:
            response = requests.post(url, files={"file": f})
        data = response.json()
        return data.get("transcription", "").strip()
    except Exception as e:
        print(f"\nError sending full file: {e}")
        return ""


# ---------------- Process One Audio File ---------------- #
def process_file(audio_path):
    """
    Load audio, simulate the live_transcript_typed chunking pipeline,
    and return the full typed transcript.
    """
    global chunk_counter, full_transcript_words, send_threads
    chunk_counter = 0
    full_transcript_words = []
    send_threads = []
    chunk_results = {}  # index → (words, delay) or None; filled by threads

    if VERBOSE:
        print(f"\nLoading: {audio_path}")
    audio, _ = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
    audio = audio.astype(np.float32)
    if VERBOSE:
        print(f"Duration: {len(audio) / SAMPLE_RATE:.1f}s — processing...\n")

    worker_thread = threading.Thread(target=typing_worker, daemon=False)
    worker_thread.start()

    # Simulate the callback buffer by sliding through the audio in BLOCKSIZE steps
    BLOCKSIZE = 512
    buffer = []
    required_samples = int(SAMPLE_RATE * MIN_CHUNK_DURATION)
    search_samples = int(SAMPLE_RATE * SILENCE_SEARCH_WINDOW)
    max_samples = int(SAMPLE_RATE * MAX_CHUNK_DURATION) if MAX_CHUNK_DURATION > 0 else None
    overlap_samples = int(SAMPLE_RATE * OVERLAP_DURATION)
    overlap_tail: np.ndarray = np.array([], dtype=np.float32)  # tail of last sent chunk

    for start in range(0, len(audio), BLOCKSIZE):
        block = audio[start:start + BLOCKSIZE]
        if len(block) == 0:
            break
        buffer.append(block)

        total_samples = sum(len(c) for c in buffer)

        natural_trigger = total_samples >= required_samples + search_samples
        force_cut = bool(max_samples and total_samples >= max_samples)

        if natural_trigger or force_cut:
            audio_chunk = np.concatenate(buffer, axis=0)
            # On a forced max-duration cut, search for silence near the max boundary
            # rather than the minimum, so we still avoid cutting mid-word when possible.
            cut_target = required_samples if natural_trigger else max(required_samples, max_samples - search_samples // 2)
            cut_point = find_cut_point(audio_chunk, cut_target)
            send_audio = audio_chunk[:cut_point]

            rms = float(np.sqrt(np.mean(send_audio.astype(np.float64) ** 2)))
            if rms >= MIN_AUDIO_ENERGY:
                chunk_counter += 1
                idx = chunk_counter  # stable index for ordering

                # Prepend overlap tail from previous chunk so Whisper has context
                audio_with_overlap = np.concatenate([overlap_tail, send_audio]) if len(overlap_tail) else send_audio

                chunk_path = os.path.join(AUDIO_DIR, f"temp_{idx}.wav")
                wav_write(chunk_path, SAMPLE_RATE, audio_with_overlap)
                chunk_results[idx] = None  # reserve slot before thread starts

                t = threading.Thread(
                    target=send_chunk_to_server,
                    args=(chunk_path, len(audio_with_overlap), chunk_results, idx),
                    daemon=True
                )
                send_threads.append(t)
                t.start()

                # Save the tail of this chunk's audio for the next iteration
                overlap_tail = send_audio[-overlap_samples:] if len(send_audio) > overlap_samples else send_audio.copy()

            buffer = [audio_chunk[cut_point:]]

    # Handle any leftover audio that never hit the trigger threshold
    if buffer:
        remainder = np.concatenate(buffer, axis=0)
        rms = float(np.sqrt(np.mean(remainder.astype(np.float64) ** 2)))
        if len(remainder) > int(SAMPLE_RATE * 0.5) and rms >= MIN_AUDIO_ENERGY:
            chunk_counter += 1
            idx = chunk_counter
            audio_with_overlap = np.concatenate([overlap_tail, remainder]) if len(overlap_tail) else remainder
            chunk_path = os.path.join(AUDIO_DIR, f"temp_{idx}.wav")
            wav_write(chunk_path, SAMPLE_RATE, audio_with_overlap)
            chunk_results[idx] = None

            t = threading.Thread(
                target=send_chunk_to_server,
                args=(chunk_path, len(audio_with_overlap), chunk_results, idx),
                daemon=True
            )
            send_threads.append(t)
            t.start()

    for t in send_threads:
        t.join()

    # Feed results to the typing queue in chunk order, stripping overlap words
    prev_words: list = []
    for idx in sorted(chunk_results.keys()):
        entry = chunk_results[idx]
        if entry is None:
            continue
        words, delay = entry
        new_words = strip_overlap(prev_words, words)
        prev_words = words[-OVERLAP_MATCH_WORDS:]  # keep tail for next chunk's dedup
        if new_words:
            typing_queue.put((new_words, delay))

    typing_queue.join()
    typing_queue.put(None)
    worker_thread.join()

    return ' '.join(full_transcript_words)


# ---------------- WER Comparison ---------------- #
def compare_transcripts(chunked, full_file, reference=None):
    print("\n" + "=" * 50)
    print("CHUNKED (live_transcript_typed style):")
    print(chunked or "(empty)")
    if VERBOSE_SHOW_NORMALIZED:
        print(f"  [normalized] {normalize(chunked) if chunked else '(empty)'}")

    print("\nFULL FILE (full_transcript style):")
    print(full_file or "(empty)")
    if VERBOSE_SHOW_NORMALIZED:
        print(f"  [normalized] {normalize(full_file) if full_file else '(empty)'}")

    if reference:
        ref = normalize(reference)
        chunked_wer = wer(ref, normalize(chunked)) if chunked else 1.0
        full_wer    = wer(ref, normalize(full_file)) if full_file else 1.0
        print(f"\nReference:         {reference}")
        if VERBOSE_SHOW_NORMALIZED:
            print(f"  [normalized] {ref}")
        print(f"WER (chunked):     {chunked_wer:.1%}")
        print(f"WER (full file):   {full_wer:.1%}")
    else:
        if chunked and full_file:
            cross_wer = wer(normalize(full_file), normalize(chunked))
            print(f"\nCross-WER (chunked vs full file): {cross_wer:.1%}")
        print("(No reference provided — skipping absolute WER)")

    print("=" * 50)


# ---------------- FLEURS Audio Helper ---------------- #
_FLEURS_TEMP_WAV = os.path.join(BASE_DIR, "fleurs_temp.wav")

def process_fleurs_sample(sample) -> tuple[str, str, str]:
    """
    Write a FLEURS sample's audio to a temp WAV, run both pipelines,
    and return (chunked_transcript, full_transcript, reference).
    """
    audio_array = np.array(sample["audio"]["array"], dtype=np.float32)
    sr = sample["audio"]["sampling_rate"]
    reference = sample["raw_transcription"]

    # Resample to SAMPLE_RATE if needed
    if sr != SAMPLE_RATE:
        audio_array = librosa.resample(audio_array, orig_sr=sr, target_sr=SAMPLE_RATE)

    # Write int16 WAV for process_file (which uses librosa.load internally)
    audio_int16 = (audio_array * 32767).clip(-32768, 32767).astype(np.int16)
    wav_write(_FLEURS_TEMP_WAV, SAMPLE_RATE, audio_int16)

    chunked = process_file(_FLEURS_TEMP_WAV)
    full = send_full_file_to_server(_FLEURS_TEMP_WAV)
    return chunked, full, reference


# ---------------- Main ---------------- #
def main():
    # --- Static test files ---
    for audio_path, reference in TEST_FILES:
        if not os.path.exists(audio_path):
            print(f"File not found: {audio_path} — skipping.")
            continue

        print(f"\n{'=' * 50}")
        print(f"Testing: {audio_path}")

        print("\n[Chunked transcription — typed output]")
        chunked_transcript = process_file(audio_path)

        print("\n[Full-file transcription]")
        full_transcript = send_full_file_to_server(audio_path)

        compare_transcripts(chunked_transcript, full_transcript, reference)

    # --- FLEURS samples ---
    print(f"\n{'=' * 50}")
    print(f"FLEURS evaluation — {SAMPLES_PER_LANGUAGE} sample(s) per language")

    for lang_name, lang_code in FLEURS_LANGUAGES.items():
        print(f"\n{'=' * 50}")
        print(f"Language: {lang_name}")
        dataset = load_fleurs(lang_code)

        chunked_wers, full_wers = [], []

        for idx, sample in enumerate(dataset):
            if VERBOSE:
                print(f"\n  Sample {idx + 1}/{SAMPLES_PER_LANGUAGE}")
            chunked, full, reference = process_fleurs_sample(sample)
            if VERBOSE:
                compare_transcripts(chunked, full, reference)

            if reference:
                ref = normalize(reference)
                if chunked:
                    chunked_wers.append(wer(ref, normalize(chunked)))
                if full:
                    full_wers.append(wer(ref, normalize(full)))

        print(f"\n  [{lang_name}] Average WER (chunked):   "
              f"{sum(chunked_wers)/len(chunked_wers):.1%}" if chunked_wers else
              f"\n  [{lang_name}] No chunked WER data")
        print(f"  [{lang_name}] Average WER (full file): "
              f"{sum(full_wers)/len(full_wers):.1%}" if full_wers else
              f"  [{lang_name}] No full-file WER data")


if __name__ == "__main__":
    main()
