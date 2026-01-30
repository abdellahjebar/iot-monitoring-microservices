import requests
import json
import time

AUTH_URL = "http://localhost:8000/users"
DEVICE_URL = "http://localhost:8001/devices"

def verify_flow():
    # 0. Unique User
    email = f"user_{int(time.time())}@example.com"
    password = "password123"
    
    print(f"[-] Registering user: {email}")
    # 1. Register
    resp = requests.post(f"{AUTH_URL}/add", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"[!] Registration failed: {resp.text}")
        return

    # 2. Login
    print("[-] Logging in...")
    resp = requests.post(f"{AUTH_URL}/auth", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"[!] Login failed: {resp.text}")
        return
    token = resp.json()["token"]
    print(f"[+] Got Token: {token[:10]}...")

    # 3. Create Device
    print("[-] Creating Device...")
    headers = {"Authorization": f"Bearer {token}"}
    device_payload = {"name": "Test Sensor 1", "type": "temperature"}
    resp = requests.post(f"{DEVICE_URL}/", json=device_payload, headers=headers)
    if resp.status_code != 200:
        print(f"[!] Create Device failed: {resp.text}")
        return
    device_data = resp.json()
    print(f"[+] Device Created: {device_data['id']}")

    # 4. List Devices
    print("[-] Listing Devices...")
    resp = requests.get(f"{DEVICE_URL}/", headers=headers)
    if resp.status_code != 200:
        print(f"[!] List Devices failed: {resp.text}")
        return
    devices = resp.json()
    print(f"[+] Found {len(devices)} devices: {[d['name'] for d in devices]}")

    if len(devices) > 0 and devices[0]['name'] == "Test Sensor 1":
        print("[SUCCESS] End-to-End Test Passed! \U0001F680")
    else:
        print("[FAIL] Device list mismatch.")

if __name__ == "__main__":
    try:
        verify_flow()
    except Exception as e:
        print(f"[!] Script Error: {e}")
