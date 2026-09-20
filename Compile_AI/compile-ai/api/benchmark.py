import os
import re
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


def budget_to_number(budget):
    budget = str(budget).strip().lower()

    if "under $20k" in budget:
        return 10000

    if "$20k-$75k" in budget:
        return 47500

    if "$75k-$250k" in budget:
        return 162500

    if "$250k-$750k" in budget:
        return 500000

    return None


def timeline_to_weeks(timeline):
    timeline = str(timeline).strip().lower()

    numbers = [
        int(x) for x in re.findall(r"\d+", timeline)
    ]

    if not numbers:
        return None

    if "week" in timeline:
        return sum(numbers) / len(numbers)

    if "month" in timeline:
        return (sum(numbers) / len(numbers)) * 4.33

    if "year" in timeline:
        return (sum(numbers) / len(numbers)) * 52

    return None


def calculate_percentile(value, values):

    values = [
        v for v in values
        if v is not None
    ]

    if not values:
        return None

    count_below = sum(
        1 for v in values
        if v <= value
    )

    percentile = (
        count_below / len(values)
    ) * 100

    return round(percentile, 2)


def calculate_benchmark(
    industry=None,
    company_size_tag=None,
    budget=None,
    timeline_weeks=None
):

    df = get_dataset()

    filtered = df.copy()

    # Industry filter
    if industry:
        filtered = filtered[
            filtered["industry"]
            .fillna("")
            .astype(str)
            .str.lower()
            == industry.lower()
        ]

    # Company size filter
    if company_size_tag:
        filtered = filtered[
            filtered["company_size_tag"]
            .fillna("")
            .astype(str)
            .str.lower()
            == company_size_tag.lower()
        ]

    # Safety fallback
    if len(filtered) < 10 and industry:
        filtered = df[
            df["industry"]
            .fillna("")
            .astype(str)
            .str.lower()
            == industry.lower()
        ]

    # Budget values
    budgets = [
        budget_to_number(x)
        for x in filtered["budget_band"]
    ]

    budgets = [
        x for x in budgets
        if x is not None
    ]

    # Timeline values
    timelines = [
        timeline_to_weeks(x)
        for x in filtered["timeline_target"]
    ]

    timelines = [
        x for x in timelines
        if x is not None
    ]

    # User budget percentile
    budget_percentile = None

    if budget is not None and budgets:
        budget_percentile = calculate_percentile(
            budget,
            budgets
        )

    # User timeline percentile
    timeline_percentile = None

    if timeline_weeks is not None and timelines:
        timeline_percentile = calculate_percentile(
            timeline_weeks,
            timelines
        )

    # Cost distribution
    cost_distribution = (
        filtered["cost_band"]
        .fillna("unknown")
        .value_counts()
        .to_dict()
    )

    return {
        "industry": industry,
        "company_size_tag": company_size_tag,
        "sample_size": len(filtered),

        "user_estimate": {
            "budget": budget,
            "timeline_weeks": timeline_weeks
        },

        "budget_benchmark": {
            "low": min(budgets) if budgets else None,
            "median": (
                round(float(pd.Series(budgets).median()), 2)
                if budgets else None
            ),
            "high": max(budgets) if budgets else None,
            "user_percentile": budget_percentile
        },

        "timeline_benchmark_weeks": {
            "low": min(timelines) if timelines else None,
            "median": (
                round(float(pd.Series(timelines).median()), 2)
                if timelines else None
            ),
            "high": max(timelines) if timelines else None,
            "user_percentile": timeline_percentile
        },

        "cost_band_distribution": cost_distribution
    }