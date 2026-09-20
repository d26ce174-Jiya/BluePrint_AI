"""
Compile - API layer.
Wires together: Tier 1 classifier (instant field tagging), Claude API
(translation + the actual consultant reasoning - discovery questions, BRD,
architecture, estimation), matching the System Blueprint's AI Reasoning
Layer and Ingestion Layer.

RUN:
    pip install -r requirements_api.txt
    export ANTHROPIC_API_KEY=your_key_here      (Mac/Linux)
    $env:ANTHROPIC_API_KEY="your_key_here"       (Windows PowerShell)
    uvicorn main:app --reload --port 8000

Then open http://127.0.0.1:8000/docs for interactive API testing (FastAPI
auto-generates this - no frontend needed to test).

NOTE: I could not test the /translate or /consultant/* endpoints end-to-end
in the sandbox that wrote this file - it has no internet access, so it can't
reach the Anthropic API. The /classify endpoint IS tested (it only needs the
local .joblib file). Test the Claude-backed endpoints on your machine where
you have a real API key and internet.
"""
import os 
import joblib

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from google import genai

app = FastAPI(title="Compile AI API", version="0.1.0")

MODEL_PATH = os.environ.get("COMPILE_CLASSIFIER_PATH", "models/tier1_classifier/compile_field_classifier.joblib")
_classifier_bundle = None  # lazy-loaded on first request

def get_classifier():
    global _classifier_bundle
    if _classifier_bundle is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=500, detail=f"Classifier not found at {MODEL_PATH}")
        _classifier_bundle = joblib.load(MODEL_PATH)
    return _classifier_bundle

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")
    return genai.Client(api_key=api_key)


# ---------- /classify : Tier 1, instant, no LLM call ----------

class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=1)

class ClassifyResponse(BaseModel):
    industry: str
    company_size_tag: str
    problem_title: str
    budget_band: str
    cost_band: str

@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    models = get_classifier()
    out = {}
    for field, m in models.items():
        vec = m["vectorizer"].transform([req.text])
        out[field] = m["classifier"].predict(vec)[0]
    return out


# ---------- /translate : both directions, via Claude ----------

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_lang: str = Field(..., description="e.g. 'English', 'Hindi', 'Spanish'")

class TranslateResponse(BaseModel):
    translated_text: str
    detected_source_lang: str | None = None

@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    client = get_gemini_client()

    prompt = (
        f"Translate the following text into {req.target_lang}. "
        f"Reply with ONLY the translation, nothing else.\n\n"
        f"Text:\n{req.text}"
    )

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    translated = response.text.strip()

    return TranslateResponse(
        translated_text=translated
    )


# ---------- /consultant/discover : clarifying questions (FR-2.2) ----------

class DiscoverRequest(BaseModel):
    raw_input_text: str
    user_language: str = "English"

class DiscoverResponse(BaseModel):
    questions: list[str]

@app.post("/consultant/generate", response_model=list[GenerateResponse])
def generate(req: GenerateRequest):
    client = get_gemini_client()

    sections = SECTION_PROMPTS.keys() if req.section == "all" else [req.section]

    if req.section != "all" and req.section not in SECTION_PROMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown section: {req.section}"
        )

    context = req.raw_input_text

    if req.discovery_answers:
        context += "\n\nAdditional context from discovery:\n" + "\n".join(
            f"- {q}: {a}" for q, a in req.discovery_answers.items()
        )

    results = []

    for section in sections:
        prompt = (
            f"{SECTION_PROMPTS[section]}\n\n"
            f"Write the response in {req.user_language}. "
            f"Label all outputs as advisory/editable. "
            f"Be specific and concrete, not generic.\n\n"
            f"Business context:\n{context}"
        )

        resp = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )

        content = resp.text.strip()

        results.append(
            GenerateResponse(
                section=section,
                content=content
            )
        )

    return results


# ---------- /consultant/generate : BRD + architecture (FR-3, FR-4, FR-5) ----------

class GenerateRequest(BaseModel):
    raw_input_text: str
    discovery_answers: dict[str, str] = {}
    section: str = Field(
        default="all",
        description="'gap_analysis' | 'brd' | 'architecture' | 'estimate' | 'all'"
    )
    user_language: str = "English"

class GenerateResponse(BaseModel):
    section: str
    content: str

SECTION_PROMPTS = {
    "gap_analysis": "Write a current-state vs desired-state gap analysis for this business, "
                     "in 3-5 sentences.",
    "brd": "Write a structured Business Requirement Document: objectives, scope, stakeholders, "
           "functional requirements, non-functional requirements, assumptions, constraints.",
    "architecture": "Recommend a High-Level Design: major components, integrations, data flow, "
                     "a technology stack (frontend/backend/DB/hosting) with a one-line rationale "
                     "per choice, and relevant security/compliance considerations.",
    "estimate": "Produce a first-pass effort estimate (person-weeks by phase: discovery, design, "
                 "build, test, deploy) and a rough cost band (low/mid/high) with assumptions stated.",
}

@app.post("/consultant/generate", response_model=list[GenerateResponse])
def generate(req: GenerateRequest):
    client = get_claude_client()
    sections = SECTION_PROMPTS.keys() if req.section == "all" else [req.section]
    if req.section != "all" and req.section not in SECTION_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown section: {req.section}")

    context = req.raw_input_text
    if req.discovery_answers:
        context += "\n\nAdditional context from discovery:\n" + "\n".join(
            f"- {q}: {a}" for q, a in req.discovery_answers.items()
        )

    results = []
    for section in sections:
        prompt = (
            f"{SECTION_PROMPTS[section]}\n\nWrite the response in {req.user_language}. "
            f"Label all outputs as advisory/editable. Be specific and concrete, not generic.\n\n"
            f"Business context:\n{context}"
        )
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        content = "".join(b.text for b in resp.content if b.type == "text").strip()
        results.append(GenerateResponse(section=section, content=content))
    return results


@app.get("/health")
def health():
    return {"status": "ok"}
