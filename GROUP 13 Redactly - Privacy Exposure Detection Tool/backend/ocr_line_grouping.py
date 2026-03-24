# ocr_line_grouping.py
"""
Helper to run Tesseract OCR, group individual word boxes into lines,
assemble full text, and run your existing PII extraction (pii_utils.extract_pii).

Usage:
  from ocr_line_grouping import ocr_and_extract_pii
  res = ocr_and_extract_pii("sample.jpg")
  print(res["pii"])
  print(res["lines"])
"""

from typing import List, Dict, Any
from PIL import Image
import pytesseract
import cv2
import numpy as np

# Tesseract config - page segmentation mode. Adjust if needed.
TESSERACT_CONFIG = "--psm 6"

def preprocess_for_ocr(img_bgr: np.ndarray, upsample: float = 1.5) -> np.ndarray:
    """Resize, grayscale, denoise, and apply adaptive threshold to help OCR."""
    if upsample != 1.0:
        img_bgr = cv2.resize(img_bgr, (0, 0), fx=upsample, fy=upsample, interpolation=cv2.INTER_LINEAR)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 15, 9)
    return th

def ocr_get_word_boxes(image_path: str, do_preprocess: bool = True) -> Dict[str, Any]:
    """Run pytesseract.image_to_data and return raw data dict + images used."""
    pil = Image.open(image_path).convert("RGB")
    img = np.array(pil)[:, :, ::-1].copy()  # RGB -> BGR
    img_proc = preprocess_for_ocr(img) if do_preprocess else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    pil_proc = Image.fromarray(cv2.cvtColor(img_proc, cv2.COLOR_GRAY2RGB))
    data = pytesseract.image_to_data(pil_proc, output_type=pytesseract.Output.DICT, config=TESSERACT_CONFIG)
    return {"raw_data": data, "image": img, "image_proc": img_proc}

def group_words_to_lines(ocr_data: Dict[str, Any], y_tol: int = 10) -> List[str]:
    """
    Group OCR words into lines using vertical (cy) clustering. Returns list of joined lines.
    y_tol: vertical tolerance in pixels to consider words on same line (increase if OCR lines split).
    """
    data = ocr_data["raw_data"]
    n = len(data.get("text", []))
    words = []
    for i in range(n):
        txt = (data["text"][i] or "").strip()
        if not txt:
            continue
        left, top, width, height = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
        cx = left + width / 2.0
        cy = top + height / 2.0
        words.append({"text": txt, "left": left, "top": top, "width": width, "height": height, "cx": cx, "cy": cy})

    # sort by top then left to build reading order
    words = sorted(words, key=lambda w: (w["top"], w["left"]))

    # cluster into lines
    lines_clusters = []
    for w in words:
        if not lines_clusters:
            lines_clusters.append([w])
            continue
        last_line = lines_clusters[-1]
        avg_y = sum(x["cy"] for x in last_line) / len(last_line)
        if abs(w["cy"] - avg_y) <= y_tol:
            last_line.append(w)
        else:
            lines_clusters.append([w])

    # join words in each line in left-to-right order
    joined_lines = []
    for line in lines_clusters:
        sorted_line = sorted(line, key=lambda x: x["left"])
        text_line = " ".join(w["text"] for w in sorted_line).strip()
        if text_line:
            joined_lines.append(text_line)
    return joined_lines

def assemble_full_text(lines: List[str]) -> str:
    """Join lines into a full_text string for downstream processing."""
    return "\n".join(lines)

def ocr_and_extract_pii(image_path: str) -> Dict[str, Any]:
    """
    High-level helper:
      - runs OCR and groups words into lines
      - assembles full text
      - runs extract_pii on full text
      - also returns per-line hits where PII appears
    Returns dict:
      {
        "full_text": str,
        "lines": [str,...],
        "pii": {...},                # from extract_pii(full_text)
        "line_level_hits": [ {...} ] # each has { "line":str, "pii":{...} }
        "raw_ocr": raw pytesseract dict
      }
    """
    # Lazy import here to avoid circular import at module load time
    try:
        from pii_utils import extract_pii
    except Exception as e:
        # If pii_utils is not available for some reason, raise a clear error
        raise ImportError(f"pii_utils not importable inside ocr_and_extract_pii: {e}")

    raw = ocr_get_word_boxes(image_path, do_preprocess=True)
    lines = group_words_to_lines(raw)
    full_text = assemble_full_text(lines)
    pii = extract_pii(full_text)

    line_level_hits = []
    for ln in lines:
        if not ln.strip():
            continue
        line_pii = extract_pii(ln)
        if line_pii.get("phones") or line_pii.get("emails") or line_pii.get("address_candidates"):
            line_level_hits.append({"line": ln, "pii": line_pii})

    return {
        "full_text": full_text,
        "lines": lines,
        "pii": pii,
        "line_level_hits": line_level_hits,
        "raw_ocr": raw["raw_data"]
    }

# quick CLI test (optional)
if __name__ == "__main__":
    import json, sys
    path = sys.argv[1] if len(sys.argv) > 1 else "sample.jpg"
    out = ocr_and_extract_pii(path)
    print(json.dumps(out["pii"], indent=2))
    print("\n--- Lines with PII ---")
    for h in out["line_level_hits"]:
        print(h["line"], "->", h["pii"])
