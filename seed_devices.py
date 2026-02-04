import requests

BASE_URL = "http://localhost:8080"
EMAIL = "test_user@example.com"
PASSWORD = "securepassword123"

# 1. Login
try:
    auth_resp = requests.post(f"{BASE_URL}/auth/auth", json={"email": EMAIL, "password": PASSWORD})
    auth_resp.raise_for_status()
    token = auth_resp.json()["token"]
    print(f"✅ Logged in. Token retrieved.")
except Exception as e:
    print(f"❌ Login failed: {e}")
    # Try registering if login fails
    requests.post(f"{BASE_URL}/auth/add", json={"email": EMAIL, "password": PASSWORD})
    auth_resp = requests.post(f"{BASE_URL}/auth/auth", json={"email": EMAIL, "password": PASSWORD})
    token = auth_resp.json()["token"]

headers = {"Authorization": f"Bearer {token}"}

# 2. Register Devices
devices = [
    f"sim_device_{i:03d}" for i in range(1, 7)
]

print(f"DTO Registering {len(devices)} devices...")

for dev_id in devices:
    payload = {
        "id": dev_id,
        "type": "T-X Sensor", 
        "status": "OFFLINE" 
    }
    
    # Try Adding
    resp = requests.post(f"{BASE_URL}/devices/", json=payload, headers=headers)
    
    if resp.status_code in [200, 201]:
        print(f"   [+] Registered {dev_id}")
    elif resp.status_code == 409:
        print(f"   [.] {dev_id} already exists")
    else:
        print(f"   [!] Failed {dev_id}: {resp.status_code} - {resp.text}")

print("Done. Refresh Dashboard.")
