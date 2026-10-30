import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import EvaluationDataset, EvaluationExample, EvaluationRun, Skill
from ..schemas import EvaluationRunRequest, EvaluationComparisonOut
from ..ml.evaluator import MappingEvaluator
from .mappings import keyword_engine, semantic_engine, ensure_engines_indexed

router = APIRouter(prefix="/evaluation", tags=["Evaluation Lab"])

evaluator = MappingEvaluator(keyword_engine=keyword_engine, semantic_engine=semantic_engine)

@router.get("/datasets")
def get_evaluation_datasets(db: Session = Depends(get_db)):
    """Retrieve all available labelled benchmark evaluation datasets."""
    datasets = db.query(EvaluationDataset).all()
    results = []
    for d in datasets:
        ex_count = len(d.examples)
        test_count = len([e for e in d.examples if e.partition == "TEST"])
        dev_count = len([e for e in d.examples if e.partition == "DEV"])
        results.append({
            "id": d.id,
            "name": d.name,
            "version": d.version,
            "description": d.description,
            "is_demo": d.is_demo,
            "total_examples": ex_count,
            "test_examples": test_count,
            "dev_examples": dev_count,
            "created_at": d.created_at
        })
    return results

@router.get("/datasets/{id}/examples")
def get_dataset_examples(id: int, partition: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve examples within a dataset, optionally filtered by partition (TEST or DEV)."""
    query = db.query(EvaluationExample).filter(EvaluationExample.dataset_id == id)
    if partition:
        query = query.filter(EvaluationExample.partition == partition.upper())
    
    examples = query.all()
    return [
        {
            "id": e.id,
            "curriculum_statement": e.curriculum_statement,
            "correct_skill_id": e.correct_skill_id,
            "correct_skill_name": e.correct_skill_name,
            "role": e.role,
            "partition": e.partition,
            "annotator_id": e.annotator_id,
            "notes": e.notes
        }
        for e in examples
    ]

@router.post("/run", response_model=EvaluationComparisonOut)
def run_evaluation_experiment(payload: EvaluationRunRequest, db: Session = Depends(get_db)):
    """
    Executes live scientific evaluation on the specified benchmark dataset:
    - Runs Keyword Baseline vs Semantic Embedding model across labelled test items.
    - Measures genuine Precision, Recall, F1-score, Top-1 Accuracy, Top-k Accuracy, and Inference Latencies.
    - Provides error diagnosis (True Positives, False Positives, Missed Mappings).
    - Persists evaluation run record for reproducibility.
    """
    dataset = db.query(EvaluationDataset).filter(EvaluationDataset.id == payload.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Evaluation dataset not found.")

    ensure_engines_indexed(db)

    # Filter examples
    query = db.query(EvaluationExample).filter(EvaluationExample.dataset_id == dataset.id)
    if payload.test_partition_only:
        query = query.filter(EvaluationExample.partition == "TEST")
    
    examples_db = query.all()
    if not examples_db:
        raise HTTPException(status_code=400, detail="No evaluation examples found for selected partition.")

    examples_data = [
        {
            "id": e.id,
            "curriculum_statement": e.curriculum_statement,
            "correct_skill_id": e.correct_skill_id,
            "correct_skill_name": e.correct_skill_name,
            "role": e.role
        }
        for e in examples_db
    ]

    # Run authentic evaluation
    res = evaluator.run_evaluation(
        examples=examples_data,
        threshold=payload.threshold,
        top_k=payload.top_k
    )

    # Persist EvaluationRun record
    run_record = EvaluationRun(
        dataset_id=dataset.id,
        model_version=semantic_engine.model_name,
        baseline_config="Lexical-Token-TFIDF",
        metrics_json=json.dumps({
            "keyword_baseline": res["keyword_baseline"],
            "semantic_model": res["semantic_model"],
            "per_role_metrics": res["per_role_metrics"]
        }),
        error_inspection_json=json.dumps(res["error_inspection"])
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    return EvaluationComparisonOut(
        run_id=run_record.id,
        dataset_name=dataset.name,
        dataset_version=dataset.version,
        evaluated_count=res["evaluated_count"],
        keyword_baseline=res["keyword_baseline"],
        semantic_model=res["semantic_model"],
        side_by_side_samples=res["side_by_side_samples"],
        per_role_metrics=res["per_role_metrics"],
        error_inspection=res["error_inspection"],
        execution_notes=res["execution_notes"],
        created_at=run_record.created_at
    )

@router.get("/runs/{id}/export")
def export_evaluation_run_csv(id: int, db: Session = Depends(get_db)):
    """Exports evaluation run comparison metrics as downloadable CSV report."""
    run = db.query(EvaluationRun).filter(EvaluationRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found")

    metrics_data = json.loads(run.metrics_json)
    kw = metrics_data.get("keyword_baseline", {})
    sem = metrics_data.get("semantic_model", {})

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Evaluation Run ID", run.id])
    writer.writerow(["Dataset ID", run.dataset_id])
    writer.writerow(["Model Version", run.model_version])
    writer.writerow(["Baseline Configuration", run.baseline_config])
    writer.writerow(["Executed At", run.created_at.isoformat()])
    writer.writerow([])
    writer.writerow(["Metric", "Keyword Baseline (Method A)", "Semantic Model (Method B)", "Delta (Semantic - Baseline)"])
    
    metric_keys = [
        ("Top-1 Accuracy", "top_1_accuracy"),
        ("Top-3 Accuracy", "top_k_accuracy"),
        ("Precision", "precision"),
        ("Recall", "recall"),
        ("F1-Score", "f1_score"),
        ("Median Latency (ms)", "median_latency_ms")
    ]

    for label, k in metric_keys:
        kw_val = kw.get(k, 0.0)
        sem_val = sem.get(k, 0.0)
        delta = round(sem_val - kw_val, 4)
        writer.writerow([label, kw_val, sem_val, delta])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=evaluation_run_{id}_report.csv"}
    )
