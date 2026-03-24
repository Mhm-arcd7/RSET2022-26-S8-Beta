import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ImageResult.css";

type OCRBox = {
  text: string;
  box: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

type CustomRegion = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type ImageAnalysis = {
  file_id: string;
  image_url: string;
  ocr_results: OCRBox[];
};

const ImageResult = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [data, setData] = useState<ImageAnalysis | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [customRegions, setCustomRegions] = useState<CustomRegion[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "draw">("select");
  const [context, setContext] = useState("Public");
  const [hackScore, setHackScore] = useState<number | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Load data
  useEffect(() => {
    const stored = localStorage.getItem("imageAnalysis");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  // Draw canvas
  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = data.image_url;

    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      drawBoxes(ctx);
    };
  }, [data, selectedRegions, customRegions]);

  const drawBoxes = (ctx: CanvasRenderingContext2D) => {
    if (!data) return;

    // OCR regions
    data.ocr_results.forEach((item, index) => {
      const { left, top, width, height } = item.box;
      const selected = selectedRegions.includes(index);

      ctx.strokeStyle = selected ? "#00ff66" : "#ff4444";
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, width, height);
    });

    // Custom regions
    customRegions.forEach((r) => {
      ctx.strokeStyle = "#00ccff";
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = canvasRef.current!;
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const end = getMousePos(e);

    const newRegion: CustomRegion = {
      x: Math.min(startPoint.x, end.x),
      y: Math.min(startPoint.y, end.y),
      w: Math.abs(end.x - startPoint.x),
      h: Math.abs(end.y - startPoint.y),
    };

    setCustomRegions((prev) => [...prev, newRegion]);

    setIsDrawing(false);
    setStartPoint(null);
  };


  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!data || mode !== "select") return;

  const canvas = canvasRef.current!;
  const rect = canvas.getBoundingClientRect();

  // Real image scale
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  data.ocr_results.forEach((item, index) => {
    const { left, top, width, height } = item.box;

    if (
      x >= left &&
      x <= left + width &&
      y >= top &&
      y <= top + height
    ) {
      setSelectedRegions((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    }
  });
};

const handleCalculateRisk = async () => {
  if (!data) return;

  const formData = new FormData();
  formData.append("file_id", data.file_id);
  formData.append("context", context);

  const res = await fetch("http://127.0.0.1:8000/calculate/image-risk", {
    method: "POST",
    body: formData,
  });

  const result = await res.json();

  if (result.hackability_score !== undefined) {
    setHackScore(result.hackability_score);
  }
};

  const handleApplyRedaction = async () => {
    if (!data) return;

    const autoRegions = selectedRegions.map((index) => {
      const box = data.ocr_results[index].box;
      return {
        selected: true,
        x: box.left,
        y: box.top,
        w: box.width,
        h: box.height,
      };
    });

    const manualRegions = customRegions.map((r) => ({
      selected: true,
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
    }));

    const allRegions = [...autoRegions, ...manualRegions];

    const res = await fetch("http://127.0.0.1:8000/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_id: data.image_url.split("/uploads/")[1],
        regions: allRegions,
      }),
    });

    const result = await res.json();

    if (result.redacted_url) {
      setDownloadUrl(`${result.redacted_url}?t=${Date.now()}`);
    }
  };

  if (!data) return <div className="image-page">Loading...</div>;

  return (
    <div className="image-page">
      <h2>Image Analysis Results</h2>

      <div className="mode-toggle">
        <button
          className={mode === "select" ? "active" : ""}
          onClick={() => setMode("select")}
        >
          Select Mode
        </button>
        <button
          className={mode === "draw" ? "active" : ""}
          onClick={() => setMode("draw")}
        >
          Draw Mode
        </button>
      </div>

<div style={{ marginBottom: "20px" }}>
  <label>Context of Use: </label>

  <select
    value={context}
    onChange={(e) => setContext(e.target.value)}
    style={{ marginLeft: "10px" }}
  >
    <option value="Public">Public</option>
    <option value="Restricted">Restricted</option>
    <option value="Private">Private</option>
  </select>

  <button
    style={{ marginLeft: "15px" }}
    onClick={handleCalculateRisk}
  >
    Calculate Hackability
  </button>

  {hackScore !== null && (
    <div style={{ marginTop: "10px" }}>
      <strong>Hackability Score:</strong> {hackScore.toFixed(2)}
    </div>
  )}
</div>

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      <div>
        {selectedRegions.length + customRegions.length} regions selected
      </div>

      <button onClick={handleApplyRedaction}>
        Apply Blur
      </button>

      {downloadUrl && (
        <div>
          <h4>Preview Redacted Image</h4>
          <img src={downloadUrl} alt="Redacted" />
          <br />
          <a href={downloadUrl} download>
            ⬇ Download
          </a>
        </div>
      )}

      <button onClick={() => navigate("/")}>
        ← Analyze Another File
      </button>
    </div>
  );
};

export default ImageResult;