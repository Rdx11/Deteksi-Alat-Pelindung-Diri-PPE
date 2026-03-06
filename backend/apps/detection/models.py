"""
Models untuk Detection app
"""
from django.db import models
from django.contrib.auth.models import User
import uuid

class DetectionSession(models.Model):
    """Model untuk sesi deteksi (image, video, atau live)"""
    
    SESSION_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('live', 'Live Camera'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='detection_sessions')
    session_type = models.CharField(max_length=10, choices=SESSION_TYPES)
    name = models.CharField(max_length=255, blank=True)
    
    # File uploads (untuk image dan video)
    source_file = models.FileField(upload_to='detections/%Y/%m/%d/', null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.session_type} - {self.name or self.id}"


class DetectionResult(models.Model):
    """Model untuk hasil deteksi individual"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(DetectionSession, on_delete=models.CASCADE, related_name='results')
    
    # Frame info (untuk video/live)
    frame_number = models.IntegerField(null=True, blank=True)
    timestamp = models.FloatField(null=True, blank=True, help_text='Timestamp dalam detik')
    
    # Detection data
    detections = models.JSONField(default=list, help_text='Array of detected objects')
    annotated_image = models.ImageField(upload_to='annotated/%Y/%m/%d/', null=True, blank=True)
    
    # Compliance metrics
    total_persons = models.IntegerField(default=0)
    persons_with_helmet = models.IntegerField(default=0)
    persons_with_vest = models.IntegerField(default=0)
    persons_without_helmet = models.IntegerField(default=0)
    persons_without_vest = models.IntegerField(default=0)
    compliance_score = models.FloatField(default=0.0, help_text='Skor compliance 0-100')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['frame_number', 'created_at']
        indexes = [
            models.Index(fields=['session', 'frame_number']),
            models.Index(fields=['session', '-created_at']),
        ]
    
    def __str__(self):
        return f"Result {self.id} - Session {self.session.id}"


class Alert(models.Model):
    """Model untuk alert/peringatan keselamatan"""
    
    SEVERITY_LEVELS = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('danger', 'Danger'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(DetectionSession, on_delete=models.CASCADE, related_name='alerts')
    result = models.ForeignKey(DetectionResult, on_delete=models.CASCADE, related_name='alerts', null=True)
    
    # Alert info
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Status
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['session', '-created_at']),
            models.Index(fields=['is_acknowledged']),
        ]
    
    def __str__(self):
        return f"{self.severity.upper()} - {self.title}"
