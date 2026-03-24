# metadata_tools.py
print("🔥 metadata_tools.py LOADED")

import os
import json
import shutil
import subprocess
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS

# ---------------- IMAGE METADATA ----------------

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp")
MEDIA_EXTS = (".mp4", ".mov", ".avi", ".mkv", ".mp3", ".wav", ".m4a", ".flac", ".ogg")


def extract_image_metadata(file_path: str) -> dict:
    try:
        img = Image.open(file_path)
        exif = {}

        try:
            raw_exif = img._getexif()
            if raw_exif:
                for tag_id, value in raw_exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    exif[str(tag)] = str(value)
        except Exception:
            pass

        exif["format"] = str(img.format)
        exif["mode"] = str(img.mode)
        exif["size"] = f"{img.size[0]}x{img.size[1]}"
        return exif

    except Exception as e:
        print("Image metadata extraction error:", e)
        return {}


def remove_image_metadata(input_path: str, output_path: str) -> bool:
    try:
        img = Image.open(input_path)
        if img.mode != "RGB":
            img = img.convert("RGB")

        clean_img = Image.new("RGB", img.size)
        clean_img.putdata(list(img.getdata()))
        clean_img.save(output_path, format="JPEG")
        return True

    except Exception as e:
        print("Image metadata removal error:", e)
        return False


def extract_media_metadata(file_path: str) -> dict:
    try:
        cmd = [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_format", "-show_streams",
            file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return json.loads(result.stdout or "{}")
    except Exception:
        return {}


def remove_media_metadata(input_path: str, output_path: str) -> bool:
    try:
        cmd = [
            "ffmpeg", "-i", input_path,
            "-map", "0", "-c", "copy",
            "-map_metadata", "-1",
            "-map_chapters", "-1",
            output_path, "-y"
        ]
        subprocess.run(cmd, capture_output=True)
        return True
    except Exception:
        return False


def extract_metadata(file_path: str) -> dict:
    ext = Path(file_path).suffix.lower()
    if ext in IMAGE_EXTS:
        return extract_image_metadata(file_path)
    if ext in MEDIA_EXTS:
        return extract_media_metadata(file_path)
    return {}


def remove_metadata(input_path: str, output_path: str) -> bool:
    ext = Path(input_path).suffix.lower()
    if ext in IMAGE_EXTS:
        return remove_image_metadata(input_path, output_path)
    if ext in MEDIA_EXTS:
        return remove_media_metadata(input_path, output_path)
    return False


def extract_tags(meta: dict) -> dict:
    if "streams" not in meta:
        return meta

    result = {}
    fmt = meta.get("format", {})
    if "tags" in fmt:
        result["format_tags"] = fmt["tags"]

    result["streams"] = meta.get("streams", [])
    return result
