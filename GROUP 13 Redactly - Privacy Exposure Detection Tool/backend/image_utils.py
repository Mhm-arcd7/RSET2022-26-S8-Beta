import os
import cv2
import pytesseract
from datetime import datetime
from PIL import Image
from ocr_line_grouping import ocr_and_extract_pii
from pii_utils import extract_pii

# Face detection
def detect_faces(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    faces = face_cascade.detectMultiScale(gray, 1.1, 5)

    regions = []
    for i, (x, y, w, h) in enumerate(faces):
        regions.append({
            "id": f"face_{i}",
            "type": "FACE",
            "text": "FACE",
            "x": int(x),
            "y": int(y),
            "w": int(w),
            "h": int(h),
            "selected": True
        })

    return regions


# OCR + PII detection
def analyze_image(image_path):
    result = ocr_and_extract_pii(image_path)

    regions = []

    # Extract PII from full text
    pii_data = result.get("pii", {})
    lines = result.get("lines", [])

    for line in lines:
        line_pii = extract_pii(line)

        if (
            line_pii["emails"]
            or line_pii["phones"]
            or line_pii["address_candidates"]
        ):
            # Rough bounding box detection via OCR raw data
            # (Basic version – can improve later)
            regions.append({
                "id": f"pii_{len(regions)}",
                "type": "TEXT",
                "text": "PII",
                "x": 50,
                "y": 50,
                "w": 200,
                "h": 40,
                "selected": True
            })

    # Face detection
    regions.extend(detect_faces(image_path))

    return regions


# Apply blur
def apply_blur(image_path, regions, output_path):
    img = cv2.imread(image_path)

    for r in regions:
        if r.get("selected"):
            x, y, w, h = int(r["x"]), int(r["y"]), int(r["w"]), int(r["h"])
            roi = img[y:y+h, x:x+w]
            img[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (51, 51), 0)

    cv2.imwrite(output_path, img)