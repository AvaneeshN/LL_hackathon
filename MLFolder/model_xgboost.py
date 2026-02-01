# model_xgboost.py

import joblib
import numpy as np
from xgboost import XGBClassifier
from config import MODEL_PATH


class XGBoostTrafficModel:
    """
    Wrapper class for XGBoost congestion prediction model
    """

    def __init__(self, scale_pos_weight=1.0):
        """
        scale_pos_weight is passed dynamically from training script
        """
        self.model = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight,
            eval_metric="logloss",
            use_label_encoder=False
        )

    def train(self, X_train, y_train):
        """
        Train the XGBoost model
        """
        self.model.fit(X_train, y_train)

    def save(self):
        """
        Save trained model to disk
        """
        joblib.dump(self.model, MODEL_PATH)

    def load(self):
        """
        Load trained model from disk
        """
        self.model = joblib.load(MODEL_PATH)

    def predict(self, X):
        """
        Predict class labels (0/1)
        """
        return self.model.predict(X)

    def predict_risk(self, X):
        """
        Predict congestion risk probability
        """
        return self.model.predict_proba(X)[:, 1]
