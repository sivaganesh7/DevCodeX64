import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.features.feature_engineering import FeatureEngineer

def generate_synthetic_dataset(n_samples=1000):
    """
    Generates a synthetic dataset for training the initial risk model.
    This creates proxy labels based on a heuristic combining complexity and security findings.
    """
    print(f"Generating synthetic dataset with {n_samples} samples...")
    
    # Feature ranges
    loc = np.random.randint(10, 2000, n_samples)
    complexity = np.random.randint(1, 50, n_samples)
    functions = np.random.randint(1, 30, n_samples)
    dependencies = np.random.randint(0, 20, n_samples)
    code_smells = np.random.randint(0, 30, n_samples)
    security_findings = np.random.randint(0, 10, n_samples)
    high_findings = np.random.randint(0, 5, n_samples)
    
    # Heuristic for the proxy label: 
    # High risk (1) if high complexity OR high security findings OR high code smells
    # This simulates a real-world scenario where these factors contribute to risk.
    labels = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        risk_score = (
            (complexity[i] / 50.0) * 0.3 +
            (security_findings[i] / 10.0) * 0.4 + 
            (high_findings[i] / 5.0) * 0.8 + 
            (code_smells[i] / 30.0) * 0.2
        )
        # Add some noise
        risk_score += np.random.normal(0, 0.1)
        
        if risk_score > 0.6:
            labels[i] = 1
            
    data = {
        "loc": loc,
        "complexity": complexity,
        "functions": functions,
        "dependencies": dependencies,
        "codeSmells": code_smells,
        "securityFindings": security_findings,
        "highFindings": high_findings
    }
    
    df = pd.DataFrame(data)
    
    print(f"Dataset generated. Risky files: {sum(labels)} / {n_samples}")
    return df, labels

def train_model():
    df, y = generate_synthetic_dataset(n_samples=2000)
    
    # Ensure columns match expected feature order
    X = df[FeatureEngineer.FEATURE_NAMES].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    print("\n--- Evaluation Metrics ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("--------------------------\n")
    
    # Save the model
    model_version = "risk-model-v1"
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'models', model_version))
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, "model.pkl")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    print("\n[!] NOTE: This model was trained on synthetic data for Phase 7 implementation.")

if __name__ == "__main__":
    train_model()
