import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Save, Settings, Phone, MapPin } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"; 
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
  created_at: number;
};

const Profile: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();

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
  });

  // 👇 Add editing state
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (clientProfile) {
      setForm({
        phone: clientProfile.phone ?? "",
        address: clientProfile.address ?? "",
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
      });
      alert("✅ Profile updated successfully!");
      setIsEditing(false); // 👈 exit edit mode after saving
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("❌ Failed to update profile. Check console for details.");
    }
  };

  if (!isLoaded|| !dbUser) {
        return (
          <div className="flex h-screen bg-gray-50">
            <DynamicSidebar />
            <div className="flex-1 flex flex-col">
              <ClientNavbar />
              <div className="flex-1 p-6 flex items-center justify-center">
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              </div>
            </div>
          </div>
        );
      }

  return (
    <div  className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
      {/* Sidebar */}
      <DynamicSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl space-y-6"
          >
            <h1 className="text-2xl font-bold mb-6 text-gray-600">My Profile</h1>

            {/* === First Container: Profile Info === */}
            <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-200 flex items-center gap-6">
              <img
                src={user?.imageUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full border-2 border-gray-200"
              />

              <div>
                <p className="text-gray-600 text-sm">{dbUser.email}</p>
                <h2 className="text-lg font-semibold text-gray-900">
                  {dbUser.firstName} {dbUser.lastName}
                </h2>
              </div>

              <button
                onClick={() => openUserProfile()}
                className="ml-auto flex items-center gap-2 px-3 py-2  rounded-lg bg-gray-100 border border-gray-300 hover:bg-gray-200 transition"
                aria-label="Manage Account"
              >
                <span className="text-sm font-medium text-gray-600">
                  Manage Account
                </span>
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>

           {/* === Second Container: Client Info (view + edit) === */}
              {dbUser.role === "client" && (
                <div className=" bg-white rounded-2xl shadow-md p-4 border border-gray-200 ">
                  <div className="  justify-items-start mb-10 border-b border-gray-200 p-3">
                    <h2 className="text-xl font-semibold text-gray-600">Client Contact Information</h2>
                  </div>
                  
                  {!isEditing ? (
                    <>
                      <div className="space-y-3 text-gray-700 p-3">
                        
                        <p>
                          <span className="font-medium text-gray-600">Contact Number:</span>{" "}
                          {clientProfile?.phone || "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-600">Home Address:</span>{" "}
                          {clientProfile?.address || "Not provided"}
                        </p>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 bg-gray-100 border font-semibold border-gray-300 text-gray-700 px-6 py-2 rounded-lg shadow hover:bg-gray-200 transition"
                        >
                          <Settings size={18} />
                          {(!clientProfile?.phone && !clientProfile?.address)
                            ? "Set up your contact information"
                            : "Edit Information"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <form
                        className="space-y-4 "
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSave();
                        }}
                      >
                        {/* ✅ Contact number with label beside input */}
                        <div className="flex items-center gap-4">
                          <label className="w-1/3 text-sm font-medium text-gray-600">
                            Please enter your Contact Number <span className="text-red-500">*</span>
                          </label>
                          {/* ✅ Phone input */}
                          <div className="flex-1">  
                            <PhoneInput
                              country={"ph"} // default to PH
                              value={form.phone}
                              onChange={(value) => setForm({ ...form, phone: value })}
                              inputClass="!w-full !h-10 !text-sm !rounded-lg !border-gray-300 focus:!ring-teal-400 required"
                            />
                          </div>
                          
                        </div>

                        {/* ✅ Address with inline label */}
                        <div className="flex items-center gap-4">
                          <label className="w-1/3 text-sm font-medium text-gray-600">
                            Please enter your current address <span className="text-red-500">*</span>
                          </label>
                          <div className="flex-1">  
                            <textarea
                              aria-label="Address"
                              value={form.address}
                              onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                              }
                              className="w-full h-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                              required
                            />
                          </div>
                          
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex items-center gap-2 bg-teal-500 text-white px-6 py-2 rounded-lg shadow hover:bg-teal-600 transition"
                          >
                            <Save size={18} /> Save Changes
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
