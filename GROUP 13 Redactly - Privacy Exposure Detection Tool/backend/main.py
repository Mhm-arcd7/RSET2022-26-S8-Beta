print("RUNNING FROM:", __file__)
from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from frame_utils import extract_frames_from_video
from face_detector import detect_faces
from video_utils import extract_audio_from_video
from risk_engine import analyze_privacy_risks
import uuid
import os
import shutil
import whisper
import spacy
import cv2
import numpy as np

from pydub import AudioSegment, generators

# ===============================
# IMAGE LOGIC IMPORTS
# ===============================

from ocr_utils_advanced import extract_text_and_regions
from pii_utils import extract_pii

# ===============================
# METADATA IMPORTS
# ===============================

from metadata_tools import (
    extract_metadata,
    remove_metadata,
    extract_tags
)
# ===============================
# HACKABILITY IMPORTS
# ===============================
from hackability_score import (
    compute_privacy_risk,
    generate_detected_items_from_pii
)

# ===============================
# INIT
# ===============================

app = FastAPI(title="REDACTLY Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

whisper_model = None
nlp = None

@app.on_event("startup")
async def load_models():
    global whisper_model, nlp
    print("⏳ Loading Whisper model...")
    whisper_model = whisper.load_model("base")

    print("⏳ Loading spaCy model...")
    nlp = spacy.load("en_core_web_sm")

    print("✅ Models loaded successfully")

AUDIO_WHISPER_RESULTS = {}
IMAGE_TEXT_CACHE = {}

# =====================================================
# HEALTH
# =====================================================

@app.get("/")
def health():
    return {"status": "REDACTLY backend running"}

# =====================================================
# SERVE UPLOADED IMAGES
# =====================================================

@app.get("/uploads/{filename}")
def get_uploaded_file(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        return {"error": "File not found"}
    return FileResponse(path, filename=filename)

# =====================================================
# 🔊 AUDIO ANALYSIS
# =====================================================

@app.post("/analyze/audio")
async def analyze_audio(file: UploadFile = File(...), context: str = Form("Public")):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]

    audio_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = whisper_model.transcribe(audio_path, word_timestamps=True)
        transcript = result.get("text", "").strip()
    except Exception as e:
        print("Whisper error:", e)
        transcript = ""
        result = {}

    entities = []
    risk_score = 0.0

    if transcript:
        pii_data = extract_pii(transcript)
        detected_items = generate_detected_items_from_pii(pii_data)
        # Context factor (you can later take from UI)
        #context_of_use = 0.8
        # Convert user context to Ci value
        context_map = {
        "Public": 1.0,
        "Restricted": 0.7,
        "Private": 0.4
        }
        Ci = context_map.get(context, 1.0)

        risk_score = compute_privacy_risk(detected_items, Ci)

        # 1️⃣ spaCy entities
        for label, values in pii_data.get("entities", {}).items():
            for val in values:
                entities.append({
                    "text": val,
                    "type": label
                })

        # 2️⃣ Structured PII
        structured_fields = [
            ("emails", "EMAIL"),
            ("phones", "PHONE"),
            ("pan_numbers", "PAN"),
            ("passport_numbers", "PASSPORT"),
            ("account_numbers", "ACCOUNT"),
            ("credit_cards", "CREDIT_CARD"),
            ("ifsc_codes", "IFSC")
        ]

        for field, label in structured_fields:
            for val in pii_data.get(field, []):
                entities.append({
                    "text": val,
                    "type": label
                })

    AUDIO_WHISPER_RESULTS[file_id] = result

    return {
        "file_id": file_id,
        "transcript": transcript,
        "entities": entities,
        "hackability_score": risk_score,
        "context_used": context
    }

# =====================================================
# HAK
# =====================================================

@app.post("/calculate/audio-risk")
async def calculate_audio_risk(
    file_id: str = Form(...),
    context: str = Form("Public")
):
    whisper_result = AUDIO_WHISPER_RESULTS.get(file_id)

    if not whisper_result:
        return {"error": "Audio result not found"}

    transcript = whisper_result.get("text", "").strip()

    if not transcript:
        return {"hackability_score": 0}

    pii_data = extract_pii(transcript)
    detected_items = generate_detected_items_from_pii(pii_data)

    context_map = {
        "Public": 1.0,
        "Restricted": 0.7,
        "Private": 0.4
    }

    Ci = context_map.get(context, 1.0)

    risk_score = compute_privacy_risk(detected_items, Ci)

    return {
        "hackability_score": risk_score,
        "context_used": context
    }


# # =====================================================
# 🔕 AUDIO REDACTION
# =====================================================

def normalize(word):
    return (
        word.lower()
        .replace(".", "")
        .replace(",", "")
        .replace("!", "")
        .replace("?", "")
        .replace("'", "")
        .replace('"', "")
        .strip()
    )


def normalize_text(text):
    return (
        text.lower()
        .replace(".", "")
        .replace(",", "")
        .replace("!", "")
        .replace("?", "")
        .replace("'", "")
        .replace('"', "")
        .replace("-", "")
        .replace(" ", "")
        .strip()
    )


def get_selected_timestamps(whisper_result, selected_words):
    timestamps = []

    if not whisper_result:
        return timestamps

    # Normalize selected phrases
    normalized_targets = {
        normalize_text(word) for word in selected_words if normalize_text(word)
    }

    for segment in whisper_result.get("segments", []):
        words = segment.get("words", [])

        for w in words:
            raw_word = w.get("word", "")
            start = w.get("start")
            end = w.get("end")

            if not start or not end or end <= start:
                continue

            normalized_word = normalize_text(raw_word)

            if not normalized_word:
                continue

            # 1️⃣ Direct exact match
            if normalized_word in normalized_targets:
                timestamps.append((start, end))
                continue

            # 2️⃣ Safe partial match (ONLY if word length >= 3)
            # Prevents tiny matches like "is", "a", etc.
            if len(normalized_word) >= 3:
                for target in normalized_targets:
                    if normalized_word in target:
                        timestamps.append((start, end))
                        break

    return timestamps


def apply_beep(audio, timestamps):
    for start, end in timestamps:
        start_ms = int(start * 1000)
        end_ms = int(end * 1000)
        duration = end_ms - start_ms

        silence = AudioSegment.silent(duration=duration)
        beep = generators.Sine(1000).to_audio_segment(duration=duration).apply_gain(-3)

        audio = audio[:start_ms] + silence + audio[end_ms:]
        audio = audio.overlay(beep, position=start_ms)

    return audio


def apply_mute(audio, timestamps):
    for start, end in timestamps:
        start_ms = int(start * 1000)
        end_ms = int(end * 1000)
        silence = AudioSegment.silent(duration=(end_ms - start_ms))
        audio = audio[:start_ms] + silence + audio[end_ms:]
    return audio


def apply_trim(audio, timestamps):
    # Remove segments entirely
    offset = 0
    for start, end in timestamps:
        start_ms = int(start * 1000) - offset
        end_ms = int(end * 1000) - offset
        audio = audio[:start_ms] + audio[end_ms:]
        offset += (end_ms - start_ms)
    return audio


@app.post("/redact/audio")
async def redact_audio(
    file_id: str = Form(...),
    mode: str = Form("beep"),
    targets: str = Form("")
):

    input_audio = None
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(file_id):
            input_audio = os.path.join(UPLOAD_DIR, fname)
            break

    if not input_audio:
        return {"error": "Audio file not found"}

    whisper_result = AUDIO_WHISPER_RESULTS.get(file_id)

    selected_words = set()
    for phrase in targets.split(","):
        for part in phrase.strip().lower().split():
            selected_words.add(part)

    output_audio_path = os.path.join(OUTPUT_DIR, f"{file_id}_redacted.wav")

    if not whisper_result or not selected_words:
        shutil.copy(input_audio, output_audio_path)
        return {"download_url": f"/download/{file_id}_redacted.wav"}

    timestamps = get_selected_timestamps(whisper_result, selected_words)

    audio = AudioSegment.from_file(input_audio)

    if mode == "beep":
        audio = apply_beep(audio, timestamps)
    elif mode == "mute":
        audio = apply_mute(audio, timestamps)
    elif mode == "trim":
        audio = apply_trim(audio, timestamps)

    audio.export(output_audio_path, format="wav")

    return {"download_url": f"/download/{file_id}_redacted.wav"}

# =====================================================
# 🖼️ IMAGE ANALYSIS
# =====================================================

def detect_faces(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(60, 60)
    )

    results = []

    for (x, y, w, h) in faces:
        results.append({
            "text": "FACE",
            "box": {
                "left": int(x),
                "top": int(y),
                "width": int(w),
                "height": int(h)
            }
        })

    return results

def detect_barcode(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Gradient in X direction
    gradX = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=-1)
    gradX = cv2.convertScaleAbs(gradX)

    blurred = cv2.GaussianBlur(gradX, (9, 9), 0)
    _, thresh = cv2.threshold(blurred, 225, 255, cv2.THRESH_BINARY)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 7))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    closed = cv2.erode(closed, None, iterations=2)
    closed = cv2.dilate(closed, None, iterations=2)

    contours, _ = cv2.findContours(
        closed.copy(),
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    results = []

    for c in contours:
        area = cv2.contourArea(c)
        if area > 1000:  # filter small noise
            x, y, w, h = cv2.boundingRect(c)

            results.append({
                "text": "BARCODE",
                "box": {
                    "left": int(x),
                    "top": int(y),
                    "width": int(w),
                    "height": int(h)
                }
            })

    return results

def detect_signature(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Invert so signature becomes white
    _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)

    # Remove small noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5,5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(
        thresh,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    results = []

    for c in contours:
        area = cv2.contourArea(c)

        # Filter very small or very large areas
        if 500 < area < 10000:
            x, y, w, h = cv2.boundingRect(c)

            # Signature usually wide but not too tall
            if w > 40 and h > 10:
                results.append({
                    "text": "SIGNATURE",
                    "box": {
                        "left": int(x),
                        "top": int(y),
                        "width": int(w),
                        "height": int(h)
                    }
                })

    return results



@app.post("/analyze/image")
async def analyze_image(
    file: UploadFile = File(...),
    context: str = Form("Public")
):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]

    filename = f"{file_id}{ext}"
    image_path = os.path.join(UPLOAD_DIR, filename)

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # OCR detection
        ocr_results = extract_text_and_regions(image_path)

        # Add face detection
        face_results = detect_faces(image_path)

        # Add barcode detection
        barcode_results = detect_barcode(image_path)

         # Add sign detection
        signature_results = detect_signature(image_path)

        # Combine everything
        all_results = ocr_results + face_results + barcode_results + signature_results

        combined_text = " ".join([item["text"] for item in ocr_results])
        IMAGE_TEXT_CACHE[file_id] = combined_text
        pii_entities = extract_pii(combined_text)
        detected_items = generate_detected_items_from_pii(pii_entities)
        context_map = {
            "Public": 1.0,
            "Restricted": 0.7,
            "Private": 0.4
            }
        Ci = context_map.get(context, 1.0)
        risk_score = compute_privacy_risk(detected_items, Ci)
        return {
            "file_id": file_id,
            "image_url": f"http://127.0.0.1:8000/uploads/{filename}",
            "ocr_results": all_results,
            "pii_entities": pii_entities,
            "hackability_score": risk_score,
            "context_used": context
            }

    except Exception as e:
        print("Image analysis error:", e)
        return {"error": "Image processing failed"}
    
    from fastapi import Form

