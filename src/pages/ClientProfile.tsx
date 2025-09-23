// src/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Save } from "lucide-react";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";

type UserRecord = {
  _id: Id<"users">;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "designer" | "admin";
  createdAt: number;
};

type ClientRecord = {
  _id: Id<"clients">;
  user_id: Id<"users">;
  phone?: string;
  address?: string;
  bio?: string;
  created_at: number;
};

const Profile: React.FC = () => {
  const { user, isLoaded } = useUser();

  // Fetch Convex user by ClerkId
  const dbUser = useQuery(
    api.userQueries.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  ) as UserRecord | null | undefined;

  // Fetch client profile
  const clientProfile = useQuery(
    api.clients.getByUser,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  ) as ClientRecord | null | undefined;

  const updateClient = useMutation(api.clients.updateProfile);

  const [form, setForm] = useState({
    phone: "",
    address: "",
    bio: "",
  });

  useEffect(() => {
    if (clientProfile) {
      setForm({
        phone: clientProfile.phone ?? "",
        address: clientProfile.address ?? "",
        bio: clientProfile.bio ?? "",
      });
    }
  }, [clientProfile]);

  const handleSave = async () => {
    if (!clientProfile?._id) return;
    try {
      await updateClient({
        clientId: clientProfile._id,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
      });
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("❌ Failed to update profile. Check console for details.");
    }
  };

  if (!isLoaded || !dbUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-4 text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      {/* Sidebar */}
      <DynamicSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl p-6 bg-white rounded-2xl shadow-md"
          >
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>

            {/* Base User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Name
                </label>
                <p className="mt-1 text-gray-900">
                  {dbUser.firstName} {dbUser.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Email
                </label>
                <p className="mt-1 text-gray-900">{dbUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Role
                </label>
                <p className="mt-1 capitalize text-gray-900">{dbUser.role}</p>
              </div>
            </div>

            {/* Editable Client Profile */}
            {dbUser.role === "client" && (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  Client Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Phone
                    </label>
                    <input
                      aria-label="Phone number"
                      type="text"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <input
                      aria-label="Address"
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Bio
                    </label>
                    <textarea
                      aria-label="Bio"
                      value={form.bio}
                      onChange={(e) =>
                        setForm({ ...form, bio: e.target.value })
                      }
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-teal-500 text-white px-6 py-2 rounded-lg shadow hover:bg-teal-600 transition"
                  >
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default Profile;
