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

    const checkInterval = setInterval(() => {
      let data = null;

      if (mode === "metadata") {
        data = localStorage.getItem("metadataResult");
      } else if (mode === "image") {
        data = localStorage.getItem("imageAnalysis");
      } else {
        data = localStorage.getItem("audioAnalysis");
      }

      if (data) {
        clearInterval(stepInterval);
        clearInterval(checkInterval);

        if (mode === "metadata") navigate("/metadata-result");
        else if (mode === "image") navigate("/image-result");
        else navigate("/results");
      }
    }, 1000);

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

      <p className="progress-text">{Math.round(progress)}% complete</p>

      <p className="note">
        Please wait while we securely process your file.
      </p>
    </section>
  );
};

export default Analyzing;
