import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import HeaderSection from "./admin/HeaderSection";

const AdminReports: React.FC = () => {
  const [user, setUser] = useState<{ full_name: string } | null>(null);
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  // --- Queries ---
  const billings = useQuery(api.billing.listAll) || []; // all billing
  const requests = useQuery(api.design_requests.listAllRequests) || [];
  const designs = useQuery(api.designs.listAllDesigns) || [];

  const isLoading =
    billings === undefined || requests === undefined || designs === undefined;

  // --- Auth check ---
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    if (clerkUser) {
      const role = clerkUser.unsafeMetadata?.userType;
      if (role === "admin") {
        setUser({
          full_name: clerkUser.fullName || clerkUser.username || "admin",
        });
      } else {
        navigate("/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, clerkUser, navigate]);

  // --- Derived Data ---
  const approvedBillings = useMemo(
    () => billings.filter((b: any) => b.status === "approved"),
    [billings]
  );

  const totalRevenue = approvedBillings.reduce(
    (sum: number, b: any) => sum + (b.final_amount || 0),
    0
  );

  const requestStats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === "pending").length,
    approved: requests.filter((r: any) => r.status === "approved").length,
    rejected: requests.filter((r: any) => r.status === "rejected").length,
  };

  const designStats = {
    total: designs.length,
    finished: designs.filter((d: any) => d.status === "finished").length,
    approved: designs.filter((d: any) => d.status === "approved").length,
    revisions: designs.filter((d: any) => d.status === "pending_revision")
      .length,
  };

  if (!user) return <div>Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <AdminNavbar />
        <main className="p-6 md:p-8 flex flex-col gap-6 overflow-auto">
          <HeaderSection  />

          {/* Sales Reports */}
          <section className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Sales Reports</h2>
            <p className="text-gray-600 mb-2">
              Total Revenue:{" "}
              <span className="font-bold text-teal-600">
                ₱{totalRevenue.toLocaleString()}
              </span>
            </p>
            <p className="text-gray-600 mb-4">
              Approved Billings:{" "}
              <span className="font-bold">{approvedBillings.length}</span>
            </p>
            <table className="w-full text-left border">
              <thead className="bg-teal-100">
                <tr>
                  <th className="p-2">Client</th>
                  <th className="p-2">Designer</th>
                  <th className="p-2">Final Amount</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {approvedBillings.map((b: any) => (
                  <tr key={b._id} className="border-t">
                    <td className="p-2">{b.client_id}</td>
                    <td className="p-2">{b.designer_id}</td>
                    <td className="p-2">₱{b.final_amount}</td>
                    <td className="p-2">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Design Requests Reports */}
          <section className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">
              Design Requests Reports
            </h2>
            <p className="text-gray-600 mb-4">
              Total: <span className="font-bold">{requestStats.total}</span> |{" "}
              Approved: {requestStats.approved} | Pending: {requestStats.pending}{" "}
              | Rejected: {requestStats.rejected}
            </p>
            <table className="w-full text-left border">
              <thead className="bg-teal-100">
                <tr>
                  <th className="p-2">Title</th>
                  <th className="p-2">Client</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2">{r.request_title}</td>
                    <td className="p-2">{r.client_id}</td>
                    <td className="p-2 capitalize">{r.status}</td>
                    <td className="p-2">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Design Reports */}
          <section className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Design Reports</h2>
            <p className="text-gray-600 mb-4">
              Total: <span className="font-bold">{designStats.total}</span> |{" "}
              Finished: {designStats.finished} | Approved: {designStats.approved}{" "}
              | Revisions: {designStats.revisions}
            </p>
            <table className="w-full text-left border">
              <thead className="bg-teal-100">
                <tr>
                  <th className="p-2">Design ID</th>
                  <th className="p-2">Client</th>
                  <th className="p-2">Designer</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {designs.map((d: any) => (
                  <tr key={d._id} className="border-t">
                    <td className="p-2">{d._id}</td>
                    <td className="p-2">{d.client_id}</td>
                    <td className="p-2">{d.designer_id}</td>
                    <td className="p-2 capitalize">{d.status}</td>
                    <td className="p-2">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </motion.div>
  );
};

export default AdminReports;