@app.post("/calculate/image-risk")
async def calculate_image_risk(
    file_id: str = Form(...),
    context: str = Form("Public")
):
    combined_text = IMAGE_TEXT_CACHE.get(file_id)

    if not combined_text:
        return {"error": "Image data not found"}

    pii_data = extract_pii(combined_text)
    detected_items = generate_detected_items_from_pii(pii_data)

    context_map = {
        "Public": 1.0,
        "Restricted": 0.7,
        "Private": 0.4
    }

    Ci = context_map.get(context, 1.0)

    risk_score = compute_privacy_risk(detected_items, Ci)

    return {
        "hackability_score": risk_score,
        "context_used": context
    }

# =====================================================
# 🖼️ CANVAS UPLOAD
# =====================================================

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):

    file_id = f"img_{uuid.uuid4().hex}.png"
    image_path = os.path.join(UPLOAD_DIR, file_id)

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ocr_results = extract_text_and_regions(image_path)
    combined_text = " ".join([item["text"] for item in ocr_results])
    pii = extract_pii(combined_text)

    regions = []

    for i, item in enumerate(ocr_results):
        text = item["text"]
        box = item["box"]

        label = None

        if text in pii.get("emails", []):
            label = "EMAIL"
        elif text in pii.get("phones", []):
            label = "PHONE"
        elif any(text in addr for addr in pii.get("address_candidates", [])):
            label = "ADDRESS"

        if label:
            regions.append({
                "id": i + 1,
                "type": label,
                "text": label,
                "selected": True,
                "x": box["left"],
                "y": box["top"],
                "w": box["width"],
                "h": box["height"]
            })

    return {
        "image_id": file_id,
        "regions": regions
    }

