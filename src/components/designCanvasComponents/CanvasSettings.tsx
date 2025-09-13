// src/components/designCanvasComponents/CanvasSettings.tsx
import { useEffect, useState } from "react";
import type { Canvas, Object as FabricObject, Rect, Circle } from "fabric";
import {
  addText,
  addRectangle,
  addCircle,
  addLine,
  addBrush,
  addEraser,
  addFreeform,
  addImage,
  disableDrawingMode,
} from "./CanvasTools";
import {
  Type,
  Square,
  Circle as CircleIcon,
  Minus,
  Brush,
  Eraser,
  Image as ImageIcon,
  Pencil,
  MousePointer,
} from "lucide-react";

interface CanvasSettingsProps {
  canvas: Canvas | null;
}

export default function CanvasSettings({ canvas }: CanvasSettingsProps) {
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(
    null
  );
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [diameter, setDiameter] = useState<string>("");
  const [color, setColor] = useState<string>("#000000");

  // track active tool for button highlight
  const activeTool = (canvas as any)?._activeTool || null;

  // selection listeners
  useEffect(() => {
    if (!canvas) return;

    const handleSelection = (e: any) => {
      const obj = e.selected?.[0] ?? canvas.getActiveObject();
      applySelection(obj as FabricObject | null);
    };

    const handleCleared = () => applySelection(null);

    const handleObjectModified = (e: any) =>
      applySelection(e.target as FabricObject);

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleCleared);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("object:scaling", handleObjectModified);

    if (canvas.getActiveObject())
      applySelection(canvas.getActiveObject() as FabricObject);

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleCleared);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("object:scaling", handleObjectModified);
    };
  }, [canvas]);

  // apply selection -> populate UI fields
  function applySelection(obj: FabricObject | null) {
    if (!obj) {
      setSelectedObject(null);
      setWidth("");
      setHeight("");
      setDiameter("");
      setColor("#000000");
      return;
    }

    setSelectedObject(obj);

    // handle rect (some versions use 'rect' or 'rectangle')
    if (obj.type === "rect" || obj.type === "rectangle") {
      // width/height in Fabric can be influenced by scale; read object.width * scaleX if you prefer
      const w = Math.round(((obj as Rect).width ?? 0) * ((obj as Rect).scaleX ?? 1));
      const h = Math.round(((obj as Rect).height ?? 0) * ((obj as Rect).scaleY ?? 1));
      setWidth(w.toString());
      setHeight(h.toString());
      setDiameter("");
      setColor(((obj as any).fill as string) ?? "#000000");
    } else if (obj.type === "circle") {
      const radius = (obj as Circle).radius ?? 0;
      const dia = Math.round(radius * 2 * ((obj as any).scaleX ?? 1));
      setDiameter(dia.toString());
      setWidth("");
      setHeight("");
      setColor(((obj as any).fill as string) ?? "#000000");
    } else {
      // generic objects (including text)
      setWidth("");
      setHeight("");
      setDiameter("");
      setColor(((obj as any).fill as string) ?? "#000000");
    }
  }

  // update functions that change object properties AND UI state
  const updateRectWidth = (val: string) => {
    setWidth(val);
    if (!selectedObject || (selectedObject.type !== "rect" && selectedObject.type !== "rectangle")) return;
    const newW = parseFloat(val);
    if (!isFinite(newW) || newW <= 0) return;

    // set object's width while keeping scale at 1.
    (selectedObject as Rect).set({ width: newW, scaleX: 1 });
    selectedObject.setCoords();
    canvas?.requestRenderAll();
  };

  const updateRectHeight = (val: string) => {
    setHeight(val);
    if (!selectedObject || (selectedObject.type !== "rect" && selectedObject.type !== "rectangle")) return;
    const newH = parseFloat(val);
    if (!isFinite(newH) || newH <= 0) return;

    (selectedObject as Rect).set({ height: newH, scaleY: 1 });
    selectedObject.setCoords();
    canvas?.requestRenderAll();
  };

  const updateCircleDiameter = (val: string) => {
    setDiameter(val);
    if (!selectedObject || selectedObject.type !== "circle") return;
    const newD = parseFloat(val);
    if (!isFinite(newD) || newD <= 0) return;

    (selectedObject as Circle).set({ radius: newD / 2, scaleX: 1, scaleY: 1 });
    selectedObject.setCoords();
    canvas?.requestRenderAll();
  };

  // FIXED: update color on object immediately (picker + text input)
  const updateColor = (val: string) => {
    setColor(val);
    if (!selectedObject || !canvas) return;

    try {
      // Only set fill when object supports it; most do (Rect, Circle, Text, Path).
      selectedObject.set("fill", val);
      // some objects might require also setting `stroke` depending on use-case — we only change fill here.
      selectedObject.setCoords?.();
      canvas.requestRenderAll();
    } catch (err) {
      // swallow errors for objects that can't accept fill
      // console.warn("Failed to set fill on selectedObject", err);
    }
  };

  const deleteSelected = () => {
    if (!selectedObject || !canvas) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    applySelection(null);
  };

  return (
    <div className="p-4 bg-white rounded shadow w-50 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => canvas && addText(canvas)}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Add Text"
        >
          <Type size={18} />
        </button>

        <button
          onClick={() => canvas && addRectangle(canvas)}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Add Rectangle"
        >
          <Square size={18} />
        </button>

        <button
          onClick={() => canvas && addCircle(canvas)}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Add Circle"
        >
          <CircleIcon size={18} />
        </button>

        <button
          onClick={() => canvas && addLine(canvas)}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Add Line"
        >
          <Minus size={18} />
        </button>

        <button
          onClick={() => canvas && addBrush(canvas)}
          className={`p-2 rounded ${
            activeTool === "brush"
              ? "bg-blue-400 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          title="Brush"
        >
          <Brush size={18} />
        </button>

        <button
          onClick={() => canvas && addEraser(canvas)}
          className={`p-2 rounded ${
            activeTool === "eraser"
              ? "bg-blue-400 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          title="Eraser"
        >
          <Eraser size={18} />
        </button>

        <button
          onClick={() => canvas && addFreeform(canvas)}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Freeform Path"
        >
          <Pencil size={18} />
        </button>

        <button
          onClick={() => canvas && addImage(canvas)}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Add Image"
        >
          <ImageIcon size={18} />
        </button>

        <button
          onClick={() => canvas && disableDrawingMode(canvas)}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Select / Move"
        >
          <MousePointer size={18} />
        </button>
      </div>

      {/* Settings */}
      <h3 className="text-lg font-semibold">Settings</h3>

      {!selectedObject ? (
        <p className="text-sm text-gray-500">No object selected</p>
      ) : (
        <div className="space-y-3">
          {(selectedObject.type === "rect" || selectedObject.type === "rectangle") && (
            <>
              <label className="block text-xs" htmlFor="rect-width">
                Width (px)
              </label>
              <input
                id="rect-width"
                aria-label="Rectangle width"
                className="w-full p-1 border rounded"
                value={width}
                onChange={(e) => updateRectWidth(e.target.value)}
                inputMode="numeric"
              />

              <label className="block text-xs" htmlFor="rect-height">
                Height (px)
              </label>
              <input
                id="rect-height"
                aria-label="Rectangle height"
                className="w-full p-1 border rounded"
                value={height}
                onChange={(e) => updateRectHeight(e.target.value)}
                inputMode="numeric"
              />
            </>
          )}

          {selectedObject.type === "circle" && (
            <>
              <label className="block text-xs" htmlFor="circle-diameter">
                Diameter (px)
              </label>
              <input
                id="circle-diameter"
                aria-label="Circle diameter"
                className="w-full p-1 border rounded"
                value={diameter}
                onChange={(e) => updateCircleDiameter(e.target.value)}
                inputMode="numeric"
              />
            </>
          )}

          <label className="block text-xs" htmlFor="fill-color">
            Fill color
          </label>

          <div className="flex items-center gap-2">
            <input
              id="fill-color"
              aria-label="Fill color"
              type="color"
              value={color || "#000000"}
              onChange={(e) => updateColor(e.target.value)}
              className="w-12 h-8 border rounded p-0"
            />
            <input
              aria-label="Fill color hex"
              className="flex-1 p-1 border rounded"
              value={color}
              onChange={(e) => updateColor(e.target.value)}
              placeholder="#000000"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={deleteSelected}
              className="px-3 py-1 bg-red-100 text-red-700 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
