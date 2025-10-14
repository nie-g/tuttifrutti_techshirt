import React, { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { X, Upload, Activity } from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({ templateName: "", shirtTypeId: "" });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { user } = useUser();
  const currentUser = useQuery(
    api.userQueries.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  const saveDesignTemplate = useAction(api.design_templates.saveDesignTemplate);
  const shirtTypes = useQuery(api.shirt_types.getAll) ?? [];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setPreviewImage(result);

      const response = await fetch(result);
      const buffer = await response.arrayBuffer();
      setFileData(buffer);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError("Only admins can upload templates");
      return;
    }
    if (!fileData || !formData.templateName || !formData.shirtTypeId) {
      setError("All fields are required");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    try {
      await saveDesignTemplate({
        templateName: formData.templateName.trim(),
        shirtTypeId: formData.shirtTypeId as Id<"shirt_types">,
        templateImage: fileData,
      });
      setFormData({ templateName: "", shirtTypeId: "" });
      setPreviewImage(null);
      setFileData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Template uploaded successfully");
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to upload template");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <div className="flex items-center mb-4">
          <Upload className="text-teal-500 mr-2" size={22} />
          <h2 className="text-lg font-semibold text-gray-800">
            Add New Template
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
            {error}
          </div>
        )}
        {isUploading && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded flex items-center">
            <Activity className="animate-spin mr-2" /> Uploading...
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block font-medium mb-2">Template Name</label>
          <input
            type="text"
            name="templateName"
            value={formData.templateName}
            onChange={(e) =>
              setFormData((p) => ({ ...p, templateName: e.target.value }))
            }
            className="w-full p-3 border rounded-md mb-4"
            placeholder="Enter template name"
            required
          />

          <label className="block font-medium mb-2">Shirt Type</label>
          <select
            aria-label="Select a shirt type"
            name="shirtTypeId"
            value={formData.shirtTypeId}
            onChange={(e) =>
              setFormData((p) => ({ ...p, shirtTypeId: e.target.value }))
            }
            className="w-full p-3 border rounded-md mb-4"
            required
          >
            <option value="">Select a shirt type</option>
            {shirtTypes.map((st) => (
              <option key={st._id} value={st._id}>
                {st.type_name}
              </option>
            ))}
          </select>

          <label className="block font-medium mb-2">Template Image</label>
          <div className="border-2 border-dashed p-6 rounded-lg text-center mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              id="template-image-upload"
            />
            <label
              htmlFor="template-image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-h-64 rounded-md object-contain"
                />
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-gray-600 text-sm mt-2">
                    Click to upload or drag and drop
                  </p>
                </>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="bg-teal-500 text-white px-6 py-3 rounded-md hover:bg-teal-600 disabled:bg-teal-300 w-full"
          >
            {isUploading ? "Uploading..." : "Upload Template"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTemplateModal;
