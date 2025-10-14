import React, { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";

// ✅ Shared components
import ClientNavbar from "../components/UsersNavbar";
import ClientSidebar from "../components/Sidebar";
import { useUser } from "@clerk/clerk-react"; // 👈 add this import at the top

const Users: React.FC = () => {
  const users = useQuery(api.users.listAllUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
   const { user: clerkUser } = useUser();

  // ✅ Convex actions
  const updateUserMutation = useAction(api.functions.updateClerkUser.updateClerkUser);
  const sendInvite = useAction(api.functions.invites.sendClerkInvite); // 🟢 New invite action

  // ✅ Modal states
  const [editingUser, setEditingUser] = useState<any>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false); // 🟢 Invite modal state

  // Edit modal fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Invite modal fields 🟢
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "client" | "designer">("designer");


  // ✅ Open/Close modals
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  const openInviteModal = () => setInviteModalOpen(true); // 🟢
  const closeInviteModal = () => {
    setInviteModalOpen(false);
    setInviteEmail("");
    setInviteRole("designer");
  };

  // ✅ Handle Update User
  const handleUpdate = async () => {
    if (!editingUser) return;
    const payload: any = { userId: editingUser.clerkId, firstName, lastName };
    if (email !== editingUser.email) payload.email = email;

    try {
      const result = await updateUserMutation(payload);
      if (result.success) {
        alert("✅ User updated!");
        closeEditModal();
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error updating user");
    }
  };

  // 🟢 Handle Invite User
  const handleInviteUser = async () => {
    if (!inviteEmail) {
      alert("Please enter an email");
      return;
    }

    try {
      const result = await sendInvite({ email: inviteEmail, role: inviteRole });
      if (result.emailSent) {
        alert(`✅ Invitation sent to ${inviteEmail} as ${inviteRole}`);
        closeInviteModal();
      } else {
        alert(`❌ Failed to send invite: ${result.message}`);
      }
    } catch (err) {
      console.error("Error sending invite:", err);
      alert("❌ Failed to send invite. Check console for details.");
    }
  };

  // ✅ Handle Loading State
  if (!users) {
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

  // ✅ Filtered users
  const filteredUsers = users
    .filter((u: any) => u.clerkId !== clerkUser?.id) // 👈 exclude current admin
    .filter((u: any) => {
      const matchesSearch =
        u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <ClientSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />

        <div className="flex-1 p-6 overflow-y-auto">
          <motion.div
            className="bg-white shadow-md rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Users</h1>
              {/* 🟢 Invite Button */}
              <button
                onClick={openInviteModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

            {/* Users Table */}
            <motion.div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">First Name</th>
                    <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">Last Name</th>
                    <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">Role</th>
                    <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any, idx: number) => (
                    <motion.tr
                      key={user._id}
                      className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <td className="px-4 py-3 border-b text-sm text-gray-700">{user.firstName}</td>
                      <td className="px-4 py-3 border-b text-sm text-gray-700">{user.lastName}</td>
                      <td className="px-4 py-3 border-b text-sm text-gray-700">{user.email}</td>
                      <td className="px-4 py-3 border-b text-sm capitalize text-gray-700">{user.role}</td>
                      <td className="px-4 py-3 border-b text-sm">
                        <button
                          className="px-6 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                          onClick={() => openEditModal(user)}
                        >
                          Edit
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* 🟢 Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-start ">
              <h2 className="text-xl font-bold mb-6  text-gray-600">Invite New User</h2>
            </div>
            

            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm font-medium text-gray-700">User Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="border border-gray-400 w-full rounded-lg p-2 text-gray-700"
                placeholder="Enter user email"
              />
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm font-medium text-gray-700">User Role</label>    
              <select
              aria-label="Select user role"
              className="border border-gray-400 w-full rounded-lg p-2 mb-3 text-gray-700"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "client" | "designer")}
            >
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="designer">Designer</option>
            </select>
            </div>

            

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg text-gray-700 hover:bg-gray-400 hover:text-gray-100"
                onClick={closeInviteModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={handleInviteUser}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Existing) */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-8 text-gray-800">Update User Profile</h2>
            <input
              className="border border-gray-400 w-full rounded-lg p-2 mb-3 text-gray-700"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="border border-gray-400 w-full rounded-lg p-2 mb-3 text-gray-700"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              className="border border-gray-400 w-full rounded-lg p-2 mb-3 text-gray-700"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg text-gray-700 hover:bg-gray-400 hover:text-gray-100"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                onClick={handleUpdate}
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
