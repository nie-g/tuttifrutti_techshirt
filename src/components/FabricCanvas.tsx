import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import CanvasSettings from "./designCanvasComponents/CanvasSettings";
import DesignDetails from "./designCanvasComponents/CanvasDesignDetails";
import { Save, Upload, Info, Wrench, ArrowLeft, ReceiptText } from "lucide-react"; // added Back icon
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation, useAction } from "convex/react";
import { useNavigate } from "react-router-dom";
import DesignerBillModal from "./DesignerBillModal";
// 🔹 Bigger canvas size
const CANVAS_WIDTH = 730;
const CANVAS_HEIGHT = 515;

interface FabricCanvasProps {
  designId: Id<"design">;
  initialCanvasJson?: string | null;
  onReady?: (canvasEl: HTMLCanvasElement) => void;
  onModified?: () => void;
  getThreeScreenshot?: () => string; // screenshot from 3D preview
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
  const navigate = useNavigate();
  const notifyClientUpdate = useMutation(api.design_notifications.notifyClientDesignUpdate);

  // 🔹 Floating panel state
  const [activeTab, setActiveTab] = useState<"none" | "details" | "tools">(
    "none"
  );

  const saveCanvas = useMutation(api.fabric_canvases.saveCanvas);
  const savePreview = useAction(api.design_preview.savePreview);
  const designDoc = useQuery(api.designs.getById, { designId });
  const isApproved = designDoc?.status === "approved";
  const isDisabled = designDoc?.status === "approved" || designDoc?.status === "finished";



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

  // Initialize Fabric.js canvas
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

  // Load initial JSON
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

  // 🔹 Save only JSON
  const handleSave = async () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());

    try {
      await saveCanvas({ designId, canvasJson: json, thumbnail: undefined });
      alert("Canvas saved successfully!");
      notifyParent(canvas);
    } catch (err) {
      console.error("Failed to save canvas", err);
      alert("Error saving canvas. Check console.");
    }
  };

  // 🔹 Save only Preview Image
  const handlePostUpdate = async () => {
  if (!getThreeScreenshot) {
    alert("3D preview screenshot function not provided.");
    return;
  }

    try {
      const dataUrl = getThreeScreenshot();
      const blob = await (await fetch(dataUrl)).blob();
      const previewBuffer = await blob.arrayBuffer();

      // 1️⃣ Save the preview
      await savePreview({ designId, previewImage: previewBuffer });

      // 2️⃣ Notify the client & update status
      await notifyClientUpdate({ designId });

      alert("Update posted successfully! The client has been notified.");
    } catch (err) {
      console.error("Failed to post update", err);
      alert("Error posting update. Check console.");
    }
  };
  const billingDoc = useQuery(api.billing.getBillingByDesign, { designId });
  const [isDesignerBillOpen, setIsDesignerBillOpen] = useState(false);

  return (
    <div className="p-2 relative">
      {/* Top row: Back button + Controls */}
      <div className="flex justify-between items-center mb-4">
        {/* Back button on the left */}
       <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>


        {/* Right-side controls: Details, Tools, Save, Post */}
        <div className="flex gap-2">
          {/* See Bill button – only show if billing exists */}
          {billingDoc && (
            <button
              type="button"
              onClick={() => setIsDesignerBillOpen(true)}
              className="p-2 rounded bg-zinc-500 hover:bg-zinc-600 text-white"
              title="See Bill"
            >
              <ReceiptText size={18} />
            </button>
          )}
          {/* Details button */}
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === "details" ? "none" : "details")
            }
            className={`p-2 rounded ${
              activeTab === "details" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            title="Details"
          >
            <Info size={18} />
          </button>

          {/* Tools button */}
          {!isDisabled &&  (
            <button
              type="button"
              onClick={() =>
                setActiveTab(activeTab === "tools" ? "none" : "tools")
              }
              className={`p-2 rounded ${
                activeTab === "tools" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
              title="Tools"
            >
              <Wrench size={18} />
            </button>
          )}

          {/* Save button */}
          {!isDisabled && (
            <button
              type="button"
              title="Save design"
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={handleSave}
            >
              <Save size={18} />
              <span className="text-sm font-medium">Save</span>
            </button>
          )}

          {/* Post button */}
          {!isDisabled && (
            <button
              type="button"
              title="Post update"
              className="flex items-center gap-2 px-3 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
              onClick={handlePostUpdate}
            >
              <Upload size={18} />
              <span className="text-sm font-medium">Post</span>
            </button>
          )}

        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasElRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 w-[1000px] h-[700px] rounded"
      />


      {/* Floating container for details/tools */}
        {activeTab !== "none" && (
          <div className="absolute top-16 right-2 max-w-[100vw] sm:max-w-sm p-4 bg-white shadow-lg border rounded-xl z-10 overflow-y-auto max-h-[80vh]">
            {activeTab === "details" && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Design Details</h3>
                <DesignDetails designId={designId} />
              </div>
            )}

            {activeTab === "tools" && (
              <div className="w-full">
                <CanvasSettings canvas={canvas} />
              </div>
            )}
          </div>
        )}
        {billingDoc && isDesignerBillOpen && (
          <DesignerBillModal
            designId={designId} // pass the designId

            onClose={() => setIsDesignerBillOpen(false)}
          />
        )}
        

    </div>
  );
};

export default FabricCanvas;
