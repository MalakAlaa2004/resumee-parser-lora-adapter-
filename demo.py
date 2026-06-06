"""
Resume Parser Demo — Local (Apple Silicon)
Loads Phi-3.5-mini-instruct + LoRA adapter and parses resumes to structured JSON.
"""
import json
import re
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

MODEL_NAME = "microsoft/Phi-3.5-mini-instruct"
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

SAMPLE_RESUME = """
John Smith
Software Engineer - Google

San Francisco, CA - john.smith@gmail.com

WORK EXPERIENCE

Senior Software Engineer
Google - Mountain View, CA
June 2019 to Present

Software Engineer
Amazon - Seattle, WA
January 2016 to May 2019

EDUCATION

Master of Science in Computer Science
Stanford University
2015

Bachelor of Science in Computer Engineering
UC Berkeley
2013

SKILLS

Python, Java, C++, Go, Kubernetes, Docker, TensorFlow, AWS, GCP, SQL, Git, REST APIs, Microservices, Machine Learning

ADDITIONAL INFORMATION

8 years of experience in software engineering
"""


def load_model():
    print("Loading model (this may take a few minutes on first run)...")
    # device = "mps" if torch.backends.mps.is_available() else "cpu"  # Apple Silicon only
    if torch.cuda.is_available():
        device = "cuda"        # NVIDIA GPU (Windows / Linux)
    elif torch.backends.mps.is_available():
        device = "mps"         # Apple Silicon GPU (macOS)
    else:
        device = "cpu"         # Fallback
    print(f"Using device: {device}")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    tokenizer.pad_token = tokenizer.eos_token

    base_model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        device_map=device,
    )

    model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
    model.eval()
    print("Model loaded!\n")
    return model, tokenizer


def parse_resume(model, tokenizer, resume_text):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_TEMPLATE.format(resume=resume_text)},
    ]
    input_text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=1536)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )
    generated = outputs[0][inputs['input_ids'].shape[1]:]
    response = tokenizer.decode(generated, skip_special_tokens=True)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]*\}', response)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return response


def main():
    model, tokenizer = load_model()

    # Run sample resume first
    print("=" * 60)
    print("SAMPLE RESUME DEMO")
    print("=" * 60)
    print("Parsing sample resume...")
    result = parse_resume(model, tokenizer, SAMPLE_RESUME)
    print(json.dumps(result, indent=2))

    # Interactive mode
    print("\n" + "=" * 60)
    print("INTERACTIVE MODE")
    print("=" * 60)
    print("Paste a resume, then press Enter twice to submit.")
    print("Type 'quit' to exit.\n")

    while True:
        lines = []
        try:
            while True:
                line = input()
                if line.strip().lower() == 'quit':
                    print("Bye!")
                    return
                lines.append(line)
                if len(lines) >= 2 and lines[-1] == '' and lines[-2] == '':
                    break
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            return

        resume_text = '\n'.join(lines).strip()
        if not resume_text:
            continue

        print("\nParsing...\n")
        result = parse_resume(model, tokenizer, resume_text)
        print(json.dumps(result, indent=2))
        print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()
