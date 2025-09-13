// src/components/ShirtSizeManager.tsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Edit, Trash2, Loader } from "lucide-react";

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
      sleeves_w: formData.sleeves_w ? Number(formData.sleeves_w) : undefined,
      sleeves_h: formData.sleeves_h ? Number(formData.sleeves_h) : undefined,
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
  };

  const handleDelete = async (id: Id<"shirt_sizes">) => {
    await deleteSize({ id });
    setLocalSizes((prev) => prev.filter((s) => s._id !== id));
  };

  if (!shirtSizes) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader className="animate-spin h-6 w-6 text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Shirt Size Manager</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <label className="sr-only" htmlFor="size_label">Size Label</label>
        <input
          id="size_label"
          type="text"
          placeholder="Size Label"
          value={formData.size_label}
          onChange={(e) => setFormData({ ...formData, size_label: e.target.value })}
          className="p-2 border rounded"
          required
        />

        <label className="sr-only" htmlFor="width">Width</label>
        <input
          id="width"
          type="number"
          placeholder="Width"
          value={formData.w}
          onChange={(e) => setFormData({ ...formData, w: e.target.value })}
          className="p-2 border rounded"
          required
        />

        <label className="sr-only" htmlFor="height">Height</label>
        <input
          id="height"
          type="number"
          placeholder="Height"
          value={formData.h}
          onChange={(e) => setFormData({ ...formData, h: e.target.value })}
          className="p-2 border rounded"
          required
        />

        <label className="sr-only" htmlFor="type">Shirt Type</label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="tshirt">T-Shirt</option>
          <option value="polo">Polo</option>
          <option value="jersey">Jersey</option>
          <option value="long sleeves">Long Sleeves</option>
        </select>

        <label className="sr-only" htmlFor="category">Category</label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="adult">Adult</option>
          <option value="kids">Kids</option>
        </select>

        <label className="sr-only" htmlFor="sleeve_w">Sleeve Width</label>
        <input
          id="sleeve_w"
          type="number"
          placeholder="Sleeve Width"
          value={formData.sleeves_w}
          onChange={(e) => setFormData({ ...formData, sleeves_w: e.target.value })}
          className="p-2 border rounded"
        />

        <label className="sr-only" htmlFor="sleeve_h">Sleeve Height</label>
        <input
          id="sleeve_h"
          type="number"
          placeholder="Sleeve Height"
          value={formData.sleeves_h}
          onChange={(e) => setFormData({ ...formData, sleeves_h: e.target.value })}
          className="p-2 border rounded"
        />

        <button
          type="submit"
          className="bg-teal-600 text-white rounded px-4 py-2 hover:bg-teal-700 transition"
        >
          {editingSize ? "Update" : "Add"}
        </button>
      </form>

      {/* Sizes Table */}
      <div className="hidden md:block">
        <table className="w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Size</th>
              <th className="px-4 py-2 border">Width</th>
              <th className="px-4 py-2 border">Height</th>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Sleeve W</th>
              <th className="px-4 py-2 border">Sleeve H</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {localSizes.map((size) => (
              <tr key={size._id}>
                <td className="px-4 py-2 border">{size.size_label}</td>
                <td className="px-4 py-2 border">{size.w}</td>
                <td className="px-4 py-2 border">{size.h}</td>
                <td className="px-4 py-2 border">{size.type}</td>
                <td className="px-4 py-2 border">{size.category}</td>
                <td className="px-4 py-2 border">{size.sleeves_w ?? "-"}</td>
                <td className="px-4 py-2 border">{size.sleeves_h ?? "-"}</td>
                <td className="px-4 py-2 border flex gap-2">
                  <button
                    onClick={() => handleEdit(size)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label={`Edit size ${size.size_label}`}
                    title={`Edit size ${size.size_label}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(size._id)}
                    className="text-red-600 hover:text-red-800"
                    aria-label={`Delete size ${size.size_label}`}
                    title={`Delete size ${size.size_label}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="grid md:hidden gap-4">
        {localSizes.map((size) => (
          <div key={size._id} className="border rounded-lg p-4 shadow">
            <h3 className="font-semibold text-gray-800">{size.size_label}</h3>
            <p>Width: {size.w}</p>
            <p>Height: {size.h}</p>
            <p>Type: {size.type}</p>
            <p>Category: {size.category}</p>
            <p>Sleeve W: {size.sleeves_w ?? "-"}</p>
            <p>Sleeve H: {size.sleeves_h ?? "-"}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEdit(size)}
                className="text-blue-600 hover:text-blue-800"
                aria-label={`Edit size ${size.size_label}`}
                title={`Edit size ${size.size_label}`}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(size._id)}
                className="text-red-600 hover:text-red-800"
                aria-label={`Delete size ${size.size_label}`}
                title={`Delete size ${size.size_label}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShirtSizeManager;
