# main_advanced.py

from ocr_utils_advanced import extract_text_and_regions
from content_utils import analyze_content
from metadata_utils_advanced import extract_raw_metadata
from llm_utils import validate_and_infer_metadata
from layout_utils import analyze_layout
from pii_utils import extract_pii
from pii_utils import detect_bold_regions_from_image
from ocr_line_grouping import ocr_and_extract_pii
import cv2   # OpenCV (needed for image operations used in content_utils / OCR)


def process_image_advanced(image_path):
    """
    Processes an image using an advanced pipeline for comprehensive data extraction.
    Uses ocr_line_grouping. Falls back to extract_text_and_regions if grouping helper is not available.
    Returns a dict with keys: metadata, content, ocr, layout, bold_regions (optional), pii.
    """
    results = {}

    # 1. Metadata
    try:
        raw_metadata = extract_raw_metadata(image_path)
        results["metadata"] = validate_and_infer_metadata(raw_metadata)
    except FileNotFoundError:
        raise
    except Exception as e:
        results["metadata"] = {"error": f"metadata_failed: {e}"}

    # 2. Content (objects, faces, scene)
    try:
        results["content"] = analyze_content(image_path)
    except Exception as e:
        results["content"] = {"error": f"content_analysis_failed: {e}"}

    # 3. OCR: prefer ocr_line_grouping (gives lines + grouped text) -> better for addresses/phones
    ocr_full = ""
    ocr_lines = []
    raw_ocr = None

    if ocr_and_extract_pii is not None:
        try:
            ocr_result = ocr_and_extract_pii(image_path)
            # ocr_and_extract_pii returns: full_text, lines, pii, line_level_hits, raw_ocr
            ocr_full = ocr_result.get("full_text", "")
            ocr_lines = ocr_result.get("lines", [])
            raw_ocr = ocr_result.get("raw_ocr", None)
            results["ocr"] = {
                "full_text": ocr_full,
                "lines": ocr_lines,
                "line_level_hits": ocr_result.get("line_level_hits", [])
            }
            # also include the PII extracted by ocr_line_grouping (same shape as extract_pii)
            results["pii"] = ocr_result.get("pii", {})
        except Exception as e:
            # fallback to original OCR method below
            results["ocr"] = {"error": f"ocr_line_grouping_failed: {e}"}
            ocr_and_fallback = True
    else:
        ocr_and_fallback = True

    # If fallback required or ocr_line_grouping not used, use existing OCR
    if 'ocr' not in results or ("error" in results.get("ocr", {})):
        try:
            text_data = extract_text_and_regions(image_path)
            # If your old extractor returns word-level pieces, we store them in 'raw'
            results["ocr"] = {"raw": text_data}
            # try to locate a concatenated full_text if the extractor provides one
            if isinstance(text_data, dict) and "full_text" in text_data:
                ocr_full = text_data["full_text"]
                results["ocr"]["full_text"] = ocr_full
            else:
                # join words if extractor gives a list of words (best-effort)
                if isinstance(text_data, dict) and "words" in text_data:
                    ocr_full = " ".join(w.get("text","") for w in text_data["words"])
                    results["ocr"]["full_text"] = ocr_full
                else:
                    # store raw string if extractor returned one
                    if isinstance(text_data, str):
                        ocr_full = text_data
                        results["ocr"]["full_text"] = ocr_full
        except Exception as e:
            results["ocr"] = {"error": f"ocr_fallback_failed: {e}"}
            ocr_full = ""

    # 4. Layout analysis (may depend on OCR output)
    try:
        results["layout"] = analyze_layout(image_path, results.get("ocr", {}))
    except Exception as e:
        results["layout"] = {"error": f"layout_failed: {e}"}

    # 5. Bold regions (optional)
    if detect_bold_regions_from_image is not None:
        try:
            results["bold_regions"] = detect_bold_regions_from_image(image_path)
        except Exception as e:
            results["bold_regions"] = {"error": f"detect_bold_failed: {e}"}
    else:
        results["bold_regions"] = None

    # 6. PII - if not already set by ocr_line_grouping, run extract_pii on assembled full text
    if "pii" not in results:
        try:
            # ensure we pass some text (full_text) not the low-level word list
            results["pii"] = extract_pii(ocr_full or "")
        except Exception as e:
            results["pii"] = {"error": f"pii_extraction_failed: {e}"}

    return results


if __name__ == "__main__":
    img_path = "sample.jpg"
    print(f"--- Processing image with advanced pipeline: {img_path} ---")
    try:
        details = process_image_advanced(img_path)
        print("\n--- Comprehensive Details Extracted ---")
        # For structured output, print as JSON
        import json
        print(json.dumps(details, indent=2))
    except FileNotFoundError:
        print(f"Error: The file '{img_path}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")