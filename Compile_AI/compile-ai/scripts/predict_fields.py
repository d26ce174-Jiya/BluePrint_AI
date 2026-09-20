"""
Inference helper for compile_field_classifier.joblib
Usage: python3 predict_fields.py "some raw business input text..."
"""
import sys, joblib

BUNDLE_PATH = "compile_field_classifier.joblib"

def load():
    return joblib.load(BUNDLE_PATH)

def predict(text, models):
    out = {}
    for field, m in models.items():
        vec = m["vectorizer"].transform([text])
        out[field] = m["classifier"].predict(vec)[0]
    return out

if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else (
        "We're a small logistics company. Shipments get lost between warehouses "
        "and nobody can tell where a pallet is once it leaves the dock. We track "
        "everything in spreadsheets today. Budget is tight, maybe 30k, want something in a couple months."
    )
    models = load()
    preds = predict(text, models)
    print("INPUT:", text)
    print("PREDICTIONS:")
    for k, v in preds.items():
        print(f"  {k}: {v}")
