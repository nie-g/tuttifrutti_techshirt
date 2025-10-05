// src/pages/SeeDesign.tsx
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import * as fabric from "fabric";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import TexturedTShirt from "./seeDesign/TexturedShirt";
import ThreeScreenshotHelper from "../components/ThreeScreenshotHelper";
import { ArrowLeft, Paperclip } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useQuery, useMutation, useAction } from "convex/react"; // ✅ include useAction
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
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
  designer_id: Id<"users">;
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
  useEffect(() => {
    if (isLoaded && user) {
      const role = (user.unsafeMetadata?.userType as string) || "guest";
      if (role !== "client") {
        navigate("/");
      }
    }
  }, [isLoaded, user, navigate]);
  // fetch design by ID
  const design = useQuery(api.designs.getById,designId ? { designId } : "skip") as DesignRecord | null | undefined;
  // fetch linked request to get shirt type
  const designRequest = useQuery(api.design_requests.getById,design?.request_id ? { requestId: design.request_id } : "skip"
  ) as DesignRequestRecord | null | undefined;
  // fetch the fabric canvas JSON stored for this design
  const canvasDoc = useQuery( api.fabric_canvases.getByDesign, designId ? { designId } : "skip"
  ) as FabricCanvasRecord | null | undefined;

  const latestPreview = useQuery(
    api.design_preview.getLatestByDesign,
    designId ? { designId } : "skip"
  ) as { _id: Id<"design_preview"> } | undefined;
  // comments
  const comments = useQuery( api.comments.listByPreview,latestPreview?._id ? { preview_id: latestPreview._id } : "skip"
  ) as
    | {
        _id: Id<"comments">;
        user_id: Id<"users">;
        comment: string;
        created_at: number;
      }[]
    | undefined;
// --- Comment logic with in-memory image handling ---
  const [newComment, setNewComment] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const saveCommentImage = useAction(api.comments.saveCommentsImages);
  const addComment = useMutation(api.comments.add);
 // ✅ Fetch comment images for each comment
const commentImagesList = useQuery(
  api.comment_images.listAll,
  latestPreview?._id ? { preview_id: latestPreview._id } : "skip"
) as { _id: Id<"comment_images">; comment_id: Id<"comments">; storage_id: Id<"_storage"> }[] | undefined;

// --- existing states ---
const [commentImageMap, setCommentImageMap] = useState<Record<string, string[]>>({});
const fetchImageUrl = useAction(api.comments.getCommentImageUrl);

// ✅ Load image URLs for each comment
useEffect(() => {
  if (!commentImagesList || commentImagesList.length === 0) return;

  (async () => {
    const newMap: Record<string, string[]> = {};

    for (const img of commentImagesList) {
      if (!newMap[img.comment_id]) newMap[img.comment_id] = [];

      try {
    // ✅ Skip if storage_id is missing or null
        if (!img.storage_id) continue;

        const url = await fetchImageUrl({ storageId: img.storage_id });
        if (url) newMap[img.comment_id].push(url);
      } catch (err) {
        console.error("Failed to fetch image URL:", err);
      }

    }

    setCommentImageMap(newMap);
  })();
}, [commentImagesList, fetchImageUrl]);


  

