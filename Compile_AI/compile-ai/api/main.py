
"""
Compile AI - FastAPI Backend

Pipeline:
User Requirement
      ↓
NLP Analysis
      ↓
Tier 1 Trained Classifier
      ↓
Gemini Generative AI Consultant
      ↓
Benchmark
      ↓
Compliance
      ↓
Vendor Lock-in
      ↓
Translation
      ↓
Final Output
"""

import os
import time
import random
import threading
from contextlib import asynccontextmanager
import warnings
import joblib

# Suppress scikit-learn version mismatch warnings gracefully
try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except ImportError:
    pass

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from langdetect import detect

from fastapi.middleware.cors import CORSMiddleware

from dataset_utils import find_similar_examples
from benchmark import calculate_benchmark
from compliance import get_compliance_mapping
from lockin import calculate_lockin


# ============================================================
# AFC TOOL: DATASET SEARCH
# ============================================================

def search_dataset(query: str) -> str:
    """
    Searches the internal Compile AI dataset for relevant past enterprise blueprints,
    tech stacks, BRD objectives, functional requirements, and effort estimates.
    """
    try:
        examples = find_similar_examples(raw_input_text=query, limit=3)
        if not examples:
            return "No matching blueprint dataset records found."

        formatted_items = []
        for ex in examples:
            formatted_items.append(
                f"- Problem: {ex.get('problem_title')}\n"
                f"  Industry: {ex.get('industry')}, Size: {ex.get('company_size_tag')}\n"
                f"  Objectives: {ex.get('brd_objectives')}\n"
                f"  Functional Requirements: {ex.get('functional_requirements')}\n"
                f"  Architecture: {ex.get('hld_summary')}\n"
                f"  Tech Stack: {ex.get('tech_stack')}\n"
                f"  Cost Band: {ex.get('cost_band')}"
            )
        return "\n\n".join(formatted_items)
    except Exception as e:
        return f"Dataset search error: {str(e)}"


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv(
    dotenv_path=os.path.join(
        os.path.dirname(__file__),
        ".env"
    )
)

# Also fallback to root workspace .env if GEMINI_API_KEY not found
if not os.environ.get("GEMINI_API_KEY"):
    root_env = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
    )
    if os.path.exists(root_env):
        load_dotenv(dotenv_path=root_env)


# ============================================================
# STARTUP: WARM DATASET CACHE IN BACKGROUND
# ============================================================

def _warmup_cache():
    """
    Build TF-IDF index in a background thread so the first user
    request is not blocked by the 50-second cold-start.
    The server accepts requests immediately; the index is ready
    within ~60s of startup.
    """
    try:
        from dataset_utils import _ensure_cache
        print("[startup] Warming TF-IDF dataset cache in background...")
        _ensure_cache()
        print("[startup] TF-IDF cache warm-up complete.")
    except Exception as e:
        print(f"[startup] Cache warm-up failed (non-fatal): {e}")


@asynccontextmanager
async def lifespan(application):
    # Fire the warm-up in a daemon thread — does not block startup
    t = threading.Thread(target=_warmup_cache, daemon=True, name="dataset-warmup")
    t.start()
    yield  # app runs here
    # (cleanup on shutdown if needed)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Compile AI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODEL PATH
# ============================================================

MODEL_PATH = os.environ.get(
    "COMPILE_CLASSIFIER_PATH",
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "models",
        "tier1_classifier",
        "compile_field_classifier.joblib"
    )
)

_classifier_bundle = None


# ============================================================
# CLASSIFIER LOADER
# ============================================================

def get_classifier():

    global _classifier_bundle

    if _classifier_bundle is None:

        if not os.path.exists(MODEL_PATH):

            raise HTTPException(
                status_code=500,
                detail=f"Classifier not found at {MODEL_PATH}"
            )

        _classifier_bundle = joblib.load(
            MODEL_PATH
        )

    return _classifier_bundle


