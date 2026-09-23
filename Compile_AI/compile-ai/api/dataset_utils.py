"""
dataset_utils.py — Compile AI Retrieval Engine

Architecture:
  Application startup
      ↓
  Load 105,500-row dataset once
      ↓
  Build TF-IDF matrix once (cached globally)
      ↓
  Every search request
      ↓
  Transform query vector only (fast)
      ↓
  Cosine similarity against cached matrix
      ↓
  Top-K results returned to Gemini AFC

Key improvements:
  - TF-IDF matrix built ONCE, not per-request
  - 8 rich fields indexed (vs 3 before)
  - Score-based industry detection (vs first-match-wins)
  - Configurable top-K limit
  - Industry filter safely falls back to full dataset
"""

import os
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


DATASET_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "raw",
    "compile_synthetic_dataset_105500_FIXED.csv"
)

# ============================================================
# GLOBAL CACHE — built once at first use, reused forever
# ============================================================

_dataset = None          # Full DataFrame
_vectorizer = None       # TF-IDF vocabulary fitted on full corpus
_matrix = None           # Sparse TF-IDF matrix for full dataset
_doc_indices = None      # Maps matrix rows back to DataFrame indices

# Rich fields used for TF-IDF indexing (8 fields)
_SEARCH_FIELDS = [
    "problem_title",
    "raw_input_text",
    "industry",
    "brd_objectives",
    "functional_requirements",
    "hld_summary",
    "tech_stack",
    "cost_band",
]


def _build_searchable_text(df: pd.DataFrame) -> pd.Series:
    """Combine all rich fields into a single searchable text string per row."""
    combined = pd.Series([""] * len(df), index=df.index)
    for field in _SEARCH_FIELDS:
        if field in df.columns:
            combined = combined + " " + df[field].fillna("").astype(str)
    return combined.str.strip()


def _ensure_cache() -> None:
    """
    Build and cache the TF-IDF vectorizer and matrix once.
    Subsequent calls are O(1) — just check the global.
    """
    global _dataset, _vectorizer, _matrix, _doc_indices

    if _dataset is not None and _vectorizer is not None and _matrix is not None:
        return  # Already cached

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    print("[dataset_utils] Loading dataset...")
    _dataset = pd.read_csv(DATASET_PATH)
    print(f"[dataset_utils] Loaded {len(_dataset):,} records. Building TF-IDF index...")

    searchable = _build_searchable_text(_dataset)
    _doc_indices = _dataset.index.tolist()

    _vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=60000,      # Slightly wider vocabulary for richer fields
        sublinear_tf=True,       # Apply log(1 + tf) to reduce high-freq term dominance
    )
    _matrix = _vectorizer.fit_transform(searchable)
    print(f"[dataset_utils] TF-IDF index built: {_matrix.shape[0]:,} rows x {_matrix.shape[1]:,} features.")


def get_dataset() -> pd.DataFrame:
    """Return the cached dataset, loading it if necessary."""
    _ensure_cache()
    return _dataset


# ============================================================
# INDUSTRY DETECTION — score-based, not first-match-wins
# ============================================================

