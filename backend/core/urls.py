"""
URL Configuration untuk PPE Detection System
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/detect/', include('apps.detection.urls')),
    path('api/reports/', include('apps.reports.urls')),
]

# Serve media files dalam development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
