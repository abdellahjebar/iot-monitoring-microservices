from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import detector

app = FastAPI(title="IoT Prediction Service", version="1.0.0")

class TelemetryData(BaseModel):
    temperature: float
    humidity: float
    cpu_load: float = 0.0

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "prediction-service"}

@app.post("/predict/anomaly")
def predict_anomaly(data: TelemetryData):
    try:
        result = detector.predict(
            temperature=data.temperature,
            humidity=data.humidity,
            cpu_load=data.cpu_load
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
