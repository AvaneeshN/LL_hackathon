# feature_engineering.py - FIXED VERSION

import numpy as np
import pandas as pd


def add_features(df):
    """
    Add engineered features for congestion prediction.
    
    FIXES:
    - Handle zero-division safely
    - More robust NaN handling
    - Add epsilon for numerical stability
    - Defensive programming
    """
    # Make a copy to avoid modifying original
    df = df.copy()
    
    # FIX 1: Safe division with epsilon to avoid division by zero
    epsilon = 1e-6
    
    # Packet loss features
    df["packet_loss"] = (df["txPackets"] - df["rxPackets"]).clip(lower=0)
    df["loss_rate"] = df["packet_loss"] / (df["txPackets"] + epsilon)
    df["late_rate"] = df["tooLatePackets"] / (df["txPackets"] + epsilon)
    
    # FIX 2: Clip rates to [0, 1] range (handle any anomalies)
    df["loss_rate"] = df["loss_rate"].clip(0, 1)
    df["late_rate"] = df["late_rate"].clip(0, 1)
    
    # Rolling statistics on traffic
    # FIX 3: Use min_periods to handle edge cases
    df["traffic_mean"] = df["traffic_kbits"].rolling(window=5, min_periods=1).mean()
    df["traffic_std"] = df["traffic_kbits"].rolling(window=5, min_periods=1).std().fillna(0)
    df["traffic_max"] = df["traffic_kbits"].rolling(window=5, min_periods=1).max()
    
    # Delta and growth features
    df["traffic_delta"] = df["traffic_kbits"].diff().fillna(0)
    df["traffic_growth"] = df["traffic_delta"].rolling(window=3, min_periods=1).mean().fillna(0)
    
    # FIX 4: Additional useful features
    df["packet_rate"] = df["txPackets"] + df["rxPackets"]
    df["tx_rx_ratio"] = df["txPackets"] / (df["rxPackets"] + epsilon)
    df["tx_rx_ratio"] = df["tx_rx_ratio"].clip(0, 100)  # Clip extreme ratios
    
    # FIX 5: Handle any remaining NaN values
    # Use forward fill first, then backward fill, then fill with 0
    df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
    
    # FIX 6: Remove inf values that might have been created
    df = df.replace([np.inf, -np.inf], 0)
    
    return df.reset_index(drop=True)


def add_target(df, pred_horizon):
    """
    Create target variable for congestion prediction.
    
    FIXES:
    - More robust congestion detection
    - Handle edge cases
    - Multiple congestion indicators
    """
    df = df.copy()
    
    # FIX 1: Multiple congestion indicators
    # A congestion event occurs when:
    # 1. Packet loss is significant
    # 2. Late packets are present
    # 3. Loss rate exceeds threshold
    
    # Define thresholds
    LOSS_THRESHOLD = 0.05  # 5% packet loss
    LATE_THRESHOLD = 0.02  # 2% late packets
    MIN_PACKETS = 10       # Minimum packets to consider
    
    # Create congestion indicators
    significant_traffic = df["txPackets"] >= MIN_PACKETS
    high_loss = df["loss_rate"] >= LOSS_THRESHOLD
    high_late = df["late_rate"] >= LATE_THRESHOLD
    packet_loss_present = df["packet_loss"] > 0
    
    # Congestion event = any of these conditions when traffic is significant
    df["congestion_event"] = (
        significant_traffic & (high_loss | high_late | packet_loss_present)
    ).astype(int)
    
    # FIX 2: Create target with prediction horizon
    df["target"] = df["congestion_event"].shift(-pred_horizon)
    
    # FIX 3: Drop only the rows where target is NaN (at the end)
    # This preserves more data than dropping all NaN
    df = df.dropna(subset=['target']).reset_index(drop=True)
    
    return df


def build_sliding_windows(df, window_size, feature_cols):
    """
    Create sliding window features for time series prediction.
    
    FIXES:
    - Validate inputs
    - Better error messages
    - Handle edge cases
    """
    # FIX 1: Input validation
    if len(df) < window_size:
        raise ValueError(
            f"DataFrame has {len(df)} rows but window_size is {window_size}. "
            "Need at least window_size rows."
        )
    
    # FIX 2: Check that all feature columns exist
    missing_cols = [col for col in feature_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing feature columns: {missing_cols}")
    
    # FIX 3: Check that target column exists
    if 'target' not in df.columns:
        raise ValueError("Target column not found. Call add_target() first.")
    
    X, y = [], []
    
    for i in range(window_size, len(df)):
        # Extract window
        window = df[feature_cols].iloc[i-window_size:i].values.flatten()
        
        # FIX 4: Validate window has no NaN or inf
        if np.isnan(window).any() or np.isinf(window).any():
            continue  # Skip windows with invalid data
        
        X.append(window)
        y.append(df["target"].iloc[i])
    
    X = np.array(X)
    y = np.array(y)
    
    # FIX 5: Validation of output
    if len(X) == 0:
        raise ValueError("No valid windows created. Check your data for NaN/inf values.")
    
    print(f"  Created {len(X)} windows from {len(df)} rows")
    print(f"  Feature dimension: {X.shape[1]} ({len(feature_cols)} features × {window_size} timesteps)")
    print(f"  Positive class ratio: {y.mean():.4f}")
    
    return X, y
