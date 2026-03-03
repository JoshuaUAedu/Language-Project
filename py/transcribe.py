# py/transcribe.py
from transformers import pipeline, WhisperProcessor, WhisperForConditionalGeneration
import torch
import librosa

# Device setup
device = 0 if torch.cuda.is_available() else -1

# Language mapping
WH_MAP = {
    'en': 'English',
    'es': 'Spanish',
    'ja': 'Japanese',
    'ch': 'Chinese',
    'ko': 'Korean',
    'de': 'German',
    'fr': 'French'
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
def transcription(audio_path, model_objects):
    """
    audio_path : str
        Path to audio file
    model_objects : dict
        dict returned from load_transcription_model()
    """

    processor = model_objects["processor"]
    whisper = model_objects["whisper"]

    # Load audio
    recording, sr = librosa.load(audio_path, sr=16000)
    inputs = processor(recording, sampling_rate=sr, return_tensors='pt')

    input_features = inputs['input_features'].to(device)

    # Detect language
    with torch.no_grad():
        lang_prob = whisper.detect_language(input_features)
        lang_token = lang_prob.item()

        detected_lang = processor.tokenizer.convert_ids_to_tokens(lang_token)
        detected_lang = detected_lang.replace('<|', '').replace('|>', '')

        # Force language into decoder
        forced_decoder_ids = processor.get_decoder_prompt_ids(
            language=detected_lang,
            task='transcribe'
        )

        generated_ids = whisper.generate(
            input_features,
            forced_decoder_ids=forced_decoder_ids,
            repetition_penalty=1.1,
            no_repeat_ngram_size=3  # optional
        )

        transcript = processor.batch_decode(
            generated_ids,
            skip_special_tokens=True
        )[0]

        # Map language
        ln = WH_MAP.get(detected_lang, "Unknown")

    return transcript, ln