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



# Test harness for live_transcript_typed pipeline using LibriSpeech (openslr/librispeech_asr)
# Runs pre-recorded audio samples through the same chunking/transcription logic
# and computes WER against reference transcripts.

# ---------------- Configuration ---------------- #
GPU_IP = config.GPU_IP
SERVER_PORT = 8000
MIN_CHUNK_DURATION = 2.0    # must match live_transcript_typed
MAX_CHUNK_DURATION = 6.0    # force-cut ceiling (seconds); 0 = disabled
SILENCE_SEARCH_WINDOW = .5
SILENCE_WINDOW_SIZE = 0.05
SAMPLE_RATE = 16000
MIN_AUDIO_ENERGY = 0.01
OVERLAP_DURATION = 0.5      # seconds of previous chunk to prepend for Whisper context
OVERLAP_MATCH_WORDS = 6     # max words to try matching when stripping overlap
VERBOSE = False             # True: show per-sample transcripts and WER; False: averages only
VERBOSE_SHOW_NORMALIZED = False  # additionally print normalized text in verbose mode

# ---- How much to transcribe ----
# Set NUM_SAMPLES to limit by number of samples (0 = no limit).
# Set MAX_TOTAL_DURATION to limit by total audio seconds (0.0 = no limit).
# Both limits are applied together — whichever is reached first stops evaluation.
NUM_SAMPLES = 500         # max samples to evaluate (0 = unlimited)
MAX_TOTAL_DURATION = 0.0    # max cumulative audio seconds to evaluate (0.0 = unlimited)

# ---- LibriSpeech dataset config ----
# openslr/librispeech_asr is public — no token required.
# subconfig: "clean" or "other"
# split:     "test", "validation", "train.100", "train.360"
LIBRISPEECH_SUBCONFIG = "clean"
LIBRISPEECH_SPLIT = "test"

WHISPER_HALLUCINATIONS = {'mbc', 'you', 'bye', 'thank', 'thanks', 'thank you', 'goodbye'}

