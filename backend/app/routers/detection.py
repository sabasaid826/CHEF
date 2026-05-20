"""
Food detection router — Machine Learning Pipeline (YOLOv8).
Accepts an uploaded image, runs inference using YOLOv8 to detect food objects,
and maps them to known ingredients.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
import io
from PIL import Image
from app.schemas import DetectionResult, DetectedFood

router = APIRouter(prefix="/api/detect", tags=["detection"])

# ── YOLOv8 Model — Lazy Initialization ─────────────────────────────────────
# Model is NOT loaded at startup. It is loaded on first request to /api/detect/image.
# This keeps the backend RAM footprint ~430 MB lighter until detection is actually used.
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB hard limit
_ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

import logging
_logger = logging.getLogger(__name__)

_model = None          # cached model instance (None = not yet loaded)
_model_available: bool | None = None  # None = untried, True = ok, False = failed


def _get_model():
    """Lazy-load the YOLOv8 model on first call, then cache it for subsequent requests."""
    global _model, _model_available
    if _model_available is None:  # first call — attempt to load
        try:
            from ultralytics import YOLO
            _model = YOLO("yolov8n.pt")
            _model_available = True
            _logger.info("YOLOv8 model loaded successfully (lazy init).")
        except Exception as _e:
            _model = None
            _model_available = False
            _logger.warning(
                f"YOLOv8 model could not be loaded: {_e}. "
                "Detection endpoint will return 503 until the model file is available."
            )
    return _model, _model_available

# COCO dataset class indices for food items we want to extract
FOOD_CLASSES = {
    46: "banana",
    47: "apple",
    48: "sandwich",
    49: "orange",
    50: "broccoli",
    51: "carrot",
    52: "hot dog",
    53: "pizza",
    54: "donut",
    55: "cake"
}


@router.post(
    "/image",
    response_model=DetectionResult,
    summary="Detect food items in an image using YOLOv8",
    responses={
        400: {"description": "Invalid image format or file too large"},
        503: {"description": "YOLOv8 model is not loaded"},
    },
)
async def detect_food(file: UploadFile = File(...)):
    """
    Real ML food detection from an uploaded image.

    - **Accepted formats**: JPEG, PNG, WebP
    - **Max file size**: 10 MB
    - Passes the image to YOLOv8, filters for food-class objects,
      and returns detected ingredients with confidence scores.
    """
    model, model_available = _get_model()
    if not model_available:
        raise HTTPException(
            status_code=503,
            detail="YOLOv8 model is not available. Please ensure yolov8n.pt is present in the backend directory."
        )

    # 1. Validate MIME type
    content_type = file.content_type or ""
    if content_type not in _ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Please upload a JPEG, PNG, or WebP image."
        )

    # 2. Read and enforce size limit
    image_bytes = await file.read()
    if len(image_bytes) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(image_bytes) // (1024*1024)} MB). Maximum allowed size is 10 MB."
        )

    # 3. Validate it is a real image
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
        img = Image.open(io.BytesIO(image_bytes))  # Re-open after verify (verify closes the stream)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image. Please upload a valid image file.")

    # 4. Run YOLOv8 Inference restricted to food classes
    results = model.predict(source=img, classes=list(FOOD_CLASSES.keys()), conf=0.25, verbose=False)  # type: ignore[union-attr]

    # 5. Parse predictions
    detected: list[DetectedFood] = []
    seen_ingredients: set[str] = set()

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())

            if class_id in FOOD_CLASSES:
                food_name = FOOD_CLASSES[class_id]
                if food_name not in seen_ingredients:
                    seen_ingredients.add(food_name)
                detected.append(DetectedFood(
                    label=food_name,
                    confidence=confidence,
                    ingredient=food_name
                ))

    if not detected:
        return DetectionResult(
            detected_foods=[],
            ingredients=[],
            message="No food items from our known classes were detected in the image.",
            method="yolov8_ml"
        )

    return DetectionResult(
        detected_foods=detected,
        ingredients=list(seen_ingredients),
        message=f"Successfully detected {len(detected)} food item(s) using YOLOv8 computer vision.",
        method="yolov8_ml"
    )
