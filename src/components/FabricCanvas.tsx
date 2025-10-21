import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import CanvasSettings from "./designCanvasComponents/CanvasSettings";
import DesignDetails from "./designCanvasComponents/CanvasDesignDetails";
import { Save, Upload, Info, Wrench, ArrowLeft, ReceiptText, Image, MessageCircleMore, Notebook, Loader2, BadgeCheck } from "lucide-react"; // added Back icon
import { useQuery } from "convex/react";
import toast from "react-hot-toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation, useAction } from "convex/react";
import { useNavigate } from "react-router-dom";
import DesignerBillModal from "./DesignerBillModal";
import { addImageFromUrl } from "./designCanvasComponents/CanvasTools";
import CommentsModal from "./designCanvasComponents/CanvasComments";
import ReferencesGallery from "./designCanvasComponents/CanvasDesignReferences";
import CanvasSketch from "./designCanvasComponents/CanvasSketchModal";
import { motion } from "framer-motion";
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
  

  const [showReferences, setShowReferences] = useState(false);


  // 🔹 Floating panel state
  const [activeTab, setActiveTab] = useState<"none" | "details" | "tools"| "references"| "comments"| "sketch">(
    "none"
  );

  const saveCanvas = useMutation(api.fabric_canvases.saveCanvas);
  const savePreview = useAction(api.design_preview.savePreview);
  const designDoc = useQuery(api.designs.getById, { designId });
  const isDisabled = designDoc?.status === "approved" || designDoc?.status === "completed";
  const requestId = designDoc?.request_id; 
  const [showComments, setShowComments] = useState(false);
  const previewDoc = useQuery(api.design_preview.getByDesign, { designId });
  const [showSketch, setShowSketch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  

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
          canvas.selection = false;
          canvas.skipTargetFind = true;
          
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
     setIsSaving(true);
    try {
      await saveCanvas({ designId, canvasJson: json, thumbnail: undefined });
      setIsSaving(false);
      notifyParent(canvas);
      toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        }  text-green-700 px-8 py-2 flex items-center`}
          >
            <BadgeCheck className="mr-2" size={20} />
            <span>Design Sucessfully saved!</span>
          </div>
              
          ));
    } catch (err) {
      console.error("Failed to save canvas", err);
     toast.error("Error saving canvas");
    }
  };
 const updateDesignStatus = useMutation(api.designs.updateStatus);
  // 🔹 Save only Preview Image
  const handlePostUpdate = async () => {
  if (!getThreeScreenshot) {
    alert("3D preview screenshot function not provided.");
    return;
  }
     setIsPosting(true);
    try {
      const dataUrl = getThreeScreenshot();
      const blob = await (await fetch(dataUrl)).blob();
      const previewBuffer = await blob.arrayBuffer();

      // 1️⃣ Save the preview
      await savePreview({ designId, previewImage: previewBuffer });
      await updateDesignStatus({ designId, status: "in_progress" });

      // 2️⃣ Notify the client & update status
      await notifyClientUpdate({ designId });
      toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        }  text-green-700 px-8 py-2 flex items-center`}
          >
            <BadgeCheck className="mr-2" size={20} />
            <span>Update sucessfully posted!</span>
          </div>
              
      ));
      setIsPosting(false);
    } catch (err) {
      console.error("Failed to post update", err);
    toast.error("Error posting update");
    }
  };
  const billingDoc = useQuery(api.billing.getBillingByDesign, { designId });
  const [isDesignerBillOpen, setIsDesignerBillOpen] = useState(false);
  const comments = useQuery(
  api.comments.listByPreview,
  previewDoc?._id ? { preview_id: previewDoc._id } : "skip"
  );

  

  return (
    <div className="p-2 relative">
      {/* Top row: Back button + Controls */}
      <div className="flex justify-between items-center mb-4">
        {/* Back button on the left */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100  border border-gray-300 rounded hover:bg-gray-300"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </motion.button>


        {/* Right-side controls: Details, Tools, Save, Post */}
        <div className="flex gap-2">
          {/* See Bill button – only show if billing exists */}
          {billingDoc && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsDesignerBillOpen(true)}
              className="p-2 rounded bg-zinc-500 hover:bg-zinc-600 text-white"
              title="See Bill"
            >
              <ReceiptText size={18} />
            </motion.button>
          )}

          {/*See Sketch*/}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowSketch(true)}
            className={`p-2 rounded ${
              showSketch ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title="Sketch"
          >
          <Notebook size={18} />
         
          </motion.button>
          {/* Comments button – only show if comments exist */}
          {comments && comments.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowComments(true)}
              className={`p-2 rounded ${
                showComments ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
              title="Comments"
            >
              <MessageCircleMore size={18} />
            </motion.button>
          )}
          {/* References button */}
           <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowReferences(true)}
            className={`p-2 rounded ${
              showReferences ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title="See References"
          >
            <Image size={18} />
          </motion.button>

          {/* Details button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() =>
              setActiveTab(activeTab === "details" ? "none" : "details")
            }
            className={`p-2 rounded ${
              activeTab === "details" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title="Details"
          >
            <Info size={18} />
          </motion.button>

          {/* Tools button */}
          {!isDisabled &&  (
             <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() =>
                setActiveTab(activeTab === "tools" ? "none" : "tools")
              }
              className={`p-2 rounded ${
                activeTab === "tools" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
              title="Tools"
            >
              <Wrench size={18} />
            </motion.button>
          )}

          {/* Save button */}
          {/* Save button */}
          {!isDisabled && (
            <motion.button
              whileHover={!isSaving ? { scale: 1.1 } : {}}
              whileTap={!isSaving ? { scale: 0.95 } : {}}
              type="button"
              disabled={isSaving}
              title="Save design"
              className={`flex items-center gap-2 px-3 py-2 rounded text-white transition-all ${
                isSaving ? "bg-green-400 opacity-70 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
              }`}
              onClick={handleSave}
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                  </motion.div>
                  <span className="text-sm font-medium">Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span className="text-sm font-medium">Save</span>
                </>
              )}
            </motion.button>
          )}

          {/* Post Update button */}
          {!isDisabled && (
            <motion.button
              whileHover={!isPosting ? { scale: 1.1 } : {}}
              whileTap={!isPosting ? { scale: 0.95 } : {}}
              type="button"
              disabled={isPosting}
              title="Post update"
              className={`flex items-center gap-2 px-3 py-2 rounded text-white transition-all ${
                isPosting ? "bg-teal-400 opacity-70 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"
              }`}
              onClick={handlePostUpdate}
            >
              {isPosting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                  </motion.div>
                  <span className="text-sm font-medium">Posting...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span className="text-sm font-medium">Post</span>
                </>
              )}
            </motion.button>
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
        {showComments && previewDoc?._id && (
        <CommentsModal
          previewId={previewDoc._id}
          onClose={() => setShowComments(false)}
          onSelectImage={async (url) => {
            if (canvas) {
              await addImageFromUrl(canvas, url);
              setShowComments(false);
            }
          }}
        />
      )}


        {showReferences && requestId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-4">
            <h2 className="text-lg font-semibold mb-3">Design References</h2>

            <ReferencesGallery
              requestId={requestId}
              onSelectImage={async (url) => {
                if (canvas) {
                  await addImageFromUrl(canvas, url);
                  setShowReferences(false);
                  setActiveTab("none");
                }
              }}
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowReferences(false)
                  
                  
                }
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSketch && requestId && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-4">
                <h2 className="text-lg font-semibold mb-3">Request Sketch</h2>
                <CanvasSketch requestId={requestId} />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowSketch(false)}
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

export default FabricCanvas;
