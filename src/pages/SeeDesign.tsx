// src/pages/SeeDesign.tsx
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import * as fabric from "fabric";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import TexturedTShirt from "./seeDesign/TexturedShirt";
import ThreeScreenshotHelper from "../components/ThreeScreenshotHelper";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { HandCoins } from "lucide-react"; // icon for billing
import BillModal from "../components/BillModal";



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

  // ✅ Approve mutation
  const approveDesign = useMutation(api.designs.approveDesign);
  const requestRevision = useMutation(api.designs.reviseDesign);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isNotReadyModalOpen, setIsNotReadyModalOpen] = useState(false);
  const [isRevisionInProgressModalOpen, setIsRevisionInProgressModalOpen] =useState(false);
  const billing = useQuery(api.billing.getBillingBreakdown,designId ? { designId } : "skip");
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  
const RevisionConfirmModal = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
      <h3 className="text-lg font-semibold mb-2">Confirm Revision Request</h3>
      <p className="text-sm text-gray-600 mb-4">
        Each revision is estimated to cost <span className="font-medium text-red-600">₱350 - ₱400</span>.  
        Are you sure you want to request a revision for this design?
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setIsRevisionModalOpen(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!design?._id) return;
            try {
              await requestRevision({ designId: design._id });
              alert("✅ Revision requested successfully!");
            } catch (err) {
              console.error(err);
              alert("⚠️ Failed to request revision.");
            }
            setIsRevisionModalOpen(false);
          }}
          className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-yellow-600 transition"
        >
          Yes, Request
        </button>
      </div>
    </div>
  </div>
);

const ApproveConfirmModal = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
      <h3 className="text-lg font-semibold mb-2">Confirm Approval</h3>
      <p className="text-sm text-gray-600 mb-4">
        Once you approve this design, it will be marked as{" "}
        <span className="font-medium text-teal-600">FINAL</span> and cannot be
        changed.  
        Are you sure you want to approve this design?
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setIsApproveModalOpen(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!design?._id) return;
            try {
              await approveDesign({ designId: design._id });
              alert("✅ Design approved successfully!");
            } catch (err) {
              console.error(err);
              alert("⚠️ Failed to approve design.");
            }
            setIsApproveModalOpen(false);
          }}
          className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition"
        >
          Yes, Approve
        </button>
      </div>
    </div>
  </div>
);

const NotReadyModal = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
      <h3 className="text-lg font-semibold mb-2">Design Not Ready</h3>
      <p className="text-sm text-gray-600 mb-4">
        This design is not yet complete.  
        Please wait until the designer posts an update before you can approve or request a revision.
      </p>
      <div className="flex justify-end">
        <button
          onClick={() => setIsNotReadyModalOpen(false)}
          className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition"
        >
          Okay
        </button>
      </div>
    </div>
  </div>
);

const RevisionInProgressModal = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
      <h3 className="text-lg font-semibold mb-2">Revision In Progress</h3>
      <p className="text-sm text-gray-600 mb-4">
        You cannot request another revision while one is already{" "}
        <span className="font-medium text-yellow-600">in progress</span>.  
        Please wait until the designer completes the current revision.
      </p>
      <div className="flex justify-end">
        <button
          onClick={() => setIsRevisionInProgressModalOpen(false)}
          className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition"
        >
          Okay
        </button>
      </div>
    </div>
  </div>
);


  // helper to create a plain white fallback canvas
