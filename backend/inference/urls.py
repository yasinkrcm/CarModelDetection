from django.urls import path
from .views import detect, predict


urlpatterns = [
    path('detect', detect, name='detect'),
    path('predict', predict, name='predict'),
]
