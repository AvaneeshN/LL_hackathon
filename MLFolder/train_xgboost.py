# train_xgboost.py - FIXED VERSION

import os
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.model_selection import train_test_split

# Import fixed modules
from feature_engineering import (
    add_features,
    add_target,
    build_sliding_windows
)
from model_xgboost import XGBoostTrafficModel
from config import WINDOW_SIZE, PRED_HORIZON, FEATURE_COLS, MODEL_PATH

# -----------------------------
# CONFIG
# -----------------------------
DATA_DIR = "processed_data"
RANDOM_STATE = 42

print("="*70)
print(" XGBoost Congestion Prediction Model Training")
print("="*70)
print(f"\nConfiguration:")
print(f"  Window Size: {WINDOW_SIZE}")
print(f"  Prediction Horizon: {PRED_HORIZON}")
print(f"  Features: {len(FEATURE_COLS)}")
print(f"  Data Directory: {DATA_DIR}")
print("="*70)

# -----------------------------
# LOAD + PREPARE DATA
# -----------------------------
X_all, y_all = [], []
file_count = 0
skipped_files = 0

csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
print(f"\nFound {len(csv_files)} CSV files to process")

for file in csv_files:
    file_path = os.path.join(DATA_DIR, file)
    print(f"\n[{file_count + 1}/{len(csv_files)}] Processing: {file}")
    
    try:
        # FIX 1: Read CSV and clean column names
        df = pd.read_csv(file_path)
        
        # Strip angle brackets from column names
        df.columns = df.columns.str.strip().str.replace('<', '').str.replace('>', '')
        print(f"  Columns: {df.columns.tolist()}")
        print(f"  Shape: {df.shape}")
        
        # FIX 2: Handle missing values
        df = df.fillna(0)
        
        # FIX 3: Find time column
        time_col = None
        possible_time_cols = ["timestamp", "slotStart", "slot", "slotId", "frame", "index", "time"]
        
        for col in possible_time_cols:
            if col in df.columns:
                time_col = col
                break
        
        if time_col is not None:
            df = df.sort_values(time_col).reset_index(drop=True)
            df = df.rename(columns={time_col: 'timestamp'})
        else:
            print(f"  Warning: No time column found. Using row order.")
            df['timestamp'] = df.index
        
        # FIX 4: Normalize column names
        if "tooLateRxPackets" in df.columns:
            df = df.rename(columns={"tooLateRxPackets": "tooLatePackets"})
        
        if "tooLatePackets" not in df.columns:
            df["tooLatePackets"] = 0
        
        # FIX 5: Calculate traffic_kbits from packet data
        if 'traffic_kbits' not in df.columns:
            BYTES_PER_PACKET = 1500  # Average packet size
            BITS_PER_BYTE = 8
            BITS_TO_KBITS = 1000
            
            df['traffic_kbits'] = (
                (df['txPackets'] * BYTES_PER_PACKET * BITS_PER_BYTE) / BITS_TO_KBITS
            )
            print(f"  Calculated traffic_kbits from packet data")
        
        # FIX 6: Ensure required columns exist
        required_cols = ['timestamp', 'traffic_kbits', 'txPackets', 'rxPackets', 'tooLatePackets']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            print(f"  ERROR: Missing columns {missing_cols}, skipping file")
            skipped_files += 1
            continue
        
        # Check for minimum data
        if len(df) < WINDOW_SIZE + PRED_HORIZON:
            print(f"  Skipping: Not enough data (need at least {WINDOW_SIZE + PRED_HORIZON} rows)")
            skipped_files += 1
            continue
        
        # FIX 7: Feature engineering with error handling
        print(f"  Adding features...")
        df = add_features(df)
        
        # FIX 8: Target creation
        print(f"  Creating target variable...")
        df = add_target(df, PRED_HORIZON)
        
        # FIX 9: Check if we have any congestion events
        congestion_count = df['congestion_event'].sum()
        target_count = df['target'].sum()
        print(f"  Congestion events: {congestion_count}")
        print(f"  Future congestion (target): {target_count}")
        
        # FIX 10: Sliding window transformation with validation
        print(f"  Building sliding windows...")
        X, y = build_sliding_windows(df, WINDOW_SIZE, FEATURE_COLS)
        
        if len(X) == 0:
            print(f"  Skipping: No valid windows created")
            skipped_files += 1
            continue
        
        X_all.append(X)
        y_all.append(y)
        file_count += 1
        
    except Exception as e:
        print(f"  ERROR processing {file}: {str(e)}")
        skipped_files += 1
        continue

print("\n" + "="*70)
print(f"Successfully processed {file_count}/{len(csv_files)} files")
print(f"Skipped {skipped_files} files due to errors")
print("="*70)

