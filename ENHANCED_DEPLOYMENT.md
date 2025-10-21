# Enhanced Car Brand Detection System

## Overview

This enhanced system addresses false positive issues in car brand detection by:

1. **Dataset Augmentation**: Generates challenging training data with various conditions
2. **Enhanced Training**: Uses expanded dataset with advanced YOLOv8 configurations
3. **Optimized Inference**: Implements warmup, tunable parameters, and false positive filtering
4. **Real-time Tuning**: Supports runtime parameter adjustment via API

## Quick Start

### 1. Full Pipeline Deployment
```bash
# Run complete pipeline (augmentation + training + deployment)
python scripts/deploy_enhanced_model.py --full-pipeline
```

### 2. Step-by-Step Deployment

#### Augment Dataset
```bash
# Generate augmented training data
python scripts/augment_dataset.py \
    --input scripts/Car-Brand-Detection-3/train \
    --output scripts/Car-Brand-Detection-3/train_augmented \
    --multiplier 2
```

#### Merge Datasets
```bash
# Merge original and augmented datasets
python scripts/merge_datasets.py \
    --original scripts/Car-Brand-Detection-3/train \
    --augmented scripts/Car-Brand-Detection-3/train_augmented \
    --output scripts/Car-Brand-Detection-3/train_merged \
    --update-yaml
```

#### Train Enhanced Model
```bash
# Train with expanded dataset
python scripts/train_enhanced_model.py \
    --data scripts/Car-Brand-Detection-3/data_merged.yaml \
    --epochs 100 \
    --export \
    --copy-public
```

#### Monitor Training
```bash
# Watch training progress
python scripts/monitor_training.py --watch --interval 30
```

#### Start Services
```bash
# Backend (Django)
cd backend
pip install -r requirements.txt
python manage.py runserver

# Frontend (Next.js)
npm install
npm run dev
```

## Key Improvements

### 1. Dataset Augmentation (`scripts/augment_dataset.py`)
- **Grayscale conversion**: 25% chance per image
- **Lighting variations**: Brightness/contrast adjustments
- **HSV shifts**: Color tone variations
- **Weather simulation**: Fog, rain, snow effects
- **Blur and noise**: Realistic image degradation
- **Perspective transforms**: Angle diversity

### 2. Enhanced Training (`scripts/train_enhanced_model.py`)
- **Advanced parameters**: Optimized learning rates, weight decay
- **Data augmentation**: Controlled augmentation during training
- **Early stopping**: Prevents overfitting
- **Model export**: ONNX and TensorRT formats
- **Performance monitoring**: Real-time metrics

### 3. Optimized Inference (`backend/inference/views.py`)
- **Warmup**: Reduces cold-start latency
- **Tunable parameters**: Runtime confidence, IoU, image size
- **False positive filtering**: Removes tiny detections
- **Environment variables**: Easy configuration
- **Query parameters**: Runtime tuning via API

### 4. Frontend Integration (`app/demo/page.js`)
- **Higher confidence**: Default 0.4 threshold
- **Consistent sizing**: 640px image processing
- **Real-time tuning**: Query parameter support
- **Better UX**: Improved detection stability

## Configuration

### Environment Variables
```bash
# Backend inference parameters
export YOLO_CONF=0.35          # Confidence threshold
export YOLO_IOU=0.45           # IoU threshold for NMS
export YOLO_IMGSZ=640          # Input image size
export YOLO_MAX_DET=50         # Maximum detections
export YOLO_MIN_REL_AREA=0.0015 # Minimum relative area (filters tiny boxes)
```

### API Parameters
```bash
# Runtime tuning via query parameters
curl -X POST "http://localhost:8000/api/predict?conf=0.5&imgsz=800" \
     -F "image=@test.jpg"
```

## Monitoring and Testing

### Training Monitor
```bash
# Watch training progress
python scripts/monitor_training.py --watch

# Check current status
python scripts/monitor_training.py --runs-dir runs/detect/car_brand_detection_enhanced
```

### API Testing
```bash
# Test with single image
python scripts/test_api.py --image test_car.jpg

# Test with multiple parameters
python scripts/test_api.py --image test_car.jpg --multi-test
```

### Performance Testing
```bash
# Test response times
python scripts/test_api.py --image test_car.jpg --conf 0.3
python scripts/test_api.py --image test_car.jpg --conf 0.6
```

## File Structure

```
scripts/
├── augment_dataset.py          # Dataset augmentation
├── merge_datasets.py          # Dataset merging
├── train_enhanced_model.py    # Enhanced training
├── monitor_training.py        # Training monitoring
├── deploy_enhanced_model.py   # Full deployment pipeline
├── test_api.py               # API testing
└── optimize-model.py         # Model optimization

backend/
├── inference/views.py        # Enhanced inference API
└── requirements.txt         # Updated dependencies

app/
└── demo/page.js             # Enhanced frontend with tuning
```

## Performance Improvements

### Latency Optimization
- **Model warmup**: Eliminates cold-start delays
- **Optimized inference**: Reduced image processing overhead
- **Efficient parameters**: Balanced speed vs accuracy

### False Positive Reduction
- **Higher confidence**: Default 0.35 threshold
- **Size filtering**: Removes tiny detections
- **Better training**: Augmented dataset with challenging conditions
- **Runtime tuning**: Adjustable parameters per request

### Accuracy Improvements
- **Expanded dataset**: 2x more training data
- **Challenging conditions**: Weather, lighting, angles
- **Advanced training**: Better hyperparameters
- **Validation**: Comprehensive testing pipeline

## Troubleshooting

### Training Issues
```bash
# Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"

# Monitor training
python scripts/monitor_training.py --watch
```

### API Issues
```bash
# Test backend connectivity
python scripts/test_api.py --image test.jpg

# Check backend logs
cd backend && python manage.py runserver --verbosity=2
```

### Performance Issues
```bash
# Test with different parameters
python scripts/test_api.py --image test.jpg --multi-test

# Check model optimization
python scripts/optimize-model.py --model runs/detect/car_brand_detection_enhanced/weights/best.pt --test
```

## Next Steps

1. **Monitor training progress** and adjust parameters if needed
2. **Test API performance** with various images and parameters
3. **Deploy to production** using the optimized models
4. **Fine-tune thresholds** based on real-world performance
5. **Add monitoring** for production deployment

## Support

For issues or questions:
1. Check training logs in `runs/detect/car_brand_detection_enhanced/`
2. Test API with `scripts/test_api.py`
3. Monitor system performance with `scripts/monitor_training.py`
4. Review configuration in `backend/inference/views.py`
