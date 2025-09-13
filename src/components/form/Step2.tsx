// src/components/form/Step2.tsx
import React, { useEffect, useRef, useState } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import * as fabric from "fabric";
import {
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Square,
  Circle,
  Triangle,
  Type,
  LayoutTemplate,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";

interface Template {
  _id: Id<"design_templates">;
  template_name: string;
  template_image: string;
  created_at?: number;
}

interface Step2Props {
  canvasRef: RefObject<fabric.Canvas | null>;
  canvasState: any;
  setCanvasState: Dispatch<SetStateAction<any>>;
}

const ToolButton = ({
  icon,
  onClick,
  tooltip,
  disabled,
  active,
  color = "teal",
}: {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  active?: boolean;
  color?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`flex items-center justify-center p-3 rounded-lg border shadow-sm transition-colors duration-200 w-full
      ${
        active
          ? `bg-${color}-500 text-white`
          : `bg-gray-100 hover:bg-${color}-100`
      }
      disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {icon}
  </button>
);

const Step2: React.FC<Step2Props> = ({
  canvasRef,
  canvasState,
  setCanvasState,
}) => {
  const tempStorageRef = useRef<any[]>([]);
  const redoStackRef = useRef<any[]>([]);

  const templates = useQuery(api.design_templates.getAll);

  const assignId = (obj: fabric.Object) => {
    if (!(obj as any).id) {
      (obj as any).id = `obj_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;
    }
  };

  const saveState = () => {
    if (canvasRef.current) {
      const json = canvasRef.current.toJSON();
      tempStorageRef.current.push(json);
      redoStackRef.current = [];
    }
  };

  const undo = () => {
    if (!canvasRef.current || tempStorageRef.current.length < 2) return;
    const last = tempStorageRef.current.pop();
    if (last) redoStackRef.current.push(last);
    const prev = tempStorageRef.current[tempStorageRef.current.length - 1];
    canvasRef.current.loadFromJSON(prev, () =>
      canvasRef.current?.renderAll()
    );
  };

  const redo = () => {
    if (!canvasRef.current || redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop();
    if (next) {
      canvasRef.current.loadFromJSON(next, () =>
        canvasRef.current?.renderAll()
      );
      tempStorageRef.current.push(next);
    }
  };

  const [isTextInputModalOpen, setIsTextInputModalOpen] = useState(false);
  const [textInputValue, setTextInputValue] = useState("Your Text");
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] =
    useState(false);

  const addRectangle = () => {
    if (!canvasRef.current) return;
    saveState();
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: "red",
      width: 60,
      height: 60,
      opacity: 0.8,
    });
    assignId(rect);
    canvasRef.current.add(rect);
  };

  const addCircle = () => {
    if (!canvasRef.current) return;
    saveState();
    const circle = new fabric.Circle({
      radius: 50,
      fill: "blue",
      left: 100,
      top: 100,
      opacity: 0.8,
    });
    assignId(circle);
    canvasRef.current.add(circle);
  };

  const addTriangle = () => {
    if (!canvasRef.current) return;
    saveState();
    const triangle = new fabric.Triangle({
      width: 100,
      height: 100,
      fill: "green",
      left: 100,
      top: 100,
      opacity: 0.8,
    });
    assignId(triangle);
    canvasRef.current.add(triangle);
  };

  const addText = () => {
    setIsTextInputModalOpen(true);
  };

  const handleAddTextToCanvas = () => {
    if (!canvasRef.current || !textInputValue) return;
    saveState();
    const text = new fabric.IText(textInputValue, {
      left: 100,
      top: 100,
      fontFamily: "arial",
      fill: "#000",
    });
    assignId(text);
    canvasRef.current.add(text);
    setIsTextInputModalOpen(false);
    setTextInputValue("Your Text");
  };

  // ✅ Promise-based template selection
  const handleSelectTemplate = async (templateImage: string) => {
    if (!canvasRef.current) return;
    saveState();
    canvasRef.current.clear();

    try {
      const img = await fabric.Image.fromURL(templateImage, {
        crossOrigin: "anonymous",
      });
      const canvas = canvasRef.current!;
      const scale = Math.min(
        (canvas.width! * 0.9) / (img.width ?? 1),
        (canvas.height! * 0.9) / (img.height ?? 1)
      );
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: "center",
        originY: "center",
      });
      assignId(img);
      canvas.add(img);
      canvas.renderAll();
      setIsTemplateGalleryModalOpen(false);
    } catch (err) {
      console.error("Failed to load template:", err);
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    saveState();
    canvasRef.current.clear();
  };

  // ✅ Promise-based image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvasRef.current || !e.target.files?.length) return;
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (f) => {
        const imageData = f.target?.result;
        if (typeof imageData === "string") {
          try {
            const img = await fabric.Image.fromURL(imageData, {
              crossOrigin: "anonymous",
            });
            const canvas = canvasRef.current!;
            const scale = Math.min(
              (canvas.width! * 0.8) / (img.width ?? 1),
              (canvas.height! * 0.8) / (img.height ?? 1)
            );
            img.set({
              scaleX: scale,
              scaleY: scale,
              left: canvas.width! / 2,
              top: canvas.height! / 2,
              originX: "center",
              originY: "center",
            });
            assignId(img);
            canvas.add(img);
            saveState();
          } catch (err) {
            console.error("Failed to load uploaded image:", err);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = new fabric.Canvas("designCanvas", {
        preserveObjectStacking: true,
      });
      canvasRef.current = canvas;

      canvas.on("object:added", (e) => {
        if (e.target) assignId(e.target);
      });

      saveState();
    }

    if (canvasRef.current && canvasState) {
      canvasRef.current.loadFromJSON(canvasState, () =>
        canvasRef.current?.renderAll()
      );
    }

    return () => {
      if (canvasRef.current) {
        setCanvasState(canvasRef.current.toJSON());
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, [canvasRef, canvasState, setCanvasState]);

  return (
    <div className="flex h-[calc(100vh-150px)] overflow-hidden border rounded-lg shadow">
      {/* Left panel */}
      <div className="w-1/4 bg-gray-50 p-4 overflow-y-auto flex flex-col space-y-4">
        <ToolButton
          icon={<Upload />}
          onClick={() => document.getElementById("fileInput")?.click()}
          tooltip="Upload Image"
          color="teal"
        />
        <input
          aria-label="Upload image"
          type="file"
          id="fileInput"
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        <ToolButton icon={<ArrowLeft />} onClick={undo} tooltip="Undo" />
        <ToolButton icon={<ArrowRight />} onClick={redo} tooltip="Redo" />
        <ToolButton icon={<Trash2 />} onClick={clearCanvas} tooltip="Clear" />
        <ToolButton icon={<Square />} onClick={addRectangle} tooltip="Rectangle" color="blue" />
        <ToolButton icon={<Circle />} onClick={addCircle} tooltip="Circle" color="purple" />
        <ToolButton icon={<Triangle />} onClick={addTriangle} tooltip="Triangle" color="orange" />
        <ToolButton icon={<Type />} onClick={addText} tooltip="Text" color="pink" />
        <ToolButton icon={<LayoutTemplate />} onClick={() => setIsTemplateGalleryModalOpen(true)} tooltip="Template Gallery" color="gray" />
      </div>

      {/* Right panel */}
      <div className="w-3/4 overflow-auto p-4 flex justify-center items-center">
        <canvas
          id="designCanvas"
          width={1200}
          height={800}
          className="border rounded-lg shadow max-w-full h-auto"
        />
      </div>

      {/* Text modal */}
      {isTextInputModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h3 className="text-lg font-bold mb-4">Enter Text</h3>
            <input
              type="text"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              className="border p-2 w-full mb-4 rounded"
              placeholder="Your text here"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsTextInputModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTextToCanvas}
                className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template modal */}
      {isTemplateGalleryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl h-3/4 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Select a Design Template</h3>
            {templates === undefined ? (
              <div className="flex justify-center items-center h-48">
                <p>Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex justify-center items-center h-48">
                <p>No templates available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {templates.map((template: Template) => (
                  <div
                    key={template._id}
                    className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition"
                    onClick={() =>
                      handleSelectTemplate(template.template_image)
                    }
                  >
                    <img
                      src={template.template_image}
                      alt={template.template_name}
                      className="w-full h-48 object-cover"
                    />
                    <p className="p-2 text-center font-medium">
                      {template.template_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsTemplateGalleryModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2;
