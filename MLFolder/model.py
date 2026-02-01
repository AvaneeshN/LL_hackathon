import numpy as np
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, roc_auc_score
import joblib

MODEL_PATH = "xgb_model.bin"

class XGBTrafficModel:

    def __init__(self):
        self.model = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=3,
            eval_metric="logloss"
        )

    def train(self, X_train, y_train):
        self.model.fit(X_train, y_train)
        self.save_model()
        return self.model

    def evaluate(self, X_test, y_test):
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]

        report = classification_report(y_test, y_pred, output_dict=True)
        auc = roc_auc_score(y_test, y_prob)

        return {
            "classification_report": report,
            "roc_auc": auc
        }

    def save_model(self):
        joblib.dump(self.model, MODEL_PATH)

    def load_model(self, path: str = MODEL_PATH):
        self.model = joblib.load(path)
        return self.model

    def predict_risk(self, X_window):
        """
        X_window must be a 2D array of shape (1, features)
        """
        return self.model.predict_proba(X_window)[:, 1][0]
