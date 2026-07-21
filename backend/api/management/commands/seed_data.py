from django.core.management.base import BaseCommand
from api.models import User, Amenity, Workspace

class Command(BaseCommand):
    help = 'Seeds initial workspace and user data into SQLite database.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Django database with default accounts and workspaces...")

        # 1. Create Users
        admin_user, created_admin = User.objects.get_or_create(
            email="admin@cowork.com",
            defaults={
                "full_name": "Alex Administrator",
                "role": "admin",
                "phone": "+91 9380747558",
                "is_staff": True,
                "is_superuser": True
            }
        )
        if created_admin or not admin_user.check_password("admin123"):
            admin_user.set_password("admin123")
            admin_user.save()

        owner_user, created_owner = User.objects.get_or_create(
            email="owner@cowork.com",
            defaults={
                "full_name": "Affan Space Owner",
                "role": "owner",
                "phone": "+91 9380747558",
                "is_staff": True
            }
        )
        if created_owner or not owner_user.check_password("owner123"):
            owner_user.set_password("owner123")
            owner_user.save()

        regular_user, created_user = User.objects.get_or_create(
            email="user@cowork.com",
            defaults={
                "full_name": "Devon Developer",
                "role": "user",
                "phone": "+91 9380747558"
            }
        )
        if created_user or not regular_user.check_password("user123"):
            regular_user.set_password("user123")
            regular_user.save()

        # 2. Create Amenities
        wifi, _ = Amenity.objects.get_or_create(name="High-speed Wi-Fi", defaults={"icon": "wifi"})
        parking, _ = Amenity.objects.get_or_create(name="Free Parking", defaults={"icon": "local_parking"})
        cafe, _ = Amenity.objects.get_or_create(name="Cafeteria / Coffee", defaults={"icon": "coffee"})
        power, _ = Amenity.objects.get_or_create(name="24/7 Power Backup", defaults={"icon": "power"})
        meeting, _ = Amenity.objects.get_or_create(name="Meeting Rooms", defaults={"icon": "groups"})
        security, _ = Amenity.objects.get_or_create(name="CCTV & Security", defaults={"icon": "security"})
        ac, _ = Amenity.objects.get_or_create(name="Air Conditioning", defaults={"icon": "ac_unit"})
        printer, _ = Amenity.objects.get_or_create(name="Printing Services", defaults={"icon": "print"})
        studio, _ = Amenity.objects.get_or_create(name="Soundproof & Recording", defaults={"icon": "mic"})

        # 3. Create or update workspaces with photos
        workspaces_data = [
            {
                "id": 1,
                "name": "Sleek Glasshouse Meeting Cabin",
                "type": "meeting_room",
                "capacity": 8,
                "area_size": 320.0,
                "price_per_hour": 25.0,
                "price_per_day": 150.0,
                "location": "San Francisco",
                "address": "456 Tech Boulevard, Suite A",
                "description": "A high-tech glass room flooded with natural light, perfect for client presentations, design reviews, or board meetings.",
                "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
                "rating": 4.8,
                "expectations": "quiet,corporate,professional",
                "amenities": [wifi, meeting, ac, security, printer]
            },
            {
                "id": 2,
                "name": "Nexus Hive Dedicated Desk",
                "type": "shared_desk",
                "capacity": 1,
                "area_size": 40.0,
                "price_per_hour": 5.0,
                "price_per_day": 35.0,
                "location": "San Francisco",
                "address": "456 Tech Boulevard, Floor 2",
                "description": "Your personal permanent desk in a vibrant open-concept hall. Ideal for creators and solo remote workers.",
                "image_url": "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=1000",
                "rating": 4.5,
                "expectations": "creative,collaborative,social",
                "amenities": [wifi, cafe, power, ac]
            },
            {
                "id": 3,
                "name": "Summit Executive Private Office",
                "type": "private_cabin",
                "capacity": 4,
                "area_size": 180.0,
                "price_per_hour": 15.0,
                "price_per_day": 95.0,
                "location": "New York",
                "address": "789 Madison Avenue, Floor 14",
                "description": "Secure locked private suite matching a team of 4 people. Perfect for early-stage startups.",
                "image_url": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=1000",
                "rating": 4.9,
                "expectations": "quiet,focused,corporate",
                "amenities": [wifi, parking, power, meeting, security, ac, printer]
            },
            {
                "id": 4,
                "name": "Creative Podcast & Media Studio",
                "type": "private_cabin",
                "capacity": 5,
                "area_size": 220.0,
                "price_per_hour": 30.0,
                "price_per_day": 180.0,
                "location": "Los Angeles",
                "address": "102 Sunset Boulevard",
                "description": "A fully acoustic-treated media studio equipped with broadcast microphones, 4K camera mounts, lighting rigs, and soundproofing.",
                "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=1000",
                "rating": 4.9,
                "expectations": "creative,focused,media",
                "amenities": [wifi, studio, ac, power, security]
            },
            {
                "id": 5,
                "name": "Vanguard Innovation Lounge",
                "type": "shared_desk",
                "capacity": 2,
                "area_size": 80.0,
                "price_per_hour": 8.0,
                "price_per_day": 50.0,
                "location": "Austin",
                "address": "301 Congress Ave",
                "description": "Spacious ergonomic co-working workstation with standing desks, ultra-fast fiber Internet, and complimentary artisanal espresso.",
                "image_url": "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1000",
                "rating": 4.7,
                "expectations": "collaborative,tech,social",
                "amenities": [wifi, cafe, power, parking, ac]
            },
            {
                "id": 6,
                "name": "Zenith Sky Working Terrace",
                "type": "meeting_room",
                "capacity": 12,
                "area_size": 450.0,
                "price_per_hour": 40.0,
                "price_per_day": 250.0,
                "location": "Chicago",
                "address": "500 N Michigan Avenue, Penthouse",
                "description": "Penthouse glass meeting room with outdoor terrace access. Ideal for executive retreats, team workshops, and high-impact pitch events.",
                "image_url": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000",
                "rating": 5.0,
                "expectations": "luxury,corporate,executive",
                "amenities": [wifi, meeting, parking, cafe, security, ac]
            }
        ]

        for item in workspaces_data:
            amenities_list = item.pop("amenities")
            w, _ = Workspace.objects.update_or_create(
                id=item["id"],
                defaults={**item, "owner": owner_user}
            )
            w.amenities.set(amenities_list)

        self.stdout.write(self.style.SUCCESS("Database successfully seeded with 6 high-definition workspaces and WhatsApp notification phone!"))
