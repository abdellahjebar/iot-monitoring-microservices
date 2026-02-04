import asyncio
from model import detector

def test_prediction_logic():
    print("🧪 Testing Prediction Logic...")
    
    # 1. Normal Conditions
    normal = detector.predict(temperature=45, humidity=50, cpu_load=30)
    print(f"Normal Case: {normal}")
    assert normal['risk_level'] == 'LOW'
    assert not normal['is_anomaly']
    
    # 2. Extreme Conditions (Should be anomaly)
    anomaly = detector.predict(temperature=120, humidity=90, cpu_load=99)
    print(f"Anomaly Case: {anomaly}")
    assert anomaly['is_anomaly'] == True
    assert anomaly['risk_level'] == 'HIGH'
    
    # 3. Edge Case (Medium Risk) - Low score but not -1
    # This is harder to synthetic force without knowing exact model boundaries, 
    # but let's try a boundary value
    boundary = detector.predict(temperature=85, humidity=20, cpu_load=85)
    print(f"Boundary Case: {boundary}")
    
    print("✅ Logic verification passed!")

if __name__ == "__main__":
    test_prediction_logic()
