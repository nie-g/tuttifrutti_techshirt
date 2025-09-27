// src/components/ShirtSizeManager.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Edit, Trash2, Loader, Plus, X, FileText } from "lucide-react";

interface ShirtSize {
  _id: Id<"shirt_sizes">;
  size_label: string;
  w: number;
  h: number;
  type: "jersey" | "polo" | "tshirt" | "long sleeves";
  sleeves_w?: number;
  sleeves_h?: number;
  category: "kids" | "adult";
}

const ShirtSizeManager: React.FC = () => {
  const shirtSizes = useQuery(api.shirt_sizes.getAll) as ShirtSize[] | undefined;
  const addSize = useMutation(api.shirt_sizes.create);
  const updateSize = useMutation(api.shirt_sizes.update);
  const deleteSize = useMutation(api.shirt_sizes.remove);

  const [localSizes, setLocalSizes] = useState<ShirtSize[]>([]);
  const [editingSize, setEditingSize] = useState<ShirtSize | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    size_label: "",
    w: "",
    h: "",
    type: "tshirt",
    sleeves_w: "",
    sleeves_h: "",
    category: "adult",
  });

  useEffect(() => {
    if (shirtSizes) setLocalSizes(shirtSizes);
  }, [shirtSizes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.size_label) return;

    const sizeData = {
      size_label: formData.size_label,
      w: Number(formData.w),
      h: Number(formData.h),
      type: formData.type as ShirtSize["type"],
      sleeves_w: formData.type === "jersey" ? undefined : (formData.sleeves_w ? Number(formData.sleeves_w) : undefined),
      sleeves_h: formData.type === "jersey" ? undefined : (formData.sleeves_h ? Number(formData.sleeves_h) : undefined),
      category: formData.category as ShirtSize["category"],
    };

    if (editingSize) {
      await updateSize({ id: editingSize._id, ...sizeData });
      setLocalSizes((prev) =>
        prev.map((s) => (s._id === editingSize._id ? { ...s, ...sizeData } : s))
      );
    } else {
      await addSize(sizeData);
    }

    setFormData({
      size_label: "",
      w: "",
      h: "",
      type: "tshirt",
      sleeves_w: "",
      sleeves_h: "",
      category: "adult",
    });
    setEditingSize(null);
    setIsModalOpen(false);
  };

  const handleEdit = (size: ShirtSize) => {
    setEditingSize(size);
    setFormData({
      size_label: size.size_label,
      w: String(size.w),
      h: String(size.h),
      type: size.type,
      sleeves_w: size.sleeves_w ? String(size.sleeves_w) : "",
      sleeves_h: size.sleeves_h ? String(size.sleeves_h) : "",
      category: size.category,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: Id<"shirt_sizes">) => {
    if (window.confirm("Are you sure you want to delete this size?")) {
      await deleteSize({ id });
      setLocalSizes((prev) => prev.filter((s) => s._id !== id));
    }
  };

  if (!shirtSizes) {
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
          <h2 className="text-2xl font-bold text-gray-900">Shirt Size Manager</h2>
          <p className="text-gray-600">Manage shirt sizes across categories</p>
        </div>
        <button
          onClick={() => {
            setEditingSize(null);
            setFormData({
              size_label: "",
              w: "",
              h: "",
              type: "tshirt",
              sleeves_w: "",
              sleeves_h: "",
              category: "adult",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Size
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {localSizes.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No shirt sizes added yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Size", "Width", "Height", "Type", "Category", "Sleeve W", "Sleeve H"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    )
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {localSizes.map((size) => (
                  <tr key={size._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{size.size_label}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{size.w}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{size.h}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{size.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{size.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{size.sleeves_w ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{size.sleeves_h ?? "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(size)}
                        className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(size._id)}
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

      {/* Add/Edit Modal */}
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
              {editingSize ? "Edit Shirt Size" : "Add Shirt Size"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Size Label</label>
                <input
                  aria-label="Size label"
                  type="text"
                  value={formData.size_label}
                  onChange={(e) => setFormData({ ...formData, size_label: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                <input
                  aria-label="Width"
                  type="number"
                  value={formData.w}
                  onChange={(e) => setFormData({ ...formData, w: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                <input
                  aria-label="Height"
                  type="number"
                  value={formData.h}
                  onChange={(e) => setFormData({ ...formData, h: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  aria-label="Shirt type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="tshirt">T-Shirt</option>
                  <option value="polo">Polo</option>
                  <option value="jersey">Jersey</option>
                  <option value="long sleeves">Long Sleeves</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select
                  aria-label="Shirt category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="adult">Adult</option>
                  <option value="kids">Kids</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sleeve Width</label>
                <input
                  aria-label="Sleeve width"
                  type="number"
                  value={formData.sleeves_w}
                  onChange={(e) => setFormData({ ...formData, sleeves_w: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={formData.type === "jersey"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sleeve Height</label>
                <input
                  aria-label="Sleeve height"
                  type="number"
                  value={formData.sleeves_h}
                  onChange={(e) => setFormData({ ...formData, sleeves_h: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={formData.type === "jersey"}
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
                  {editingSize ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ShirtSizeManager;
