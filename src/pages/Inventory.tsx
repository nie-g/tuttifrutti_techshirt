// src/pages/InventoryPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import { Search, FileText, ArrowUpDown, Plus, Edit, Trash2, X } from "lucide-react";

interface InventoryItem {
  _id: Id<"inventory_items">;
  name: string;
  category_id: Id<"inventory_categories">;
  categoryName: string;
  unit: string;
  stock: number;
  reorder_level?: number;
  description?: string;
  created_at: number;
  updated_at: number;
}

interface InventoryCategory {
  _id: Id<"inventory_categories">;
  category_name: string;
}

const InventoryPage: React.FC = () => {
  const inventoryItems = useQuery(api.inventory.getInventoryItems);
  const inventoryCategories = useQuery(api.inventory.getInventoryCategories);
  const createItem = useMutation(api.inventory.createInventoryItem);
  const updateItem = useMutation(api.inventory.updateInventoryItem);
  const deleteItem = useMutation(api.inventory.deleteInventoryItem);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: "asc" | "desc" }>({ key: "created_at", direction: "desc" });

  // --- Stock Modal state ---
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAmount, setStockAmount] = useState(0);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);

  const [formState, setFormState] = useState({
    name: "",
    categoryId: "",
    unit: "",
    stock: 0,
    reorderLevel: 0,
    description: "",
  });

  /* -------------------------
     Effects
  ------------------------- */
  useEffect(() => {
    if (isEditMode && currentItem) {
      setFormState({
        name: currentItem.name || "",
        categoryId: currentItem.category_id || "",
        unit: currentItem.unit || "",
        stock: currentItem.stock || 0,
        reorderLevel: currentItem.reorder_level || 0,
        description: currentItem.description || "",
      });
    } else {
      setFormState({ name: "", categoryId: "", unit: "", stock: 0, reorderLevel: 0, description: "" });
    }
  }, [isModalOpen, isEditMode, currentItem]);

  /* -------------------------
     Stock Modal
  ------------------------- */
  const handleOpenStockModal = (item: InventoryItem) => {
    setStockItem(item);
    setStockAmount(0);
    setIsStockModalOpen(true);
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem) return;

    try {
      await updateItem({
        id: stockItem._id,
        name: stockItem.name,
        categoryId: stockItem.category_id,
        unit: stockItem.unit,
        stock: stockItem.stock + stockAmount, // increment stock
        reorderLevel: stockItem.reorder_level ?? 0,
        description: stockItem.description ?? "",
      });
      setIsStockModalOpen(false);
    } catch (err) {
      console.error("Failed to update stock:", err);
      alert("Failed to update stock. Check console for details.");
    }
  };

  /* -------------------------
     Handlers
  ------------------------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [id]: id === "stock" || id === "reorderLevel" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleAddItem = () => {
    setIsEditMode(false);
    setCurrentItem({});
    setIsModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setIsEditMode(true);
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: Id<"inventory_items">) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteItem({ id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && currentItem._id) {
        await updateItem({
          id: currentItem._id,
          name: formState.name,
          categoryId: formState.categoryId as Id<"inventory_categories">,
          unit: formState.unit,
          stock: formState.stock,
          reorderLevel: formState.reorderLevel,
          description: formState.description,
        });
      } else {
        await createItem({
          name: formState.name,
          categoryId: formState.categoryId as Id<"inventory_categories">,
          unit: formState.unit,
          stock: formState.stock,
          reorderLevel: formState.reorderLevel,
          description: formState.description,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save inventory item:", error);
      alert("Failed to save inventory item. Check console for details.");
    }
  };

  const handleSort = (key: keyof InventoryItem) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  /* -------------------------
     Filter + Sort
  ------------------------- */
  const filteredItems = (inventoryItems ?? [])
    .filter(i => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        i.name.toLowerCase().includes(term) ||
        i.categoryName.toLowerCase().includes(term) ||
        i.unit.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const isLoading = inventoryItems === undefined || inventoryCategories === undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-gray-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Track and manage your inventory items</p>
            </div>
            <button onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>

          {/* Search */}
          <div className="mb-4 relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center">Loading inventory...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No inventory items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["name", "categoryName", "unit", "stock", "reorder_level"].map(col => (
                        <th key={col}
                          onClick={() => handleSort(col as keyof InventoryItem)}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center">
                            {col.replace("_", " ").toUpperCase()}
                            {sortConfig.key === col && <ArrowUpDown className="ml-1 h-4 w-4" />}
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map(item => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.categoryName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.stock}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.reorder_level ?? "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.description || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => handleEditItem(item)} className="inline-flex items-center px-2 py-1 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50">
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </button>
                          <button onClick={() => handleOpenStockModal(item)} className="inline-flex items-center px-2 py-1 text-green-600 hover:text-green-800 rounded-md hover:bg-green-50">
                            <Plus className="h-4 w-4 mr-1" /> Add Stock
                          </button>
                          <button onClick={() => handleDeleteItem(item._id)} className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50">
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
                className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 relative"
              >
                {/* Close button */}
                <button
                  aria-label="Close modal"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>

                <h2 className="text-lg font-semibold mb-4">
                  {isEditMode ? "Edit Item" : "Add Item"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                    <input aria-label="Item name" id="name" value={formState.name} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" required />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select aria-label="Item category" id="categoryId" value={formState.categoryId} onChange={e => handleSelectChange(e.target.value, "categoryId")} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" required>
                      <option value="">Select a category</option>
                      {inventoryCategories?.map((cat: InventoryCategory) => (
                        <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                      <input aria-label="Item unit" id="unit" value={formState.unit} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                      <input aria-label="Item stock" id="stock" type="number" value={formState.stock} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Reorder Level</label>
                      <input aria-label="Item reorder level" id="reorderLevel" type="number" value={formState.reorderLevel} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea aria-label="Item description" id="description" value={formState.description} onChange={handleInputChange} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500" />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">{isEditMode ? "Save" : "Add"}</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Add Stock Modal */}
          {isStockModalOpen && stockItem && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 relative"
              >
                <button
                  aria-label="Close modal"
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>

                <h2 className="text-lg font-semibold mb-4">Add Stock – {stockItem.name}</h2>

                <form onSubmit={handleAddStockSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Amount to Add
                    </label>
                    <input
                      aria-label="Amount to add"
                      type="number"
                      min="1"
                      value={stockAmount}
                      onChange={(e) => setStockAmount(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsStockModalOpen(false)}
                      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
};

export default InventoryPage;
