import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Plus, Edit, Trash2, X, FileText } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface PrintPricing {
  _id: Id<"print_pricing">;
  print_type: "Sublimation" | "Dtf";
  amount: number;
  description?: string;
  created_at: number;
  updated_at?: number;
}

const PrintPricing: React.FC = () => {
  const printPricings = useQuery(api.print_pricing.getAll) as PrintPricing[] | undefined;

  const addPricing = useMutation(api.print_pricing.create);
  const updatePricing = useMutation(api.print_pricing.update);
  const deletePricing = useMutation(api.print_pricing.remove);

  const [localPricings, setLocalPricings] = useState<PrintPricing[]>([]);
  const [editingPricing, setEditingPricing] = useState<PrintPricing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    print_type: "Sublimation",
    amount: "",
    description: "",
  });

  useEffect(() => {
    if (printPricings) setLocalPricings(printPricings);
  }, [printPricings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.print_type || !formData.amount) return;

    const data = {
      print_type: formData.print_type as "Sublimation" | "Dtf",
      amount: Number(formData.amount),
      description: formData.description || undefined,
    };

    if (editingPricing) {
      await updatePricing({ id: editingPricing._id, ...data });
    } else {
      await addPricing(data);
    }

    setFormData({ print_type: "Sublimation", amount: "", description: "" });
    setEditingPricing(null);
    setIsModalOpen(false);
  };

  const handleEdit = (pricing: PrintPricing) => {
    setEditingPricing(pricing);
    setFormData({
      print_type: pricing.print_type,
      amount: String(pricing.amount),
      description: pricing.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: Id<"print_pricing">) => {
    if (window.confirm("Are you sure you want to delete this print pricing?")) {
      await deletePricing({ id });
      setLocalPricings((prev) => prev.filter((p) => p._id !== id));
    }
  };

  if (!printPricings) {
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
          <h2 className="text-2xl font-bold text-gray-700">Print Pricing Manager</h2>
          <p className="text-gray-600 text-sm">Manage pricing for each print type</p>
        </div>
        <button
          onClick={() => {
            setEditingPricing(null);
            setFormData({ print_type: "Sublimation", amount: "", description: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Print Pricing
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {localPricings.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No print pricing found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Print Type", "Amount", "Description", "Created At"].map((col) => (
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
                {localPricings.map((pricing) => (
                  <tr key={pricing._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pricing.print_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      ₱{pricing.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {pricing.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(pricing.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(pricing)}
                        className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pricing._id)}
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
              {editingPricing ? "Edit Print Pricing" : "Add Print Pricing"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Print Type
                </label>
                <select
                  aria-label="Select a print type"
                  value={formData.print_type}
                  onChange={(e) =>
                    setFormData({ ...formData, print_type: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Sublimation">Sublimation</option>
                  <option value="Dtf">DTF</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Amount (₱)
                </label>
                <input
                  aria-label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                  placeholder="e.g. Full front print, back print, etc."
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
                  {editingPricing ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PrintPricing;
