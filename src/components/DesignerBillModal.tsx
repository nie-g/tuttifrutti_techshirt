import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface DesignerBillModalProps {
  designId: Id<"design">;
  onClose: () => void;
}

const DesignerBillModal: React.FC<DesignerBillModalProps> = ({
  designId,
  onClose,
}) => {
  const billingDoc = useQuery(api.billing.getBillingByDesign, { designId });
  const clientInfo = useQuery(api.billing.getClientInfoByDesign, { designId });

  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");

  if (!billingDoc) return null;
  const breakdown = billingDoc.breakdown;

  // Latest negotiation entry
 // Latest negotiation entry
  const latestNegotiation =
    billingDoc.negotiation_history &&
    billingDoc.negotiation_history[billingDoc.negotiation_history.length - 1];


  

  const saveFinalAmount = useMutation(api.billing.UpdateFinalAmount);
    const handleSaveFinalAmount = async () => {
      if (!billingDoc?._id) return;

      try {
        await saveFinalAmount({
          billingId: billingDoc._id,
          finalAmount: Number(finalAmount), // convert string → number
        });
        console.log("Final amount saved:", finalAmount);
        setIsNegotiationOpen(false);
      } catch (err) {
        console.error("Error saving final amount:", err);
      }
    };


  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Invoice</h3>
              <p className="text-sm text-gray-500">
                Invoice No. #{billingDoc._id}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(billingDoc._creationTime).toLocaleDateString()}
              </p>
            </div>
            <button
              aria-label="close"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Client Info */}
          <div className="mb-6 text-gray-700 text-sm">
            <h4 className="font-bold mb-1">Client Info</h4>
            <p>
              {clientInfo
                ? `${clientInfo.firstName} ${clientInfo.lastName}`
                : "Client Name"}
            </p>
            <p>{clientInfo?.phone || "No contact number"}</p>
            <p>{clientInfo?.address || "No address"}</p>
          </div>

          {/* Billing Table */}
          <table className="w-full text-sm text-left border-t border-b mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-center">Quantity</th>
                <th className="px-3 py-2 text-center">Unit Price</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2">Printing</td>
                <td className="px-3 py-2 text-center">{breakdown.shirtCount}</td>
                <td className="px-3 py-2 text-center">₱{breakdown.printFee}</td>
                <td className="px-3 py-2 text-right">
                  ₱
                  {(breakdown.printFee * breakdown.shirtCount).toLocaleString()}
                </td>
              </tr>
              {breakdown.revisionFee > 0 && (
                <tr className="border-t">
                  <td className="px-3 py-2">Revision Fee</td>
                  <td className="px-3 py-2 text-center">-</td>
                  <td className="px-3 py-2 text-center">
                    ₱{breakdown.revisionFee}
                  </td>
                  <td className="px-3 py-2 text-right">
                    ₱{breakdown.revisionFee}
                  </td>
                </tr>
              )}
              {breakdown.designerFee > 0 && (
                <tr className="border-t">
                  <td className="px-3 py-2">Designer Fee</td>
                  <td className="px-3 py-2 text-center">-</td>
                  <td className="px-3 py-2 text-center">
                    ₱{breakdown.designerFee}
                  </td>
                  <td className="px-3 py-2 text-right">
                    ₱{breakdown.designerFee}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-1/3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>₱{breakdown.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>₱{breakdown.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bill Status */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50 border text-sm text-gray-700 flex justify-between items-center">
            <div>
              <span className="font-medium">Bill Status:</span>{" "}
              <span className="text-blue-600 font-semibold">
                {billingDoc.status || "Pending"}
              </span>
            </div>

            {(!billingDoc.status ||
              billingDoc.status.toLowerCase() === "pending") && (
              <button
                onClick={() => setIsNegotiationOpen(true)}
                className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Manage Negotiation
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Negotiation Modal */}
      {isNegotiationOpen && (
        <motion.div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50"
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Negotiation Details
              </h3>
              <button
                aria-label="Close"
                onClick={() => setIsNegotiationOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Starting amount */}
            <p className="text-sm mb-2">
              <span className="font-semibold">Starting Amount:</span> ₱
              {breakdown.total.toLocaleString()}
            </p>

            {/* Latest negotiation */}
            {latestNegotiation ? (
              <p className="text-sm mb-4">
                <span className="font-semibold">Latest:</span> ₱
                {latestNegotiation.amount} on{" "}
                {new Date(latestNegotiation.date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-sm mb-4 text-gray-500">
                No negotiation history yet.
              </p>
            )}

            {/* Input field */}
            <input
              type="number"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              placeholder="Enter final amount"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            />

            <button
              onClick={handleSaveFinalAmount}
              className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Submit Final Amount
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default DesignerBillModal;
