import React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle, HandCoins } from "lucide-react";

interface BillModalProps {
  billing: {
    shirtCount: number;
    printFee: number;
    revisionFee: number;
    designerFee: number;
    total: number;
  };
  onClose: () => void;
  onApprove: () => void;
  onNegotiate: () => void;
}

const BillModal: React.FC<BillModalProps> = ({
  billing,
  onClose,
  onApprove,
  onNegotiate,
}) => {
  if (!billing) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Billing Breakdown
          </h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between">
            <span className="font-medium">Shirts Ordered</span>
            <span>{billing.shirtCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Printing Fee (per shirt)</span>
            <span>₱{billing.printFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Revision Fee</span>
            <span>₱{billing.revisionFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Designer Fee</span>
            <span>₱{billing.designerFee}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-lg font-bold text-gray-600">
            <span>Total</span>
            <span>₱{billing.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onNegotiate}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-800 transition"
          >
            <HandCoins size={18} /> Negotiate Price
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition"
          >
            <CheckCircle size={18} /> Approve
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BillModal;
