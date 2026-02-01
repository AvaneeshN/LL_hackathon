import numpy as np
from feature_engineering import create_base_features, build_sliding_windows
from model import XGBTrafficModel

class NetworkRiskEngine:

    def __init__(self):
        self.model = XGBTrafficModel()
        self.model.load_model()

    def score_window(self, recent_data_df):
        """
        recent_data_df: pandas df with last window_size rows
        """
        feature_cols = [
            "traffic_kbits",
            "traffic_mean",
            "traffic_std",
            "traffic_max",
            "traffic_delta",
            "traffic_growth",
            "loss_rate",
            "late_rate"
        ]

        windows = build_sliding_windows(recent_data_df, recent_data_df.shape[0], feature_cols)
        X = np.array(windows)
        risk = self.model.predict_risk(X)
        return float(risk)

    def recommend_action(self, risk: float):
        if risk > 0.85:
            return "WIDEN_PATH"
        elif risk > 0.7:
            return "REROUTE"
        elif risk > 0.4:
            return "PREPARE_REROUTE"
        else:
            return "MONITOR"