# -----------------------------
# COMBINE ALL CELLS
# -----------------------------
if len(X_all) == 0:
    raise RuntimeError(
        "No valid training data found. Check:\n"
        "1. CSV files have correct format\n"
        "2. Column names are correct\n"
        "3. Files have enough data rows"
    )

X = np.vstack(X_all)
y = np.concatenate(y_all)

print("\n" + "="*70)
print(" Combined Dataset Statistics")
print("="*70)
print(f"X shape: {X.shape}")
print(f"  Samples: {X.shape[0]:,}")
print(f"  Features: {X.shape[1]} ({len(FEATURE_COLS)} features × {WINDOW_SIZE} timesteps)")
print(f"\ny shape: {y.shape}")
print(f"  Positive samples: {y.sum():,} ({y.mean()*100:.2f}%)")
print(f"  Negative samples: {(~y.astype(bool)).sum():,} ({(1-y.mean())*100:.2f}%)")
print("="*70)

# FIX 11: Check for class imbalance
if y.mean() < 0.01:
    print("\n WARNING: Very low positive class ratio (<1%)")
    print("   Consider:")
    print("   - Adjusting congestion thresholds")
    print("   - Using different loss_rate/late_rate thresholds")
    print("   - Checking if data has actual congestion events")

# -----------------------------
# TIME-BASED TRAIN / TEST SPLIT
# -----------------------------
split_idx = int(0.8 * len(X))

X_train, X_test = X[:split_idx], X[split_idx:]
y_train, y_test = y[:split_idx], y[split_idx:]

print(f"\nTrain/Test Split:")
print(f"  Train: {len(X_train):,} samples ({len(X_train)/len(X)*100:.1f}%)")
print(f"  Test:  {len(X_test):,} samples ({len(X_test)/len(X)*100:.1f}%)")

# -----------------------------
# HANDLE CLASS IMBALANCE
# -----------------------------
pos = np.sum(y_train == 1)
neg = np.sum(y_train == 0)

print(f"\nTrain Set Class Distribution:")
print(f"  Positive: {pos:,}")
print(f"  Negative: {neg:,}")

if pos == 0:
    raise ValueError(
        "No positive congestion events found in training data.\n"
        "Possible solutions:\n"
        "1. Lower congestion thresholds in feature_engineering_fixed.py\n"
        "2. Check if CSV files contain actual congestion events\n"
        "3. Verify packet loss/late packet data is present"
    )

scale_pos_weight = neg / pos
print(f"  Scale pos weight: {scale_pos_weight:.2f}")

# -----------------------------
# TRAIN MODEL
# -----------------------------
print("\n" + "="*70)
print(" Training XGBoost Model")
print("="*70)

model = XGBoostTrafficModel(scale_pos_weight=scale_pos_weight)
model.train(X_train, y_train)

print("✓ Training complete")

# -----------------------------
# EVALUATION
# -----------------------------
print("\n" + "="*70)
print(" Model Evaluation")
print("="*70)

y_pred = model.predict(X_test)
y_prob = model.predict_risk(X_test)

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['No Congestion', 'Congestion']))

print("\nConfusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"                 Predicted")
print(f"                 No    Yes")
print(f"Actual No    {cm[0,0]:6d} {cm[0,1]:6d}")
print(f"       Yes   {cm[1,0]:6d} {cm[1,1]:6d}")

# Calculate additional metrics
if y_test.sum() > 0:  # If there are positive samples in test set
    roc_auc = roc_auc_score(y_test, y_prob)
    print(f"\nROC-AUC Score: {roc_auc:.4f}")
else:
    print("\n No positive samples in test set, cannot calculate ROC-AUC")

# Calculate business metrics
true_positives = cm[1,1]
false_positives = cm[0,1]
false_negatives = cm[1,0]

if (true_positives + false_positives) > 0:
    precision = true_positives / (true_positives + false_positives)
    print(f"Precision: {precision:.4f} (of predicted congestion, how many were actual)")

if (true_positives + false_negatives) > 0:
    recall = true_positives / (true_positives + false_negatives)
    print(f"Recall: {recall:.4f} (of actual congestion, how many were detected)")

# -----------------------------
# SAVE MODEL
# -----------------------------
print("\n" + "="*70)
print(" Saving Model")
print("="*70)

model.save()
print(f"✓ Model saved as: {MODEL_PATH}")

print("\n" + "="*70)
print(" Training Complete!")
print("="*70)
print("\nNext steps:")
print("  1. Use predict_service.py to make predictions")
print("  2. Check model performance metrics above")
print("  3. Adjust hyperparameters if needed")
print("="*70 + "\n")
