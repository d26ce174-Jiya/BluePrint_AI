import os
import pandas as pd


DATASET_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "raw",
    "compile_synthetic_dataset_105500_FIXED.csv"
)


_dataset = None


def get_dataset():
    global _dataset

    if _dataset is None:

        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(
                f"Dataset not found at {DATASET_PATH}"
            )

        _dataset = pd.read_csv(DATASET_PATH)

    return _dataset


def get_compliance_mapping(industry=None):

    df = get_dataset()

    if industry:
        filtered = df[
            df["industry"]
            .fillna("")
            .astype(str)
            .str.lower()
            == industry.lower()
        ].copy()
    else:
        filtered = df.copy()

    if len(filtered) == 0:
        return {
            "industry": industry,
            "sample_size": 0,
            "compliance": []
        }

    compliance_items = []

    for value in filtered["security_notes"].dropna():

        text = str(value)
        lower = text.lower()

        if "hipaa" in lower:
            compliance_items.append({
                "standard": "HIPAA",
                "reason": "Healthcare data protection"
            })

        if "soc 2" in lower:
            compliance_items.append({
                "standard": "SOC 2",
                "reason": "Security and access controls"
            })

        if "pci-dss" in lower:
            compliance_items.append({
                "standard": "PCI-DSS",
                "reason": "Payment and card data security"
            })

    unique_items = []
    seen = set()

    for item in compliance_items:

        key = item["standard"]

        if key not in seen:
            seen.add(key)
            unique_items.append(item)

    return {
        "industry": industry,
        "sample_size": len(filtered),
        "compliance": unique_items
    }