# =====================================================
# 🖼️ APPLY REDACTION
# =====================================================

@app.post("/apply")
async def apply_redaction(data: dict = Body(...)):

    image_id = data.get("image_id")
    regions = data.get("regions", [])

    image_path = os.path.join(UPLOAD_DIR, image_id)

    if not os.path.exists(image_path):
        return {"error": "Image not found"}

    img = cv2.imread(image_path)

    for r in regions:
        if r.get("selected"):
            x = int(r["x"])
            y = int(r["y"])
            w = int(r["w"])
            h = int(r["h"])

            roi = img[y:y+h, x:x+w]
            img[y:y+h, x:x+w] = cv2.GaussianBlur(roi, (51, 51), 0)

    out_name = f"redacted_{image_id}"
    out_path = os.path.join(OUTPUT_DIR, out_name)

    cv2.imwrite(out_path, img)

    return {
        "redacted_url": f"http://127.0.0.1:8000/download/{out_name}"
    }

# =====================================================
# 🏷️ VIDEO ANALYSIS
# =====================================================

@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)):

    video_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]

    video_path = os.path.join(UPLOAD_DIR, f"{video_id}{ext}")
    audio_path = os.path.join(UPLOAD_DIR, f"{video_id}.wav")
    frames_dir = os.path.join(UPLOAD_DIR, f"{video_id}_frames")

    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 1️⃣ Extract audio
    extract_audio_from_video(video_path, audio_path)

    # 2️⃣ Extract frames
    frames = extract_frames_from_video(
        video_path,
        frames_dir,
        every_n_frames=30
    )

    # 3️⃣ Analyze frames
    frame_results = []

    for f in frames[:15]:  # limit for speed
        img = cv2.imread(f)

        face_result = detect_faces(img)

        frame_results.append({
            "frame": os.path.basename(f),
            "analysis": {
                "content": {
                    "faces": face_result
                }
            }
        })

    # 4️⃣ Whisper transcript
    transcript = ""
    entities = []

    try:
        result = whisper_model.transcribe(audio_path)
        transcript = result.get("text", "").strip()

        if transcript:
            doc = nlp(transcript)
            entities = [
                {"text": ent.text, "type": ent.label_}
                for ent in doc.ents
            ]
    except:
        pass

    VIDEO_CACHE[video_id] = {
        "entities": entities,
        "frames": frame_results
    }

    return {
        "video_id": video_id,
        "frames_processed": len(frame_results),
        "entities": entities
    }

