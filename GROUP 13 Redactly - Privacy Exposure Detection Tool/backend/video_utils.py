import os
import cv2
import subprocess


def extract_audio_from_video(video_path, audio_path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", video_path, audio_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True
    )


def extract_frames_from_video(video_path, frames_dir, every_n_frames=30):
    os.makedirs(frames_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    frame_index = 0
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % every_n_frames == 0:
            timestamp = round(frame_index / fps, 2)
            frame_path = os.path.join(
                frames_dir,
                f"frame_{frame_index:06d}.jpg"
            )

            cv2.imwrite(frame_path, frame)

            frames.append({
                "frame_index": frame_index,
                "path": frame_path,
                "timestamp": timestamp
            })

        frame_index += 1

    cap.release()
    print(f"[INFO] Extracted {len(frames)} frames")
    return frames
