import base64
import io
import os
from typing import Any, Dict, List
import json
import numpy as np

import torch
from PIL import Image
from django.http import JsonResponse, HttpRequest, UnreadablePostError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, JSONParser

# Global model singleton
_model = None
_model_load_error = None
_device = None


def _resolve_weights_path() -> str:
    """Resolve the most likely best.pt path within repo."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    # 1) public/models/best.pt (correct path)
    public_best = os.path.join(base_dir, 'public', 'models', 'best.pt')
    if os.path.exists(public_best):
        print(f"Found model at: {public_best}")
        return public_best
    # 2) public/best.pt (alternative path)
    alt_public = os.path.join(base_dir, 'public', 'best.pt')
    if os.path.exists(alt_public):
        print(f"Found model at: {alt_public}")
        return alt_public
    # 3) scripts/runs/.../best.pt (training output)
    scripts_best = os.path.join(base_dir, 'scripts', 'runs', 'detect', 'car_brand_detection2', 'weights', 'best.pt')
    if os.path.exists(scripts_best):
        print(f"Found model at: {scripts_best}")
        return scripts_best
    # 4) backend dir (in case user puts it here)
    backend_best = os.path.join(base_dir, 'backend', 'best.pt')
    if os.path.exists(backend_best):
        print(f"Found model at: {backend_best}")
        return backend_best
    
    # If none found, return the most likely path and let YOLO handle the error
    print(f"Model not found, trying: {public_best}")
    return public_best


def _get_model():
    global _model, _model_load_error, _device
    if _model is not None:
        return _model
    if _model_load_error is not None:
        raise _model_load_error
    try:
        from ultralytics import YOLO
        weights_path = _resolve_weights_path()
        _device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"Loading YOLO model from: {weights_path}")
        print(f"Using device: {_device}")
        
        # Load YOLO model
        model = YOLO(weights_path)
        
        # Move model to device
        try:
            model.model.to(_device)
            print(f"Model moved to {_device}")
        except Exception as e:
            print(f"Could not move model to device: {e}")
        
        _model = model
        print("Model loaded successfully!")
        return _model
    except Exception as e:
        print(f"Error loading model: {e}")
        _model_load_error = e
        raise


def _run_inference(image_bytes: bytes, imgsz: int = 512, conf: float = 0.25) -> List[Dict[str, Any]]:
    model = _get_model()
    # Convert raw bytes to numpy RGB image for Ultralytics
    pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    np_img = np.array(pil_img)
    
    print(f"Running inference on image shape: {np_img.shape}")
    results = model.predict(source=np_img, imgsz=imgsz, conf=conf, device=_device)
    
    detections: List[Dict[str, Any]] = []
    for r in results:
        if not hasattr(r, 'boxes') or r.boxes is None:
            continue
        for b in r.boxes:
            xyxy = b.xyxy[0].tolist()
            conf_v = float(b.conf[0].item()) if hasattr(b, 'conf') else None
            cls_idx = int(b.cls[0].item()) if hasattr(b, 'cls') else None
            name = None
            if hasattr(r, 'names') and cls_idx is not None:
                name = r.names.get(cls_idx)
            detections.append({
                'box': {
                    'x1': xyxy[0], 'y1': xyxy[1], 'x2': xyxy[2], 'y2': xyxy[3],
                },
                'confidence': conf_v,
                'classId': cls_idx,
                'className': name,
            })
    
    print(f"Found {len(detections)} detections")
    return detections


@csrf_exempt
@require_http_methods(["POST"]) 
def detect(request: HttpRequest) -> JsonResponse:
    """Legacy endpoint kept for compatibility: multipart with 'image' only."""
    if 'image' not in request.FILES:
        return JsonResponse({'error': 'image file field is required'}, status=400)
    image_bytes = request.FILES['image'].read()
    detections = _run_inference(image_bytes)
    return JsonResponse({'detections': detections})


@csrf_exempt
@api_view(["POST"])
@parser_classes([MultiPartParser, JSONParser])
def predict(request):
    """Unified inference endpoint.
    Accepts:
      - multipart/form-data with field 'image'
      - application/json with field 'image_base64' (data URL or raw base64)
    """
    image_bytes = None
    try:
        # Prefer multipart if provided
        if hasattr(request, 'FILES') and 'image' in request.FILES:
            image_bytes = request.FILES['image'].read()
        else:
            # Avoid forcing DRF to parse on aborted connections: read raw body safely
            content_type = request.META.get('CONTENT_TYPE', '')
            raw_body = request.body  # may raise UnreadablePostError on client abort
            if 'application/json' in content_type:
                try:
                    payload = json.loads(raw_body.decode('utf-8') or '{}')
                except Exception:
                    return JsonResponse({'error': 'invalid json'}, status=400)
                b64 = (payload.get('image_base64') or '')
                if ',' in b64:
                    b64 = b64.split(',', 1)[1]
                try:
                    image_bytes = base64.b64decode(b64)
                except Exception:
                    return JsonResponse({'error': 'invalid base64'}, status=400)
            else:
                # Fallback to DRF parsed data if available
                if isinstance(request.data, dict) and 'image_base64' in request.data:
                    b64 = request.data.get('image_base64') or ''
                    if ',' in b64:
                        b64 = b64.split(',', 1)[1]
                    try:
                        image_bytes = base64.b64decode(b64)
                    except Exception:
                        return JsonResponse({'error': 'invalid base64'}, status=400)
    except UnreadablePostError:
        return JsonResponse({'error': 'client aborted request'}, status=400)
    except Exception:
        return JsonResponse({'error': 'failed to read request body'}, status=400)

    if not image_bytes:
        return JsonResponse({'error': 'image or image_base64 required'}, status=400)

    # Optionally normalize or ensure it's a valid image
    try:
        _ = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    except Exception:
        return JsonResponse({'error': 'invalid image data'}, status=400)

    try:
        detections = _run_inference(image_bytes)
        return JsonResponse({'detections': detections})
    except Exception as e:
        print(f"Inference error: {e}")
        return JsonResponse({'error': 'inference_failed', 'detail': str(e)}, status=500)