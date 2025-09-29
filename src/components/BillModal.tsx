import React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle, HandCoins } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface BillModalProps {
  designId: Id<"design">;
  billing?: {
    shirtCount: number;
    printFee: number;
    revisionFee: number;
    designerFee: number;
    total: number;
    status?: string;
  };
  onClose: () => void;
  onApprove: () => void;
  onNegotiate: () => void;
}

const BillModal: React.FC<BillModalProps> = ({
  designId,
  billing,
  onClose,
  onApprove,
  onNegotiate,
}) => {
  const clientInfo = useQuery(api.billing.getClientInfoByDesign, { designId });
  const billingDoc = useQuery(api.billing.getBillingByDesign, { designId });

  if (!billingDoc && !billing) return null;

  // Normalize shape
  const breakdown =
    billingDoc?.breakdown ??
    billing ?? {
      shirtCount: 0,
      printFee: 0,
      revisionFee: 0,
      designerFee: 0,
      total: 0,
    };

  const status = billingDoc?.status ?? billing?.status ?? "pending";
  const isApproved = status === "approved";

  // Use final_amount if exists
  const displayTotal = billingDoc?.starting_amount ?? breakdown.total;
   // Final total fallback logic
  const getFinalTotal = () => {
    if (!billingDoc) return displayTotal;
    if (!billingDoc.final_amount || billingDoc.final_amount === 0) {
      return displayTotal;
    }
    return billingDoc.final_amount;
  };

  const finalTotal = getFinalTotal();

  const [isNegotiating, setIsNegotiating] = React.useState(false);
  const [negotiatedAmount, setNegotiatedAmount] = React.useState(displayTotal);
  const submitNegotiation = useMutation(api.billing.submitNegotiation);

  const handleNegotiate = () => {
    setIsNegotiating(true);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">
            {isApproved ? "Invoice" : "Billing Breakdown"}
          </h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Invoice Layout */}
        {isApproved ? (
          <div className="text-gray-700 text-sm ">
            {/* Bill To + Invoice Info */}
            <div className="flex justify-between mb-6">
              <div>
                <h4 className="font-bold">Billed to:</h4>
                <p>
                  {clientInfo
                    ? `${clientInfo.firstName} ${clientInfo.lastName}`
                    : "Client Name"}
                </p>
                <p>{clientInfo?.phone || "No contact number"}</p>
                <p>{clientInfo?.address || "No address"}</p>
              </div>
              <div className="text-right">
                <p>
                  Invoice No.{" "}
                  {billingDoc?.invoiceNo
                    ? billingDoc.invoiceNo.toString().padStart(4, "0")
                    : "N/A"}
                </p>
                <p>
                  Date:{" "}
                  {billingDoc?.created_at
                    ? new Date(billingDoc.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-t border-b border-gray-300 mb-6">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Quantity</th>
                  <th className="py-2 text-center">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="py-2">Shirts</td>
                  <td className="text-center">{breakdown.shirtCount}</td>
                  <td className="text-center">₱{breakdown.printFee}</td>
                  <td className="text-right">
                    ₱{(breakdown.printFee * breakdown.shirtCount).toLocaleString()}
                  </td>
                </tr>
                {breakdown.revisionFee > 0 && (
                  <tr className="border-t border-gray-200">
                    <td className="py-2">Revision Fee</td>
                    <td className="text-center">-</td>
                    <td className="text-center">₱{breakdown.revisionFee}</td>
                    <td className="text-right">₱{breakdown.revisionFee}</td>
                  </tr>
                )}
                {breakdown.designerFee > 0 && (
                  <tr className="border-t border-gray-200">
                    <td className="py-2">Designer Fee</td>
                    <td className="text-center">-</td>
                    <td className="text-center">₱{breakdown.designerFee}</td>
                    <td className="text-right">₱{breakdown.designerFee}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-1/2 space-y-1 text-sm">
                <div className="flex justify-between border-b border-gray-300">
                  <span>Subtotal</span>
                  <span>₱{displayTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300">
                  <span>Total</span>
                  <span>₱{displayTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg bg-gray-50 text-gray-800 px-2 py-1 rounded">
                  <span>Final Negotiated Price</span>
                  <span>₱{finalTotal.toLocaleString()}</span>

                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Billing Breakdown Layout */
          <>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span className="font-medium">Shirts Ordered</span>
                <span>{breakdown.shirtCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Printing Fee (per shirt)</span>
                <span>₱{breakdown.printFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Revision Fee</span>
                <span>₱{breakdown.revisionFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Designer Fee</span>
                <span>₱{breakdown.designerFee}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-bold text-gray-600">
                <span>Total</span>
                <span>₱{displayTotal.toLocaleString()}</span>
              </div>
               <p className="text-sm text-gray-600 mb-2">
                Current negotiated Price Offered by designer: ₱{finalTotal.toLocaleString()}
              </p>
            </div>

                      {/* Negotiation History */}
          {(billingDoc?.negotiation_history?.length ?? 0) > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Negotiation History
              </h4>
              <ul className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                {billingDoc?.negotiation_history?.map((entry, i) => (
                  <li key={i}>
                    • ₱{entry.amount.toLocaleString()} on{" "}
                    {new Date(entry.date).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}


            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleNegotiate}
                disabled={(billingDoc?.negotiation_rounds ?? 0) >= 5}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-800 transition disabled:opacity-50"
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
          </>
        )}
      </motion.div>

      {/* Negotiation Modal */}
     
      {isNegotiating && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="bg-white rounded-2xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Negotiate Price</h3>

            <p className="text-sm text-red-600 mb-2">
              You can negotiate a maximum of 5 times.
            </p>

            <p className="text-sm text-gray-600 mb-2">
              Current total: ₱{displayTotal.toLocaleString()}
            </p>
            

            <input
              aria-label="Negotiated amount"
              type="number"
              value={negotiatedAmount}
              onChange={(e) => setNegotiatedAmount(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              min={0}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsNegotiating(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const minAllowed = displayTotal * 0.9; // 10% of starting amount
                  if (negotiatedAmount < minAllowed) {
                    alert(
                      `⚠️ The negotiated amount cannot be less than 10% of the starting amount (₱${minAllowed.toLocaleString()}).`
                    );
                    return;
                  }

                  try {
                    await submitNegotiation({
                      designId,
                      newAmount: negotiatedAmount,
                    });
                    alert("✅ Negotiation submitted!");
                    setIsNegotiating(false);
                  } catch (err) {
                    console.error(err);
                    alert("⚠️ Failed to submit negotiation.");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-cyan-800 transition"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
};

export default BillModal;
