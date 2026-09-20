#!/usr/bin/env bash
# Compile project - one-time folder setup.
# Run this from the folder where you downloaded all the Compile files,
# e.g.:  bash setup_folders.sh
set -e

mkdir -p compile-ai/data/raw
mkdir -p compile-ai/data/processed
mkdir -p compile-ai/models/tier1_classifier
mkdir -p compile-ai/models/tier2_generative/checkpoints
mkdir -p compile-ai/scripts
mkdir -p compile-ai/docs
mkdir -p compile-ai/outputs
mkdir -p compile-ai/api

# --- move data ---
mv -f compile_synthetic_dataset_105500.csv        compile-ai/data/raw/            2>/dev/null || true
mv -f chunks/*.csv                                  compile-ai/data/raw/chunks/     2>/dev/null || true

# --- move tier 1 (classifier) ---
mv -f train_classifier.py                          compile-ai/scripts/             2>/dev/null || true
mv -f predict_fields.py                             compile-ai/scripts/             2>/dev/null || true
mv -f compile_field_classifier.joblib                compile-ai/models/tier1_classifier/ 2>/dev/null || true
mv -f compile_classifier_metrics.json                compile-ai/models/tier1_classifier/ 2>/dev/null || true
mv -f requirements_cpu.txt                           compile-ai/models/tier1_classifier/ 2>/dev/null || true

# --- move tier 2 (generative, GPU) ---
mv -f train_generative_model.py                     compile-ai/scripts/             2>/dev/null || true
mv -f requirements_gpu.txt                           compile-ai/models/tier2_generative/ 2>/dev/null || true

# --- move api ---
mv -f main.py                                        compile-ai/api/                 2>/dev/null || true
mv -f requirements_api.txt                            compile-ai/api/                 2>/dev/null || true
mv -f .env.example                                    compile-ai/api/                 2>/dev/null || true
mv -f compile_neural_classifier.joblib                compile-ai/models/tier1_classifier/ 2>/dev/null || true
mv -f compile_neural_classifier_metrics.json           compile-ai/models/tier1_classifier/ 2>/dev/null || true
mv -f train_neural_classifier.py                       compile-ai/scripts/              2>/dev/null || true

# --- move docs ---
mv -f MODEL_README.md                                compile-ai/docs/                2>/dev/null || true
mv -f Compile_Innovation_and_Dataset_Addendum.md     compile-ai/docs/                2>/dev/null || true
mv -f compile_dataset_generator.py                   compile-ai/scripts/             2>/dev/null || true

echo "Done. Project structure:"
find compile-ai -maxdepth 3 -print | sed 's/[^-][^\/]*\// |/g;s/|\([^ ]\)/|-- \1/'
