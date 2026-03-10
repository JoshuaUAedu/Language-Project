# py/transcribe.py
from transformers import pipeline, WhisperProcessor, WhisperForConditionalGeneration
import torch
import librosa

# Device setup
device = 0 if torch.cuda.is_available() else -1

# Language mapping (auto-detect output codes → full names)
WH_MAP = {
    'en': 'English',
    'es': 'Spanish',
    'ja': 'Japanese',
    'ch': 'Chinese',
    'ko': 'Korean',
    'de': 'German',
    'fr': 'French'
}

# ISO 639-1 codes sent by the website → full names (used when language is forced)
ISO_NAME_MAP = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
}

# --- Load models once ---
def load_transcription_model():
    whis_sm = 'openai/whisper-small'

    # ASR pipeline (optional, can remove if you only use WhisperForConditionalGeneration)
    asr = pipeline(
        'automatic-speech-recognition',
        model=whis_sm,
        device=device,
        generate_kwargs={'task': 'transcribe'}
    )

    # Direct model + processor for more control
    processor = WhisperProcessor.from_pretrained(whis_sm)
    whisper = WhisperForConditionalGeneration.from_pretrained(whis_sm).to(device)
    whisper.eval()

    # Return everything needed for inference
    return {
        "processor": processor,
        "whisper": whisper,
        "asr": asr
    }

# --- Transcription function ---
def transcription(audio_path, model_objects, forced_lang=None):
    """
    audio_path : str
        Path to audio file
    model_objects : dict
        dict returned from load_transcription_model()
    forced_lang : str or None
        ISO 639-1 code (e.g. 'en', 'zh') to force Whisper into that language.
        When None, Whisper auto-detects the spoken language.
    """

    processor = model_objects["processor"]
    whisper = model_objects["whisper"]

    # Load audio
    recording, sr = librosa.load(audio_path, sr=16000)
    inputs = processor(recording, sampling_rate=sr, return_tensors='pt')

    input_features = inputs['input_features'].to(device)

    with torch.no_grad():
        if forced_lang:
            # Use the language selected on the left page — higher confidence
            lang_code = forced_lang
            ln = ISO_NAME_MAP.get(forced_lang, 'Unknown')
        else:
            # Auto-detect spoken language
            lang_prob = whisper.detect_language(input_features)
            lang_token = lang_prob.item()
            lang_code = processor.tokenizer.convert_ids_to_tokens(lang_token)
            lang_code = lang_code.replace('<|', '').replace('|>', '')
            ln = WH_MAP.get(lang_code, 'Unknown')

        forced_decoder_ids = processor.get_decoder_prompt_ids(
            language=lang_code,
            task='transcribe'
        )

        generated_ids = whisper.generate(
            input_features,
            forced_decoder_ids=forced_decoder_ids,
            repetition_penalty=1.1,
            no_repeat_ngram_size=3
        )

        transcript = processor.batch_decode(
            generated_ids,
            skip_special_tokens=True
        )[0]

    return transcript, ln