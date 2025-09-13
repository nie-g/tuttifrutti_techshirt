import React, { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Upload, Activity } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";

interface FormData {
  templateName: string;
  shirtTypeId: Id<"shirt_types"> | "";
}

const TemplateUploader: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    templateName: "",
    shirtTypeId: "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clerk user
  const { user } = useUser();
  const clerkId = user?.id;

  // Convex user lookup
  const currentUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  // Convex queries/mutations
  const shirtTypes = useQuery(api.shirt_types.getAll) ?? [];
  const createTemplateMutation = useMutation(api.design_templates.create);

  // Handle text & select input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("You must be logged in as an admin to upload templates");
      return;
    }

    if (!previewImage) {
      setError("Please select an image for the template");
      return;
    }

    if (!formData.templateName.trim()) {
      setError("Please enter a template name");
      return;
    }

    if (!formData.shirtTypeId) {
      setError("Please select a shirt type");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await createTemplateMutation({
        templateName: formData.templateName.trim(),
        templateImage: previewImage,
        shirtTypeId: formData.shirtTypeId as Id<"shirt_types">,
      });

      setFormData({ templateName: "", shirtTypeId: "" });
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess("Template uploaded successfully");
    } catch (err: any) {
      console.error("Error uploading template:", err);
      setError(
        "There was an issue uploading your template. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
      <div className="flex items-center mb-6">
        <Upload className="text-teal-500 mr-2" size={24} />
        <h2 className="text-xl font-semibold text-gray-900">
          Upload Design Template
        </h2>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-white border-l-4 border-red-500 text-gray-800 p-4 mb-6 rounded-md shadow-md">
          <div className="flex items-center">
            <p>{error}</p>
            <button
              className="ml-auto pl-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border-l-4 border-blue-500 text-gray-800 p-4 mb-6 rounded-md shadow-md">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-3 text-blue-500 animate-spin" />
            <p className="font-medium">Uploading template...</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-white border-l-4 border-teal-500 text-gray-800 p-4 mb-6 rounded-md shadow-md">
          <div className="flex items-center">
            <p>{success}</p>
            <button
              className="ml-auto pl-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setSuccess(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Template Name */}
          <div>
            <label className="block text-gray-900 font-medium mb-2">
              Template Name
            </label>
            <input
              type="text"
              name="templateName"
              value={formData.templateName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter a name for your template"
              required
            />
          </div>

          {/* Shirt Type */}
          <div>
            <label className="block text-gray-900 font-medium mb-2">
              Shirt Type
            </label>
            <select
              aria-label="Select a shirt type"
              name="shirtTypeId"
              value={formData.shirtTypeId}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">Select template shirt type</option>
              {shirtTypes.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.type_name}
                </option>
              ))}
            </select>
          </div>

          {/* Template Image */}
          <div>
            <label className="block text-gray-900 font-medium mb-2">
              Template Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                id="template-image-upload"
                name="template-image-upload"
                required={previewImage === null}
              />
              <label
                htmlFor="template-image-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Template Preview"
                    className="max-w-full max-h-64 object-contain rounded-md"
                  />
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </>
                )}
                {previewImage && (
                  <span className="text-sm text-teal-600 font-medium">
                    Click to change image
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-teal-500 text-white px-6 py-3 rounded-md hover:bg-teal-600 transition-colors font-medium disabled:bg-teal-300 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader className="animate-spin mr-2" size={18} />
                Uploading...
              </span>
            ) : (
              "Upload Template"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ templateName: "", shirtTypeId: "" });
              setPreviewImage(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              setError(null);
              setSuccess(null);
            }}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateUploader;