function createWhiteFallbackCanvas(): HTMLCanvasElement {
  const tempCanvasEl = document.createElement("canvas");
  tempCanvasEl.width = 730;
  tempCanvasEl.height = 515;

  const fabricInstance = new fabric.Canvas(tempCanvasEl, {
    backgroundColor: "#f5f5f5",
    renderOnAddRemove: false,
  });

  fabricInstance.renderAll();
  return tempCanvasEl;
}


  
  // Load fabric JSON into hidden canvas
  // Load fabric JSON into hidden canvas (or fallback to plain white)
  useEffect(() => {
    if (!canvasDoc) return;

    const tempCanvasEl = document.createElement("canvas");
    tempCanvasEl.width = 730;
    tempCanvasEl.height = 515;

    const fabricInstance = new fabric.Canvas(tempCanvasEl, {
      backgroundColor: "#f5f5f5",
      renderOnAddRemove: false,
    });

    if (canvasDoc.canvas_json) {
      try {
        fabricInstance.loadFromJSON(canvasDoc.canvas_json, () => {
          fabricInstance.renderAll();
          fabricInstance.requestRenderAll();
          setFabricCanvas(tempCanvasEl);
          setCanvasModifiedKey((k) => k + 1);
        });
      } catch (e) {
        console.error("Failed to load fabric canvas JSON", e);
        // fallback to white
        setFabricCanvas(createWhiteFallbackCanvas());
        setCanvasModifiedKey((k) => k + 1);
      }
    } else {
      // no JSON → fallback to white
      setFabricCanvas(createWhiteFallbackCanvas());
      setCanvasModifiedKey((k) => k + 1);
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
      {/* Left: 3D preview */}
      <motion.div className="relative flex-1 border rounded-2xl h-[96vh] p-6 shadow-md bg-white flex items-center justify-center">
        {/* Back + Approve inside 3D canvas container */}
        <div className="absolute top-4 left-4 z-20">
          <motion.button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 bg-white shadow-lg rounded-full px-4 py-2 hover:bg-gray-100"
          >
            <ArrowLeft size={18} /> Back
          </motion.button>
        </div>

        <div className="absolute top-4 right-4 z-20 flex gap-3">
          {design && design.status === "approved" ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full shadow">
                <CheckCircle size={18} /> Approved
              </div>
              {/* 🆕 Billing button only visible when approved */}
              <motion.button
                onClick={() => setIsBillModalOpen(true)}
                className="bg-teal-500 text-white px-6 py-2 rounded-full shadow-lg hover:bg-teal-600 transition flex items-center gap-2"
              >
                <HandCoins size={18} />View Bill
              </motion.button>
            </div>
          ) : (
            design && (
              <>
                <motion.button
                  onClick={() => {
                    if (!latestPreview) {
                      setIsNotReadyModalOpen(true);
                    } else {
                      setIsApproveModalOpen(true);
                    }
                  }}
                  className="bg-teal-500 text-white px-6 py-2 rounded-full shadow-lg hover:bg-teal-600 transition"
                >
                  Approve
                </motion.button>

                {design.status !== "approved" && (
                  <motion.button
                    onClick={() => {
                      if (!latestPreview) {
                        setIsNotReadyModalOpen(true);
                      } else if (design.status === "pending_revision") {
                        setIsRevisionInProgressModalOpen(true);
                      } else {
                        setIsRevisionModalOpen(true);
                      }
                    }}
                    className="bg-yellow-500 text-white px-6 py-2 rounded-full shadow-lg hover:bg-yellow-600 transition"
                  >
                    Request Revision
                  </motion.button>
                )}
              </>
            )
          )}

        </div>




        {fabricCanvas && designRequest ? (
          <ThreeCanvas camera={{ position: [0, 1, 2.5], fov: 45 }}>
            <color attach="background" args={["#f5f5f5"]} />
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
              .reverse()
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
            placeholder={
              design?.status === "approved"
                ? "Comments are disabled after approval"
                : "Write a comment..."
            }
            disabled={design?.status === "approved"}
            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none ${
              design?.status === "approved"
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "focus:ring-2 focus:ring-teal-400"
            }`}
          />
          <button
            onClick={handleAddComment}
            disabled={design?.status === "approved"}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              design?.status === "approved"
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-teal-500 text-white hover:bg-teal-600"
            }`}
          >
            Send
          </button>
        </div>

      </motion.div>
     {/* 🆕 Modal Renders */}
      {isRevisionModalOpen && <RevisionConfirmModal />}
      {isApproveModalOpen && <ApproveConfirmModal />}
      {isNotReadyModalOpen && <NotReadyModal />}
      {isRevisionInProgressModalOpen && <RevisionInProgressModal />}
      {isBillModalOpen && billing && (<BillModal
    billing={billing}
    onClose={() => setIsBillModalOpen(false)}
    onApprove={() => console.log("approve bill")}
    onNegotiate={() => console.log("negotiate bill")}
  />
)}

     
    </motion.div>
  );
};

export default SeeDesign;
