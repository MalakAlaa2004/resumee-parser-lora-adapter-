"""
ResumeParser NLU — Local Backend Server
Loads Phi-3.5-mini-instruct + LoRA adapter once, then serves
POST /parse  { "resume": "<text>" }  →  { "result": {...} }
"""
import json
import re
import sys
import threading
import webbrowser

import torch
# Patch for older PyTorch versions that crash with newer PEFT when checking float8
if not hasattr(torch, "float8_e8m0fnu"):
    torch.float8_e8m0fnu = None

from flask import Flask, jsonify, request
from flask_cors import CORS
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

# ── Config ──────────────────────────────────────────────────────────
MODEL_NAME   = "microsoft/Phi-3.5-mini-instruct"
ADAPTER_PATH = "./resume_parser_lora_adapter"

SYSTEM_PROMPT = (
    "You are an expert resume parser. Extract structured information "
    "from the given resume text and return it as a JSON object."
)

USER_TEMPLATE = (
    'Extract the following entities from this resume and return them as a '
    'JSON object with these keys: "Name", "Email Address", "Location", '
    '"Companies worked at", "Designation", "Degree", "College Name", '
    '"Graduation Year", "Skills", "Years of Experience".\n\n'
    'For fields with multiple values, use a list. '
    'For fields not found in the resume, use null.\n\n'
    'Resume:\n---\n{resume}\n---'
)

# ── Flask app ────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # allow file:// origin from the HTML GUI

# ── Global model state ───────────────────────────────────────────────
_model     = None
_tokenizer = None
_device    = None
_ready     = False
_load_error = None


def _detect_device():
    if torch.cuda.is_available():
        return "cuda"
    elif torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model():
    global _model, _tokenizer, _device, _ready, _load_error
    try:
        _device = _detect_device()
        print(f"[server] Using device: {_device}")
        print("[server] Loading tokenizer…")
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _tokenizer.pad_token = _tokenizer.eos_token

        print("[server] Loading base model…")
        _model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,
            device_map=_device,
            low_cpu_mem_usage=True,
        )
        print("[server] Loading LoRA adapter…")
        _model = PeftModel.from_pretrained(_model, ADAPTER_PATH)
        _model.eval()
        _ready = True
        print("[server] ✓ Model ready!")
    except Exception as e:
        _load_error = str(e)
        print(f"[server] ✗ Model load failed: {e}", file=sys.stderr)


# ── Routes ───────────────────────────────────────────────────────────
@app.route("/status")
def status():
    return jsonify({
        "ready":  _ready,
        "device": _device,
        "error":  _load_error,
    })


@app.route("/parse", methods=["POST"])
def parse():
    if not _ready:
        err = _load_error or "Model is still loading, please wait…"
        return jsonify({"error": err}), 503

    body = request.get_json(force=True, silent=True) or {}
    resume_text = (body.get("resume") or "").strip()
    if not resume_text:
        return jsonify({"error": "No resume text provided."}), 400

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": USER_TEMPLATE.format(resume=resume_text)},
    ]
    input_text = _tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = _tokenizer(
        input_text, return_tensors="pt", truncation=True, max_length=1536
    )
    inputs = {k: v.to(_model.device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=512,
            do_sample=False,
            pad_token_id=_tokenizer.eos_token_id,
        )

    generated = outputs[0][inputs["input_ids"].shape[1]:]
    response  = _tokenizer.decode(generated, skip_special_tokens=True)

    # Try to extract JSON from the response
    parsed = None
    try:
        parsed = json.loads(response)
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]*\}', response)
        if match:
            try:
                parsed = json.loads(match.group())
            except json.JSONDecodeError:
                pass

    if parsed is None:
        # Return raw text so the GUI can still display something
        return jsonify({"error": "Could not parse JSON from model output.", "raw": response}), 422

    return jsonify({"result": parsed, "device": _device})


# ── Entry point ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  ResumeParser NLU — Local Backend")
    print("=" * 55)

    # Load model in background so Flask starts immediately
    t = threading.Thread(target=load_model, daemon=True)
    t.start()

    # Open the GUI after a short delay
    def open_gui():
        import time, pathlib, urllib.request
        time.sleep(1.5)
        html = pathlib.Path(__file__).parent / "app.html"
        webbrowser.open(html.as_uri())
    threading.Thread(target=open_gui, daemon=True).start()

    print("[server] Starting on http://localhost:5000")
    print("[server] GUI will open automatically in your browser.")
    print("[server] Press Ctrl+C to stop.\n")
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
