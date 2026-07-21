from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register', views.register_view, name='register'),
    path('auth/register/', views.register_view, name='register_slash'),
    path('auth/login', views.login_view, name='login'),
    path('auth/login/', views.login_view, name='login_slash'),
    path('auth/me', views.me_view, name='me'),
    path('auth/me/', views.me_view, name='me_slash'),

    # Workspaces / Spaces aliases
    path('spaces', views.workspaces_list_create_view, name='spaces_list_create'),
    path('spaces/', views.workspaces_list_create_view, name='spaces_list_create_slash'),
    path('spaces/<int:pk>', views.workspace_detail_view, name='spaces_detail'),
    path('spaces/<int:pk>/', views.workspace_detail_view, name='spaces_detail_slash'),

    path('workspaces', views.workspaces_list_create_view, name='workspaces_list_create'),
    path('workspaces/', views.workspaces_list_create_view, name='workspaces_list_create_slash'),
    path('workspaces/<int:pk>', views.workspace_detail_view, name='workspaces_detail'),
    path('workspaces/<int:pk>/', views.workspace_detail_view, name='workspaces_detail_slash'),

    # Bookings
    path('bookings', views.bookings_list_create_view, name='bookings_list_create'),
    path('bookings/', views.bookings_list_create_view, name='bookings_list_create_slash'),
    path('bookings/check-availability', views.check_availability_view, name='check_availability'),
    path('bookings/check-availability/', views.check_availability_view, name='check_availability_slash'),
    path('bookings/<int:pk>/status', views.booking_status_update_view, name='booking_status_update'),
    path('bookings/<int:pk>/status/', views.booking_status_update_view, name='booking_status_update_slash'),

    # Inquiries
    path('inquiries', views.inquiries_list_create_view, name='inquiries_list_create'),
    path('inquiries/', views.inquiries_list_create_view, name='inquiries_list_create_slash'),
    path('inquiries/<int:pk>/reply', views.inquiry_reply_view, name='inquiry_reply'),
    path('inquiries/<int:pk>/reply/', views.inquiry_reply_view, name='inquiry_reply_slash'),

    # Dashboard
    path('dashboard/stats', views.dashboard_stats_view, name='dashboard_stats'),
    path('dashboard/stats/', views.dashboard_stats_view, name='dashboard_stats_slash'),
]
