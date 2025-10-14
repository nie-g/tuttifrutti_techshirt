import React, { useRef, useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { X, Upload, Activity } from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  templateId: Id<"design_templates">;
  existingName: string;
  existingShirtTypeId: Id<"shirt_types">;
  existingImageUrl?: string;
  existingImageStorageId?: Id<"_storage">;
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  templateId,
  existingName,
  existingShirtTypeId,
  existingImageUrl,
}) => {
  const [formData, setFormData] = useState({
    templateName: existingName,
    shirtTypeId: existingShirtTypeId as string,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(
    existingImageUrl || null
  );
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateTemplate = useAction(api.design_templates.updateDesignTemplate);
  const shirtTypes = useQuery(api.shirt_types.getAll) ?? [];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        templateName: existingName,
        shirtTypeId: existingShirtTypeId as string,
      });
      setPreviewImage(existingImageUrl || null);
      setFileData(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, existingName, existingShirtTypeId, existingImageUrl]);

  if (!isOpen) return null;

  // === handle image selection ===
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
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

  // === handle form submission ===
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.templateName || !formData.shirtTypeId) {
      setError("All fields are required");
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateTemplate({
        templateId,
        templateName: formData.templateName.trim(),
        shirtTypeId: formData.shirtTypeId as Id<"shirt_types">,
        templateImage: fileData ?? undefined,
      });

      setSuccess("Template updated successfully");
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error("Failed to update template:", err);
      setError("Failed to update template");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg md:max-w-2xl relative overflow-y-auto max-h-[90vh] p-6 sm:p-8">
        {/* Close button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div className="flex items-center mb-6">
          <Upload className="text-teal-500 mr-2" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Edit Template</h2>
        </div>

        {/* Status messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-sm">
            {error}
          </div>
        )}
        {isUpdating && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded flex items-center text-sm">
            <Activity className="animate-spin mr-2" /> Saving changes...
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Template Name */}
          <div>
            <label className="block font-medium mb-2 text-gray-700">
              Template Name
            </label>
            <input
              type="text"
              name="templateName"
              value={formData.templateName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, templateName: e.target.value }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Enter template name"
              required
            />
          </div>

          {/* Shirt Type */}
          <div>
            <label className="block font-medium mb-2 text-gray-700">
              Shirt Type
            </label>
            <select
              aria-label="Select a shirt type"
              name="shirtTypeId"
              value={formData.shirtTypeId}
              onChange={(e) =>
                setFormData((p) => ({ ...p, shirtTypeId: e.target.value }))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            >
              {shirtTypes.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.type_name}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-medium mb-2 text-gray-700">
              Template Image
            </label>
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-xl text-center transition hover:border-teal-400">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                id="edit-template-image-upload"
              />
              <label
                htmlFor="edit-template-image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Template Preview"
                    className="w-full max-h-[300px] object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="text-gray-500 text-sm mt-2">
                      Click to upload or drag and drop
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-teal-500 text-white font-medium py-3 px-6 rounded-lg w-full hover:bg-teal-600 transition disabled:bg-teal-300"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTemplateModal;
