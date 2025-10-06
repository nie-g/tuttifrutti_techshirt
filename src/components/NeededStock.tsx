import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface NeededStockModalProps {
  onClose: () => void;
  designId: Id<"design">;
  userId: Id<"users">;
  onSubmitSuccess: () => void;
}

const NeededStockModal: React.FC<NeededStockModalProps> = ({
  onClose,
  designId,
  userId,
  onSubmitSuccess,
}) => {
  const inventory = useQuery(api.inventory.getInventoryItems); // ✅ create if not yet existing
  const updateStock = useMutation(api.inventory.updateStockForNeededItem);
  const markInProduction = useMutation(api.designs.markAsInProduction);

  const [neededItems, setNeededItems] = useState<
    { itemId: Id<"inventory_items">; quantity: number }[]
  >([]);

  const handleAddItem = () => {
    if (!inventory || inventory.length === 0) return;
    setNeededItems([...neededItems, { itemId: inventory[0]._id, quantity: 1 }]);
  };

  const handleUpdateItem = (index: number, field: "itemId" | "quantity", value: any) => {
    const updated = [...neededItems];
    (updated[index] as any)[field] = value;
    setNeededItems(updated);
  };

  const handleSubmit = async () => {
    for (const item of neededItems) {
      await updateStock({ itemId: item.itemId, neededQty: item.quantity });
    }

    await markInProduction({ designId, userId });
    onSubmitSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Required Materials for Production
        </h2>

        {neededItems.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-3 mb-3">
            <select
              aria-label="Select an item"
              value={entry.itemId}
              onChange={(e) =>
                handleUpdateItem(idx, "itemId", e.target.value as Id<"inventory_items">)
              }
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            >
              {inventory?.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.name}
                </option>
              ))}
            </select>

            <input
              aria-label="Quantity"
              type="number"
              min={1}
              value={entry.quantity}
              onChange={(e) =>
                handleUpdateItem(idx, "quantity", Number(e.target.value))
              }
              className="w-24 border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        ))}

        <button
          onClick={handleAddItem}
          className="text-teal-600 text-sm mb-4 hover:underline"
        >
          + Add another item
        </button>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={neededItems.length === 0}
            className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-600 text-white"
          >
            Submit & Start Production
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeededStockModal;
