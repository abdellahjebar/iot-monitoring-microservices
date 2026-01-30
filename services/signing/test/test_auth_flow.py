import pytest
import httpx
from helpers.config import redis_client

# Base URL of the running service (inside container, strict localhost might vary, 
# but since we run this INSIDE the container, localhost:8000 works if we run against the app port, 
# or 0.0.0.0. Actually, if running inside container, the app is on port 8000).
BASE_URL = "http://localhost:8000"

# Test Data
USER_EMAIL = "test_user@example.com"
USER_PASS = "securepassword123"

@pytest.fixture(scope="module")
def test_client():
    with httpx.Client(base_url=BASE_URL) as client:
        yield client

def test_1_register_user(test_client):
    """Test user registration"""
    payload = {"email": USER_EMAIL, "password": USER_PASS}
    response = test_client.post("/users/add", json=payload)
    
    # If user already exists (from previous runs), we accept 200 or 401(technically fail but for idempotent tests...)
    # Better: delete user first? For now, let's assume clean db or unique email.
    # To make it robust: use random email
    pass 

def test_full_auth_flow(test_client):
    """
    Test the complete flow:
    1. Register
    2. Login -> Get Token
    3. Verify Token -> Success
    4. Logout -> Success
    5. Verify Token -> Fail (Blacklisted)
    """
    # 0. Generate unique email to avoid "User already exists" errors
    import time
    unique_email = f"user_{int(time.time())}@example.com"
    
    # 1. Register
    reg_payload = {"email": unique_email, "password": USER_PASS}
    resp = test_client.post("/users/add", json=reg_payload)
    assert resp.status_code == 200, f"Registration failed: {resp.text}"
    data = resp.json()
    assert data["email"] == unique_email

    # 2. Login
    auth_payload = {"email": unique_email, "password": USER_PASS}
    resp = test_client.post("/users/auth", json=auth_payload)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    tokens = resp.json()
    assert "token" in tokens
    jwt_token = tokens["token"]
    assert jwt_token.startswith("eyJ") # Basic JWT structure check

    # 3. Verify Token (Should Assert True)
    verify_payload = {"token": jwt_token}
    resp = test_client.post("/users/verify-token", json=verify_payload)
    assert resp.status_code == 200, f"Token verification failed: {resp.text}"
    assert resp.json()["payload"]["sub"] == unique_email

    # 4. Logout (Blacklist)
    # Logout endpoint expects partial bearer token in Authorization header
    headers = {"Authorization": f"Bearer {jwt_token}"}
    resp = test_client.post("/users/logout", headers=headers)
    assert resp.status_code == 200, f"Logout failed: {resp.text}"

    # 5. Verify Token AGAIN (Should Fail - 401 or 404 or 403)
    # The API should return 401 if token is blacklisted or invalid
    verify_payload = {"token": jwt_token}
    resp = test_client.post("/users/verify-token", json=verify_payload)
    
    # We expect this to FAIL because constraints. 
    # If the code sends 200, it means the SECURITY HOLE exists.
    assert resp.status_code in [401, 403, 404], f"Security Fail: Blacklisted token was accepted! Response: {resp.text}"
