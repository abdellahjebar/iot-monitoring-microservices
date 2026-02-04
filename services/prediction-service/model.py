import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prediction-service")

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False
        
        # Pre-train with some synthetic normal data to have a baseline
        # (In a real scenario, we'd load a saved model or train on DB data)
        self._train_initial_model()

    def _train_initial_model(self):
        """Trains the model on synthetic 'normal' data."""
        logger.info("Training initial model on synthetic data...")
        
        # Generate synthetic normal data
        # Temp: 20-80, Humidity: 30-70, CPU: 10-80
        np.random.seed(42)
        normal_data = pd.DataFrame({
            'temperature': np.random.uniform(20, 80, 1000),
            'humidity': np.random.uniform(30, 70, 1000),
            'cpu_load': np.random.uniform(10, 80, 1000)
        })
        
        self.model.fit(normal_data)
        self.is_trained = True
        logger.info("Model training complete.")

    def predict(self, temperature: float, humidity: float, cpu_load: float):
        """
        Predicts if the given metrics are anomalous.
        Returns: 
            dict with 'is_anomaly', 'anomaly_score', 'risk_level'
        """
        if not self.is_trained:
            return {"error": "Model not trained"}

        data = pd.DataFrame([[temperature, humidity, cpu_load]], 
                           columns=['temperature', 'humidity', 'cpu_load'])
        
        # Predict: -1 for anomalies, 1 for normal
        prediction = self.model.predict(data)[0]
        
        # Decision function: lower is more anomalous
        score = self.model.decision_function(data)[0]
        
        is_anomaly = prediction == -1
        
        # Calculate risk level
        risk_level = "LOW"
        if is_anomaly:
            risk_level = "HIGH"
        elif score < 0.1:  # Close to the boundary
            risk_level = "MEDIUM"
            
        return {
            "is_anomaly": bool(is_anomaly),
            "anomaly_score": float(score),
            "risk_level": risk_level
        }

# Singleton instance
detector = AnomalyDetector()
