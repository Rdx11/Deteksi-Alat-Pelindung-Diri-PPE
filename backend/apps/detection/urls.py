"""
URL routing untuk detection app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.DetectionSessionViewSet, basename='session')
router.register(r'results', views.DetectionResultViewSet, basename='result')
router.register(r'alerts', views.AlertViewSet, basename='alert')

urlpatterns = [
    path('', include(router.urls)),
    path('image/', views.detect_image, name='detect_image'),
    path('video/', views.detect_video, name='detect_video'),
    path('status/<str:task_id>/', views.check_task_status, name='task_status'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
]
