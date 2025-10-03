import { useEffect, useState } from "react";
import type { Canvas, Object as FabricObject, Rect, Circle, Textbox } from "fabric";
import {
  addText,
  addRectangle,
  addCircle,
  addLine,
  addBrush,
  addEraser,
  addFreeform,
  addImage,
  addBucketTool,
  addEyedropperTool,
  disableDrawingMode,
  setBrushColor,
  setDefaultColor,
  getDefaultColor,
  setObjectColor,
  setEraserSize as applyEraserSize,
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
  PaintBucket,
  Pipette,
  Trash2,
} from "lucide-react";

interface CanvasSettingsProps {
  canvas: Canvas | null;
}

export default function CanvasSettings({ canvas }: CanvasSettingsProps) {
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);

  // object settings
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [diameter, setDiameter] = useState<string>("");

  // colors
  const [color, setColor] = useState<string>("#000000"); // global tool color
  const [objectColor, setObjectColorState] = useState<string>("#000000"); // per-object color
  const [colorPickerActive, setColorPickerActive] = useState<boolean>(false); // ✅ toggle for color picker

  // tool states
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(10);
  const [fontSize, setFontSize] = useState(24);

  // keep color in sync with canvas default on mount
  useEffect(() => {
    if (!canvas) return;
    setColor(getDefaultColor(canvas));
  }, [canvas]);

  // === CURSOR FEEDBACK ===
  useEffect(() => {
    if (!canvas) return;
    const el = canvas.upperCanvasEl as HTMLCanvasElement;

    if (activeTool === "bucket") {
      el.style.cursor = "crosshair"; // simulate paint bucket
    } else if (activeTool === "eyedropper") {
      el.style.cursor = "copy"; // simulate eyedropper
    } else {
      el.style.cursor = "default";
    }
  }, [activeTool, canvas]);

  // === SELECTION LISTENERS ===
  useEffect(() => {
    if (!canvas) return;

    const handleSelection = (e: any) => {
      const obj = e.selected?.[0] ?? canvas.getActiveObject();
      applySelection(obj as FabricObject | null);
    };

    const handleCleared = () => applySelection(null);
    const handleObjectModified = (e: any) => applySelection(e.target as FabricObject);

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleCleared);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("object:scaling", handleObjectModified);

    if (canvas.getActiveObject()) {
      applySelection(canvas.getActiveObject() as FabricObject);
    }

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleCleared);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("object:scaling", handleObjectModified);
    };
  }, [canvas]);

  // === APPLY SELECTION ===
  function applySelection(obj: FabricObject | null) {
    if (!obj) {
      setSelectedObject(null);
      setWidth("");
      setHeight("");
      setDiameter("");
      setObjectColorState("#000000");
      return;
    }

    setSelectedObject(obj);

    let objColor =
      ((obj as any).fill as string) ??
      ((obj as any).stroke as string);

    if (obj.type === "rect" || obj.type === "rectangle") {
      const w = Math.round(((obj as Rect).width ?? 0) * ((obj as Rect).scaleX ?? 1));
      const h = Math.round(((obj as Rect).height ?? 0) * ((obj as Rect).scaleY ?? 1));
      setWidth(w.toString());
      setHeight(h.toString());
      setDiameter("");
      if (objColor) setObjectColorState(objColor);
    } else if (obj.type === "circle") {
      const radius = (obj as Circle).radius ?? 0;
      const dia = Math.round(radius * 2 * ((obj as any).scaleX ?? 1));
      setDiameter(dia.toString());
      setWidth("");
      setHeight("");
      if (objColor) setObjectColorState(objColor);
    } else if (obj.type === "textbox") {
      setFontSize((obj as Textbox).fontSize ?? 24);
      if (objColor) setObjectColorState(objColor);
    } else {
      setWidth("");
      setHeight("");
      setDiameter("");
      if (objColor) setObjectColorState(objColor);
    }
  }

  // === UPDATE FUNCTIONS ===
  const updateColor = (val: string) => {
    setColor(val);
    if (!canvas) return;

    // Always keep default + brush synced
    setDefaultColor(canvas, val);
    setBrushColor(canvas, val, brushSize);

    // ✅ Only fill when bucket is active AND picker is enabled
    if (activeTool === "bucket" && colorPickerActive && selectedObject) {
      try {
        setObjectColor(selectedObject, val);
        selectedObject.setCoords?.();
        canvas.requestRenderAll();
      } catch {}
    }
  };

  const updateObjectColor = (val: string) => {
    setObjectColorState(val);
    if (!canvas || !selectedObject) return;
    try {
      setObjectColor(selectedObject, val);
      selectedObject.setCoords?.();
      canvas.requestRenderAll();
    } catch {}
  };

  const updateWidth = (val: string) => {
    setWidth(val);
    if (!canvas || !selectedObject) return;
    const w = parseInt(val, 10);
    if (!isNaN(w) && (selectedObject as Rect).set) {
      (selectedObject as Rect).set({ scaleX: w / ((selectedObject as Rect).width ?? 1) });
      canvas.requestRenderAll();
    }
  };

  const updateHeight = (val: string) => {
    setHeight(val);
    if (!canvas || !selectedObject) return;
    const h = parseInt(val, 10);
    if (!isNaN(h) && (selectedObject as Rect).set) {
      (selectedObject as Rect).set({ scaleY: h / ((selectedObject as Rect).height ?? 1) });
      canvas.requestRenderAll();
    }
  };

  const updateDiameter = (val: string) => {
    setDiameter(val);
    if (!canvas || !selectedObject) return;
    const d = parseInt(val, 10);
    if (!isNaN(d) && (selectedObject as Circle).set) {
      (selectedObject as Circle).set({ radius: d / 2 });
      selectedObject.setCoords?.();
      canvas.requestRenderAll();
    }
  };

  const updateBrushSize = (val: number) => {
    setBrushSize(val);
    if (!canvas) return;
    setBrushColor(canvas, color, val);
  };

