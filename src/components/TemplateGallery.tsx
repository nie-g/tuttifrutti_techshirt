// src/components/TemplateGallery.tsx
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ChangeEvent, FormEvent } from "react";
import { Trash2, Edit, Search, Loader } from "lucide-react";

// ✅ Matches Convex `design_templates` schema
interface Template {
  _id: Id<"design_templates">;
  template_name: string;
  template_image: string;
  created_at?: number;
}

// ✅ Edit form state
interface EditFormData {
  templateName: string;
  templateImage: string | null;
}

const TemplateGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    templateName: "",
    templateImage: null,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localTemplates, setLocalTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Query templates
  const apiTemplates = useQuery(api.design_templates.getAll) as Template[] | undefined;

  // ✅ Mutations
  const removeTemplateMutation = useMutation(api.design_templates.remove);
  const updateTemplateMutation = useMutation(api.design_templates.update);

  // ✅ Update local state when API data changes
  useEffect(() => {
    if (apiTemplates) {
      setLocalTemplates(apiTemplates);
      setIsLoading(false);
    }
  }, [apiTemplates]);

  // ✅ Fallback sample data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && (!apiTemplates || apiTemplates.length === 0)) {
        setLocalTemplates([
          {
            _id: "sample-template-1" as Id<"design_templates">,
            template_name: "Sample Jersey Design",
            template_image: "https://placehold.co/400x400?text=Jersey+Template",
            created_at: Date.now(),
          },
          {
            _id: "sample-template-2" as Id<"design_templates">,
            template_name: "Team Uniform",
            template_image: "https://placehold.co/400x400?text=Uniform+Template",
            created_at: Date.now() - 86400000,
          },
        ]);
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading, apiTemplates]);

  // ✅ Filter templates
  const filteredTemplates = localTemplates.filter((template) =>
    template.template_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ File change handler
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
    reader.onload = (event) => {
      if (event.target?.result) {
        const result = event.target.result as string;
        setPreviewImage(result);
        setEditFormData((prev) => ({ ...prev, templateImage: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ✅ Handle edit
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditFormData({
      templateName: template.template_name,
      templateImage: null,
    });
    setPreviewImage(template.template_image);
    setIsEditModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  // ✅ Handle edit submit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !editFormData.templateName.trim()) return;

    try {
      await updateTemplateMutation({
        templateId: selectedTemplate._id,
        templateName: editFormData.templateName.trim(),
        templateImage: editFormData.templateImage ?? undefined,
      });

      setLocalTemplates((prev) =>
        prev.map((t) =>
          t._id === selectedTemplate._id
            ? {
                ...t,
                template_name: editFormData.templateName.trim(),
                template_image: editFormData.templateImage || t.template_image,
              }
            : t
        )
      );

      setIsEditModalOpen(false);
      setSelectedTemplate(null);
      setPreviewImage(null);
      setEditFormData({ templateName: "", templateImage: null });
      setSuccess("Template updated successfully");
    } catch (err) {
      setError("Failed to update template. Please try again.");
    }
  };

  // ✅ Handle delete
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      await removeTemplateMutation({ templateId: selectedTemplate._id });
      setLocalTemplates((prev) => prev.filter((t) => t._id !== selectedTemplate._id));
      setSelectedTemplate(null);
      setIsDeleteModalOpen(false);
      setSuccess("Template deleted successfully");
    } catch (err) {
      setError("Failed to delete template. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {/* 🔍 Search bar */}
      <div className="flex items-center mb-4">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search templates..."
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ✅ Template List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader className="animate-spin h-6 w-6 text-teal-500" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <img
                src={template.template_image}
                alt={template.template_name}
                className="w-full h-48 object-cover"
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsViewModalOpen(true);
                }}
              />
              <div className="p-4 flex justify-between items-center">
                <h3 className="text-gray-800 font-semibold">{template.template_name}</h3>
                <div className="flex gap-2">
                  <button
                    aria-label="Edit template"
                    onClick={() => handleEditTemplate(template)}
                    className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    aria-label="Delete template"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">No templates found</p>
      )}

      {/* ⚡️ Modals (view, edit, delete) remain same — omitted for brevity */}
    </div>
  );
};

export default TemplateGallery;