# ============================================================
# GEMINI CLIENT
# ============================================================

def get_gemini_client():

    api_key = os.environ.get(
        "GEMINI_API_KEY"
    )

    if not api_key:

        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not set"
        )

    return genai.Client(
        api_key=api_key
    )


# ============================================================
# GEMINI RETRY & RESILIENCE RUNNER
# ============================================================

def generate_with_retry(
    client,
    prompt: str,
    preferred_model: str = None,
    tools: list = None,
    max_retries: int = 3,
    system_instruction: str = None
):
    """
    Executes Gemini generation using the recommended client.chats.create pattern
    with exponential backoff + jitter for transient 503 / 429 quota spikes.

    If tools are provided (such as search_dataset), Gemini dynamically decides whether
    to invoke automatic function calling (AFC) to query the dataset or answer directly.
    """
    active_preferred = (preferred_model or os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")).strip()
    # Small, explicitly configured list of verified models: primary first, then verified fallback
    candidate_models = [active_preferred]
    if "gemini-3.5-flash" not in candidate_models:
        candidate_models.append("gemini-3.5-flash")

    last_error = None

    for model_name in candidate_models:
        for attempt in range(max_retries):
            try:
                # Use client.chats.create recommended pattern for AFC & robust execution
                config_kwargs = {}
                if tools:
                    config_kwargs["tools"] = tools
                if system_instruction:
                    config_kwargs["system_instruction"] = system_instruction

                config = types.GenerateContentConfig(**config_kwargs) if config_kwargs else None

                chat = client.chats.create(
                    model=model_name,
                    config=config
                )
                response = chat.send_message(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                err_str = str(e)
                last_error = e
                # Check for 503 / UNAVAILABLE / high demand / rate limit / 429
                is_transient = any(
                    code in err_str
                    for code in ["503", "UNAVAILABLE", "ResourceExhausted", "high demand", "429", "RESOURCE_EXHAUSTED", "temporarily unavailable"]
                )
                if is_transient and attempt < max_retries - 1:
                    # Exponential backoff with random jitter to prevent thundering-herd collisions
                    # attempt 0: ~2.2s - 2.8s, attempt 1: ~4.2s - 5.0s, attempt 2: ~8.2s - 9.2s
                    base_delay = 2.0
                    jitter = random.uniform(0.2, 0.9)
                    delay = (base_delay * (2 ** attempt)) + jitter
                    print(f"Gemini {model_name} transient 503/load spike: {err_str[:60]}... Retrying in {delay:.2f}s with jitter (attempt {attempt + 1}/{max_retries})...")
                    time.sleep(delay)
                    continue
                else:
                    # Model not available or retries exhausted for this candidate, try fallback
                    print(f"Gemini model {model_name} attempt failed: {err_str[:80]}. Checking configured fallback...")
                    break

    raise last_error or Exception("Gemini generation failed across all retry attempts and fallback models.")


# ============================================================
# LANGUAGE DETECTION
# ============================================================

def detect_language(text: str):

    try:

        return detect(text)

    except Exception:

        return "unknown"


# ============================================================
# /health
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "tier1_model": "loaded on request",
        "generative_ai": "Gemini"
    }


# ============================================================
# /classify
# TIER 1 CLASSIFICATION
# ============================================================

class ClassifyRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1
    )


class ClassifyResponse(BaseModel):

    industry: str

    company_size_tag: str

    problem_title: str

    budget_band: str

    cost_band: str


@app.post(
    "/classify",
    response_model=ClassifyResponse
)
def classify(req: ClassifyRequest):

    models = get_classifier()

    output = {}

    for field, model_data in models.items():

        vectorizer = model_data["vectorizer"]

        classifier = model_data["classifier"]

        vector = vectorizer.transform(
            [req.text]
        )

        prediction = classifier.predict(
            vector
        )[0]

        output[field] = str(
            prediction
        )

    return output


# ============================================================
# /translate
# GEMINI TRANSLATION
# ============================================================

class TranslateRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1
    )

    target_lang: str = Field(
        ...,
        description="Example: English, Hindi, Gujarati, Spanish"
    )


class TranslateResponse(BaseModel):

    translated_text: str

    detected_source_lang: str | None = None


@app.post(
    "/translate",
    response_model=TranslateResponse
)
def translate(req: TranslateRequest):

    client = get_gemini_client()

    prompt = f"""
Translate the following text into {req.target_lang}.

Rules:
- Return ONLY the translated text.
- Do not explain anything.
- Do not add notes.

Text:
{req.text}
"""

    try:
        translated_text = generate_with_retry(
            client=client,
            prompt=prompt,
            preferred_model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
            max_retries=3
        )
        return TranslateResponse(translated_text=translated_text)
    except Exception as e:
        print("Translate Gemini call failed after retries:", e)
        return TranslateResponse(translated_text=req.text)


# ============================================================
# /consultant/discover
# GEMINI DISCOVERY QUESTIONS
# ============================================================

class DiscoverRequest(BaseModel):

    raw_input_text: str = Field(
        ...,
        min_length=1
    )

    user_language: str = "English"


class DiscoverResponse(BaseModel):

    questions: list[str]


@app.post(
    "/consultant/discover",
    response_model=DiscoverResponse
)
def discover(req: DiscoverRequest):

    client = get_gemini_client()

    prompt = f"""
You are a business requirements consultant.

Read the client's requirement below.

Generate 3 to 7 useful clarifying questions.

Focus ONLY on information that is genuinely missing, such as:
- stakeholders
- number of users
- scale
- timeline
- budget
- technical constraints
- existing systems
- security requirements

Do NOT ask questions whose answers are already clearly present.

Write the questions in {req.user_language}.

Return ONLY the questions, one question per line.
Do not number them.

Client requirement:
{req.raw_input_text}
"""

    raw_text = None
    try:
        raw_text = generate_with_retry(
            client=client,
            prompt=prompt,
            preferred_model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
            max_retries=3
        )
    except Exception as e:
        print("Discover Gemini call failed after retries:", e)

    if not raw_text:
        return DiscoverResponse(
            questions=[
                "What key stakeholders and user roles will interact with this system daily?",
                "What legacy databases, spreadsheets, or ERP tools must this solution integrate with?",
                "What specific compliance, privacy, or security regulations apply to your organization?",
                "What is your target rollout timeline and allocated budget for this initiative?",
                "What measurable operational metrics define success for this project in 90 days?"
            ]
        )

    questions = []

    for line in response.text.splitlines():

        line = line.strip()

        if not line:
            continue

        line = line.lstrip(
            "-•0123456789. )"
        ).strip()

        if line:

            questions.append(
                line
            )

    return DiscoverResponse(
        questions=questions
    )


# ============================================================
# /consultant/generate
# GEMINI BRD / ARCHITECTURE / ESTIMATION
# ============================================================

class GenerateRequest(BaseModel):

    raw_input_text: str = Field(
        ...,
        min_length=1
    )

    discovery_answers: dict[str, str] = {}

    section: str = Field(
        default="all",
        description=(
            "gap_analysis | brd | architecture | estimate | all"
        )
    )

    user_language: str = "English"


class GenerateResponse(BaseModel):

    section: str

    content: str


