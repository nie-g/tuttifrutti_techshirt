// src/components/admin/AdminMetricsCards.tsx
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const AdminMetricsCards: React.FC = () => {
  // ✅ Fetch all billings and designs
  const billings = useQuery(api.billing.listAll) || [];
  const designs = useQuery(api.designs.listAllDesigns) || [];
  const ratings = useQuery(api.ratings_and_feedback.listAll) || [];

  // ✅ Filter only approved billings whose linked design is completed
  const approvedBillings = useMemo(() => {
    return billings.filter((b: any) => {
      if (b.status !== "approved") return false;
      const design = designs.find(
        (d: any) => d._id === (b.design_id ?? b.design)
      );
      return design?.status === "completed";
    });
  }, [billings, designs]);

  // --- Compute chart summary ---
  const chartSummary = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth - 1;

    const thisSum = approvedBillings
      .filter((b: any) => new Date(b.created_at || b._creationTime).getMonth() === thisMonth)
      .reduce((sum: number, b: any) => sum + (b.final_amount || 0), 0);

    const lastSum = approvedBillings
      .filter((b: any) => new Date(b.created_at || b._creationTime).getMonth() === lastMonth)
      .reduce((sum: number, b: any) => sum + (b.final_amount || 0), 0);

    const percentChange = lastSum === 0 ? 100 : ((thisSum - lastSum) / lastSum) * 100;

    return { thisSum, lastSum, percentChange };
  }, [approvedBillings]);

  // --- Average sale ---
  const avgSale = useMemo(() => {
    if (!approvedBillings.length) return 0;
    const total = approvedBillings.reduce((s: number, b: any) => s + (b.final_amount || 0), 0);
    return total / approvedBillings.length;
  }, [approvedBillings]);

  // --- Overall ratings ---
  const overallRatingStats = useMemo(() => {
    if (!ratings.length) return { avg: 0, count: 0 };
    const sum = ratings.reduce((total: number, r: any) => total + (r.rating || 0), 0);
    const avg = sum / ratings.length;
    return { avg, count: ratings.length };
  }, [ratings]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Net Income */}
      <motion.div
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-4 shadow flex flex-col justify-between"
      >
        <div className="text-sm font-medium text-gray-500">Net Income</div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="text-2xl font-semibold">
              ₱{chartSummary.thisSum.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              +₱{(chartSummary.thisSum - chartSummary.lastSum).toLocaleString()} from last period
            </div>
          </div>
          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
            +{chartSummary.percentChange.toFixed(1)}%
          </div>
        </div>
      </motion.div>

      {/* Average Sales */}
      <motion.div
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-4 shadow"
      >
        <div className="text-sm font-medium text-gray-500">Average Sales</div>
        <div className="mt-3">
          <div className="text-2xl font-semibold">
            ₱{Math.round(avgSale).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Avg per completed billing</div>
        </div>
      </motion.div>

      {/* Total Orders */}
      <motion.div
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-4 shadow"
      >
        <div className="text-sm font-medium text-gray-500">Total Orders</div>
        <div className="mt-3">
          <div className="text-2xl font-semibold">{approvedBillings.length}</div>
          <div className="text-xs text-gray-500">Approved & completed designs</div>
        </div>
      </motion.div>

      {/* Overall Ratings */}
      <motion.div
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 shadow"
      >
        <div className="text-sm font-medium text-gray-500">Overall Ratings</div>
        <div className="mt-3">
          <div className="text-2xl font-semibold">
            {overallRatingStats.avg.toFixed(1)} ⭐
          </div>
          <div className="text-xs text-gray-500">
            Based on {overallRatingStats.count} reviews
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default AdminMetricsCards;
