import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Edit, Loader, X, FileText, Plus } from "lucide-react";

interface Designer {
  _id: Id<"designers">;
  user_id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
}

interface Pricing {
  _id: Id<"designer_pricing">;
  designer_id: Id<"designers"> | "default";
  normal_amount?: number;
  revision_fee?: number;
  description?: string;
}

const PricingManager: React.FC = () => {
  const designers = useQuery(api.designers.listAllWithUsers) as Designer[] | undefined;
  const pricings = useQuery(api.designer_pricing.getAll) as Pricing[] | undefined;
  const updatePricing = useMutation(api.designer_pricing.update);
  const upsertDefaultPricing = useMutation(api.designer_pricing.upsertDefault);

  const [localPricings, setLocalPricings] = useState<Pricing[]>([]);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    normalAmount: "",
    revisionFee: "",
    description: "",
  });

  useEffect(() => {
    if (pricings) setLocalPricings(pricings);
  }, [pricings]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingPricing) return;

  const isDefault = editingPricing.designer_id === "default";

  if (isDefault) {
    await upsertDefaultPricing({
      normal_amount: Number(formData.normalAmount),
      revision_fee: formData.revisionFee ? Number(formData.revisionFee) : undefined,
      description: formData.description || undefined,
    });
  } else {
    await updatePricing({
      id: editingPricing._id,
      normal_amount: Number(formData.normalAmount),
      revision_fee: formData.revisionFee ? Number(formData.revisionFee) : undefined,
      description: formData.description || undefined,
    });
  }

  setFormData({ normalAmount: "", revisionFee: "", description: "" });
  setEditingPricing(null);
  setIsModalOpen(false);
};

  const handleEdit = (pricing: Pricing) => {
    setEditingPricing(pricing);
    setFormData({
      normalAmount: String(pricing.normal_amount ?? ""),
      revisionFee: pricing.revision_fee ? String(pricing.revision_fee) : "",
      description: pricing.description ?? "",
    });
    setIsModalOpen(true);
  };

  if (!pricings || !designers) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader className="animate-spin h-6 w-6 text-teal-500" />
      </div>
    );
  }

  // 🧩 Group pricing by designer_id (including default)
  const groupedPricings = localPricings.reduce<Record<string, Pricing[]>>((acc, pricing) => {
    const key = pricing.designer_id === "default" ? "default" : pricing.designer_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pricing);
    return acc;
  }, {});

  // 🧱 Default pricing (if exists)
  const defaultPricing = localPricings.find((p) => p.designer_id === "default");

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 shadow rounded-xl">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-600">Designer Pricing Manager</h2>
        <p className="text-gray-600">Manage and edit pricing for each designer</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {Object.keys(groupedPricings).length === 0 && !defaultPricing ? (
          <div className="p-6 text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No pricing entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Designer", "Description", "Designer Fee", "Revision Fee", "Actions"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {/* 🩵 Default Pricing Row */}
                <tr className="bg-blue-50 hover:bg-blue-100 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">Default</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {defaultPricing?.description || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {defaultPricing?.normal_amount
                      ? `₱${defaultPricing.normal_amount.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {defaultPricing?.revision_fee
                      ? `₱${defaultPricing.revision_fee.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {defaultPricing ? (
                      <button
                        onClick={() => handleEdit(defaultPricing)}
                        className="inline-flex items-center bg-teal-500 px-6 py-1 text-white hover:bg-teal-600 rounded-md"
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit Pricing
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleEdit({
                            _id: "default" as any,
                            designer_id: "default",
                            normal_amount: 0,
                            revision_fee: 0,
                            description: "",
                          })
                        }
                        className="inline-flex items-center px-2 py-1 text-green-600 hover:text-green-800 rounded-md hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Set Up Pricing
                      </button>
                    )}
                  </td>
                </tr>

                {/* 👇 Designer-Specific Rows */}
                {Object.entries(groupedPricings)
                  .filter(([id]) => id !== "default")
                  .map(([designerId, pricings]) => {
                    const designer = designers.find((d) => d._id === designerId);
                    return pricings.map((pricing) => {
                      const isUnset =
                        !pricing.normal_amount || pricing.normal_amount === 0;
                      return (
                        <tr
                          key={pricing._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {designer
                              ? `${designer.firstName} ${designer.lastName}`
                              : "Unknown"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {pricing.description || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {pricing.normal_amount
                              ? `₱${pricing.normal_amount.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {pricing.revision_fee
                              ? `₱${pricing.revision_fee.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isUnset ? (
                              <button
                                onClick={() => handleEdit(pricing)}
                                className="inline-flex items-center px-2 py-1 text-green-600 hover:text-green-800 rounded-md hover:bg-green-50"
                              >
                                <Plus className="h-4 w-4 mr-1" /> Set Up Pricing
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEdit(pricing)}
                                className="inline-flex items-center bg-teal-500 px-6 py-1 text-white hover:bg-teal-600 rounded-md"
                              >
                                <Edit className="h-4 w-4 mr-1" /> Edit Pricing
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingPricing && (
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

            <h2 className="text-lg font-semibold mb-4">Edit Pricing</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>
                <input
                  aria-label="Description"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                />
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
                  Revision Fee (Optional)
                </label>
                <input
                  aria-label="Revision fee"
                  type="number"
                  value={formData.revisionFee}
                  onChange={(e) =>
                    setFormData({ ...formData, revisionFee: e.target.value })
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
                  Save
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
