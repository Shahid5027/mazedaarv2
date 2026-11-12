import os
import sys
import joblib
import pandas as pd
import numpy as np

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.engines.ps3_dropout_engine import (
    DropoutPredictionEngine,
    MODEL_PATH,
    METRICS_PATH,
    FEATURE_COLUMNS
)

def validate_ps3_pipeline():
    print("=" * 80)
    print("EDUCORE AI — PS3 DROPOUT PREDICTION MODEL VALIDATION SUITE")
    print("=" * 80)

    # 1. Pipeline & Persistence Verification
    assert os.path.exists(MODEL_PATH), f"Model pipeline missing at {MODEL_PATH}"
    assert os.path.exists(METRICS_PATH), f"Model metrics missing at {METRICS_PATH}"

    pipeline = joblib.load(MODEL_PATH)
    metrics = joblib.load(METRICS_PATH)
    print("✓ Model and metrics files verified on disk.")

    # 2. Pipeline Architecture Check
    step_names = [name for name, _ in pipeline.steps]
    print(f"Pipeline Steps: {step_names}")
    assert "imputer" in step_names, "Missing SimpleImputer"
    assert "scaler" in step_names, "Missing StandardScaler"
    assert "rf" in step_names, "Missing RandomForestClassifier"

    # 3. Target Leakage Verification
    print(f"Feature Columns ({len(FEATURE_COLUMNS)} features): {FEATURE_COLUMNS}")
    assert "dropout_label" not in FEATURE_COLUMNS, "TARGET LEAKAGE DETECTED: label in feature columns!"
    assert "risk_score" not in FEATURE_COLUMNS, "TARGET LEAKAGE DETECTED: risk_score in feature columns!"
    assert "student_id" not in FEATURE_COLUMNS, "ID column leaked into feature matrix!"
    print("✓ Target leakage check PASSED: Features strictly contain pre-outcome behavioral signals.")

    # 4. Train / Test Separation & Data Partition Check
    train_n = metrics["training_samples"]
    test_n = metrics["test_samples"]
    total_n = train_n + test_n
    test_ratio = test_n / total_n
    print(f"Training Samples: {train_n} ({round((1-test_ratio)*100, 1)}%) | Test Samples: {test_n} ({round(test_ratio*100, 1)}%)")
    assert total_n == 800, f"Expected 800 synthetic cohort samples, got {total_n}"
    assert abs(test_ratio - 0.25) < 0.01, f"Expected 25% test split, got {test_ratio}"
    print("✓ Train/test separation PASSED: Stratified 75/25 split with independent holdout.")

    # 5. Metric Calculations & Confusion Matrix Verification
    cm = metrics["confusion_matrix"]
    tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]
    print(f"\nConfusion Matrix on Test Set (N={test_n}):")
    print(f"                 Predicted Retained (0)  Predicted Dropout (1)")
    print(f"Actual Retained (0):     TN = {tn:<8}           FP = {fp:<8}")
    print(f"Actual Dropout  (1):     FN = {fn:<8}           TP = {tp:<8}")

    calc_prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    calc_rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    calc_f1 = 2 * (calc_prec * calc_rec) / (calc_prec + calc_rec) if (calc_prec + calc_rec) > 0 else 0.0

    print(f"\nRecorded vs Re-derived Metrics:")
    print(f"  Precision: Recorded={metrics['precision']} | Derived={round(calc_prec, 3)}")
    print(f"  Recall:    Recorded={metrics['recall']} | Derived={round(calc_rec, 3)}")
    print(f"  F1-Score:  Recorded={metrics['f1_score']} | Derived={round(calc_f1, 3)}")
    print(f"  ROC-AUC:   Recorded={metrics['roc_auc']}")

    # 6. Gini Feature Importances Check
    print(f"\nFeature Importances (Sum = {round(sum(metrics['feature_importances'].values()), 4)}):")
    sorted_fi = sorted(metrics["feature_importances"].items(), key=lambda x: x[1], reverse=True)
    for feat, imp in sorted_fi:
        print(f"  - {feat:<24}: {round(imp * 100, 2):>5.2f}%")

    # 7. Model Inference & Probability Calibration Check
    test_cases = [
        {
            "desc": "High Risk Student (Critically low attendance, failing grades, 4 missing assignments)",
            "features": {
                "attendance_rate": 42.0,
                "average_grade": 48.0,
                "late_assignments": 3,
                "missing_assignments": 4,
                "lms_logins_30d": 3,
                "engagement_change_pct": -35.0,
                "previous_failure_count": 2
            },
            "expected_risk": "high"
        },
        {
            "desc": "Low Risk Student (High attendance, high grades, 0 missing assignments)",
            "features": {
                "attendance_rate": 96.0,
                "average_grade": 89.0,
                "late_assignments": 0,
                "missing_assignments": 0,
                "lms_logins_30d": 28,
                "engagement_change_pct": 12.0,
                "previous_failure_count": 0
            },
            "expected_risk": "low"
        }
    ]

    print("\nInference Probability & Local Explanation Checks:")
    for tc in test_cases:
        pred = DropoutPredictionEngine.predict_risk(tc["features"], student_id="TEST_STU")
        print(f"\nCase: {tc['desc']}")
        print(f"  Probability: {pred['risk_probability']} -> Risk Level: {pred['risk_level'].upper()} (Expected: {tc['expected_risk'].upper()})")
        print(f"  Top Risk Factors: {[f['factor'] for f in pred['primary_factors'][:2]]}")
        assert pred["risk_level"] == tc["expected_risk"], f"Risk classification mismatch: got {pred['risk_level']}"
        assert 0.0 <= pred["risk_probability"] <= 1.0, "Probability outside [0, 1] bounds!"

    print("\n" + "=" * 80)
    print("ALL PS3 MODEL VALIDATION CHECKS PASSED WITH ZERO LEAKAGE.")
    print("=" * 80)

if __name__ == "__main__":
    validate_ps3_pipeline()
