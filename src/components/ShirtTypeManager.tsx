import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Plus, Edit, Trash2, X, FileText } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface ShirtType {
  _id: Id<"shirt_types">;
  type_name: string;
  description?: string;
  created_at?: number;
}

const ShirtTypeManager: React.FC = () => {
  const shirtTypes = useQuery(api.shirt_types.getAll) as ShirtType[] | undefined;

  const addType = useMutation(api.shirt_types.create);
  const updateType = useMutation(api.shirt_types.update);
  const deleteType = useMutation(api.shirt_types.remove);

  const [localTypes, setLocalTypes] = useState<ShirtType[]>([]);
  const [editingType, setEditingType] = useState<ShirtType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type_name: "",
    description: "",
  });

  useEffect(() => {
    if (shirtTypes) setLocalTypes(shirtTypes);
  }, [shirtTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type_name.trim()) return;

    const data = {
      type_name: formData.type_name.trim(),
      description: formData.description || undefined,
    };

    if (editingType) {
      await updateType({ id: editingType._id, ...data });
    } else {
      await addType(data);
    }

    setFormData({ type_name: "", description: "" });
    setEditingType(null);
    setIsModalOpen(false);
  };

  const handleEdit = (type: ShirtType) => {
    setEditingType(type);
    setFormData({
      type_name: type.type_name,
      description: type.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: Id<"shirt_types">) => {
    if (window.confirm("Are you sure you want to delete this shirt type?")) {
      await deleteType({ id });
      setLocalTypes((prev) => prev.filter((t) => t._id !== id));
    }
  };

  if (!shirtTypes) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader className="animate-spin h-6 w-6 text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 shadow rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Shirt Type Manager</h2>
          <p className="text-gray-600 text-sm">Manage available shirt types</p>
        </div>
        <button
          onClick={() => {
            setEditingType(null);
            setFormData({ type_name: "", description: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Shirt Type
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {localTypes.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No shirt types found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Type Name", "Description", "Created At"].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {localTypes.map((type) => (
                  <tr key={type._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {type.type_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {type.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {type.created_at
                        ? new Date(type.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type._id)}
                        className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-lg p-5 relative"
          >
            <button
              aria-label="Close modal"
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-4">
              {editingType ? "Edit Shirt Type" : "Add Shirt Type"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Type Name
                </label>
                <input
                  aria-label="Shirt Type Name"
                  type="text"
                  value={formData.type_name}
                  onChange={(e) =>
                    setFormData({ ...formData, type_name: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g. Round-neck, Polo, Long sleeves, etc."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {editingType ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ShirtTypeManager;
