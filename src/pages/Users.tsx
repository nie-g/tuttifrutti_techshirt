import React, { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";

// ✅ Shared components
import ClientNavbar from "../components/UsersNavbar";
import ClientSidebar from "../components/Sidebar";

const Users: React.FC = () => {
  const users = useQuery(api.users.listAllUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // ✅ Convex action for sending Clerk invite
  const sendClerkInvite = useAction(api.functions.invites.sendClerkInvite);

  // ✅ Invite function
  const generateInvite = async () => {
    const email = prompt("Enter email to invite:");
    if (!email) return;

    try {
      const result = await sendClerkInvite({ email });
      if (result.emailSent) {
        alert(`✅ Invite sent to ${email}!`);
      } else {
        alert(`❌ Failed to send invite: ${result.message}`);
      }
    } catch (err) {
      console.error("Error sending invite:", err);
      alert("Failed to send invite. Check console for details.");
    }
  };

  // Handle loading state
  if (users === undefined) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ClientSidebar />
        <div className="flex-1 flex flex-col">
          <ClientNavbar />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter logic
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ? true : user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ClientSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <ClientNavbar />

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <motion.div
            className="bg-white shadow-md rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Users</h1>
              {/* ✅ Invite Button */}
              <button
                type="button"
                onClick={generateInvite}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Invite User
              </button>
            </div>

            {/* Search + Filter */}
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <input
                type="text"
                placeholder="Search by name or email..."
                className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                aria-label="Filter users by role"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="client">Client</option>
                <option value="designer">Designer</option>
                <option value="admin">Admin</option>
              </select>
            </motion.div>

            {/* Table */}
            {filteredUsers.length === 0 ? (
              <motion.p
                className="text-gray-500 text-center py-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                No users found.
              </motion.p>
            ) : (
              <motion.div
                className="overflow-x-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">
                        First Name
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">
                        Last Name
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">
                        Email
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">
                        Role
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any, idx: number) => (
                      <motion.tr
                        key={user._id}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <td className="px-4 py-3 border-b text-sm text-gray-700">
                          {user.firstName}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-gray-700">
                          {user.lastName}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 border-b text-sm capitalize text-gray-700">
                          {user.role}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-gray-700">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Users;