SECTION_PROMPTS = {

    "gap_analysis":
        """
Write a current-state vs desired-state gap analysis
for this business.

Give 3 to 5 clear sentences.
""",

    "brd":
        """
Write a structured Business Requirement Document.

Include:
- Objectives
- Scope
- Stakeholders
- Functional requirements
- Non-functional requirements
- Assumptions
- Constraints
""",

    "architecture":
        """
Recommend a High-Level Design.

Include:
- Major components
- System integrations
- Data flow
- Frontend technology
- Backend technology
- Database
- Hosting
- Security considerations

Give a short reason for each technology choice.
""",

    "estimate":
        """
Produce a detailed, requirement-driven project effort and cost estimate.

IMPORTANT: Do NOT use generic or placeholder numbers.
Derive all estimates from the actual business requirement provided.
Consider: number of modules, integration complexity, compliance burden,
team size implied, and any timeline constraints mentioned.

Structure your response EXACTLY as follows (keep the section headers):

## Phase Breakdown

| Phase | Weeks | % of Project |
|---|---|---|
| Discovery & Requirements | [N] | [%] |
| Architecture & UX Design | [N] | [%] |
| Core Build & Integration | [N] | [%] |
| Testing, QA & Compliance | [N] | [%] |
| Deployment & Pilot Launch | [N] | [%] |

**Total Timeline**: [N] Weeks

## Cost Band

- **Minimum MVP (Low)**: $[amount] — lean scope, single-region, minimal third-party integrations
- **Recommended Baseline (Mid)**: $[amount] — full feature set, standard compliance, one integration layer
- **Enterprise High-Resilience (High)**: $[amount] — multi-region, 24×7 SLA, enterprise SSO, full audit trail

## Assumptions & Drivers

- Team composition assumed: [list specific roles]
- Key cost drivers: [list 3–5 specific factors from this requirement]
- Delivery model: [Agile / Fixed-scope / etc.]
- [Any critical assumptions about scope, budget, or timeline stated in the requirement]

## Risk Factors

- [2–3 specific risks that could increase cost or timeline for this type of project]
"""
}


