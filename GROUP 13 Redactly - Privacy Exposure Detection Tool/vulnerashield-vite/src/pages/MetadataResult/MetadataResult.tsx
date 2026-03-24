import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MetadataResult.css";

interface Metadata {
  [key: string]: any;
}

const MetadataResult = () => {
  const navigate = useNavigate();

  const [metadataBefore, setMetadataBefore] = useState<Metadata>({});
  const [metadataAfter, setMetadataAfter] = useState<Metadata>({});
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedResult = localStorage.getItem("metadataResult");

    if (!storedResult) {
      navigate("/");
      return;
    }

    try {
      const parsed = JSON.parse(storedResult);

      setMetadataBefore(parsed.metadata_before || {});
      setMetadataAfter(parsed.metadata_after || {});
      setDownloadUrl(parsed.download_url || null);
    } catch (err) {
      console.error("Failed to parse metadata result", err);
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="metadata-page">
      {/* 🔙 Back Button */}
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Upload
      </button>

      <h1>Metadata Extraction & Hiding</h1>

      <div className="metadata-section">
        <h2>Original (Before Cleaning)</h2>
        <pre>{JSON.stringify(metadataBefore, null, 2)}</pre>
      </div>

      <div className="metadata-section">
        <h2>Cleaned (After Metadata Removal)</h2>
        <pre>{JSON.stringify(metadataAfter, null, 2)}</pre>
      </div>

      {downloadUrl && (
        <a
          href={`http://127.0.0.1:8000${downloadUrl}`}
          className="download-btn"
          download
        >
          ⬇ Download Cleaned File
        </a>
      )}
    </div>
  );
};

export default MetadataResult;
