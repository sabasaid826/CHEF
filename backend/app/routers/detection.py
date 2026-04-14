"""
Food detection router — Machine Learning Pipeline (YOLOv8).
Accepts an uploaded image, runs inference using YOLOv8 to detect food objects,
and maps them to known ingredients.
"""

from fastapi import APIRouter, UploadFile, File
import io
from PIL import Image
from ultralytics import YOLO

from app.schemas import DetectionResult, DetectedFood

router = APIRouter(prefix="/api/detect", tags=["detection"])

# ── YOLOv8 Model Initialization ───────────────────────────────────────────────
# Load the pre-trained weights (yolov8n.pt will automatically download on first run)
model = YOLO('yolov8n.pt')

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


@router.post("/image", response_model=DetectionResult)
async def detect_food(file: UploadFile = File(...)):
    """
    Real ML food detection from an uploaded image buffer.

    Passes the buffer to YOLOv8, filters out non-food items (like 'person', 'car'),
    and returns localized ingredients.
    """
    # 1. Read the bytes into a PIL Image
    image_bytes = await file.read()
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify() # Verify it's an image
        img = Image.open(io.BytesIO(image_bytes)) # Re-open after verify
    except Exception:
        return DetectionResult(
            detected_foods=[],
            ingredients=[],
            message="Invalid image file format.",
            method="yolov8_ml"
        )

    # 2. Run YOLOv8 Inference
    # We restrict execution classes to our target food indexes
    results = model.predict(source=img, classes=list(FOOD_CLASSES.keys()), conf=0.25)
    
    # 3. Parse Box Predictions
    detected: list[DetectedFood] = []
    seen_ingredients = set()

    for result in results:
        boxes = result.boxes
        for box in boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            
            if class_id in FOOD_CLASSES:
                food_name = FOOD_CLASSES[class_id]
                
                # We'll map the raw YOLO label to a more query-friendly ingredient if necessary
                # In this small set, the YOLO labels are already good queries.
                ingredient = food_name 
                
                # Prevent adding duplicate ingredients in the final list, but track all objects
                if ingredient not in seen_ingredients:
                    seen_ingredients.add(ingredient)
                
                detected.append(DetectedFood(
                    label=food_name,
                    confidence=confidence,
                    ingredient=ingredient
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