@app.post("/calculate/video-risk")
async def calculate_video_risk(
    video_id: str = Form(...)
):

    data = VIDEO_CACHE.get(video_id)

    if not data:
        return {"error": "Video not found"}

    risks = analyze_privacy_risks(
        transcript_entities=data["entities"],
        frame_results=data["frames"]
    )

    return {
        "privacy_risks": risks
    }

# =====================================================
# 🏷️ METADATA ANALYSIS
# =====================================================

@app.post("/analyze/metadata")
async def analyze_metadata(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]

    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    output_path = os.path.join(OUTPUT_DIR, f"{file_id}_clean{ext}")

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    metadata_before = extract_metadata(input_path)
    success = remove_metadata(input_path, output_path)
    metadata_after = extract_metadata(output_path) if success else {}

    return {
        "file_id": file_id,
        "metadata_before": extract_tags(metadata_before),
        "metadata_after": extract_tags(metadata_after),
        "download_url": f"/download/{file_id}_clean{ext}" if success else None
    }

# =====================================================
# HAK
# =====================================================

@app.post("/calculate/audio-risk")
async def calculate_audio_risk(
    file_id: str = Form(...),
    context: str = Form("Public")
):
    whisper_result = AUDIO_WHISPER_RESULTS.get(file_id)

    if not whisper_result:
        return {"error": "Audio result not found"}

    transcript = whisper_result.get("text", "").strip()

    if not transcript:
        return {"hackability_score": 0}

    pii_data = extract_pii(transcript)
    detected_items = generate_detected_items_from_pii(pii_data)

    context_map = {
        "Public": 1.0,
        "Restricted": 0.7,
        "Private": 0.4
    }

    Ci = context_map.get(context, 1.0)

    risk_score = compute_privacy_risk(detected_items, Ci)

    return {
        "hackability_score": risk_score,
        "context_used": context
    }

# =====================================================
# DOWNLOAD
# =====================================================

@app.get("/download/{filename}")
def download_file(filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        return {"error": "File not found"}
    return FileResponse(path, filename=filename)