@app.post(
    "/consultant/generate",
    response_model=list[GenerateResponse]
)
def generate(req: GenerateRequest):

    client = get_gemini_client()

    if (
        req.section != "all"
        and req.section not in SECTION_PROMPTS
    ):

        raise HTTPException(
            status_code=400,
            detail=f"Unknown section: {req.section}"
        )

    if req.section == "all":

        sections = list(
            SECTION_PROMPTS.keys()
        )

    else:

        sections = [
            req.section
        ]

    context = req.raw_input_text

    if req.discovery_answers:

        context += (
            "\n\nAdditional information from discovery:\n"
        )

        for question, answer in req.discovery_answers.items():

            context += (
                f"- Question: {question}\n"
                f"  Answer: {answer}\n"
            )

    results = []

    for section in sections:

        prompt = f"""
You are Compile AI, an AI business consultant.

{SECTION_PROMPTS[section]}

Important:
- Be specific and practical.
- Do not invent facts that were not provided.
- Clearly state assumptions where necessary.
- The result is advisory and editable.
- Write the response in {req.user_language}.
- You can use the search_dataset tool to lookup relevant architecture blueprints, tech stacks, and benchmarks from the dataset whenever needed.

Business context:
{context}
"""

        section_text = None
        try:
            section_text = generate_with_retry(
                client=client,
                prompt=prompt,
                preferred_model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
                tools=[search_dataset],
                max_retries=3
            )
        except Exception as e:
            print(f"Gemini generation for '{section}' failed after retries: {e}. Generating fallback from dataset & classifier.")

        if not section_text:
            classified = classify(ClassifyRequest(text=req.raw_input_text))
            ind = classified.get("industry", "Technology")
            prob = classified.get("problem_title", "Process Automation")
            size = classified.get("company_size_tag", "SME")
            cost = classified.get("cost_band", "Mid")
            # Derive a session title from the actual input text (first 60 chars, first line)
            raw_first_line = (req.raw_input_text or "").strip().split('\n')[0][:80].strip()
            session_title = raw_first_line if raw_first_line else prob

            if section == "gap_analysis":
                section_text = (
                    f"### Current State vs Desired State Gap Analysis\n"
                    f"*Note: AI generation was unavailable — this is a structured fallback. Please Regenerate Section for AI analysis.*\n\n"
                    f"- **Current State**: Manual processing and legacy tool bottlenecks in the {ind} domain, specifically around: {session_title}.\n"
                    f"- **Desired State**: A unified digital platform with automated workflows, real-time status dashboards, and integrated security controls.\n"
                    f"- **Operational Impact**: High reduction in processing delays and human error rates."
                )
            elif section == "brd":
                section_text = (
                    f"# Business Requirement Document — {session_title}\n\n"
                    f"> ⚠️ AI generation was unavailable. This is a structured fallback. Click **Regenerate Section** for a full AI-generated BRD.\n\n"
                    f"## 1. Executive Objectives\n"
                    f"Automate and digitise the core workflows for **{session_title}** — a {size} organisation in the {ind} domain.\n\n"
                    f"## 2. Scope\n"
                    f"- **In-Scope**: Intake automation, status tracking, role-based access, and legacy integration.\n"
                    f"- **Out-of-Scope**: Physical infrastructure overhaul.\n\n"
                    f"## 3. Functional Requirements\n"
                    f"- **FR-1.1**: Unified data ingestion and schema normalisation.\n"
                    f"- **FR-1.2**: Automated threshold and approval processing engine.\n"
                    f"- **FR-1.3**: Operational dashboards for key departmental leads.\n\n"
                    f"## 4. Non-Functional Requirements\n"
                    f"- **NFR-2.1**: 99.5% uptime SLA target.\n"
                    f"- **NFR-2.2**: Encrypted data storage (AES-256) and TLS 1.3 in transit."
                )
            elif section == "architecture":
                section_text = (
                    f"# Solution Architecture — {session_title}\n\n"
                    f"> ⚠️ AI generation was unavailable. This is a structured fallback. Click **Regenerate Section** for a full AI-generated HLD.\n\n"
                    f"## Recommended Technology Stack\n"
                    f"- **Frontend**: React + Vite (Reactive component workspace)\n"
                    f"- **Backend API**: Node.js / Express + Python FastAPI engine\n"
                    f"- **Database**: Relational Database (MySQL 8.0 / PostgreSQL 16)\n"
                    f"- **Cloud Infrastructure**: Containerised Microservices on AWS / Azure / GCP\n\n"
                    f"## Security & Compliance\n"
                    f"Role-based access control (RBAC), audit trail logging, and HTTPS encrypted transit."
                )
            elif section == "estimate":
                # Use classifier cost_band to derive rough ranges for the fallback
                cost_lower = cost.lower() if cost else "mid"
                if "low" in cost_lower:
                    low_r, mid_r, high_r = "$15K", "$35K", "$65K"
                    weeks_build = 4
                elif "high" in cost_lower or "enterprise" in cost_lower:
                    low_r, mid_r, high_r = "$120K", "$250K", "$500K"
                    weeks_build = 14
                else:  # Mid
                    low_r, mid_r, high_r = "$35K", "$85K", "$180K"
                    weeks_build = 8

                section_text = (
                    f"# Project Effort & Cost Estimate — {session_title}\n\n"
                    f"> ⚠️ AI generation was unavailable. This is a classifier-derived fallback. Click **Regenerate Section** for a full AI-generated estimate tailored to your exact requirements.\n\n"
                    f"## Phase Breakdown\n\n"
                    f"| Phase | Weeks | % of Project |\n"
                    f"|---|---|---|\n"
                    f"| Discovery & Requirements | 2 | {round(2/(weeks_build+8)*100)}% |\n"
                    f"| Architecture & UX Design | 2 | {round(2/(weeks_build+8)*100)}% |\n"
                    f"| Core Build & Integration | {weeks_build} | {round(weeks_build/(weeks_build+8)*100)}% |\n"
                    f"| Testing, QA & Compliance | 2 | {round(2/(weeks_build+8)*100)}% |\n"
                    f"| Deployment & Pilot Launch | 2 | {round(2/(weeks_build+8)*100)}% |\n\n"
                    f"**Total Timeline**: {weeks_build + 8} Weeks\n\n"
                    f"## Cost Band (Classifier-derived — {ind})\n\n"
                    f"- **Minimum MVP (Low)**: {low_r}\n"
                    f"- **Recommended Baseline (Mid)**: {mid_r}\n"
                    f"- **Enterprise High-Resilience (High)**: {high_r}\n\n"
                    f"## Assumptions\n\n"
                    f"- Cost band based on AI classifier output: **{cost}** for {ind} industry\n"
                    f"- Click **Regenerate Section** for requirement-specific person-week and cost breakdown"
                )
            else:
                section_text = f"Compiled Analysis for {session_title} — {section} ({ind})."

        results.append(
            GenerateResponse(
                section=section,
                content=section_text
            )
        )

    return results


