from fastapi import APIRouter, HTTPException, Depends
import logging
from app.schemas.risk import RiskPredictionRequest, RiskPredictionResponse
from app.features.feature_engineering import FeatureEngineer
from app.models.risk_model import risk_model

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/predict-risk", response_model=RiskPredictionResponse, summary="Predict ML risk for a file")
async def predict_risk(request: RiskPredictionRequest):
    """
    Predicts the risk probability and risk level for a file or module based on code and security features.
    """
    try:
        # Extract numerical features in the expected format
        feature_vector = FeatureEngineer.extract_features(request.features)
        
        # We also pass the raw dictionary to map importances back to features
        feature_values = request.features.model_dump()
        
        # Predict using the model
        risk_prob, risk_level, factors = risk_model.predict(feature_vector, feature_values)
        
        return RiskPredictionResponse(
            riskProbability=float(risk_prob),
            riskLevel=risk_level,
            factors=factors,
            modelVersion=risk_model.model_version
        )
    except Exception as e:
        logger.error(f"Error predicting risk: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during risk prediction.")
