from helpers.config import redis_client, EXPIRE_TIME
from sqlalchemy.orm import Session

# Convert EXPIRE_TIME (minutes) to seconds for Redis TTL
REDIS_TTL = int(EXPIRE_TIME) * 60

def is_blacklist_token(session: Session, token: str):
    # Check if token exists in Redis
    # redis_client.db is 0 by default, keys are strings
    return redis_client.exists(f"blacklist_token:{token}") > 0

def add_token_to_blacklist(session: Session, token: str):
    try:
        # Key: blacklist_token:{token}
        # Value: "revoked" (or any verify string)
        # ex: Expiration time in seconds
        redis_client.setex(f"blacklist_token:{token}", REDIS_TTL, "revoked")
        return True
    except Exception as e:
        # In a real app, log the error: logger.error(f"Redis error: {e}")
        return False