# ============================================================
# /nlp/analyze
# SIMPLE NLP + TIER 1 COMBINATION
# ============================================================

class NLPAnalyzeRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1
    )


class NLPAnalyzeResponse(BaseModel):

    text: str

    language: str

    word_count: int

    character_count: int

    sentences: int

    classification: dict


@app.post(
    "/nlp/analyze",
    response_model=NLPAnalyzeResponse
)
def nlp_analyze(req: NLPAnalyzeRequest):

    text = req.text.strip()

    language = detect_language(
        text
    )

    word_count = len(
        text.split()
    )

    character_count = len(
        text
    )

    sentences = sum(
        text.count(symbol)
        for symbol in [
            ".",
            "!",
            "?"
        ]
    )

    if sentences == 0:

        sentences = 1

    classification = classify(
        ClassifyRequest(
            text=text
        )
    )

    return NLPAnalyzeResponse(

        text=text,

        language=language,

        word_count=word_count,

        character_count=character_count,

        sentences=sentences,

        classification=classification
    )


# ============================================================
# /benchmark
# PROJECT BENCHMARK
# ============================================================

class BenchmarkRequest(BaseModel):

    industry: str = Field(
        ...,
        min_length=1
    )

    company_size_tag: str = Field(
        default=""
    )

    budget: float | None = None

    timeline_weeks: float | None = None


@app.post("/benchmark")
def benchmark(req: BenchmarkRequest):

    result = calculate_benchmark(

        industry=req.industry,

        company_size_tag=(
            req.company_size_tag
            or None
        ),

        budget=req.budget,

        timeline_weeks=req.timeline_weeks
    )

    return result


# ============================================================
# /compliance
# COMPLIANCE MAPPING
# ============================================================

class ComplianceRequest(BaseModel):

    industry: str = Field(
        ...,
        min_length=1
    )


@app.post("/compliance")
def compliance(req: ComplianceRequest):

    result = get_compliance_mapping(
        industry=req.industry
    )

    return result


# ============================================================
# /lock-in
# VENDOR LOCK-IN ANALYSIS
# ============================================================

class LockInRequest(BaseModel):

    tech_stack: str = Field(
        ...,
        min_length=1
    )


@app.post("/lock-in")
def lock_in(req: LockInRequest):

    result = calculate_lockin(
        tech_stack=req.tech_stack
    )

    return result


# ============================================================
# /compile
# FINAL END-TO-END COMPILE AI PIPELINE
# ============================================================

class CompileRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1
    )

    language: str = "English"

    industry: str = ""

    company_size_tag: str = ""

    budget: float | None = None

    timeline_weeks: float | None = None

    tech_stack: str = ""


class CompileResponse(BaseModel):

    input_text: str

    nlp_analysis: dict

    classification: dict

    consultant_output: list[dict]

    benchmark: dict

    compliance: dict

    lockin: dict


