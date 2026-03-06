"""
Admin configuration untuk Detection app
"""
from django.contrib import admin
from .models import DetectionSession, DetectionResult, Alert

@admin.register(DetectionSession)
class DetectionSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_type', 'name', 'created_at', 'is_active']
    list_filter = ['session_type', 'is_active', 'created_at']
    search_fields = ['name', 'user__username']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(DetectionResult)
class DetectionResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'frame_number', 'compliance_score', 'created_at']
    list_filter = ['created_at']
    search_fields = ['session__name']
    readonly_fields = ['id', 'created_at']

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['id', 'severity', 'title', 'is_acknowledged', 'created_at']
    list_filter = ['severity', 'is_acknowledged', 'created_at']
    search_fields = ['title', 'message']
    readonly_fields = ['id', 'created_at']
