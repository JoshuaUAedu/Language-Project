# LDT3 — Language Detection, Transcription & Translation

A dynamic language learning tool that combines real-time speech transcription, neural machine translation, and an interactive journal-based study interface. Audio is processed on a GPU backend (Jetstream2) and served to a local browser frontend with no installation required on the client. Learn and rank up as you go!

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Environment Setup](#environment-setup)
4. [Notebook Walkthrough — Detection & Transcription](#notebook-walkthrough)
5. [Running the GPU Server](#running-the-gpu-server)
6. [Using the Website](#using-the-website)
7. [Supported Languages](#supported-languages)
8. [Models Used](#models-used)

---

## Project Overview

LDT3 allows users to:

- **Transcribe** spoken audio in real time using OpenAI Whisper
- **Translate** transcribed text with Meta's NLLB-200 model
- **Detect** the spoken language automatically or force a specific language
- **Study** vocabulary through a journal interface with Study Mode, Exam Mode, and pronunciation scoring
- **Romanize** CJK scripts (Japanese, Korean, Chinese) for readability
- **Earn rankings** (Bronze → Emerald) by passing journal exams

---

## Repository Structure

```
Capstone/
├── env/
│   ├── requirements.txt            # Main GPU environment dependencies
│   ├── requirements_MoshiGPU.txt   # Alternative GPU env (Moshi experiments) -- *unused
│   └── requirements_moshi.txt      # Local Moshi testing env -- *unused
├── models/
│   ├── cnn_detect.keras            # CNN language detection model
│   ├── cnn_detect2.keras
│   ├── detection.pkl               # Random Forest language detection model
│   └── detectionv2.pkl
├── notebooks/
│   ├── Detection_Transcription.ipynb   # Main research notebook (start here)
│   └── Moshi.ipynb                     # Experimental STT/TTS with Kyutai Moshi 
├── py/
│   ├── server.py           # FastAPI backend — all endpoints
│   ├── transcribe.py       # Whisper transcription logic
│   ├── translate.py        # NLLB-200 translation logic
│   ├── pronunciation.py    # Phoneme alignment & pronunciation scoring
│   ├── config.py           # GPU IP configuration -- *ignored on GitHub
│   └── *.py                # Test and utility scripts
├── website/
│   ├── index.html          # Home page — journals, rankings, phrase sets
│   ├── journal.html        # Journal editor with Study & Exam modes
│   ├── config.js           # GPU IP for the frontend (must match config.py) -- *ignored on GitHub
│   ├── home.js / home.css
│   └── journal.js / journal.css
├── audio/                  # Sample audio files for testing
├── INITIALIZE.txt          # Full project development log
└── README.md
```

---

## Environment Setup

### Prerequisites

- [Anaconda](https://www.anaconda.com/download) installed locally
- Python 3.11
- Access to a CUDA-capable GPU (Jetstream2 allocation or equivalent) for the server

---

### Step 1 — Create the Conda Environment

Open **Anaconda Prompt** and run the following commands:

```bash
conda create -n LNenv python=3.11
conda activate LNenv
conda install ipykernel jupyter -y
python -m ipykernel install --user --name LNenv --display-name "Python (LNenv)"
```

---

### Step 2 — Install Dependencies

Navigate to the `env/` folder and install all required packages:

```bash
cd env
pip install -r requirements.txt
```

> **Note:** `torch`, `torchaudio`, and `transformers` will pull in large model weights on first use. 

Some packages require additional system dependencies on Linux (Jetstream2 GPU):

```bash
sudo apt update
sudo apt install portaudio19-dev
```

After installing system deps, reactivate the environment:

```bash
deactivate
source LNenv/bin/activate
```

---

### Step 3 — GPU Server Environment (Jetstream2)

If deploying the backend on a remote GPU (recommended for performance):

```bash
# On the GPU machine, clone the repo and set up the environment
python3 -m venv GPUenv
source GPUenv/bin/activate
pip install --upgrade pip

cd env
pip install -r requirements.txt
pip install fastapi uvicorn python-multipart

python -m ipykernel install --user --name=GPUenv --display-name "Python (GPUenv)"
```

> Add `GPUenv/` to your `.gitignore` before pushing to avoid committing the environment.

---

## Notebook Walkthrough

**File:** [`notebooks/Detection_Transcription.ipynb`](notebooks/Detection_Transcription.ipynb)

This is the core research notebook. Open it in VS Code or Jupyter using the `LNenv` kernel. Work through the cells in order:

### Section 1 — Imports & Dataset Loading

Loads the [Google FLEURS](https://huggingface.co/datasets/google/fleurs) multilingual dataset from Hugging Face. Only the transcription text and language label columns are used.

```python
from datasets import load_dataset
ds = load_dataset("google/fleurs", "en_us", split="train")
```

---

### Section 2 — Transcription with Whisper

Sets up the `openai/whisper-small` pipeline for automatic speech recognition. The pipeline transcribes `.wav` files and optionally auto-detects the spoken language.

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="openai/whisper-small")
result = asr("audio/recording.wav")
print(result["text"])
```

A dedicated cell allows you to **record custom audio** directly from the notebook — it captures microphone input, saves it to `audio/recording.wav` at 16 kHz (required by Whisper), and feeds it into the transcription pipeline.

---

### Section 3 — Language Detection

Trains a **multi-class text classifier** to identify the spoken language from the transcribed text. Two approaches are explored:

| Model | Input | Notes |
|---|---|---|
| Random Forest Classifier | Transcription text | Fast, good for longer text, very basic |
| CNN (Keras) | Character n-grams | Better on short phrases (<4 words) |

The final trained models are saved to `models/detection.pkl` and `models/cnn_detect.keras`.

```python
# Train and evaluate
train_model(X_train, y_train)
test_model("¿Cómo estás?")      # → Spanish
test_model("Wie geht es dir?")  # → German
```

Language probabilities are displayed for each prediction so you can see model confidence.

---

### Section 4 — Translation

Loads **Meta's NLLB-200** (No Language Left Behind) model for high-quality neural translation across all supported language pairs.

```python
from translate import load_translate_model, translate
model = load_translate_model()
translated, confidence = translate("Hello, how are you?", "English", "Japanese", model)
print(translated)   # → こんにちは、お元気ですか？
print(confidence)   # → 0.87
```

Translation is chained directly to the transcription output — speak in one language, get the translation in another.

---

### Section 5 — Pronunciation Scoring

Uses **Allosaurus** (audio → IPA phonemes) and **Epitran / G2P** (text → expected IPA phonemes) with a **Needleman-Wunsch global alignment** to score how closely the spoken pronunciation matches the expected text. Supports all 7 languages including CJK scripts.

```python
from pronunciation import pronunciation_score
score, expected, spoken = pronunciation_score("hola", "audio/recording.wav", lang="es")
print(score)     # → 0.85
print(expected)  # → o l a
print(spoken)    # → o l a
```

---

## Running the GPU Server

The FastAPI server exposes all model inference as HTTP endpoints. Run it on the GPU machine:

```bash
cd py
source ../GPUenv/bin/activate   # or conda activate LNenv
python server.py
```

The server starts on `http://0.0.0.0:8000`. Available endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/transcribe` | POST | Transcribe audio and translate |
| `/translate` | POST | Translate text between supported languages |
| `/pronunciation` | POST | Score spoken pronunciation against expected text |
| `/romanize` | POST | Romanize Japanese, Korean, or Chinese text |

### Configuring the IP Address

Both the Python backend and the website frontend need the same GPU IP address.

**`py/config.py`**
```python
GPU_IP = "your.gpu.ip.address"
```

**`website/config.js`**
```javascript
const GPU_IP = 'your.gpu.ip.address';
```

Replace `your.gpu.ip.address` with the public IP of your Jetstream2 (or other) GPU instance. Both files must match.

---

## Using the Website

The frontend is a pure HTML/CSS/JS application — no build step or Node.js runtime is required. Simply open the files in a browser.

### Step 1 — Set the GPU IP

Edit `website/config.js` and set `GPU_IP` to match your running server:

```javascript
const GPU_IP = '100.xxx.xxx.xxx';
```

### Step 2 — Open the App

Open `website/index.html` 

```
website/index.html   ← Home page
website/journal.html ← Journal editor (opens automatically when you create/open a journal)
```

> **Microphone permissions:** The browser will prompt for microphone access on first use. This is required for live transcription and pronunciation scoring.

### Step 3 — Create a Journal

1. Click **New Journal** to open a blank two-page spread.
2. Click **Transcribe** and speak — your words appear on the left page, and the translation appears on the right.
3. Alternatively, type directly into the left page and the translation will be fetched automatically.
4. Use the language droppers to choose any source/target language pair.
5. Click **Save Journal** to store the journal in the browser's local storage.

### Step 4 — Study & Exam Mode

- Click **Study** to enter flashcard mode — flip cards to reveal translations.
- Use the **Speak** button to practice pronunciation; a score is returned by the server.
- Click **Exam** for a randomized typed/spoken exam. Passing earns a rank (Bronze -> Emerald).

### Built-in Phrase Sets

The home page includes pre-loaded, read-only journals for all supported languages:

- **Beginner Phrases** — 13 essential phrases per language
- **Intermediate Phrases** — 10 conversational phrases per language

These cannot be edited or deleted. Complete their exams to track mastery and earn rankings.

---

## Supported Languages

| Language | Code | Transcription | Translation | Romanization |
|---|---|:---:|:---:|:---:|
| English | `en` | ✓ | ✓ | — |
| Spanish | `es` | ✓ | ✓ | — |
| French | `fr` | ✓ | ✓ | — |
| German | `de` | ✓ | ✓ | — |
| Chinese | `zh` | ✓ | ✓ | ✓ (Pinyin) |
| Japanese | `ja` | ✓ | ✓ | ✓ (Hepburn) |
| Korean | `ko` | ✓ | ✓ | ✓ (Academic) |

---

## Models Used

| Model | Source | Purpose |
|---|---|---|
| `openai/whisper-small` | Hugging Face | Speech-to-text transcription & language detection |
| `facebook/nllb-200-distilled-600M` | Hugging Face | Neural machine translation |
| CNN / SVM classifier | Trained locally | Short-text language detection |
| Allosaurus | PyPI | Audio → IPA phoneme recognition |
| Epitran | PyPI | Text → IPA (Spanish, French, German) |
| G2P-en | PyPI | Text → ARPAbet → IPA (English) |
| pykakasi | PyPI | Japanese kanji/kana → Hepburn romanization |
| pypinyin | PyPI | Chinese hanzi → Pinyin romanization |
| hangul-romanize | PyPI | Korean Hangul → academic romanization |
