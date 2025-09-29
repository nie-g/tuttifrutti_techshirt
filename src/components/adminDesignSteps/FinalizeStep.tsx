import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface FinalizeDesignStepProps {
  design: {
    _id: Id<"design">;
    status: string;
    title?: string;
    description?: string;
    createdAt?: number;
  };
}

const FinalizeDesignStep: React.FC<FinalizeDesignStepProps> = ({ design }) => {
  const isApproved = design.status === "approved";
  const isFinished = design.status === "finished";

  // Fetch billing breakdown
  const billingDoc = useQuery(api.billing.getBillingByDesign, {
    designId: design._id,
  });

  if (!billingDoc) return null;

  // --- Calculate final display totals ---
  const displayTotal = billingDoc.starting_amount ?? billingDoc.breakdown.total;
  const finalTotal =
    !billingDoc.final_amount || billingDoc.final_amount === 0
      ? displayTotal
      : billingDoc.final_amount;

  const breakdown = billingDoc.breakdown;

  return (
    <div className="p-4 space-y-6">
      {/* Approved: Estimated Bill */}
      {isApproved && breakdown && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Estimated Bill Breakdown</h2>
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">Total Shirts:</span> {breakdown.shirtCount}
            </p>
            <p>
              <span className="font-medium">Printing Subtotal:</span> ₱
              {(breakdown.printFee * breakdown.shirtCount).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Revision Fee:</span> ₱{breakdown.revisionFee.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Designer Fee:</span> ₱{breakdown.designerFee.toLocaleString()}
            </p>
            <hr className="my-2" />
            <p className="font-semibold text-gray-900">
              Total: ₱{displayTotal.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Final Negotiated Price: ₱{finalTotal.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Finished: Invoice */}
      {isFinished && breakdown && (
        <div className="p-6 border rounded-lg shadow bg-white">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">Invoice</h1>
              <p className="text-sm text-gray-500">Invoice No. #{design._id}</p>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <h2 className="font-semibold">{design.title || "Custom Design"}</h2>
              <p className="text-sm text-gray-500">{design.description}</p>
            </div>
          </div>

          {/* Table */}
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
                  ₱{(breakdown.printFee * breakdown.shirtCount).toLocaleString()}
                </td>
              </tr>
              {breakdown.revisionFee > 0 && (
                <tr className="border-t">
                  <td className="px-3 py-2">Revision Fee</td>
                  <td className="px-3 py-2 text-center">-</td>
                  <td className="px-3 py-2 text-center">₱{breakdown.revisionFee.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₱{breakdown.revisionFee.toLocaleString()}</td>
                </tr>
              )}
              {breakdown.designerFee > 0 && (
                <tr className="border-t">
                  <td className="px-3 py-2">Designer Fee</td>
                  <td className="px-3 py-2 text-center">-</td>
                  <td className="px-3 py-2 text-center">₱{breakdown.designerFee.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₱{breakdown.designerFee.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-1/3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>₱{displayTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>₱{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm font-medium">Thank you!</p>
          </div>
        </div>
      )}

      {!isApproved && !isFinished && (
        <p className="text-sm text-gray-600">
          Billing is locked until your design is approved.
        </p>
      )}
    </div>
  );
};

export default FinalizeDesignStep;
