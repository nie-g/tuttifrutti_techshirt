import React, { useEffect, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { X } from "lucide-react";

interface CommentsModalProps {
  previewId: Id<"design_preview">;
  onClose: () => void;
  onSelectImage?: (url: string) => Promise<void>;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  previewId,
  onClose,
  onSelectImage,
}) => {
  // ✅ Fetch all comments for this preview
  const comments = useQuery(api.comments.listByPreview, { preview_id: previewId });

  // ✅ Fetch all comment images related to this preview
  const commentImagesList = useQuery(
    api.comment_images.listAll,
    previewId ? { preview_id: previewId } : "skip"
  ) as
    | { _id: Id<"comment_images">; comment_id: Id<"comments">; storage_id: Id<"_storage"> }[]
    | undefined;

  // ✅ Fetch image URLs from storage
  const fetchImageUrl = useAction(api.comments.getCommentImageUrl);

  // ✅ Store image URLs grouped by comment_id
  const [commentImageMap, setCommentImageMap] = useState<Record<string, string[]>>({});

  // ✅ Load image URLs for each comment
  useEffect(() => {
    if (!commentImagesList || commentImagesList.length === 0) return;

    (async () => {
      const newMap: Record<string, string[]> = {};

      for (const img of commentImagesList) {
        if (!newMap[img.comment_id]) newMap[img.comment_id] = [];

        try {
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

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          {!comments || comments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">No comments yet.</p>
          ) : (
            comments.map((comment) => {
              const images = commentImageMap[comment._id] || [];
              const formattedDate = new Date(comment.created_at).toLocaleString();

              return (
                <div
                  key={comment._id}
                  className="border border-gray-200 rounded-lg p-3 shadow-sm"
                >
                  
                  <p className="text-gray-600 text-sm mb-2">{comment.comment}</p>

                  {/* 🖼️ Comment Images */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Comment ${comment._id} img ${i}`}
                          className="rounded cursor-pointer border hover:opacity-80"
                          onClick={() => onSelectImage && onSelectImage(url)}
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
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
