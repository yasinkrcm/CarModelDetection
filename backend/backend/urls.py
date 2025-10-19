from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def index(_request):
    return JsonResponse({
        'service': 'CarModelDetection Backend',
        'status': 'ok',
        'endpoints': {
            'predict': '/api/predict (POST: multipart image or JSON image_base64)',
            'detect': '/api/detect (POST: multipart image)'
        }
    })


urlpatterns = [
    path('', index, name='index'),
    path('admin/', admin.site.urls),
    path('api/', include('inference.urls')),
]