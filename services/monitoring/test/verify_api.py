import requests
import json
import time

API_URL = "http://localhost:8002/monitoring/history"

def verify_api():
    # We assume 'verify_consumption.py' ran before and inserted data for 'test_verification'
    # But to be safe, we can trigger a new event via the verification procedure, 
    # OR just query what we know is there from the previous step.
    # Let's clean slate: we will verify the DEVICE ID we used earlier or a fake one.
    
    # In consumer.py, we just log "device_id" from payload.
    # In verify_consumption.py, payload was {"status": "test_verification", "value": 123}
    # It didn't have 'device_id'. So the controller might return empty or error if we filter by device_id.
    
    # Wait! The DAO filters by `payload.device_id`.
    # Our previous test message DID NOT have a device_id.
    # So the API will return empty list for that specific message.
    # We need to send a BETTER message first.
    
    print("[-] 1. Sending Valid Message with Device ID...")
    import pika
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()
    channel.exchange_declare(exchange='iot_events', exchange_type='topic', durable=True)
    
    device_id = "device_test_api_1"
    payload = {
        "device_id": device_id,
        "telemetry": {"temperature": 25.5},
        "status": "ONLINE"
    }
    channel.basic_publish(
        exchange='iot_events', 
        routing_key='device.telemetry', 
        body=json.dumps(payload)
    )
    connection.close()
    
    print("[-] 2. Waiting 2s for ingestion...")
    time.sleep(2)
    
    # Now Query API
    url = f"{API_URL}/{device_id}"
    print(f"[-] 3. Querying {url}...")
    try:
        resp = requests.get(url)
        print(f"Code: {resp.status_code}")
        print(f"Body: {resp.json()}")
        
        if resp.status_code == 200 and resp.json()['count'] > 0:
            print("[SUCCESS] API returned data! 🚀")
        else:
            print("[FAIL] API returned no data or error.")
            
    except Exception as e:
        print(f"[!] Error: {e}")

if __name__ == "__main__":
    verify_api()
