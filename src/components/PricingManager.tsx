// src/components/PricingManager.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Edit, Trash2, Loader, Plus, X, FileText } from "lucide-react";

interface Designer {
  _id: Id<"designers">;     // ✅ comes from designers table
  user_id: Id<"users">;     // ✅ link back to users
  firstName: string;
  lastName: string;
  email: string;
}


interface Pricing {
  _id: Id<"designer_pricing">;
  designerId: Id<"designers">;
  normalAmount: number;
  promoAmount?: number;
}

const PricingManager: React.FC = () => {
const designers = useQuery(api.designers.listAllWithUsers) as Designer[] | undefined;
  const pricings = useQuery(api.designer_pricing.getAll) as Pricing[] | undefined;

  const addPricing = useMutation(api.designer_pricing.create);
  const updatePricing = useMutation(api.designer_pricing.update);
  const deletePricing = useMutation(api.designer_pricing.remove);

  const [localPricings, setLocalPricings] = useState<Pricing[]>([]);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    designerId: "",
    normalAmount: "",
    promoAmount: "",
  });

  useEffect(() => {
    if (pricings) setLocalPricings(pricings);
  }, [pricings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.designerId || !formData.normalAmount) return;

    const pricingData = {
        designer_id: formData.designerId as Id<"designers">,
        normal_amount: Number(formData.normalAmount),
        promo_amount: formData.promoAmount ? Number(formData.promoAmount) : undefined,
        description: undefined, // optional, you can add a field later
        };
    if (editingPricing) {
     await updatePricing({
        id: editingPricing._id,
        normal_amount: Number(formData.normalAmount),
        promo_amount: formData.promoAmount ? Number(formData.promoAmount) : undefined,
        description: undefined,
        });
    } else {
      await addPricing(pricingData);
    }

    setFormData({ designerId: "", normalAmount: "", promoAmount: "" });
    setEditingPricing(null);
    setIsModalOpen(false);
  };

  const handleEdit = (pricing: Pricing) => {
    setEditingPricing(pricing);
    setFormData({
      designerId: pricing.designerId,
      normalAmount: String(pricing.normalAmount),
      promoAmount: pricing.promoAmount ? String(pricing.promoAmount) : "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: Id<"designer_pricing">) => {
    if (window.confirm("Are you sure you want to delete this pricing?")) {
      await deletePricing({ id });
      setLocalPricings((prev) => prev.filter((p) => p._id !== id));
    }
  };

  if (!pricings || !designers) {
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
          <h2 className="text-2xl font-bold text-gray-600">Designer Pricing Manager</h2>
          <p className="text-gray-600">Manage pricing for each designer</p>
        </div>
        <button
          onClick={() => {
            setEditingPricing(null);
            setFormData({ designerId: "", normalAmount: "", promoAmount: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Pricing
        </button>
      </div>

      {/* Table */}
      {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {designers.length === 0 ? (
            <div className="p-6 text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No designers found</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    {["Designer", "Email", "Normal Amount", "Promo Amount"].map((col) => (
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
                {designers.map((designer) => {
                    const pricing = localPricings.find(
                    (p) => p.designerId === designer._id
                    );

                    return (
                    <tr
                        key={designer._id}
                        className="hover:bg-gray-50 transition-colors"
                    >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {designer.firstName} {designer.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                        {designer.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                        {pricing
                            ? `₱${pricing.normalAmount.toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                        {pricing?.promoAmount
                            ? `₱${pricing.promoAmount.toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {pricing ? (
                            <>
                            <button
                                onClick={() => handleEdit(pricing)}
                                className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50"
                            >
                                <Edit className="h-4 w-4 mr-1" /> Edit Pricing
                            </button>
                            <button
                                onClick={() => handleDelete(pricing._id)}
                                className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </button>
                            </>
                        ) : (
                            <button
                            onClick={() => {
                                setEditingPricing(null);
                                setFormData({
                                designerId: designer._id,
                                normalAmount: "",
                                promoAmount: "",
                                });
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center px-2 py-1 text-green-600 hover:text-green-800 rounded-md hover:bg-green-50"
                            >
                            <Plus className="h-4 w-4 mr-1" /> Set Up Pricing
                            </button>
                        )}
                        </td>
                    </tr>
                    );
                })}
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
              {editingPricing ? "Edit Pricing" : "Add Pricing"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Designer
                </label>
                <select
                  aria-label="Select a designer"
                  value={formData.designerId}
                  onChange={(e) =>
                    setFormData({ ...formData, designerId: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select Designer</option>
                  {designers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.firstName} {d.lastName} ({d.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Normal Amount
                </label>
                <input
                  aria-label="Normal amount"
                  type="number"
                  value={formData.normalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, normalAmount: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Promo Amount (Optional)
                </label>
                <input
                  aria-label="Promo amount"
                  type="number"
                  value={formData.promoAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, promoAmount: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
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

export default PricingManager;