@app.post(
    "/compile",
    response_model=CompileResponse
)
def compile_requirement(req: CompileRequest):

    # ========================================================
    # STEP 1: NLP + TRAINED CLASSIFIER
    # ========================================================

    nlp_result = nlp_analyze(
        NLPAnalyzeRequest(
            text=req.text
        )
    )

    classification = nlp_result.classification


    # ========================================================
    # STEP 2: DETERMINE INDUSTRY
    # ========================================================

    industry = req.industry.strip()

    if not industry:

        classification_industry = classification.get(
            "industry"
        )

        if classification_industry:

            industry = str(
                classification_industry
            )


    if not industry:

        text_lower = req.text.lower()

        if any(
            word in text_lower
            for word in [
                "student",
                "students",
                "school",
                "college",
                "university",
                "education",
                "attendance",
                "assignment",
                "teacher",
                "exam"
            ]
        ):

            industry = "Education"

        elif any(
            word in text_lower
            for word in [
                "hospital",
                "doctor",
                "patient",
                "medical",
                "healthcare",
                "clinic"
            ]
        ):

            industry = "Healthcare"

        elif any(
            word in text_lower
            for word in [
                "bank",
                "banking",
                "loan",
                "finance",
                "payment"
            ]
        ):

            industry = "Banking & Finance"

        elif any(
            word in text_lower
            for word in [
                "retail",
                "shop",
                "store",
                "inventory"
            ]
        ):

            industry = "Retail"

        else:

            industry = "General"


    # ========================================================
    # STEP 3: GEMINI CONSULTANT
    # ========================================================

    try:

        client = get_gemini_client()

        prompt = f"""
You are Compile AI, an AI business consultant.

Analyze the following software/business requirement.

Requirement:
{req.text}

Industry:
{industry}

Write a concise but useful response containing these four sections:

1. GAP ANALYSIS
Explain the current problem and desired state.

2. BUSINESS REQUIREMENTS
List the main objectives, stakeholders, functional requirements,
non-functional requirements, assumptions and constraints.

3. HIGH-LEVEL ARCHITECTURE
Suggest the frontend, backend, database, major components,
data flow and security considerations.

4. PROJECT ESTIMATE
Give a rough development estimate by phase:
discovery, design, development, testing and deployment.

Also mention assumptions.

Write the response in {req.language}.

Be specific to the requirement.
Do not invent information that is not provided.
Clearly label assumptions.
You can use the search_dataset tool to lookup relevant architecture blueprints, tech stacks, and benchmarks from the dataset whenever needed.
"""

        consultant_content = generate_with_retry(
            client=client,
            prompt=prompt,
            preferred_model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
            tools=[search_dataset],
            max_retries=3
        )

    except Exception as e:

        consultant_content = (
            "AI Consultant temporarily unavailable. "
            "NLP analysis and trained Tier 1 classification "
            "were completed successfully. "
            f"Temporary AI service error: {type(e).__name__}"
        )


    # ========================================================
    # STEP 4: BENCHMARK
    # ========================================================

    benchmark_result = calculate_benchmark(

        industry=industry,

        company_size_tag=(
            req.company_size_tag
            if req.company_size_tag
            else None
        ),

        budget=req.budget,

        timeline_weeks=req.timeline_weeks
    )


    # ========================================================
    # STEP 5: COMPLIANCE
    # ========================================================

    compliance_result = get_compliance_mapping(
        industry=industry
    )


    # ========================================================
    # STEP 6: VENDOR LOCK-IN
    # ========================================================

    lockin_result = calculate_lockin(

        tech_stack=(
            req.tech_stack
            if req.tech_stack
            else ""
        )
    )


    # ========================================================
    # STEP 7: FINAL COMBINED RESPONSE
    # ========================================================

    return CompileResponse(

        input_text=req.text,

        nlp_analysis={

            "language": nlp_result.language,

            "word_count": nlp_result.word_count,

            "character_count": nlp_result.character_count,

            "sentences": nlp_result.sentences,

            "industry": industry
        },

        classification=classification,

        consultant_output=[

            {
                "section": "ai_consultant",

                "content": consultant_content
            }
        ],

        benchmark=benchmark_result,

        compliance=compliance_result,

        lockin=lockin_result
    )

