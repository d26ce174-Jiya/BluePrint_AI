# Compile — Model Deliverables

Two tiers, built for two different jobs. Read the caveats — they matter more than the accuracy numbers.

## Tier 1 — Field Classifier (ready now, runs on CPU)

**Files:** `compile_field_classifier.joblib`, `compile_classifier_metrics.json`, `predict_fields.py`

TF-IDF + logistic regression, one model per field (`industry`, `company_size_tag`, `problem_title`, `budget_band`, `cost_band`). Trained on all 105,500 rows in under 30 seconds on a single CPU core. Use it for: cheap, instant field-tagging during the Discovery step (FR-2.1) without calling the LLM for every keystroke.

```bash
python3 predict_fields.py "your raw business input text here"
```

**Reported accuracy: 100% on the held-out test set. Do not trust that number.** It's inflated because this synthetic dataset's `raw_input_text` sentences are built from the same template as the labels (e.g. the sentence literally contains "...in the {industry} space..."), so the model is mostly pattern-matching known phrases, not reasoning. I tested it on a hand-written, non-templated example and it correctly caught `industry` (because the phrasing was still close to the template) but got `cost_band` wrong — it predicted "high" for a budget described as "tight, maybe 30k," which should be "low." That's the real skill level right now: good at surface pattern-matching, unreliable at anything requiring actual inference over the input. Fine as a fast pre-filter; not fine as the sole source of truth for a business-critical field like cost band.

## Tier 2 — Fine-tuned Generative Model (script ready, needs a GPU to actually train)

**Files:** `train_generative_model.py`, `requirements_gpu.txt`

This sandbox has no GPU and no internet access, so it can't download a base model or install `torch`/`transformers` — I couldn't run this one here. What I've handed you is a complete, ready-to-run fine-tuning script for `google/flan-t5-base`, set up as a single multi-task model that mirrors your AI Reasoning Layer: one shared model handling classification *and* narrative generation (gap analysis, BRD objectives, tech stack rationale, HLD summary, discovery questions) via task-prefixed prompts, so you don't need five separate models in production.

To actually train it:
```bash
pip install -r requirements_gpu.txt
python3 train_generative_model.py --data compile_synthetic_dataset_105500.csv --max_rows 5000   # sanity check, ~15 min on a free Colab T4
python3 train_generative_model.py --data compile_synthetic_dataset_105500.csv                     # full run, ~2-4 hrs on a T4
```

**Same caveat, bigger stakes.** A model fine-tuned only on this templated dataset will produce fluent, on-template BRD/architecture text — but it will have learned the *template's* style and reasoning shortcuts, not general business consulting judgment. Treat the result as a strong starting checkpoint, then keep fine-tuning on real (anonymized) session transcripts once Compile has actual users. Don't ship it as "the AI consultant" off this data alone.

## Honest recommendation

For the hackathon demo itself, calling the Claude API directly (as your System Blueprint already plans — "LLM API - Claude" in the AI Reasoning Layer) will almost certainly outperform either of these home-grown models on messy real input, with zero training time. Where these two models earn their keep is **cost and latency** at scale later: Tier 1 as an instant pre-classifier, Tier 2 as a cheaper fine-tuned fallback for high-volume narrative sections once you have enough real usage data to fine-tune on something other than templates.
