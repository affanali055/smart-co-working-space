from rest_framework import serializers
from .models import User, Amenity, Workspace, Booking, Inquiry

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'created_at']

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'icon']

class WorkspaceSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'owner_id', 'type', 'capacity', 'area_size',
            'price_per_hour', 'price_per_day', 'location', 'address',
            'description', 'image_url', 'rating', 'expectations',
            'created_at', 'amenities'
        ]

class BookingSerializer(serializers.ModelSerializer):
    workspace_id = serializers.IntegerField(source='workspace.id')
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    workspace = WorkspaceSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'workspace_id', 'user_id', 'booking_date',
            'start_time', 'end_time', 'total_price', 'status',
            'created_at', 'workspace', 'user'
        ]

class InquirySerializer(serializers.ModelSerializer):
    workspace_id = serializers.IntegerField(source='workspace.id')
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    workspace = WorkspaceSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Inquiry
        fields = [
            'id', 'workspace_id', 'user_id', 'message', 'reply',
            'status', 'created_at', 'workspace', 'user'
        ]
