import requests
import json

base_url = "http://localhost:8003/predict/anomaly"

def test(name, data):
    print(f"--- Testing {name} ---")
    try:
        resp = requests.post(base_url, json=data)
        print(f"Status: {resp.status_code}")
        print(f"Result: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    print()

test("NORMAL DATA", {"temperature": 25.0, "humidity": 50.0, "cpu_load": 40.0})
test("ANOMALOUS DATA", {"temperature": 150.0, "humidity": 95.0, "cpu_load": 100.0})
