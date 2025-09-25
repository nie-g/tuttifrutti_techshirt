// src/pages/Gallery.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PlusCircle, Upload, Trash2, ImageIcon } from "lucide-react";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";

// === Types ===
type DesignerRecord = {
  _id: Id<"designers">;
  user_id: Id<"users">;
};

type GalleryRecord = {
  _id: Id<"galleries">;
  designer_id: Id<"designers">;
  title: string;
  caption?: string;
  created_at: number;
};

type GalleryImageRecord = {
  _id: Id<"gallery_images">;
  gallery_id: Id<"galleries">;
  image: Id<"_storage">;
  created_at: number;
};

// === Local reference type for previews before upload ===
type LocalImage = {
  id: string;
  file: File;
  preview: string;
};

const Gallery: React.FC = () => {
  const { user } = useUser();

  // === Queries ===
  const dbUser = useQuery(
    api.userQueries.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const designer = useQuery(
    api.designers.getByUser,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  ) as DesignerRecord | null | undefined;

  const galleries = useQuery(
    api.gallery.getByDesigner,
    designer?._id ? { designerId: designer._id } : "skip"
  ) as GalleryRecord[] | null | undefined;

  const imagesByGallery = useQuery(
    api.gallery.getImagesByDesigner,
    designer?._id ? { designerId: designer._id } : "skip"
  ) as Record<string, GalleryImageRecord[]> | null | undefined;

  const allStorageIds =
    imagesByGallery
      ? Object.values(imagesByGallery).flatMap((imgs) =>
          imgs.map((i) => i.image)
        )
      : [];

  const previewUrls = useQuery(
    api.gallery.getPreviewUrls,
    allStorageIds.length > 0 ? { storageIds: allStorageIds } : "skip"
  ) as Record<string, string> | null | undefined;

  // === Mutations / Actions ===
  const addGallery = useMutation(api.gallery.addGallery);
  const addGalleryImage = useMutation(api.gallery.addGalleryImage);
  const saveGalleryImage = useAction(api.gallery.saveGalleryImage);

  // === Local States ===
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploading, setUploading] = useState(false);

  // === Handle File Selection ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newImages = files.map((file) => ({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
    }));

    setLocalImages((prev) => [...prev, ...newImages]);
  };

  const removeLocalImage = (id: string) => {
    setLocalImages((prev) => prev.filter((img) => img.id !== id));
  };

  // === Save Gallery ===
  const handleSaveGallery = async () => {
    if (!designer?._id) return alert("No designer profile found");
    if (!title.trim() || localImages.length === 0) {
      return alert("⚠️ Title and at least one image required");
    }

    setUploading(true);

    try {
      // 1. Create gallery entry
      const galleryId = await addGallery({
        designer_id: designer._id,
        title,
        caption,
      });

      // 2. Upload images
      for (const img of localImages) {
        const arrayBuffer = await img.file.arrayBuffer();
        const storageId = await saveGalleryImage({
          galleryId,
          image: arrayBuffer,
        });
        await addGalleryImage({
          gallery_id: galleryId,
          image: storageId as Id<"_storage">,
        });
      }

      alert("✅ Gallery posted successfully!");
      setTitle("");
      setCaption("");
      setLocalImages([]);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to upload gallery");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl space-y-8"
          >
            {/* === Create New Gallery === */}
            <div className="p-6 bg-white rounded-2xl shadow-md space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PlusCircle className="text-teal-600" /> Create New Gallery
              </h2>
              <input
                type="text"
                placeholder="Gallery Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
              />

              {/* === Upload & Preview Images === */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Gallery Images *
                  </label>
                  <label
                    htmlFor="gallery-image-upload"
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 rounded-md cursor-pointer hover:bg-teal-100 transition-colors"
                  >
                    <Upload size={14} />
                    Upload Images
                  </label>
                  <input
                    id="gallery-image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {localImages.length > 0 ? (
                  <div className="space-y-4">
                    {localImages.map((img) => (
                      <div
                        key={img.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative inline-flex items-center justify-center max-w-xs max-h-64 overflow-hidden bg-white border border-gray-300 rounded-md shrink-0">
                            <img
                              src={img.preview}
                              alt="Gallery"
                              className="object-contain max-w-full max-h-64"
                            />
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                              {img.file.name}
                            </p>
                            <button
                              aria-label="Remove image"
                              onClick={() => removeLocalImage(img.id)}
                              className="p-1 text-red-500 rounded-full hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full p-6 bg-gray-50 border border-gray-200 border-dashed rounded-md">
                    <ImageIcon className="w-8 h-8 mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No images uploaded yet
                    </p>
                    <p className="text-xs text-gray-400">
                      Upload multiple images for your gallery
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveGallery}
                disabled={uploading}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
              >
                {uploading ? "Uploading..." : "Post Gallery"}
              </button>
            </div>

            {/* === List Galleries === */}
            <div className="space-y-6">
              {galleries?.map((gallery) => (
                <div
                  key={gallery._id}
                  className="p-6 bg-white rounded-2xl shadow-md space-y-3"
                >
                  <h3 className="text-lg font-semibold">{gallery.title}</h3>
                  {gallery.caption && (
                    <p className="text-gray-600">{gallery.caption}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {imagesByGallery?.[gallery._id]?.map(
                      (img: GalleryImageRecord) => (
                        <div
                          key={img._id}
                          className="relative inline-flex items-center justify-center max-w-xs max-h-64 bg-gray-100 rounded-lg overflow-hidden"
                        >
                          {previewUrls?.[img.image.toString()] ? (
                            <img
                              src={previewUrls[img.image.toString()]}
                              alt="Gallery"
                              className="object-contain max-w-full max-h-64"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default Gallery;
