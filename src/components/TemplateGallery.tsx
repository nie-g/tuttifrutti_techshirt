import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Trash2, Edit, Search, Loader, Plus } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import AddTemplateModal from "./designTemplateComponents/AddTemplateModal";
import EditTemplateModal from "./designTemplateComponents/EditTemplateModal";

interface Template {
  _id: Id<"design_templates">;
  template_name: string;
  template_image: Id<"_storage">;
  shirt_type_id: Id<"shirt_types">;
  created_at?: number;
}

type TemplateWithUrl = Template & { imageUrl?: string | null };

const TemplateGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithUrl | null>(null);
  const [localTemplates, setLocalTemplates] = useState<Template[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useUser();
  const clerkId = user?.id;
  const currentUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  const apiTemplates = useQuery(api.design_templates.getAll) as Template[] | undefined;
  const removeTemplateMutation = useMutation(api.design_templates.remove);

  const storageIds = apiTemplates?.map((t) => t.template_image) ?? [];
  const storageUrls = useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds }) ?? [];

  useEffect(() => {
    if (apiTemplates) {
      setLocalTemplates(apiTemplates);
      const filtered = storageUrls.map((u) => (u === null ? "" : u));
      setImageUrls(filtered);
      setIsLoading(false);
    }
  }, [apiTemplates, storageUrls]);

  const handleDeleteTemplate = async (templateId: Id<"design_templates">) => {
    try {
      await removeTemplateMutation({ templateId });
      setLocalTemplates((prev) => prev.filter((t) => t._id !== templateId));
      setSuccess("Template deleted successfully");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to delete template");
    }
  };

  const handleOpenEditModal = (template: Template) => {
    const idx = (apiTemplates ?? []).findIndex((t) => t._id === template._id);
    const imageUrl = idx >= 0 ? imageUrls[idx] || null : null;
    setSelectedTemplate({ ...template, imageUrl });
    setIsEditModalOpen(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  const filteredTemplates = localTemplates.filter((t) =>
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div className="flex items-center w-full sm:max-w-md">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-600 transition w-full sm:w-auto"
          >
            <Plus size={18} />
            Add Template
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded text-sm">
          {success}
        </div>
      )}

      {/* Template Grid */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader className="animate-spin h-6 w-6 text-teal-500" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTemplates.map((t, idx) => (
            <div
              key={t._id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-3 flex flex-col"
            >
              <div className="relative w-full h-40 sm:h-44 md:h-48 rounded-md overflow-hidden bg-gray-100">
                <img
                  src={imageUrls[idx] || "https://placehold.co/400x400?text=No+Image"}
                  alt={t.template_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-between items-center mt-3">
                <h3 className="font-medium text-gray-800 truncate">
                  {t.template_name}
                </h3>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      aria-label="Edit template"
                      onClick={() => handleOpenEditModal(t)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded transition"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      aria-label="Delete template"
                      onClick={() => handleDeleteTemplate(t._id)}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">No templates found</p>
      )}

      {/* Modals */}
      <AddTemplateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {selectedTemplate && (
        <EditTemplateModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          templateId={selectedTemplate._id}
          existingName={selectedTemplate.template_name}
          existingShirtTypeId={selectedTemplate.shirt_type_id}
          existingImageUrl={selectedTemplate.imageUrl ?? undefined}
          existingImageStorageId={selectedTemplate.template_image}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default TemplateGallery;
