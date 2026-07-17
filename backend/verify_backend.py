import sys
from app.database import SessionLocal, engine, Base
from app import models
from app.main import seed_data

def test_database_queries():
    print("Verifying database models and connections...")
    
    # Initialize DB (creates file and tables if not exist)
    Base.metadata.create_all(bind=engine)
    
    # Seed data
    seed_data()
    
    db = SessionLocal()
    try:
        # Check users count
        users = db.query(models.User).all()
        print(f"-> Found {len(users)} registered users.")
        for u in users:
            print(f"   * {u.full_name} ({u.email}) - Role: {u.role}")
            
        # Check workspaces count
        workspaces = db.query(models.Workspace).all()
        print(f"-> Found {len(workspaces)} workspaces.")
        for w in workspaces:
            amenities_list = [a.name for a in w.amenities]
            print(f"   * '{w.name}' at {w.location} - Capacity: {w.capacity} - Amenities: {', '.join(amenities_list)}")
            
        # Check amenities count
        amenities = db.query(models.Amenity).all()
        print(f"-> Found {len(amenities)} default amenities in library.")
        
        # Verify seeding status
        if len(users) > 0 and len(workspaces) > 0:
            print("\nBackend SQLite Database verification PASSED successfully!")
            return True
        else:
            print("\nWarning: Database contains empty tables.")
            return False
            
    except Exception as e:
        print(f"Database verification FAILED with error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_database_queries()
    sys.exit(0 if success else 1)
