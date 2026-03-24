import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Results.css";

type Entity = {
  text: string;
  type: string;
};

type AudioAnalysis = {
  file_id: string;
  transcript: string;
  entities: Entity[];
};

const Results = () => {
  const navigate = useNavigate();

  const [audioData, setAudioData] = useState<AudioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<"beep" | "mute" | "trim">("beep");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customTargets, setCustomTargets] = useState<string[]>([]);

  const [redacting, setRedacting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [redactionComplete, setRedactionComplete] = useState(false);
  const [audioKey, setAudioKey] = useState(0);

  useEffect(() => {
    const data = localStorage.getItem("audioAnalysis");
    if (data) {
      setAudioData(JSON.parse(data));
      setLoading(false);
    }
  }, []);

  const handleSelectAll = () => {
    if (!audioData) return;
    setSelectedTargets(audioData.entities.map((e) => e.text));
  };

  const handleDeselectAll = () => {
    setSelectedTargets([]);
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;

    const words = customInput
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    setCustomTargets((prev) => [...new Set([...prev, ...words])]);
    setCustomInput("");
  };

  const handleRemoveCustom = (word: string) => {
    setCustomTargets((prev) => prev.filter((w) => w !== word));
  };

  const handleRedact = async () => {
    if (!audioData) return;

    const allTargets = [...selectedTargets, ...customTargets];

    if (allTargets.length === 0) {
      alert("Select at least one item to redact.");
      return;
    }

    setRedacting(true);
    setRedactionComplete(false);

    const formData = new URLSearchParams();
    formData.append("file_id", audioData.file_id);
    formData.append("mode", mode);
    formData.append("targets", allTargets.join(","));

    try {
      const res = await fetch("http://127.0.0.1:8000/redact/audio", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await res.json();

      if (data.download_url) {
        const freshUrl =
          `http://127.0.0.1:8000${data.download_url}?t=${Date.now()}`;

        setDownloadUrl(freshUrl);
        setAudioKey((k) => k + 1);
        setRedactionComplete(true);
      }
    } catch {
      alert("Redaction failed");
    } finally {
      setRedacting(false);
    }
  };

  const handleUndo = () => {
    setDownloadUrl(null);
    setRedactionComplete(false);
    setAudioKey((k) => k + 1);
  };

  /* ---------------------------------------------
     NEW: Email normalization helper (SAFE ADD)
  --------------------------------------------- */
  const normalizeEmailForTranscript = (email: string) => {
    return email
      .toLowerCase()
      .replace("@", " at ")
      .replace(/\./g, ".");
  };

  const getHighlightedTranscript = () => {
    if (!audioData) return "";

    const combinedTargets = [
      ...selectedTargets,
      ...customTargets,
    ].filter(Boolean);

    if (combinedTargets.length === 0) {
      return audioData.transcript;
    }

    let highlightedText = audioData.transcript;

    combinedTargets.forEach((target) => {
      const isEmail = target.includes("@");

      let processedTarget = target;

      // Only modify EMAIL matching
      if (isEmail) {
        processedTarget = normalizeEmailForTranscript(target);
      }

      const escaped = processedTarget.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(`\\b${escaped}\\b`, "gi");

      highlightedText = highlightedText.replace(
        regex,
        (match) =>
          `<span class="highlight-word">${match}</span>`
      );
    });

    return (
      <span
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    );
  };

  if (loading || !audioData) {
    return <div className="results-page">Loading…</div>;
  }

  return (
    <div className="results-page">
      <h2>Audio Analysis Results</h2>

      {/* Transcript */}
      <section className="results-section">
        <h3>Transcript</h3>
        <div className="transcript-box">
          {getHighlightedTranscript()}
        </div>
      </section>

      {/* Entity Selection */}
      <section className="results-section">
        <h3>Select Sensitive Information</h3>

        <div className="selection-toolbar">
          <div>
            {selectedTargets.length + customTargets.length} selected
          </div>
          <div className="toolbar-buttons">
            <button className="small-btn" onClick={handleSelectAll}>
              Select All
            </button>
            <button className="small-btn" onClick={handleDeselectAll}>
              Deselect All
            </button>
          </div>
        </div>

        <div className="entities-grid">
          {audioData.entities.map((entity, index) => {
            const checked = selectedTargets.includes(entity.text);

            return (
              <label key={index} className="entity-card">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelectedTargets((prev) =>
                      checked
                        ? prev.filter((t) => t !== entity.text)
                        : [...prev, entity.text]
                    )
                  }
                />
                <div className="entity-text">{entity.text}</div>
                <div className="entity-type">{entity.type}</div>
              </label>
            );
          })}
        </div>

        {/* Custom Input */}
        <div className="custom-redaction">
          <h4>Add Custom Redaction</h4>
          <input
            type="text"
            value={customInput}
            placeholder="Enter word or phrase (comma separated)"
            onChange={(e) => setCustomInput(e.target.value)}
          />
          <button className="small-btn" onClick={handleAddCustom}>
            Add
          </button>

          {customTargets.length > 0 && (
            <div className="custom-list">
              {customTargets.map((word, i) => (
                <span key={i} className="custom-chip">
                  {word}
                  <button onClick={() => handleRemoveCustom(word)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Redaction Mode */}
      <section className="results-section">
        <h3>Redaction Mode</h3>

        <div className="mode-options">
          {["beep", "mute", "trim"].map((m) => (
            <label key={m} className={`mode-option ${mode === m ? "active" : ""}`}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m as any)}
              />
              {m.toUpperCase()}
            </label>
          ))}
        </div>

        <button
          className="redact-btn"
          disabled={redacting}
          onClick={handleRedact}
        >
          {redacting ? "Redacting…" : "Apply Redaction"}
        </button>

        {redactionComplete && downloadUrl && (
          <div className="download-section">
            <h4>Preview Redacted Audio</h4>

            <audio key={audioKey} controls src={downloadUrl} />

            <div className="action-buttons">
              <a className="download-btn" href={downloadUrl} download>
                ⬇ Download
              </a>
              <button className="secondary-btn" onClick={handleUndo}>
                Undo
              </button>
            </div>
          </div>
        )}
      </section>

      <button className="secondary-btn" onClick={() => navigate("/")}>
        ← Analyze Another File
      </button>
    </div>
  );
};

export default Results;