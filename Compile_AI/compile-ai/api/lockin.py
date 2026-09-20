import re


# ============================================================
# VENDOR LOCK-IN ANALYSIS
# ============================================================

VENDOR_PATTERNS = {
    "AWS": [
        "aws",
        "amazon web services",
        "lambda",
        "dynamodb",
        "s3",
        "amazon rds",
        "elastic beanstalk"
    ],

    "Microsoft Azure": [
        "azure",
        "azure functions",
        "cosmos db",
        "microsoft sql azure"
    ],

    "Google Cloud": [
        "gcp",
        "google cloud",
        "cloud functions",
        "firestore",
        "bigquery"
    ],

    "Firebase": [
        "firebase",
        "firestore",
        "firebase authentication"
    ],

    "Oracle": [
        "oracle cloud",
        "oracle database"
    ],

    "Salesforce": [
        "salesforce",
        "apex"
    ]
}


PORTABLE_TECHNOLOGIES = [
    "postgresql",
    "postgres",
    "mysql",
    "mariadb",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "linux",
    "rest api",
    "graphql"
]


def calculate_lockin(tech_stack):

    if tech_stack is None:
        tech_stack = ""

    text = str(tech_stack).lower()

    detected_vendors = []

    for vendor, patterns in VENDOR_PATTERNS.items():

        for pattern in patterns:

            if re.search(
                r"\b" + re.escape(pattern) + r"\b",
                text
            ):
                detected_vendors.append(vendor)
                break

    portable_count = 0

    for technology in PORTABLE_TECHNOLOGIES:

        if re.search(
            r"\b" + re.escape(technology) + r"\b",
            text
        ):
            portable_count += 1

    vendor_count = len(detected_vendors)

    if vendor_count == 0:
        risk = "low"

    elif vendor_count == 1 and portable_count >= 2:
        risk = "low"

    elif vendor_count == 1:
        risk = "medium"

    else:
        risk = "high"

    if risk == "low":
        score = 25

    elif risk == "medium":
        score = 50

    else:
        score = 75

    recommendations = []

    if detected_vendors:
        recommendations.append(
            "Use portable interfaces and avoid unnecessary provider-specific services."
        )

    if portable_count < 2:
        recommendations.append(
            "Consider portable technologies such as PostgreSQL, Docker, Kubernetes, or REST APIs."
        )

    if not recommendations:
        recommendations.append(
            "Maintain portable architecture and document migration options."
        )

    return {
        "lockin_risk": risk,
        "lockin_score": score,
        "detected_vendors": detected_vendors,
        "portable_technology_count": portable_count,
        "recommendations": recommendations
    }