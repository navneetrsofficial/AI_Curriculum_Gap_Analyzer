import time
import numpy as np
from typing import List, Dict, Any, Tuple
from .keyword_engine import KeywordBaselineEngine
from .semantic_engine import SemanticEmbeddingEngine

class MappingEvaluator:
    """
    Evaluation Engine comparing Method A (Keyword Baseline) vs Method B (Semantic Embedding).
    Runs real inference over labelled curriculum outcome test examples and measures:
    - Precision, Recall, F1-score (macro and micro)
    - Top-1 and Top-k Accuracy
    - Median Latency (ms)
    - Error Inspection: Correctly mapped, False Positives (overpredictions), False Negatives (missed)
    """
    def __init__(self, keyword_engine: KeywordBaselineEngine, semantic_engine: SemanticEmbeddingEngine):
        self.keyword_engine = keyword_engine
        self.semantic_engine = semantic_engine

    def run_evaluation(
        self,
        examples: List[Dict[str, Any]],
        threshold: float = 0.45,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """
        Executes real side-by-side evaluation over provided labelled examples.
        Each example must contain: 'curriculum_statement', 'correct_skill_id', 'correct_skill_name', and optional 'role'.
        """
        if not examples:
            raise ValueError("No labelled examples provided for evaluation.")

        n_examples = len(examples)
        
        # Track Keyword results
        kw_latencies = []
        kw_top1_correct = 0
        kw_topk_correct = 0
        kw_tp = 0
        kw_fp = 0
        kw_fn = 0

        # Track Semantic results
        sem_latencies = []
        sem_top1_correct = 0
        sem_topk_correct = 0
        sem_tp = 0
        sem_fp = 0
        sem_fn = 0

        side_by_side_samples = []
        per_role_stats = {}
        error_inspection = []

        for ex in examples:
            statement = ex["curriculum_statement"]
            correct_skill_id = ex["correct_skill_id"]
            correct_skill_name = ex.get("correct_skill_name", correct_skill_id)
            role = ex.get("role", "General CSE")

            if role not in per_role_stats:
                per_role_stats[role] = {
                    "total": 0,
                    "keyword_top1_correct": 0,
                    "semantic_top1_correct": 0
                }
            per_role_stats[role]["total"] += 1

            # ---------------- 1. Keyword Baseline Inference ----------------
            t0 = time.perf_counter()
            kw_matches = self.keyword_engine.find_matches(statement, top_k=top_k)
            t_kw = (time.perf_counter() - t0) * 1000.0
            kw_latencies.append(t_kw)

            # Top-1 and Top-k check
            kw_predicted_top1_id = kw_matches[0]["skill_id"] if kw_matches else None
            kw_predicted_topk_ids = [m["skill_id"] for m in kw_matches]
            kw_top1_is_correct = (kw_predicted_top1_id == correct_skill_id)
            kw_topk_is_correct = (correct_skill_id in kw_predicted_topk_ids)

            if kw_top1_is_correct:
                kw_top1_correct += 1
                per_role_stats[role]["keyword_top1_correct"] += 1
            if kw_topk_is_correct:
                kw_topk_correct += 1

            # Threshold-based Precision/Recall (accepted candidate)
            kw_accepted = [m for m in kw_matches if m["similarity_score"] >= threshold]
            if kw_accepted:
                if any(m["skill_id"] == correct_skill_id for m in kw_accepted):
                    kw_tp += 1
                    # Any extra predictions above threshold are false positives
                    kw_fp += (len(kw_accepted) - 1)
                else:
                    kw_fp += len(kw_accepted)
                    kw_fn += 1
            else:
                kw_fn += 1

            # ---------------- 2. Semantic Model Inference ----------------
            t0 = time.perf_counter()
            sem_matches = self.semantic_engine.find_matches(statement, top_k=top_k)
            t_sem = (time.perf_counter() - t0) * 1000.0
            sem_latencies.append(t_sem)

            sem_predicted_top1_id = sem_matches[0]["skill_id"] if sem_matches else None
            sem_predicted_topk_ids = [m["skill_id"] for m in sem_matches]
            sem_top1_is_correct = (sem_predicted_top1_id == correct_skill_id)
            sem_topk_is_correct = (correct_skill_id in sem_predicted_topk_ids)

            if sem_top1_is_correct:
                sem_top1_correct += 1
                per_role_stats[role]["semantic_top1_correct"] += 1
            if sem_topk_is_correct:
                sem_topk_correct += 1

            sem_accepted = [m for m in sem_matches if m["similarity_score"] >= threshold]
            if sem_accepted:
                if any(m["skill_id"] == correct_skill_id for m in sem_accepted):
                    sem_tp += 1
                    sem_fp += (len(sem_accepted) - 1)
                else:
                    sem_fp += len(sem_accepted)
                    sem_fn += 1
            else:
                sem_fn += 1

            # Sample comparison record
            sample_rec = {
                "id": ex.get("id"),
                "curriculum_statement": statement,
                "ground_truth_skill_id": correct_skill_id,
                "ground_truth_skill_name": correct_skill_name,
                "role": role,
                "keyword_prediction": kw_matches[0] if kw_matches else None,
                "keyword_is_correct": kw_top1_is_correct,
                "semantic_prediction": sem_matches[0] if sem_matches else None,
                "semantic_is_correct": sem_top1_is_correct,
                "methods_agree": (kw_predicted_top1_id == sem_predicted_top1_id)
            }
            side_by_side_samples.append(sample_rec)

            # Error diagnosis record
            if not sem_top1_is_correct or not kw_top1_is_correct:
                error_inspection.append({
                    "statement": statement,
                    "target_skill": correct_skill_name,
                    "keyword_predicted": kw_matches[0]["canonical_name"] if kw_matches else "None",
                    "keyword_score": kw_matches[0]["similarity_score"] if kw_matches else 0.0,
                    "semantic_predicted": sem_matches[0]["canonical_name"] if sem_matches else "None",
                    "semantic_score": sem_matches[0]["similarity_score"] if sem_matches else 0.0,
                    "error_type": (
                        "Keyword Missed / Semantic Caught" if (sem_top1_is_correct and not kw_top1_is_correct)
                        else "Semantic Missed / Keyword Caught" if (kw_top1_is_correct and not sem_top1_is_correct)
                        else "Both Misaligned"
                    )
                })

        # Calculate standard classification metrics
        def calc_metrics(tp, fp, fn, top1_corr, topk_corr, latencies):
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
            return {
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "f1_score": round(float(f1), 4),
                "top_1_accuracy": round(float(top1_corr / n_examples), 4),
                "top_k_accuracy": round(float(topk_corr / n_examples), 4),
                "median_latency_ms": round(float(np.median(latencies)), 2),
                "total_examples": n_examples
            }

        kw_metrics = calc_metrics(kw_tp, kw_fp, kw_fn, kw_top1_correct, kw_topk_correct, kw_latencies)
        sem_metrics = calc_metrics(sem_tp, sem_fp, sem_fn, sem_top1_correct, sem_topk_correct, sem_latencies)

        # Per-role accuracies
        per_role_out = {}
        for r, d in per_role_stats.items():
            tot = d["total"]
            per_role_out[r] = {
                "count": tot,
                "keyword_accuracy": round(d["keyword_top1_correct"] / tot, 3),
                "semantic_accuracy": round(d["semantic_top1_correct"] / tot, 3)
            }

        engine_status = self.semantic_engine.get_engine_status()

        return {
            "evaluated_count": n_examples,
            "threshold": threshold,
            "top_k": top_k,
            "keyword_baseline": kw_metrics,
            "semantic_model": sem_metrics,
            "side_by_side_samples": side_by_side_samples,
            "per_role_metrics": per_role_out,
            "error_inspection": error_inspection,
            "model_metadata": engine_status,
            "execution_notes": (
                f"Evaluation executed deterministically across {n_examples} labelled examples. "
                f"Metrics computed: Micro-averaged Precision, Recall, F1 at threshold {threshold}; "
                f"Top-1 and Top-{top_k} Ranking Accuracy; and Median Latency (ms)."
            )
        }
