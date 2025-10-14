import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface RecentApprovedBillingsProps {
  getUserName: (userId: string) => string;
  limit?: number;
}

const RecentApprovedBillings: React.FC<RecentApprovedBillingsProps> = ({ getUserName, limit = 8 }) => {
  const billings = useQuery(api.billing.listAll) || [];
  const designs = useQuery(api.designs.listAllDesigns) || [];

  // ✅ Filter only approved billings with completed designs
  const approvedBillings = useMemo(() => {
    return billings.filter((b: any) => {
      if (b.status !== "approved") return false;
      const linkedDesign = designs.find(
        (d: any) => d._id === b.design_id || d._id === b.design
      );
      return linkedDesign?.status === "completed";
    });
  }, [billings, designs]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h4 className="font-semibold mb-3">Recent Approved Billings</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-2">Client</th>
              <th className="p-2">Designer</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {approvedBillings.slice(-limit).reverse().map((b: any) => (
              <tr key={b._id} className="border-t hover:bg-gray-50 transition">
                <td className="p-2">{getUserName(b.client_id ?? b.client)}</td>
                <td className="p-2">{getUserName(b.designer_id ?? b.designer)}</td>
                <td className="p-2 font-medium text-gray-700">
                  ₱{Number(b.final_amount || 0).toLocaleString()}
                </td>
                <td className="p-2 text-gray-500">
                  {new Date(b.created_at || b.createdAt || Date.now()).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {approvedBillings.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No approved billings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentApprovedBillings;
