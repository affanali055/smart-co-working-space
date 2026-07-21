from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Amenity, Workspace, Booking, Inquiry

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'email', 'full_name', 'role', 'phone', 'is_staff', 'created_at')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('email', 'full_name', 'phone')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'phone', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'password1', 'password2'),
        }),
    )

@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon')
    search_fields = ('name',)

@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location', 'type', 'capacity', 'price_per_hour', 'price_per_day', 'owner')
    list_filter = ('type', 'location')
    search_fields = ('name', 'location', 'address', 'description')
    filter_horizontal = ('amenities',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'workspace', 'user', 'booking_date', 'start_time', 'end_time', 'total_price', 'status')
    list_filter = ('status', 'booking_date')
    search_fields = ('workspace__name', 'user__email')

@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ('id', 'workspace', 'user', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('workspace__name', 'user__email', 'message')
