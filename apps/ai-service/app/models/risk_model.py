import os
import joblib
import logging
from typing import Tuple, List, Dict
from app.schemas.risk import RiskFactor
from app.features.feature_engineering import FeatureEngineer

logger = logging.getLogger(__name__)

class RiskModelWrapper:
    def __init__(self):
        self.model_version = "risk-model-v1"
        self.model = None
        self._load_model()

    def _load_model(self):
        # We assume the model is saved in models/risk-model-v1/model.pkl relative to the project root
        # We'll calculate path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "..", "..", "models", self.model_version, "model.pkl")
        
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                logger.info(f"Loaded {self.model_version} successfully.")
            except Exception as e:
                logger.error(f"Failed to load {self.model_version}: {e}")
        else:
            logger.warning(f"Model file not found at {model_path}. Prediction will not be available until trained.")

    def _determine_risk_level(self, probability: float) -> str:
        """
        0–25     LOW
        26–50    MEDIUM
        51–75    HIGH
        76–100   CRITICAL
        """
        prob_percent = probability * 100
        if prob_percent <= 25:
            return "LOW"
        elif prob_percent <= 50:
            return "MEDIUM"
        elif prob_percent <= 75:
            return "HIGH"
        else:
            return "CRITICAL"

    def _calculate_impact(self, feature_val: float, importance: float) -> str:
        # A simple heuristic for explainability:
        # if the feature value is non-zero and importance is high -> HIGH impact
        # This is a simplified approach for Phase 7
        if importance > 0.15 and feature_val > 0:
            return "HIGH"
        elif importance > 0.05 and feature_val > 0:
            return "MEDIUM"
        else:
            return "LOW"

    def predict(self, feature_vector, feature_values: dict) -> Tuple[float, str, List[RiskFactor]]:
        """
        Returns (riskProbability, riskLevel, factors)
        """
        if self.model is None:
            # Fallback if model not trained yet
            logger.warning("Predict called but model is not loaded. Returning baseline fallback.")
            return 0.0, "LOW", []

        # feature_vector is 2D: (1, n_features)
        # Random Forest predict_proba returns probability for each class. 
        # Assuming binary classification where class 1 is "risky"
        proba = self.model.predict_proba(feature_vector)[0]
        # In case the model has only 1 class during dummy training
        risk_prob = proba[1] if len(proba) > 1 else proba[0]

        risk_level = self._determine_risk_level(risk_prob)

        # Explainability via Feature Importances
        factors = []
        feature_names = FeatureEngineer.get_feature_names()
        importances = getattr(self.model, "feature_importances_", None)
        
        if importances is not None:
            for idx, name in enumerate(feature_names):
                imp = importances[idx]
                val = feature_values.get(name, 0)
                
                # Only include factors that actually have some impact
                impact = self._calculate_impact(val, imp)
                if impact in ["HIGH", "MEDIUM"] or (impact == "LOW" and imp > 0.01):
                    factors.append(RiskFactor(feature=name, impact=impact))
                    
        # Sort factors by impact (HIGH > MEDIUM > LOW)
        impact_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        factors.sort(key=lambda x: impact_order.get(x.impact, 3))

        return risk_prob, risk_level, factors

# Singleton instance
risk_model = RiskModelWrapper()
