from helpers.config import session_factory, engine
from dal.user_dao import create_user
from entities.user import User
from helpers.config import Base

# Ensure tables exist (they should, but just in case)
Base.metadata.create_all(bind=engine)

def seed_admin():
    session = session_factory()
    try:
        print("🌱 Checking for Admin User...")
        existing = session.query(User).filter(User.email == "admin@iot.com").first()
        if existing:
            print("✅ Admin user already exists.")
            return

        print("✨ Creating Admin User (admin@iot.com / admin)...")
        new_admin = User(
            email="admin@iot.com",
            password="admin", # Plain text based on previous DAO inspection, though usually should be hashed! 
                              # Looking at dao/entities, it seems simple storage.
            is_admin=True
        )
        
        success = create_user(session, new_admin)
        if success:
            print("🚀 Admin created successfully!")
        else:
            print("❌ Failed to create admin (DAO returned False).")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_admin()
