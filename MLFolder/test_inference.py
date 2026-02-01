# test_inference.py
"""
Sanity check script for trained XGBoost congestion model.
Builds ONE inference window correctly (no training logic misuse).
"""

import pandas as pd
import numpy as np

from data_loader import load_clean_data, validate_dataframe
from feature_engineering import add_features
from model_xgboost import XGBoostTrafficModel
from config import WINDOW_SIZE, FEATURE_COLS


def main():
    print("=" * 60)
    print(" XGBoost Congestion Model – Sanity Inference Test")
    print("=" * 60)

    # -----------------------------
    # LOAD TRAINED MODEL
    # -----------------------------
    model = XGBoostTrafficModel()
    model.load()
    print("✓ Model loaded successfully")

    # -----------------------------
    # LOAD ONE DATA FILE
    # -----------------------------
    data_path = "processed_data/pkt-stats-cell-1.csv"
    df = load_clean_data(data_path)
    df = validate_dataframe(df)

    print(f"✓ Data loaded: {len(df)} rows")

    # -----------------------------
    # FEATURE ENGINEERING
    # -----------------------------
    df = add_features(df)

    if len(df) < WINDOW_SIZE:
        raise ValueError(
            f"Need at least {WINDOW_SIZE} rows for inference, got {len(df)}"
        )

    # -----------------------------
    # BUILD ONE INFERENCE WINDOW (CORRECT WAY)
    # -----------------------------
    recent = df.tail(WINDOW_SIZE)

    # Flatten features into 1D vector
    X_latest = recent[FEATURE_COLS].values.flatten().reshape(1, -1)

    # -----------------------------
    # PREDICT RISK
    # -----------------------------
    risk = model.predict_risk(X_latest)[0]

    print("\n" + "=" * 60)
    print(" Sanity Check Result")
    print("=" * 60)
    print(f"Predicted congestion risk: {risk:.4f}")

    if risk < 0.4:
        print("Status: NORMAL (low risk)")
    elif risk < 0.7:
        print("Status: WARNING (monitor traffic)")
    elif risk < 0.85:
        print("Status: HIGH RISK (consider rerouting)")
    else:
        print("Status: CRITICAL (widen path / allocate bandwidth)")

    print("=" * 60)


if __name__ == "__main__":
    main()
