import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Analyzing.css";

const Analyzing = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode"); // "audio" | "metadata" | "image"

  const steps =
    mode === "metadata"
      ? [
          "Uploading file",
          "Extracting metadata",
          "Removing sensitive metadata",
          "Verifying cleaned file",
          "Preparing download",
        ]
      : mode === "image"
      ? [
          "Uploading image",
          "Running OCR detection",
          "Scanning for PII",
          "Analyzing scene context",
          "Generating summary",
        ]
      : [
          "Uploading audio file",
          "Extracting audio metadata",
          "Transcribing speech to text",
          "Scanning for sensitive information",
          "Preparing analysis report",
        ];

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;

    const stepInterval = setInterval(() => {
      if (!mounted) return;
      setStepIndex((prev) => {
        const next = (prev + 1) % steps.length;
        setProgress(((next + 1) / steps.length) * 100);
        return next;
      });
    }, 1500);

    // ===============================
    // 🔊 AUDIO ANALYSIS (NEW LOGIC)
    // ===============================

    const runAudioAnalysis = async () => {
  if (mode !== "audio") return;

  const file = (window as any).__pendingAudioFile;

  if (!file) {
    console.error("No audio file found.");
    navigate("/");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/analyze/audio", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    localStorage.setItem("audioAnalysis", JSON.stringify(data));

    // Clear global
    (window as any).__pendingAudioFile = null;

    navigate("/results");
  } catch (err) {
    console.error("Audio analysis failed:", err);
    navigate("/");
  }
};

    // ===============================
    // 🖼 IMAGE & 🏷 METADATA (UNCHANGED)
    // ===============================

    const checkInterval = setInterval(() => {
      if (mode === "audio") return; // skip polling for audio

      let data = null;

      if (mode === "metadata") {
        data = localStorage.getItem("metadataResult");
      } else if (mode === "image") {
        data = localStorage.getItem("imageAnalysis");
      }

      if (data) {
        clearInterval(stepInterval);
        clearInterval(checkInterval);

        if (mode === "metadata") navigate("/metadata-result");
        else if (mode === "image") navigate("/image-result");
      }
    }, 1000);

    runAudioAnalysis();

    return () => {
      mounted = false;
      clearInterval(stepInterval);
      clearInterval(checkInterval);
    };
  }, [navigate, mode, steps.length]);

  return (
    <section className="analyzing-wrapper">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Upload
      </button>

      <div className="scan-container">
        <div className="ring"></div>
        <div className="ring inner"></div>
        <div className="scan-core brand">REDACTLY</div>
      </div>

      <h2 className="brand">
        {mode === "metadata"
          ? "Analyzing Metadata"
          : mode === "image"
          ? "Analyzing Image"
          : "Analyzing Audio"}
      </h2>

      <p className="scan-step">{steps[stepIndex]}...</p>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="progress-text">
        {Math.round(progress)}% complete
      </p>

      <p className="note">
        Please wait while we securely process your file.
      </p>
    </section>
  );
};

export default Analyzing;