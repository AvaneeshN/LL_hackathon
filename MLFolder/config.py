# config.py

WINDOW_SIZE = 20
PRED_HORIZON = 10

FEATURE_COLS = [
    "traffic_kbits",
    "traffic_mean",
    "traffic_std",
    "traffic_max",
    "traffic_delta",
    "traffic_growth",
    "loss_rate",
    "late_rate"
]

MODEL_PATH = "xgboost_congestion.bin"
