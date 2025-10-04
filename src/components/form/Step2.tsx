// src/components/form/Step2.tsx
import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import CanvasSettings from "../designCanvasComponents/CanvasSettings";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { compressImageFile } from "../designCanvasComponents/CanvasTools";

interface Step2Props {
  canvasRef: React.RefObject<fabric.Canvas | null>;
  canvasState: any;
  setCanvasState: React.Dispatch<React.SetStateAction<any>>;
  shirtType: string | null;
  onSaveSnapshot?: (snapshot: string) => void;
}

const Step2: React.FC<Step2Props> = ({
  canvasRef,
  canvasState,
  setCanvasState,
  shirtType,
  onSaveSnapshot,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [localCanvas, setLocalCanvas] = useState<fabric.Canvas | null>(null);
  const isLoadingRef = useRef(false);
  const lastSentStateRef = useRef<string | null>(null);

  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const templates = useQuery(api.design_templates.getDesignTemplates, {
    shirtType: shirtType || undefined,
  });

  // initialize fabric canvas once
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      backgroundColor: "#f5f5f5",
      preserveObjectStacking: true,
    });

    canvas.setWidth(500);
    canvas.setHeight(500);
    canvas.renderAll();

    canvasRef.current = canvas;
    setLocalCanvas(canvas);

    const saveState = () => {
      try {
        const state = JSON.stringify(canvas.toJSON());
        undoStack.current.push(state);
        redoStack.current = [];
      } catch (err) {
        console.warn("Failed to save state:", err);
      }
    };

    const updateState = () => {
      if (isLoadingRef.current) return;
      try {
        const stateObj = canvas.toJSON();
        lastSentStateRef.current = JSON.stringify(stateObj);
        setCanvasState(stateObj);
        saveState();
      } catch (err) {
        console.warn("Failed to serialize canvas state:", err);
      }
    };

    canvas.on("object:added", updateState);
    canvas.on("object:modified", updateState);
    canvas.on("object:removed", updateState);

    // restore from localStorage if present
    const savedCanvas = localStorage.getItem("savedCanvas");
    if (savedCanvas) {
      try {
        canvas.loadFromJSON(JSON.parse(savedCanvas), () => {
          canvas.renderAll();
          undoStack.current.push(savedCanvas);
          lastSentStateRef.current = savedCanvas;
        });
      } catch (err) {
        console.error("Failed to load saved canvas from localStorage:", err);
      }
    } else {
      saveState();
    }

    return () => {
      canvas.off("object:added", updateState);
      canvas.off("object:modified", updateState);
      canvas.off("object:removed", updateState);
      canvas.dispose();
      canvasRef.current = null;
      setLocalCanvas(null);

      // 🧹 clear local storage when form closes
      localStorage.removeItem("savedCanvas");
      localStorage.removeItem("savedCanvasImage");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync canvas state from parent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasState) return;

    try {
      const incomingJson = JSON.stringify(canvasState);
      if (lastSentStateRef.current === incomingJson) return;
    } catch {}

    isLoadingRef.current = true;
    try {
      canvas.loadFromJSON(canvasState, () => {
        canvas.renderAll();
        const canonical = canvas.toJSON();
        const jsonStr = JSON.stringify(canonical);
        lastSentStateRef.current = jsonStr;
        setCanvasState(canonical);
        undoStack.current.push(jsonStr);
        isLoadingRef.current = false;
      });
    } catch (err) {
      console.error("Failed to load canvas JSON:", err);
      isLoadingRef.current = false;
    }
  }, [canvasState, setCanvasState, canvasRef]);

  // ✅ Save canvas JSON + snapshot locally + notify parent
  const handleSaveCanvas = () => {
    if (!localCanvas) return;
    try {
      const json = JSON.stringify(localCanvas.toJSON());
      localStorage.setItem("savedCanvas", json);

      const snapshot = localCanvas.toDataURL({
        format: "png",
        quality: 0.8,
        multiplier: 1,
      });
      localStorage.setItem("savedCanvasImage", snapshot);

      if (onSaveSnapshot) {
        onSaveSnapshot(snapshot);
      }

      alert("Canvas & snapshot saved locally ✅");
    } catch (err) {
      console.error("Error saving canvas:", err);
    }
  };

  const handleClearCanvas = () => {
    if (!localCanvas) return;
    localCanvas.clear();
    localCanvas.backgroundColor = "#f5f5f5";
    localCanvas.renderAll();
    localStorage.removeItem("savedCanvas");
    localStorage.removeItem("savedCanvasImage");
    undoStack.current = [];
    redoStack.current = [];
  };

  const handleUndo = () => {
    if (!localCanvas || undoStack.current.length < 2) return;
    const currentState = undoStack.current.pop();
    if (currentState) redoStack.current.push(currentState);

    const prevState = undoStack.current[undoStack.current.length - 1];
    if (prevState) {
      localCanvas.loadFromJSON(JSON.parse(prevState), () => {
        localCanvas.renderAll();
      });
    }
  };

  const handleRedo = () => {
    if (!localCanvas || redoStack.current.length === 0) return;
    const state = redoStack.current.pop();
    if (state) {
      undoStack.current.push(state);
      localCanvas.loadFromJSON(JSON.parse(state), () => {
        localCanvas.renderAll();
      });
    }
  };

  const filteredTemplates = templates || [];

  const handleApplyTemplate = async (template: any) => {
    if (!localCanvas) return;
    try {
      const blob = await fetch(template.template_image).then((r) => r.blob());
      const compressed = await compressImageFile(
        new File([blob], "template.jpg", { type: blob.type })
      );

      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.src = compressed;

      imgEl.onload = () => {
        const imgInstance = new fabric.Image(imgEl, {
          selectable: true,
          erasable: true,
        });

        imgInstance.scaleToWidth(400);

        // 👉 Add only when clicked (no auto-clear)
        localCanvas.add(imgInstance);
        localCanvas.centerObject(imgInstance);
        localCanvas.setActiveObject(imgInstance);
        localCanvas.renderAll();

        const json = JSON.stringify(localCanvas.toJSON());
        undoStack.current.push(json);
        lastSentStateRef.current = json;
        setCanvasState(localCanvas.toJSON());
      };
    } catch (err) {
      console.error("Failed to load template image:", err);
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-4 p-4 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-teal-600">Design Templates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template: any) => (
              <div
                key={template._id}
                className="cursor-pointer border rounded hover:shadow-md"
                onClick={() => handleApplyTemplate(template)}
              >
                <img
                  src={template.template_image}
                  alt={template.template_name}
                  className="w-full h-30 object-cover rounded-t"
                />
                <p className="text-xs text-center py-1 truncate">
                  {template.template_name}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 col-span-2">
              No templates available for this shirt type
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-4 flex-1">
        <div className="flex-1 flex justify-center items-center relative">
          <canvas
            ref={canvasElRef}
            width={500}
            height={500}
            className="border rounded-lg shadow"
            id="designCanvas"
          />
        </div>

        <div className="w-full md:w-72 flex-shrink-0 border rounded-lg shadow p-2 flex flex-col justify-between">
          <CanvasSettings canvas={localCanvas} />

          <div className="flex flex-wrap justify-end gap-2 mt-4">
            <button
              onClick={handleUndo}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Redo
            </button>
            <button
              onClick={handleClearCanvas}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={handleSaveCanvas}
              className="px-3 py-1 text-sm bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
