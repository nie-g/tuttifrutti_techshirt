import React, { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, Activity } from "lucide-react";
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
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
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

  // Convex queries/actions
  const shirtTypes = useQuery(api.shirt_types.getAll) ?? [];
  const saveDesignTemplate = useAction(api.design_templates.saveDesignTemplate);

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
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      setPreviewImage(result);

      // Convert to ArrayBuffer for Convex upload
      const response = await fetch(result);
      const buffer = await response.arrayBuffer();
      setFileData(buffer);
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

    if (!fileData) {
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

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
          <Activity className="animate-spin inline-block mr-2" />
          Uploading template...
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Template Name */}
        <label className="block font-medium mb-2">Template Name</label>
        <input
          type="text"
          name="templateName"
          value={formData.templateName}
          onChange={handleChange}
          className="w-full p-3 border rounded-md mb-4"
          placeholder="Enter template name"
          required
        />

        {/* Shirt Type */}
        <label className="block font-medium mb-2">Shirt Type</label>
        <select
          aria-label="Select a shirt type"
          name="shirtTypeId"
          value={formData.shirtTypeId}
          onChange={handleChange}
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

        {/* Template Image */}
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
          disabled={isLoading}
          className="bg-teal-500 text-white px-6 py-3 rounded-md hover:bg-teal-600 disabled:bg-teal-300"
        >
          {isLoading ? "Uploading..." : "Upload Template"}
        </button>
      </form>
    </div>
  );
};

export default TemplateUploader;
