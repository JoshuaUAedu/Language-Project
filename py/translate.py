# py/translate.py
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Device setup
device = 0 if torch.cuda.is_available() else -1

# Language mapping
LANG_NNLB_MAP = {
    'English': 'eng_Latn',
    'Spanish': 'spa_Latn',
    'Japanese': 'jpn_Jpan',
    'German': 'deu_Latn',
    'French': 'fra_Latn',
    'Korean': 'kor_Hang',
    'Chinese': 'zho_Hans'
}

# --- Load model once ---
def load_translate_model():
    translation_model_name = 'facebook/nllb-200-distilled-600M'
    tokenizer = AutoTokenizer.from_pretrained(translation_model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(translation_model_name).to(device)
    model.eval()

    return {
        "model": model,
        "tokenizer": tokenizer
    }

# --- Translation function ---
def translate(text, src_lang, target_lang, model_objects):
    """
    text : str
        Text to translate
    src_lang : str
        Source language 
    target_lang : str
        Target language
    model_objects : dict
        Dictionary returned from load_translate_model()
    """

    tokenizer = model_objects["tokenizer"]
    model = model_objects["model"]

    src_code = LANG_NNLB_MAP[src_lang]
    target_code = LANG_NNLB_MAP[target_lang]

    tokenizer.src_lang = src_code

    inputs = tokenizer(
        text,
        return_tensors='pt',
        truncation=True,
        max_length=256
    ).to(device)

    forced_bos_token_id = tokenizer.convert_tokens_to_ids(target_code)

    outputs = model.generate(
        **inputs,
        forced_bos_token_id=forced_bos_token_id,
        max_length=128,
        num_beams=8,
        length_penalty=1.0,
        repetition_penalty=1.1,
        no_repeat_ngram_size=3,
        return_dict_in_generate=True,
        output_scores=True,
    )

    translation = tokenizer.decode(outputs.sequences[0], skip_special_tokens=True)
    try:
        confidence = float(torch.exp(outputs.sequences_scores[0]).clamp(0.0, 1.0))
    except Exception:
        confidence = None
    return translation, confidence