# Model Assets

This directory is reserved for compiled model weights and serialized ML objects (`.pkl`, `.pt`, `.onnx`).

### Current Implementation
- **Computer Vision**: `backend/app/routers/detection.py` uses **YOLOv8 Nano** (`yolov8n.pt`, 6.5 MB) for real-time food detection from uploaded images. The model is pre-trained on COCO and filtered to 10 food-related class indices (banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake).
- **Model Location**: The weights file `yolov8n.pt` lives in `backend/` and is loaded at server startup by the Ultralytics library.
- **Inference**: Runs on CPU by default, with a 0.25 confidence threshold. Returns detected food labels, confidence scores, and mapped ingredient names.

### Planned ML Enhancements
- **Fine-tuned Food Detection**: Train YOLOv8 on the Food-101 dataset to expand beyond 10 COCO classes to 100+ food categories.
- **NLP Model**: spaCy/BERT for advanced ingredient intent classification and smarter recipe matching.

*(Model weights are excluded from source control via `.gitignore` to prevent repository bloat.)*
