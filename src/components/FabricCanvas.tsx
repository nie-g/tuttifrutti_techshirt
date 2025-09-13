import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import {
  addText,
  addRectangle,
  addCircle,
  addLine,
  addImage, // ✅ import addImage
} from "./designCanvasComponents/CanvasTools";
import CanvasSettings from "./designCanvasComponents/CanvasSettings";
import { Type, Square, Circle as CircleIcon, Minus, Save } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

interface FabricCanvasProps {
  designId: Id<"design">;
  initialCanvasJson?: string | null;
  onReady?: (canvasEl: HTMLCanvasElement) => void;
  onModified?: () => void;
  category:
    | "front"
    | "back"
    | "left_sleeve"
    | "right_sleeve"
    | "collar"
    | "other";
  setCategory: (
    category:
      | "front"
      | "back"
      | "left_sleeve"
      | "right_sleeve"
      | "collar"
      | "other"
  ) => void;
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({
  designId,
  initialCanvasJson,
  onReady,
  onModified,
  category,
  setCategory,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const notifyTimeoutRef = useRef<number | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  const saveCanvas = useMutation(api.fabric_canvases.saveCanvas);

  // Debounced parent notifier
  const notifyParent = (c?: fabric.Canvas) => {
    if (notifyTimeoutRef.current) {
      window.clearTimeout(notifyTimeoutRef.current);
      notifyTimeoutRef.current = null;
    }
    notifyTimeoutRef.current = window.setTimeout(() => {
      try {
        const current = c || fabricRef.current || canvas;
        if (!current) return;
        current.renderAll();
        current.calcOffset && current.calcOffset();
        if (onModified) onModified();
        if (onReady && current.lowerCanvasEl) onReady(current.lowerCanvasEl);
      } catch {}
    }, 60);
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasElRef.current) return;

    const c = new fabric.Canvas(canvasElRef.current, {
      height: CANVAS_HEIGHT,
      width: CANVAS_WIDTH,
      backgroundColor: "#f5f5f5",
      preserveObjectStacking: true,
    });

    fabricRef.current = c;
    setCanvas(c);
    if (onReady && c.lowerCanvasEl) onReady(c.lowerCanvasEl);

    const eventTypes = [
      "object:added",
      "object:modified",
      "object:removed",
      "path:created",
      "after:render",
      "selection:cleared",
    ];
    const handler = () => notifyParent(c);
    eventTypes.forEach((ev) => c.on(ev as any, handler));

    return () => {
      eventTypes.forEach((ev) => c.off(ev as any, handler));
      try { c.dispose && c.dispose(); } catch {}
      fabricRef.current = null;
      setCanvas(null);
      if (notifyTimeoutRef.current) window.clearTimeout(notifyTimeoutRef.current);
    };
  }, [onReady, onModified]);

  // Load JSON
  useEffect(() => {
    if (!canvas) return;
    if (initialCanvasJson) {
      try {
        const parsed = typeof initialCanvasJson === "string"
          ? JSON.parse(initialCanvasJson)
          : initialCanvasJson;
        canvas.loadFromJSON(parsed, () => {
          try {
            canvas.backgroundColor = "#f5f5f5";
            canvas.renderAll();
            canvas.calcOffset && canvas.calcOffset();
            setTimeout(() => notifyParent(canvas), 40);
          } catch (err) {
            console.error("Error after loadFromJSON render:", err);
            notifyParent(canvas);
          }
        });
      } catch (err) {
        console.error("Error parsing canvas JSON:", err);
        canvas.clear();
        canvas.backgroundColor = "#f5f5f5";
        canvas.renderAll();
        canvas.calcOffset && canvas.calcOffset();
        notifyParent(canvas);
      }
    } else {
      canvas.clear();
      canvas.backgroundColor = "#f5f5f5";
      canvas.renderAll();
      canvas.calcOffset && canvas.calcOffset();
      notifyParent(canvas);
    }
  }, [canvas, initialCanvasJson]);

  const handleSave = async () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    try {
      await saveCanvas({ designId, category, canvasJson: json });
      alert(`Canvas (${category}) saved successfully!`);
      notifyParent(canvas);
    } catch (err) {
      console.error("Failed to save canvas", err);
      alert("Error saving canvas. Check console.");
    }
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4 items-center">
        <button type="button" title="Add text" className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => canvas && addText(canvas)}>
          <Type size={20} />
        </button>
        <button type="button" title="Add rectangle" className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => canvas && addRectangle(canvas)}>
          <Square size={20} />
        </button>
        <button type="button" title="Add circle" className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => canvas && addCircle(canvas)}>
          <CircleIcon size={20} />
        </button>
        <button type="button" title="Add line" className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => canvas && addLine(canvas)}>
          <Minus size={20} />
        </button>
        <button type="button" title="Add image" className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => canvas && addImage(canvas)}>
          📷
        </button>

        <select
          aria-label="Select design category"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="ml-4 p-2 border rounded"
        >
          <option value="front">Front</option>
          <option value="back">Back</option>
          <option value="left_sleeve">Left Sleeve</option>
          <option value="right_sleeve">Right Sleeve</option>
          <option value="collar">Collar</option>
          <option value="other">Other</option>
        </select>

        <button
          type="button"
          title="Save design"
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleSave}
        >
          <Save size={20} />
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <canvas
          ref={canvasElRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-300 w-[800px] h-[500px] rounded"
        />
        <CanvasSettings canvas={canvas} />
      </div>
    </div>
  );
};

export default FabricCanvas;