AUDIO_DIR = "audio_chunks"
os.makedirs(AUDIO_DIR, exist_ok=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_LIBRISPEECH_TEMP_WAV = os.path.join(BASE_DIR, "librispeech_temp.wav")

# Loaded lazily in main()
_librispeech_dataset = None

def load_librispeech():
    global _librispeech_dataset
    if _librispeech_dataset is None:
        _librispeech_dataset = load_dataset(
            "openslr/librispeech_asr",
            LIBRISPEECH_SUBCONFIG,
            split=LIBRISPEECH_SPLIT,
            trust_remote_code=True,
        )
    return _librispeech_dataset


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
        try:
            os.remove(path)
        except OSError:
            pass


# ---------------- Send Full File ---------------- #
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
    chunk_results = {}

    if VERBOSE:
        print(f"\nLoading: {audio_path}")
    audio, _ = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
    audio = audio.astype(np.float32)
    if VERBOSE:
        print(f"Duration: {len(audio) / SAMPLE_RATE:.1f}s — processing...\n")

    worker_thread = threading.Thread(target=typing_worker, daemon=False)
    worker_thread.start()

    BLOCKSIZE = 512
    buffer = []
    required_samples = int(SAMPLE_RATE * MIN_CHUNK_DURATION)
    search_samples = int(SAMPLE_RATE * SILENCE_SEARCH_WINDOW)
    max_samples = int(SAMPLE_RATE * MAX_CHUNK_DURATION) if MAX_CHUNK_DURATION > 0 else None
    overlap_samples = int(SAMPLE_RATE * OVERLAP_DURATION)
    overlap_tail: np.ndarray = np.array([], dtype=np.float32)

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
            cut_target = required_samples if natural_trigger else max(required_samples, max_samples - search_samples // 2)
            cut_point = find_cut_point(audio_chunk, cut_target)
            send_audio = audio_chunk[:cut_point]

            rms = float(np.sqrt(np.mean(send_audio.astype(np.float64) ** 2)))
            if rms >= MIN_AUDIO_ENERGY:
                chunk_counter += 1
                idx = chunk_counter

                audio_with_overlap = np.concatenate([overlap_tail, send_audio]) if len(overlap_tail) else send_audio

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

                overlap_tail = send_audio[-overlap_samples:] if len(send_audio) > overlap_samples else send_audio.copy()

            buffer = [audio_chunk[cut_point:]]

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

    prev_words: list = []
    for idx in sorted(chunk_results.keys()):
        entry = chunk_results[idx]
        if entry is None:
            continue
        words, delay = entry
        new_words = strip_overlap(prev_words, words)
        prev_words = words[-OVERLAP_MATCH_WORDS:]
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


# ---------------- LibriSpeech Audio Helper ---------------- #
def get_reference_text(sample) -> str:
    """Return the reference transcript from a LibriSpeech ESB sample."""
    # ESB datasets use 'text' or 'norm_text' depending on the subconfig
    for key in ("text", "norm_text", "transcription", "raw_transcription"):
        if key in sample and sample[key]:
            return sample[key]
    return ""


def process_librispeech_sample(sample) -> tuple[str, str, str]:
    """
    Write a LibriSpeech sample's audio to a temp WAV, run both pipelines,
    and return (chunked_transcript, full_transcript, reference).
    """
    audio_array = np.array(sample["audio"]["array"], dtype=np.float32)
    sr = sample["audio"]["sampling_rate"]
    reference = get_reference_text(sample)

    if sr != SAMPLE_RATE:
        audio_array = librosa.resample(audio_array, orig_sr=sr, target_sr=SAMPLE_RATE)

    audio_int16 = (audio_array * 32767).clip(-32768, 32767).astype(np.int16)
    wav_write(_LIBRISPEECH_TEMP_WAV, SAMPLE_RATE, audio_int16)

    chunked = process_file(_LIBRISPEECH_TEMP_WAV)
    full = send_full_file_to_server(_LIBRISPEECH_TEMP_WAV)
    return chunked, full, reference


def sample_duration_seconds(sample) -> float:
    """Return duration in seconds for a dataset sample."""
    arr = sample["audio"]["array"]
    sr = sample["audio"]["sampling_rate"]
    return len(arr) / sr


# ---------------- Main ---------------- #
def main():
    dataset = load_librispeech()

    limit_str = []
    if NUM_SAMPLES > 0:
        limit_str.append(f"{NUM_SAMPLES} samples")
    if MAX_TOTAL_DURATION > 0:
        limit_str.append(f"{MAX_TOTAL_DURATION:.0f}s total audio")
    limit_desc = " / ".join(limit_str) if limit_str else "all samples"

    print(f"\n{'=' * 50}")
    print(f"LibriSpeech evaluation — {limit_desc}")
    print(f"Dataset: openslr/librispeech_asr / {LIBRISPEECH_SUBCONFIG} / split={LIBRISPEECH_SPLIT}")
    print(f"{'=' * 50}")

    chunked_wers, full_wers = [], []
    total_duration = 0.0

    for idx, sample in enumerate(dataset):
        # Apply limits
        if NUM_SAMPLES > 0 and idx >= NUM_SAMPLES:
            print(f"\nReached sample limit ({NUM_SAMPLES}). Stopping.")
            break

        dur = sample_duration_seconds(sample)
        if MAX_TOTAL_DURATION > 0 and total_duration + dur > MAX_TOTAL_DURATION:
            print(f"\nReached duration limit ({MAX_TOTAL_DURATION:.0f}s). Stopping.")
            break

        total_duration += dur

        if VERBOSE:
            print(f"\n  Sample {idx + 1}  [{dur:.1f}s]  cumulative: {total_duration:.1f}s")

        chunked, full, reference = process_librispeech_sample(sample)

        if VERBOSE:
            compare_transcripts(chunked, full, reference)

        if reference:
            ref = normalize(reference)
            if chunked:
                chunked_wers.append(wer(ref, normalize(chunked)))
            if full:
                full_wers.append(wer(ref, normalize(full)))

    print(f"\n{'=' * 50}")
    print(f"Evaluated {len(chunked_wers)} sample(s) — {total_duration:.1f}s total audio")
    print(
        f"Average WER (chunked):   {sum(chunked_wers)/len(chunked_wers):.1%}"
        if chunked_wers else "Average WER (chunked):   N/A"
    )
    print(
        f"Average WER (full file): {sum(full_wers)/len(full_wers):.1%}"
        if full_wers else "Average WER (full file): N/A"
    )
    print("=" * 50)


if __name__ == "__main__":
    main()
