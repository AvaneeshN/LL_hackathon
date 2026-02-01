# data_loader.py - FIXED VERSION

import pandas as pd
import numpy as np


def load_clean_data(path: str):
    """
    Load the cleaned traffic + packet stats CSV.
    
    FIXES:
    - Strip angle brackets from column names
    - Handle missing values
    - Calculate traffic_kbits from packet data
    - Robust column name handling
    """
    # Load CSV
    df = pd.read_csv(path)
    
    # FIX 1: Strip angle brackets from column names
    df.columns = df.columns.str.strip().str.replace('<', '').str.replace('>', '')
    
    # FIX 2: Handle missing values
    df = df.fillna(0)
    
    # FIX 3: Normalize column names (handle variations)
    column_mapping = {
        'tooLateRxPackets': 'tooLatePackets',
        'slot': 'timestamp',
        'slotStart': 'timestamp'
    }
    
    for old_col, new_col in column_mapping.items():
        if old_col in df.columns and new_col not in df.columns:
            df = df.rename(columns={old_col: new_col})
    
    # FIX 4: Ensure tooLatePackets column exists
    if 'tooLatePackets' not in df.columns:
        df['tooLatePackets'] = 0
    
    # FIX 5: Calculate traffic_kbits from packet data
    # Assumption: Each packet ~1.5KB average (typical for network packets)
    # This gives us a traffic estimate in kilobits
    if 'traffic_kbits' not in df.columns:
        BYTES_PER_PACKET = 1500  # Average packet size in bytes
        BITS_PER_BYTE = 8
        BITS_TO_KBITS = 1000
        
        df['traffic_kbits'] = (
            (df['txPackets'] * BYTES_PER_PACKET * BITS_PER_BYTE) / BITS_TO_KBITS
        )
    
    # FIX 6: Ensure timestamp column exists for sorting
    if 'timestamp' not in df.columns:
        # Use index as timestamp if no time column
        df['timestamp'] = df.index
    
    # Sort by timestamp
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    # FIX 7: Ensure all required columns exist
    required_cols = ['timestamp', 'traffic_kbits', 'txPackets', 'rxPackets', 'tooLatePackets']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        raise ValueError(f"Missing required columns after processing: {missing_cols}")
    
    return df


def validate_dataframe(df):
    """
    Validate that dataframe has all required columns and reasonable values.
    """
    required_cols = ['timestamp', 'traffic_kbits', 'txPackets', 'rxPackets', 'tooLatePackets']
    
    # Check columns exist
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")
    
    # Check for all NaN columns
    for col in required_cols:
        if df[col].isna().all():
            raise ValueError(f"Column {col} contains only NaN values")
    
    # Check for negative values (shouldn't happen with packet counts)
    numeric_cols = ['txPackets', 'rxPackets', 'tooLatePackets', 'traffic_kbits']
    for col in numeric_cols:
        if (df[col] < 0).any():
            print(f"Warning: Column {col} contains negative values. Setting to 0.")
            df[col] = df[col].clip(lower=0)
    
    return df