INDUSTRY_KEYWORDS = {
    "Education": {
        "high":   ["education", "university", "school", "college", "lms", "e-learning", "curriculum"],
        "medium": ["student", "students", "teacher", "teachers", "exam", "course", "attendance", "assignment", "learning"],
        "low":    ["classroom", "campus", "tutor", "grade", "lecture"],
    },
    "Healthcare": {
        "high":   ["healthcare", "hospital", "ehr", "emr", "telemedicine", "hipaa", "clinical"],
        "medium": ["doctor", "patient", "medical", "clinic", "pharmacy", "diagnosis", "physician"],
        "low":    ["health", "wellness", "appointment", "lab", "radiology"],
    },
    "Finance": {
        "high":   ["banking", "fintech", "insurance", "investment", "lending", "trading", "wealth management"],
        "medium": ["bank", "loan", "finance", "financial", "payment", "invoice", "accounting", "ledger"],
        "low":    ["budget", "credit", "debit", "transaction", "revenue"],
    },
    "Retail": {
        "high":   ["retail", "e-commerce", "ecommerce", "marketplace", "pos", "storefront"],
        "medium": ["shop", "store", "inventory", "product", "customer", "order", "supplier"],
        "low":    ["catalogue", "discount", "warehouse", "sku", "basket"],
    },
    "Logistics": {
        "high":   ["logistics", "supply chain", "fleet", "warehouse management", "3pl"],
        "medium": ["shipment", "tracking", "freight", "delivery", "dispatch", "transport"],
        "low":    ["cargo", "route", "driver", "manifest", "container"],
    },
    "Real Estate": {
        "high":   ["real estate", "property management", "realty", "mls", "proptech"],
        "medium": ["property", "tenant", "lease", "landlord", "listing", "mortgage"],
        "low":    ["agent", "broker", "apartment", "house", "construction"],
    },
    "Manufacturing": {
        "high":   ["manufacturing", "erp", "mes", "mrp", "production planning", "factory"],
        "medium": ["assembly", "quality control", "machine", "plant", "bom", "scm"],
        "low":    ["production", "supplier", "material", "defect", "inspection"],
    },
}


def detect_industry(text: str) -> str | None:
    """
    Score-based industry detection.
    Returns the industry with the highest weighted keyword match,
    or None if no industry clears a minimum confidence threshold.
    """
    text_lower = text.lower()
    scores = {industry: 0 for industry in INDUSTRY_KEYWORDS}
    weights = {"high": 3, "medium": 2, "low": 1}

    for industry, tiers in INDUSTRY_KEYWORDS.items():
        for tier, keywords in tiers.items():
            for kw in keywords:
                if kw in text_lower:
                    scores[industry] += weights[tier]

    best_industry = max(scores, key=scores.get)
    best_score = scores[best_industry]

    # Require a minimum score of 2 to avoid spurious classification
    if best_score < 2:
        return None

    return best_industry


# ============================================================
# MAIN RETRIEVAL FUNCTION
# ============================================================

def find_similar_examples(raw_input_text: str = "", limit: int = 3) -> list[dict]:
    """
    Search the dataset for the most similar past enterprise blueprints.

    Uses a globally cached TF-IDF matrix — the vectorizer and matrix are built
    ONCE and reused for every subsequent call. Only the query transform is computed
    per request.

    Args:
        raw_input_text: The user's business requirement description.
        limit: Maximum number of similar records to return (top-K). Default: 3.

    Returns:
        List of record dicts with all available fields.
    """
    _ensure_cache()

    if not raw_input_text or not raw_input_text.strip():
        return []

    df = _dataset

    # Score-based industry detection
    detected_industry = detect_industry(raw_input_text)

    if detected_industry:
        filtered_df = df[
            df["industry"].fillna("").astype(str).str.lower()
            == detected_industry.lower()
        ].copy()

        # Safety fallback: if filter yields nothing, use full dataset
        if len(filtered_df) == 0:
            filtered_df = df.copy()
            filtered_indices = list(range(len(df)))
        else:
            filtered_indices = filtered_df.index.tolist()
    else:
        filtered_df = df.copy()
        filtered_indices = list(range(len(df)))

    # Use the globally cached vectorizer to transform the query only (fast)
    query_vector = _vectorizer.transform([raw_input_text])

    # Extract the sub-matrix for the filtered rows
    sub_matrix = _matrix[filtered_indices]

    # Compute cosine similarity
    similarities = cosine_similarity(query_vector, sub_matrix).flatten()

    # Get top-K indices (sorted descending by similarity)
    effective_limit = min(limit, len(filtered_df))
    top_local_indices = similarities.argsort()[-effective_limit:][::-1]

    result = filtered_df.iloc[top_local_indices].copy()

    return result.to_dict(orient="records")