// SeeDesign.tsx
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import * as fabric from "fabric";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import TexturedTShirt from "./seeDesign/TexturedShirt";
import ThreeScreenshotHelper from "../components/ThreeScreenshotHelper";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";

type FabricCanvasRecord = {
  _id: Id<"fabric_canvases">;
  canvas_json?: string;
  design_id: Id<"design">;
};

type DesignRecord = {
  _id: Id<"design">;
  request_id: Id<"design_requests">;
  status: string;
};

type DesignRequestRecord = {
  _id: Id<"design_requests">;
  shirt_type: "tshirt" | "polo" | "jersey" | "roundneck";
};

const SeeDesign: React.FC = () => {
  const navigate = useNavigate();
  const { designId } = useParams<{ designId: Id<"design"> }>();

  const { user, isLoaded } = useUser();

  const [fabricCanvas, setFabricCanvas] = useState<HTMLCanvasElement>();
  const [canvasModifiedKey, setCanvasModifiedKey] = useState(0);
  const screenshotRef = useRef<() => string>(() => "");

  // 🚨 Redirect if not client
  useEffect(() => {
    if (isLoaded && user) {
      const role = (user.unsafeMetadata?.userType as string) || "guest";
      if (role !== "client") {
        navigate("/");
      }
    }
  }, [isLoaded, user, navigate]);

  // fetch design by ID
  const design = useQuery(
    api.designs.getById,
    designId ? { designId } : "skip"
  ) as DesignRecord | null | undefined;

  // fetch linked request to get shirt type
  const designRequest = useQuery(
    api.design_requests.getById,
    design?.request_id ? { requestId: design.request_id } : "skip"
  ) as DesignRequestRecord | null | undefined;

  // fetch the fabric canvas JSON stored for this design
  const canvasDoc = useQuery(
    api.fabric_canvases.getByDesign,
    designId ? { designId } : "skip"
  ) as FabricCanvasRecord | null | undefined;

  // latest preview
  const latestPreview = useQuery(
    api.design_preview.getLatestByDesign,
    designId ? { designId } : "skip"
  ) as { _id: Id<"design_preview"> } | undefined;

  // comments
  const comments = useQuery(
    api.comments.listByPreview,
    latestPreview?._id ? { preview_id: latestPreview._id } : "skip"
  ) as
    | {
        _id: Id<"comments">;
        user_id: Id<"users">;
        comment: string;
        created_at: number;
      }[]
    | undefined;

  const addComment = useMutation(api.comments.add);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim() || !latestPreview?._id) return;
    try {
      await addComment({
        preview_id: latestPreview._id,
        comment: newComment,
      });
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  // 🔥 Load fabric JSON into hidden canvas
  useEffect(() => {
    if (!canvasDoc?.canvas_json) return;

    const tempCanvasEl = document.createElement("canvas");
    tempCanvasEl.width = 500;
    tempCanvasEl.height = 500;

    const fabricInstance = new fabric.Canvas(tempCanvasEl, {
      backgroundColor: "white",
      renderOnAddRemove: false,
    });

    try {
      fabricInstance.loadFromJSON(canvasDoc.canvas_json, () => {
        fabricInstance.renderAll();
        fabricInstance.requestRenderAll();
        setFabricCanvas(tempCanvasEl);
        setCanvasModifiedKey((k) => k + 1);
      });
    } catch (e) {
      console.error("Failed to load fabric canvas JSON", e);
    }
  }, [canvasDoc]);

  const shirtType = designRequest?.shirt_type ?? "tshirt";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative p-4 flex flex-col md:flex-row gap-4 h-[80vh]"
    >
      {/* Back */}
      <motion.button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white shadow-lg rounded-full px-4 py-2 hover:bg-gray-100"
      >
        <ArrowLeft size={18} /> Back
      </motion.button>

      {/* Left: 3D preview */}
      <motion.div className="flex-1 border rounded-2xl h-[96vh] p-6 shadow-md bg-white flex items-center justify-center">
        {fabricCanvas && designRequest ? (
          <ThreeCanvas camera={{ position: [0, 1, 2.5], fov: 45 }}>
            <color attach="background" args={["#F8F9FA"]} />
            <PresentationControls>
              <Stage>
                <TexturedTShirt
                  fabricCanvas={fabricCanvas}
                  canvasModifiedKey={canvasModifiedKey}
                  shirtType={shirtType}
                />
              </Stage>
            </PresentationControls>
            <ThreeScreenshotHelper
              onReady={(fn) => (screenshotRef.current = fn)}
            />
          </ThreeCanvas>
        ) : (
          <p className="text-gray-500">Loading design...</p>
        )}
      </motion.div>

      {/* Right: Comments */}
      <motion.div className="w-full md:w-1/3 border rounded-2xl h-[96vh] p-4 shadow-md bg-white flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
          {comments?.length ? (
            comments
              .slice()
              .reverse() // oldest at top, newest at bottom (chat style)
              .map((c) => {
                const formattedDate = new Date(c.created_at).toLocaleString();
                return (
                  <div
                    key={c._id}
                    className="p-3 bg-gray-50 border rounded-lg shadow-sm"
                  >
                    <p className="text-gray-800 text-sm">{c.comment}</p>
                    <span className="text-xs text-gray-500 block mt-1">
                      {formattedDate}
                    </span>
                  </div>
                );
              })
          ) : (
            <p className="text-gray-400 text-sm">No comments yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Send
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SeeDesign;
