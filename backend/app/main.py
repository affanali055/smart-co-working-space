from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date, time
from .database import engine, Base, SessionLocal
from . import models, auth
from .routers import auth as auth_router, spaces as spaces_router, bookings as bookings_router, inquiries as inquiries_router, dashboard as dashboard_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Co-Working Space Web API",
    description="Backend API for discovering, matching, and booking flexible workspaces.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router, prefix="/api")
app.include_router(spaces_router.router, prefix="/api")
app.include_router(bookings_router.router, prefix="/api")
app.include_router(inquiries_router.router, prefix="/api")
app.include_router(dashboard_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Co-Working Space API!",
        "docs": "/docs",
        "status": "online"
    }

# Seed initial data on startup
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Check if database has any users
        if db.query(models.User).count() == 0:
            print("Seeding initial workspace data...")

            # 1. Create Users
            admin_pwd = auth.get_password_hash("admin123")
            owner_pwd = auth.get_password_hash("owner123")
            user_pwd = auth.get_password_hash("user123")

            admin_user = models.User(
                email="admin@cowork.com",
                hashed_password=admin_pwd,
                full_name="Alex Administrator",
                role="admin",
                phone="+1 (555) 019-2831"
            )
            owner_user = models.User(
                email="owner@cowork.com",
                hashed_password=owner_pwd,
                full_name="Affan Space Owner",
                role="owner",
                phone="+1 (555) 024-5566"
            )
            regular_user = models.User(   
                email="user@cowork.com",
                hashed_password=user_pwd,
                full_name="Devon Developer",
                role="user",
                phone="+1 (555) 088-7722"
            )

            db.add_all([admin_user, owner_user, regular_user])
            db.commit()
            db.refresh(owner_user)

            # 2. Create Amenities
            wifi = models.Amenity(name="High-speed Wi-Fi", icon="wifi")
            parking = models.Amenity(name="Free Parking", icon="local_parking")
            cafe = models.Amenity(name="Cafeteria / Coffee", icon="coffee")
            power = models.Amenity(name="24/7 Power Backup", icon="power")
            meeting = models.Amenity(name="Meeting Rooms", icon="groups")
            security = models.Amenity(name="CCTV & Security", icon="security")
            ac = models.Amenity(name="Air Conditioning", icon="ac_unit")
            printer = models.Amenity(name="Printing Services", icon="print")

            db.add_all([wifi, parking, cafe, power, meeting, security, ac, printer])
            db.commit()

            # 3. Create Workspaces
            w1 = models.Workspace(
                name="Sleek Glasshouse Meeting Cabin",
                owner_id=owner_user.id,
                type="meeting_room",
                capacity=8,
                area_size=320.0,
                price_per_hour=25.0,
                price_per_day=150.0,
                location="San Francisco",
                address="456 Tech Boulevard, Suite A",
                description="A high-tech glass room flooded with natural light, perfect for client presentations, design reviews, or board meetings. Equipped with a 4K screen, camera and magnetic boards.",
                image_url="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
                rating=4.8,
                expectations="quiet,corporate,professional"
            )
            w1.amenities.extend([wifi, meeting, ac, security, printer])

            w2 = models.Workspace(
                name="Nexus Hive Dedicated Desk",
                owner_id=owner_user.id,
                type="shared_desk",
                capacity=1,
                area_size=40.0,
                price_per_hour=5.0,
                price_per_day=35.0,
                location="San Francisco",
                address="456 Tech Boulevard, Floor 2",
                description="Your personal permanent desk in a vibrant open-concept hall. Ideal for creators, solo remote workers, and designers looking to build community connections.",
                image_url="https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800",
                rating=4.5,
                expectations="creative,collaborative,social"
            )
            w2.amenities.extend([wifi, cafe, power, ac])

            w3 = models.Workspace(
                name="Summit Executive Private Office",
                owner_id=owner_user.id,
                type="private_cabin",
                capacity=4,
                area_size=180.0,
                price_per_hour=15.0,
                price_per_day=95.0,
                location="New York",
                address="789 Madison Avenue, Floor 14",
                description="Secure locked private suite matching a team of 4 people. Perfect for early-stage startups and consulting agencies who need privacy and focus.",
                image_url="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800",
                rating=4.9,
                expectations="quiet,focused,corporate"
            )
            w3.amenities.extend([wifi, parking, power, meeting, security, ac, printer])

            db.add_all([w1, w2, w3])
            db.commit()

            print("Database successfully seeded with demo accounts and spaces!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

