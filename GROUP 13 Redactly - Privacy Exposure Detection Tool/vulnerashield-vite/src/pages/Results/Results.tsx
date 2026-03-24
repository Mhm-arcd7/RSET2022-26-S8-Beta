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
  hackability_score?: number;
  context_used?: string;
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
  const [context, setContext] = useState<"Public" | "Restricted" | "Private">("Public");
  const [score, setScore] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("audioAnalysis");
    if (data) {
      setAudioData(JSON.parse(data));
      setLoading(false);
    }
  }, []);

  // ✅ NORMALIZATION FUNCTION
  const normalize = (text: string) =>
    text.replace(/[\s,-]/g, "").toLowerCase();

  // ✅ SMART FLEXIBLE HIGHLIGHTER
  const renderHighlightedTranscript = () => {
    if (!audioData) return null;

    const transcript = audioData.transcript;
    const targets = [...selectedTargets, ...customTargets].filter(Boolean);

    if (targets.length === 0) return transcript;

    const normalizedTranscript = normalize(transcript);

    const matches: { start: number; end: number }[] = [];

    targets.forEach((target) => {
  let processedTarget = target;

  // ✅ EMAIL FIX ONLY
  if (target.includes("@")) {
    const [local, domain] = target.split("@");

    // Add space before numbers so "Sharma95" becomes "Sharma 95"
    const spokenLocal = local.replace(/(\d+)/g, " $1");

    processedTarget = `${spokenLocal} at ${domain}`;
  }

  const normalizedTarget = normalize(processedTarget);

      if (!normalizedTarget) return;

      let index = 0;

      while (true) {
        const found = normalizedTranscript.indexOf(normalizedTarget, index);
        if (found === -1) break;

        // Map normalized index back to original transcript index
        let originalStart = -1;
        let count = 0;

        for (let i = 0; i < transcript.length; i++) {
          const char = transcript[i];

          if (!/[,\s-]/.test(char)) {
            if (count === found) {
              originalStart = i;
              break;
            }
            count++;
          }
        }

        if (originalStart === -1) break;

        // Determine original end
        let originalEnd = originalStart;
        let remaining = normalizedTarget.length;

        while (originalEnd < transcript.length && remaining > 0) {
          if (!/[,\s-]/.test(transcript[originalEnd])) {
            remaining--;
          }
          originalEnd++;
        }

        matches.push({ start: originalStart, end: originalEnd });

        index = found + normalizedTarget.length;
      }
    });

    if (matches.length === 0) return transcript;

    // Sort and merge overlaps
    matches.sort((a, b) => a.start - b.start);

    const merged: typeof matches = [];
    matches.forEach((match) => {
      if (
        merged.length === 0 ||
        match.start > merged[merged.length - 1].end
      ) {
        merged.push(match);
      } else {
        merged[merged.length - 1].end = Math.max(
          merged[merged.length - 1].end,
          match.end
        );
      }
    });

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    merged.forEach((match, i) => {
      if (match.start > lastIndex) {
        elements.push(transcript.slice(lastIndex, match.start));
      }

      elements.push(
        <span key={i} className="highlight-word">
          {transcript.slice(match.start, match.end)}
        </span>
      );

      lastIndex = match.end;
    });

    if (lastIndex < transcript.length) {
      elements.push(transcript.slice(lastIndex));
    }

    return elements;
  };

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

 const handleCalculateScore = async () => {
  if (!audioData) return;

  setCalculating(true);
  setScore(null);

  const formData = new URLSearchParams();
  formData.append("file_id", audioData.file_id);
  formData.append("context", context);

  try {
    const res = await fetch("http://127.0.0.1:8000/calculate/audio-risk", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json();

    if (data.hackability_score !== undefined) {
      setScore(data.hackability_score);
    }
  } catch {
    alert("Failed to calculate hackability score");
  } finally {
    setCalculating(false);
  }
};

  const handleUndo = () => {
    setDownloadUrl(null);
    setRedactionComplete(false);
    setAudioKey((k) => k + 1);
  };

  if (loading || !audioData) {
    return <div className="results-page">Loading…</div>;
  }

  return (
    <div className="results-page">
      <h2>Audio Analysis Results</h2>

   <section className="results-section">
  <h3>Transcript</h3>

  <div className="transcript-box">
    {renderHighlightedTranscript()}
  </div>
</section>
<section className="results-section">
  <h3>Hackability Assessment</h3>

  <div className="mode-options">
    {["Public", "Restricted", "Private"].map((c) => (
      <label key={c} className={`mode-option ${context === c ? "active" : ""}`}>
        <input
          type="radio"
          name="context"
          value={c}
          checked={context === c}
          onChange={() => setContext(c as any)}
        />
        {c}
      </label>
    ))}
  </div>

  <button
    className="redact-btn"
    disabled={calculating}
    onClick={handleCalculateScore}
  >
    {calculating ? "Calculating…" : "Calculate Hackability Score"}
  </button>

  {score !== null && (
    <div className="download-section">
      <h4>Hackability Score</h4>
      <div style={{ fontSize: "22px", fontWeight: "bold" }}>
        {score} / 100
      </div>
    </div>
  )}
</section>

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