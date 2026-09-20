"""
Compile - Tier 2 model: fine-tuned transformer for the AI Business Consultant.

WHAT THIS DOES
Fine-tunes a seq2seq transformer (default: google/flan-t5-base) as a multi-task
model: one model, many task prefixes, matching the modules in the Compile
blueprint (Discovery, Business Analysis, Solution Architecture, Estimation).

  classify industry: <raw_input_text>              -> "Healthcare"
  classify cost_band: <raw_input_text>              -> "mid"
  generate gap analysis: <raw_input_text>           -> full gap_analysis text
  generate brd objectives: <raw_input_text>         -> full brd_objectives text
  generate tech stack: <raw_input_text>              -> full tech_stack text
  generate hld summary: <raw_input_text>             -> full hld_summary text
  generate discovery questions: <raw_input_text>     -> discovery_questions text

This single-model, multi-task setup mirrors your System Blueprint's "AI
Reasoning Layer" (Discovery / BA / SA / Estimation as separate pipelines) but
lets them share one fine-tuned base model instead of five separate ones,
which is cheaper to serve.

REQUIREMENTS - CANNOT RUN IN THIS SANDBOX
This sandbox has no GPU and no internet access (can't download the base
model or install torch/transformers). Run this on a GPU environment with
internet access: Google Colab (free T4 is enough for flan-t5-base), a
cloud GPU box (AWS/GCP/Lambda), or a local machine with an NVIDIA GPU.

    pip install -r requirements_gpu.txt

Then:
    python3 train_generative_model.py --data compile_synthetic_dataset_105500.csv

Training the full 105,500-row dataset on flan-t5-base with a single T4 GPU
takes roughly 2-4 hours for 3 epochs. Use --max_rows to try a smaller
subset first (e.g. --max_rows 5000) to sanity-check the pipeline in ~15 min
before committing to a full run.

IMPORTANT CAVEAT - SAME ONE AS THE CLASSIFIER
This dataset is templated synthetic data. A model fine-tuned only on it will
get very good at the template's style and vocabulary, but that is not the
same as being "accurate" on messy real-world business input. Treat this as
a strong starting checkpoint to then continue fine-tuning on real session
transcripts once Compile has real users - not as the final production model.
"""
import argparse
import pandas as pd
from datasets import Dataset
from transformers import (
    AutoTokenizer, AutoModelForSeq2SeqLM,
    Seq2SeqTrainer, Seq2SeqTrainingArguments,
    DataCollatorForSeq2Seq,
)

MODEL_NAME = "google/flan-t5-base"  # swap for flan-t5-large if you have a bigger GPU

CLASSIFY_TASKS = ["industry", "company_size_tag", "problem_title", "budget_band", "cost_band"]
GENERATE_TASKS = {
    "gap analysis": "gap_analysis",
    "brd objectives": "brd_objectives",
    "functional requirements": "functional_requirements",
    "tech stack": "tech_stack",
    "hld summary": "hld_summary",
    "discovery questions": "discovery_questions",
}

def build_examples(df: pd.DataFrame):
    inputs, targets = [], []
    for _, row in df.iterrows():
        text = row["raw_input_text"]
        for field in CLASSIFY_TASKS:
            inputs.append(f"classify {field.replace('_', ' ')}: {text}")
            targets.append(str(row[field]))
        for prefix, col in GENERATE_TASKS.items():
            inputs.append(f"generate {prefix}: {text}")
            targets.append(str(row[col]))
    return Dataset.from_dict({"input_text": inputs, "target_text": targets})

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="compile_synthetic_dataset_105500.csv")
    ap.add_argument("--max_rows", type=int, default=None,
                     help="Use a subset for a quick pipeline sanity-check run.")
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--batch_size", type=int, default=8)
    ap.add_argument("--output_dir", default="./compile-consultant-model")
    args = ap.parse_args()

    df = pd.read_csv(args.data)
    if args.max_rows:
        df = df.sample(n=args.max_rows, random_state=42)

    train_df = df.sample(frac=0.9, random_state=42)
    eval_df = df.drop(train_df.index)

    train_ds = build_examples(train_df)
    eval_ds = build_examples(eval_df)
    print(f"train examples: {len(train_ds)}  eval examples: {len(eval_ds)}")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        model_inputs = tokenizer(batch["input_text"], max_length=512, truncation=True)
        labels = tokenizer(text_target=batch["target_text"], max_length=256, truncation=True)
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    train_tok = train_ds.map(tokenize, batched=True, remove_columns=train_ds.column_names)
    eval_tok = eval_ds.map(tokenize, batched=True, remove_columns=eval_ds.column_names)

    collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    training_args = Seq2SeqTrainingArguments(
        output_dir=args.output_dir,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        learning_rate=5e-5,
        eval_strategy="no",
        save_strategy="epoch",
        logging_steps=100,
        predict_with_generate=False,
        fp16=False,
        load_best_model_at_end=False,
        report_to="none",
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_tok,
        eval_dataset=eval_tok,
        data_collator=collator,
        processing_class=tokenizer,
    )

    trainer.train()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print(f"Saved fine-tuned model to {args.output_dir}")

if __name__ == "__main__":
    main()