// ✅ Compress images before preview
  async function compressImageFile(
    file: File,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("No canvas context"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

// ✅ Select images (temporary, in-memory)
const handleCommentImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const compressedImages: string[] = [];
  for (const file of files) {
    try {
      const dataUrl = await compressImageFile(file);
      compressedImages.push(dataUrl);
    } catch (err) {
      console.error("Failed to compress image:", err);
    }
  }

  setCommentImages((prev) => [...prev, ...files]);
  setPreviewImages((prev) => [...prev, ...compressedImages]);
};

// ✅ Remove a selected preview before upload
const removeCommentImage = (index: number) => {
  setCommentImages((prev) => prev.filter((_, i) => i !== index));
  setPreviewImages((prev) => prev.filter((_, i) => i !== index));
};

const handleAddComment = async () => {
  if (!latestPreview?._id) return;

  // Don’t submit if there’s no text and no images
  if (!newComment.trim() && commentImages.length === 0) return;

  try {
    // Always create a comment (even if it’s empty text)
    const commentId = await addComment({
      preview_id: latestPreview._id,
      comment: newComment.trim() || "",
    });

    // Upload images if any are selected
    if (commentImages.length > 0) {
      // Sequential uploads to ensure correct linking
      for (const file of commentImages) {
        const arrayBuffer = await file.arrayBuffer();
        await saveCommentImage({
          comment_id: commentId,
          fileBytes: arrayBuffer,
        });
      }
    }

    // Reset input and previews
    setNewComment("");
    setCommentImages([]);
    setPreviewImages([]);

  } catch (err) {
    console.error("❌ Failed to add comment:", err);
    alert("⚠️ Failed to add comment. Please try again.");
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
  const approveBill = useMutation(api.billing.approveBill);

  const reviewer = useQuery(
    api.userQueries.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
    const handleApproveBill = async () => {
    if (!designId) return;
    try {
      const res = await approveBill({ designId });
      alert("✅ Bill approved successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Failed to approve bill:", err);
      alert("⚠️ Failed to approve bill.");
    }
  };
// Fetch designer info for the current design
const designer = useQuery(api.designers.getByUserId,design?.designer_id ? { userId: design.designer_id } : "skip");
const portfolios = useQuery(api.portfolio.getByDesignerId,designer?._id ? { designer_id: designer._id } : "skip");
const addRatingMutation = useMutation(api.ratings_and_feedback.addRating);
const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
const [rating, setRating] = useState(0);
const [feedback, setFeedback] = useState("");
const RevisionConfirmModal = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
      <h3 className="text-lg font-semibold mb-2">Confirm Revision Request</h3>
      <p className="text-sm text-gray-600 mb-4">
        Each revision is estimated to cost <span className="font-medium text-red-600">₱350 - ₱400</span>.  
        Are you sure you want to request a revision for this design?
      </p>
      <div className="flex justify-end gap-3">
        <button onClick={() => setIsRevisionModalOpen(false)}
         className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition">
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!design?._id) return;
            try { await requestRevision({ designId: design._id });alert("✅ Revision requested successfully!");
            } catch (err) {console.error(err);alert("⚠️ Failed to request revision.");}
            setIsRevisionModalOpen(false);
          }}
          className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-yellow-600 transition">
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
      <h3 className="text-lg font-semibold mb-2">Design Not Ready </h3>
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


 const shirtType =
  (designRequest?.shirt_type ||
    (designRequest as any)?.tshirt_type ||
    "tshirt")
    .toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="relative p-4 flex flex-col md:flex-row gap-4 h-[80vh]"
    >
      {/* Left: 3D preview */}
      <motion.div className="relative flex-1 border border-slate-300 rounded-2xl h-[96vh] p-6 shadow-md bg-white flex items-center justify-center">
        {/* Back + Approve inside 3D canvas container */}
        <div className="absolute top-4 left-4 z-20">
          <motion.button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 bg-white shadow-lg rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            <ArrowLeft size={18} /> Back
          </motion.button>
        </div>

        <div className="absolute top-4 right-4 z-20 flex gap-3">
          {design && design.status === "approved" || design?.status === "finished" ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-600 px-4 py-2 rounded-lg shadow">
                Approved
              </div>
              {/* 🆕 Billing button only visible when approved */}
              <motion.button
                onClick={() => setIsBillModalOpen(true)}
                className="bg-teal-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-teal-600 transition flex items-center gap-2"
              >
                View Bill
              </motion.button>
               <motion.button
                onClick={() => setIsRatingModalOpen(true)}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-600 transition flex items-center gap-2"
              >
                Rate Design
              </motion.button>
            </div>
          ) :design && design.status === "in_production" ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-purple-200 border border-purple-300 text-purple-700  px-4 py-2 rounded-lg shadow">
                In Production

              </div>
              <motion.button
                onClick={() => setIsBillModalOpen(true)}
                className="bg-teal-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-teal-600 transition flex items-center gap-2"
              >
                View Bill
              </motion.button>
               <motion.button
                onClick={() => setIsRatingModalOpen(true)}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-600 transition flex items-center gap-2"
              >
                Rate Design
              </motion.button>
            </div>
          ) :
          (
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
                  className="bg-teal-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-teal-600 transition"
                >
                  Approve
                </motion.button>

                {design.status !== "approved"  && (
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
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-600 transition"
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
            <ThreeScreenshotHelper onReady={(fn) => (screenshotRef.current = fn)}/>
          </ThreeCanvas>
        ) : (
          <p className="text-gray-500">Loading design...</p>
        )}
      </motion.div>

     {/* Right: Comments */}
    <motion.div className="w-full md:w-1/3 border border-gray-300 rounded-2xl h-[96vh] p-4 shadow-lg bg-white flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Comments</h2>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 border-b border-gray-400">
          {comments?.length ? (
            comments
              .slice()
              .reverse()
              .map((c) => {
                const formattedDate = new Date(c.created_at).toLocaleString();
                const images = commentImageMap[c._id] || [];

                return (
                  <div key={c._id} className="p-3 bg-gray-50 border border-gray-400 rounded-lg shadow-sm">
                    <p className="text-gray-800 text-sm">{c.comment}</p>

                    {/* 🖼️ Attached images */}
                    {images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt={`comment-img-${idx}`}
                            className="w-24 h-24 object-cover rounded-lg border border-gray-400"
                          />
                        ))}
                      </div>
                    )}

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

      {/* Input / Controls */}
      {/* Input / Controls */}
      {(() => {
        const isCommentsDisabled =
          design?.status === "approved" ||
          design?.status === "finished" ||
          design?.status === "in_production" ||
          !latestPreview;

        return (
          <div className="flex flex-col gap-2 ">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  design?.status === "approved" ||
                  design?.status === "finished" ||
                  design?.status === "in_production"
                    ? "Comments are disabled for this design."
                    : "Write a comment..."
                }
                disabled={isCommentsDisabled}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-100 disabled:text-gray-400"
              />

              <label
                htmlFor="comment-image-upload"
                className={`p-2 rounded-md cursor-pointer transition ${
                  isCommentsDisabled
                    ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-400"
                    : "text-teal-600 hover:text-teal-900"
                }`}
              >
                <Paperclip className="w-5 h-5" />
                <input
                  aria-label="file"
                  id="comment-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCommentImageSelect}
                  disabled={isCommentsDisabled}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleAddComment}
                disabled={isCommentsDisabled}
                className={`px-4 py-2 text-sm rounded-lg ${
                  isCommentsDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-teal-500 text-white hover:bg-teal-600"
                }`}
              >
                Send
              </button>
            </div>

            {/* 🖼️ Preview thumbnails */}
            {!isCommentsDisabled && previewImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previewImages.map((src, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img
                      src={src}
                      alt={`Preview ${idx}`}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeCommentImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ⚠️ Notice when comments are disabled */}
            {isCommentsDisabled && (
              <p className="text-xs text-gray-500 italic mt-1">
              Comments are disabled for designs that are marked as approved, finished, or in-production.
              </p>
            )}
          </div>
        );
      })()}

      </motion.div>

     {/* 🆕 Modal Renders */}
      {isRevisionModalOpen && <RevisionConfirmModal />}
      {isApproveModalOpen && <ApproveConfirmModal />}
      {isNotReadyModalOpen && <NotReadyModal />}
      {isRevisionInProgressModalOpen && <RevisionInProgressModal />}
      {isBillModalOpen && billing && (
      <BillModal designId={design!._id} billing={billing} onClose={() => setIsBillModalOpen(false)} onApprove={handleApproveBill} onNegotiate={() => console.log("negotiate bill")}/>
       )}
       {isRatingModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-2">Rate this Design</h3>
                  
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Leave feedback (optional)"
                    className="w-full border rounded-lg p-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />

                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsRatingModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition" >
                      Cancel
                    </button>
                    <button
                      onClick={async () => { if (!design?._id || !user?.id) return;
                       try {
                          if (!user || !reviewer || !portfolios?.[0]?._id) { console.error("Missing user, reviewer, or portfolio");
                            return;
                          }

                          // Cast to Convex ID types
                        await addRatingMutation({
                          portfolioId: portfolios[0]._id,
                          designId: design._id,
                          reviewerId: reviewer._id,
                          rating,
                          feedback,
                        });
                          alert("✅ Rating submitted!");
                          setIsRatingModalOpen(false);
                        } catch (err) {
                          console.error(err);
                          alert("⚠️ Failed to submit rating.");
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
    </motion.div>
  );
};

export default SeeDesign;
