// src/components/FabricCanvas.tsx
import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import CanvasSettings from "./designCanvasComponents/CanvasSettings";
import { Save } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation, useAction } from "convex/react";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

interface FabricCanvasProps {
  designId: Id<"design">;
  initialCanvasJson?: string | null;
  onReady?: (canvasEl: HTMLCanvasElement) => void;
  onModified?: () => void;
  getThreeScreenshot?: () => string; // New prop
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({
  designId,
  initialCanvasJson,
  onReady,
  onModified,
  getThreeScreenshot,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const notifyTimeoutRef = useRef<number | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  const saveCanvas = useMutation(api.fabric_canvases.saveCanvas);
  const savePreview = useAction(api.design_preview.savePreview);

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
        if (onModified) onModified();
        if (onReady && current.lowerCanvasEl) onReady(current.lowerCanvasEl);
      } catch {}
    }, 60);
  };

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
      try {
        c.dispose && c.dispose();
      } catch {}
      fabricRef.current = null;
      setCanvas(null);
      if (notifyTimeoutRef.current) window.clearTimeout(notifyTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady, onModified]);

  useEffect(() => {
    if (!canvas) return;
    if (initialCanvasJson) {
      try {
        const parsed =
          typeof initialCanvasJson === "string"
            ? JSON.parse(initialCanvasJson)
            : initialCanvasJson;
        canvas.loadFromJSON(parsed, () => {
          canvas.backgroundColor = "#f5f5f5";
          canvas.renderAll();
          notifyParent(canvas);
        });
      } catch {
        canvas.clear();
        canvas.backgroundColor = "#f5f5f5";
        canvas.renderAll();
        notifyParent(canvas);
      }
    } else {
      canvas.clear();
      canvas.backgroundColor = "#f5f5f5";
      canvas.renderAll();
      notifyParent(canvas);
    }
  }, [canvas, initialCanvasJson]);

  const handleSave = async () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());

    try {
      let previewBuffer: ArrayBuffer | null = null;

      if (getThreeScreenshot) {
        const dataUrl = getThreeScreenshot();
        const blob = await (await fetch(dataUrl)).blob();
        previewBuffer = await blob.arrayBuffer();
      }

      await saveCanvas({ designId, canvasJson: json, thumbnail: undefined });

      if (previewBuffer) {
        await savePreview({ designId, previewImage: previewBuffer });
      }

      alert("Canvas + 3D preview saved successfully!");
      notifyParent(canvas);
    } catch (err) {
      console.error("Failed to save canvas", err);
      alert("Error saving canvas. Check console.");
    }
  };

  return (
    <div className="p-4">
      {/* Top bar: only Save button (right aligned) */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          title="Save design"
          className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleSave}
        >
          <Save size={18} />
          <span className="text-sm font-medium">Save</span>
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
