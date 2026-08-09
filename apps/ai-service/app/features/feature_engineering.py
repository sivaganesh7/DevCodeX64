from typing import List, Dict, Any
import numpy as np
import pandas as pd
from app.schemas.risk import RiskFeatures

class FeatureEngineer:
    """
    Transforms incoming metrics into a feature vector suitable for the ML model.
    """
    
    # Define the exact order of features expected by the model
    FEATURE_NAMES = [
        "loc",
        "complexity",
        "functions",
        "dependencies",
        "codeSmells",
        "securityFindings",
        "highFindings"
    ]
    
    @staticmethod
    def extract_features(features: RiskFeatures) -> np.ndarray:
        """
        Extracts features from the Pydantic schema and returns a 2D numpy array
        (1 sample, n_features) ready for scikit-learn predict().
        """
        feature_dict = features.model_dump()
        vector = [feature_dict.get(name, 0) for name in FeatureEngineer.FEATURE_NAMES]
        return np.array([vector])

    @staticmethod
    def get_feature_names() -> List[str]:
        return FeatureEngineer.FEATURE_NAMES
