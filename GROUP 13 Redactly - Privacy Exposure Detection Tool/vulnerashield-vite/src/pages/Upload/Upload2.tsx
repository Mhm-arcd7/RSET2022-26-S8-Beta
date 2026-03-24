import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Upload.css";

type UploadType = "image" | "audio" | "video" | "metadata";

const Upload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<UploadType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openFilePicker = (type: UploadType) => {
    setUploadType(type);
    if (!fileInputRef.current) return;

    if (type === "image") fileInputRef.current.accept = "image/*";
    if (type === "audio") fileInputRef.current.accept = "audio/*";
    if (type === "video") fileInputRef.current.accept = "video/*";
    if (type === "metadata") fileInputRef.current.accept = "*/*";

    fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ---------------- AUDIO ----------------
 const handleAudioAnalyze = () => {
  if (!file) {
    alert("Please upload an audio file first.");
    return;
  }

  // Store file globally (no base64)
  (window as any).__pendingAudioFile = file;

  navigate("/analyzing?mode=audio");
};
  // ---------------- IMAGE ----------------
  const handleImageAnalyze = async () => {
    if (!file) return;

    localStorage.removeItem("imageAnalysis");

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      localStorage.setItem("imageAnalysis", JSON.stringify(data));
      navigate("/analyzing?mode=image");
    } catch (err) {
      console.error("Image analysis failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- METADATA ----------------
  const handleMetadataAnalyze = async () => {
    if (!file) return;

    localStorage.removeItem("metadataResult");

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
        });
      const data = await res.json();
      localStorage.setItem("metadataResult", JSON.stringify(data));
      navigate("/analyzing?mode=metadata");
    } catch (err) {
      console.error("Metadata analysis failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => {
    if (!file || !uploadType) {
      alert("Please upload a file first.");
      return;
    }

    if (uploadType === "audio") return handleAudioAnalyze();
    if (uploadType === "image") return handleImageAnalyze();
    if (uploadType === "metadata") return handleMetadataAnalyze();

    alert("Video coming soon 🚧");
  };

  return (
    <section className="hero-wrapper">
      <div className="hero-card">
        <div className="hero-left">
          <h1 className="brand">
            REDACT<span>LY</span>
          </h1>

          <h2>Your Media's Privacy Guardian</h2>

          <p>
            Detect and remove sensitive metadata and private information before
            sharing your media.
          </p>

          <div className="upload-options">
            <button onClick={() => openFilePicker("image")}>Upload Image</button>
            <button onClick={() => openFilePicker("audio")}>Upload Audio</button>
            <button onClick={() => openFilePicker("video")}>Upload Video</button>
            <button onClick={() => openFilePicker("metadata")}>
              Hide Metadata
            </button>
          </div>

          <button
            className="primary-btn analyze-btn"
            onClick={handleAnalyze}
            disabled={isLoading || !file}
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>

          {file && uploadType && (
            <div className="file-chip">
              Selected {uploadType}: {file.name}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileChange}
          />
        </div>

        <div className="hero-right">
          <div className="visual-card">
            <div className="scan-line"></div>
            <div className="node n1">METADATA</div>
            <div className="node n2">PII</div>
            <div className="node n3">OCR</div>
            <div className="shield-core">AI SCAN</div>
          </div>
          <div className="red-panel"></div>
        </div>
      </div>
    </section>
  );
};

export default Upload;