const updateEraserSize = (val: number) => {
  setEraserSize(val); // updates React state
  if (!canvas) return;
  applyEraserSize(canvas, val); // updates Fabric brush size
};
  const updateFontSize = (val: number) => {
    setFontSize(val);
    if (!canvas || !selectedObject) return;
    if (selectedObject.type === "textbox") {
      (selectedObject as Textbox).set({ fontSize: val });
      selectedObject.setCoords?.();
      canvas.requestRenderAll();
    }
  };

  const deleteSelected = () => {
    if (!selectedObject || !canvas) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    applySelection(null);
  };

  // === TOOL HANDLERS ===
  const activateTool = (tool: string, action: () => void) => {
    if (!canvas) return;
    disableDrawingMode(canvas);
    setActiveTool(tool);
    action();
  };

  const handleBrush = () => activateTool("brush", () => addBrush(canvas!, color, brushSize));
  const handleEraser = () => activateTool("eraser", () => addEraser(canvas!, eraserSize));
  const handleText = () => activateTool("text", () => addText(canvas!, "New Text", fontSize, color));
  const handleBucket = () => activateTool("bucket", () => addBucketTool(canvas!, color));
  const handleEyedropper = () =>
    activateTool("eyedropper", () =>
      addEyedropperTool(canvas!, (picked) => {
        setColor(picked);
      })
    );

  return (
     <div
    className="p-4 bg-white rounded shadow w-64 space-y-4 max-h-[70vh] overflow-y-auto">
      {/* === Toolbar === */}
      <div className="flex flex-wrap gap-2">
        <button onClick={handleText} className={`p-2 rounded text-teal-900 ${activeTool==="text"?"bg-teal-400 text-white":"bg-gray-200 hover:bg-gray-300"}`} title="Add Text"><Type size={18} strokeWidth={2.3}  /></button>
        <button onClick={() => canvas && addRectangle(canvas)} className="p-2 text-teal-900 bg-gray-200 rounded hover:bg-gray-300" title="Add Rectangle"><Square size={18} strokeWidth={2.3}/></button>
        <button onClick={() => canvas && addCircle(canvas)} className="p-2 text-teal-900 bg-gray-200 rounded hover:bg-gray-300" title="Add Circle"><CircleIcon size={18} strokeWidth={2.3}/></button>
        <button onClick={() => canvas && addLine(canvas)} className="p-2 text-teal-900 bg-gray-200 rounded hover:bg-gray-300" title="Add Line"><Minus size={18} strokeWidth={2.3}/></button>

        {/* brush/eraser/freeform/image/select */}
        <button onClick={handleBrush} className={`p-2 rounded text-teal-900 ${activeTool==="brush"?"bg-teal-400 text-white":"bg-gray-200 hover:bg-gray-300"}`} title="Brush"><Brush size={18} strokeWidth={2.3}/></button>
        <button onClick={handleEraser} className={`p-2 rounded text-teal-900 ${activeTool==="eraser"?"bg-teal-400 text-white":"bg-gray-200 hover:bg-gray-300"}`} title="Eraser"><Eraser size={18} strokeWidth={2.3}/></button>
        <button onClick={() => canvas && addFreeform(canvas)} className="p-2  text-teal-900 bg-gray-200 rounded hover:bg-gray-300" title="Freeform"><Pencil size={18} strokeWidth={2.3}/></button>
        <button onClick={() => canvas && addImage(canvas)} className="p-2 text-teal-900 bg-gray-200 rounded hover:bg-gray-300" title="Add Image"><ImageIcon size={18} strokeWidth={2.3}/></button>

        {/* bucket + eyedropper */}
        <button onClick={handleBucket} className={`p-2 rounded text-teal-900 ${activeTool==="bucket"?"bg-teal-400 text-white":"bg-gray-200 hover:bg-gray-300"}`} title="Bucket"><PaintBucket size={18} strokeWidth={2.3}/></button>
        <button onClick={handleEyedropper} className={`p-2 rounded text-teal-900 ${activeTool==="eyedropper"?"bg-teal-400 text-white":"bg-gray-200 hover:bg-gray-300"}`} title="Eyedropper"><Pipette size={18} strokeWidth={2.3}/></button>

        {/* selection */}
        <button
          onClick={() => {
            if (!canvas) return;
            disableDrawingMode(canvas);
            setActiveTool(null);
          }}
          className={`p-2 rounded text-teal-900 ${!activeTool?"bg-teal-400 text-white":"bg-gray-200 hover:bg-gray-300"}`}
          title="Select"
        >
          <MousePointer size={18} strokeWidth={2.3}/>
        </button>
      </div>

      {/* === Settings Panel === */}
      {/* Global tool color (manual always active) */}
      <div className="space-y-2">
        <label className="block text-sm">Tool Color</label>
        <input
          aria-label="Color"
          type="color"
          value={color}
          onChange={(e) => updateColor(e.target.value)}
          disabled={!colorPickerActive} // ✅ inactive until user enables
          className={`w-full h-8 ${!colorPickerActive ? "cursor-not-allowed opacity-80" : ""}`}
        />
        <div className="flex items-center gap-2">
          <input
            id="toggle-picker"
            type="checkbox"
            checked={colorPickerActive}
            onChange={() => setColorPickerActive(!colorPickerActive)}
          />
          <label htmlFor="toggle-picker" className="text-sm">Enable Color Picker</label>
        </div>
      </div>

      {/* Per-object color fill */}
      {selectedObject && (
        <div className="space-y-2">
          <label className="block text-sm">Object Color</label>
          <input
            aria-label="Object Color"
            type="color"
            value={objectColor}
            onChange={(e) => updateObjectColor(e.target.value)}
            className="w-full h-8"
          />
        </div>
      )}

      {selectedObject?.type === "rect" && (
        <>
          <div>
            <label className="block text-sm">Width</label>
            <input aria-label="Width" type="number" value={width} onChange={(e) => updateWidth(e.target.value)} className="w-full border p-1 rounded"/>
          </div>
          <div>
            <label className="block text-sm">Height</label>
            <input aria-label="Height" type="number" value={height} onChange={(e) => updateHeight(e.target.value)} className="w-full border p-1 rounded"/>
          </div>
        </>
      )}

      {selectedObject?.type === "circle" && (
        <div>
          <label className="block text-sm">Diameter</label>
          <input aria-label="Diameter" type="number" value={diameter} onChange={(e) => updateDiameter(e.target.value)} className="w-full border p-1 rounded"/>
        </div>
      )}

      {selectedObject?.type === "textbox" && (
        <div>
          <label className="block text-sm">Font Size</label>
          <input aria-label="Font Size" type="number" value={fontSize} onChange={(e) => updateFontSize(parseInt(e.target.value))} className="w-full border p-1 rounded"/>
        </div>
      )}

      {activeTool==="brush" && (
        <div>
          <label className="block text-sm">Brush Size</label>
          <input aria-label="Brush Size" type="range" min="1" max="50" value={brushSize} onChange={(e) => updateBrushSize(parseInt(e.target.value))} className="w-full"/>
        </div>
      )}

      {activeTool==="eraser" && (
        <div>
          <label className="block text-sm">Eraser Size</label>
          <input aria-label="Eraser Size" type="range" min="5" max="100" value={eraserSize} onChange={(e) => updateEraserSize(parseInt(e.target.value))} className="w-full"/>
        </div>
      )}

      {selectedObject && (
        <button onClick={deleteSelected} className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
          <Trash2 size={16}/> Delete
        </button>
      )}
    </div>
  );
}
