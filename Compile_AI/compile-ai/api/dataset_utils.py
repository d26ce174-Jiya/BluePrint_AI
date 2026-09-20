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

_dataset = None
_vectorizer = None
_matrix = None


def get_dataset():
    global _dataset

    if _dataset is None:
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(
                f"Dataset not found at {DATASET_PATH}"
            )

        _dataset = pd.read_csv(DATASET_PATH)

    return _dataset


def detect_industry(text):
    text = text.lower()

    industry_keywords = {
        "Education": [
            "student",
            "students",
            "school",
            "college",
            "university",
            "education",
            "attendance",
            "assignment",
            "assignments",
            "teacher",
            "teachers",
            "exam",
            "learning",
            "course"
        ],

        "Healthcare": [
            "hospital",
            "doctor",
            "patient",
            "medical",
            "healthcare",
            "clinic"
        ],

        "Finance": [
            "bank",
            "banking",
            "loan",
            "finance",
            "financial",
            "payment"
        ],

        "Retail": [
            "retail",
            "shop",
            "store",
            "customer",
            "inventory",
            "product"
        ]
    }

    for industry, keywords in industry_keywords.items():
        for keyword in keywords:
            if keyword in text:
                return industry

    return None


def find_similar_examples(raw_input_text="", limit=3):
    global _vectorizer, _matrix

    df = get_dataset()

    if not raw_input_text.strip():
        return []

    # Detect likely industry
    detected_industry = detect_industry(raw_input_text)

    # If an industry is detected, search inside that industry
    if detected_industry:
        filtered_df = df[
            df["industry"].fillna("").astype(str).str.lower()
            == detected_industry.lower()
        ].copy()
    else:
        filtered_df = df.copy()

    # Safety fallback
    if len(filtered_df) == 0:
        filtered_df = df.copy()

    # Combine important fields
    searchable = (
        filtered_df["problem_title"].fillna("").astype(str) + " " +
        filtered_df["raw_input_text"].fillna("").astype(str) + " " +
        filtered_df["industry"].fillna("").astype(str)
    )

    # Create TF-IDF for current search dataset
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=50000
    )

    matrix = vectorizer.fit_transform(searchable)

    # Convert user query
    query_vector = vectorizer.transform(
        [raw_input_text]
    )

    # Calculate similarity
    similarities = cosine_similarity(
        query_vector,
        matrix
    ).flatten()

    # Get best matches
    top_indices = similarities.argsort()[-limit:][::-1]

    result = filtered_df.iloc[top_indices].copy()

    return result.to_dict(orient="records")