// src/pages/portfolio.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Settings, Edit, Phone, NotebookPenIcon } from "lucide-react";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";

// === TYPES ===
type UserRecord = {
  _id: Id<"users">;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "designer" | "admin";
};

type DesignerRecord = {
  _id: Id<"designers">;
  user_id: Id<"users">;
  contact_number?: string;
  address?: string;
  portfolio_id?: Id<"portfolios">;
};

type PortfolioRecord = {
  _id: Id<"portfolios">;
  designer_id: Id<"designers">;
  title?: string;
  description?: string;
  specialization?: string;
  skills?: string[];
  social_links?: { platform: string; url: string }[];
};

const Portfolio: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();

  // === Queries ===
  const dbUser = useQuery(
    api.userQueries.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  ) as UserRecord | null | undefined;

  const designerProfile = useQuery(
    api.designers.getByUser,
    dbUser?._id ? { userId: dbUser._id } : "skip"
  ) as DesignerRecord | null | undefined;

  const portfolio = useQuery(
    api.portfolio.getPortfoliosByDesigner,
    designerProfile?._id ? { designer_id: designerProfile._id } : "skip"
  ) as PortfolioRecord[] | null | undefined;

  // ✅ Pick first portfolio (for now)
  const currentPortfolio = portfolio?.[0] ?? null;

  // === Mutations ===
  const updateDesigner = useMutation(api.designers.updateProfile);
  const updatePortfolio = useMutation(api.portfolio.updatePortfolio);

  // === Local form states ===
  const [designerForm, setDesignerForm] = useState({ contact_number: "", address: "" });
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    specialization: "",
    skills: [] as string[],
    social_links: [] as { platform: string; url: string }[],
  });

  const [editContact, setEditContact] = useState(false);
  const [editPortfolio, setEditPortfolio] = useState(false);

  useEffect(() => {
    if (designerProfile) {
      setDesignerForm({
        contact_number: designerProfile.contact_number ?? "",
        address: designerProfile.address ?? "",
      });
    }
  }, [designerProfile]);

  useEffect(() => {
    if (currentPortfolio) {
      setPortfolioForm({
        title: currentPortfolio.title ?? "",
        description: currentPortfolio.description ?? "",
        specialization: currentPortfolio.specialization ?? "",
        skills: currentPortfolio.skills ?? [],
        social_links: currentPortfolio.social_links ?? [],
      });
    }
  }, [currentPortfolio]);

  // === Save Functions ===
  const saveContactInfo = async () => {
    if (!designerProfile?._id) return;
    await updateDesigner({
      designerId: designerProfile._id,
      contact_number: designerForm.contact_number,
      address: designerForm.address,
    });
    setEditContact(false);
    alert("✅ Contact info updated");
  };

  const savePortfolio = async () => {
    if (!currentPortfolio?._id) return;

    // ✅ Require all fields
    if (
      !portfolioForm.title.trim() ||
      !portfolioForm.description.trim() ||
      !portfolioForm.specialization.trim() ||
      portfolioForm.skills.length === 0
    ) {
      alert("⚠️ Please complete all portfolio fields before saving.");
      return;
    }

    await updatePortfolio({
      portfolioId: currentPortfolio._id,
      title: portfolioForm.title,
      description: portfolioForm.description,
      specialization: portfolioForm.specialization,
      skills: portfolioForm.skills,
      social_links: portfolioForm.social_links,
    });

    setEditPortfolio(false);
    alert("✅ Portfolio saved");
  };

  // === Check if portfolio is empty ===
    const isPortfolioEmpty = !currentPortfolio ||
    (!currentPortfolio.title &&
      !currentPortfolio.description &&
      !currentPortfolio.specialization &&
      (!currentPortfolio.skills || currentPortfolio.skills.length === 0) &&
      (!currentPortfolio.social_links || currentPortfolio.social_links.length === 0));
    const isContactInfoEmpty =
    !designerProfile ||
    !designerProfile.contact_number ||
    designerProfile.contact_number.trim().toLowerCase() === "na" ||
    !designerProfile.address ||
    designerProfile.address.trim().toLowerCase() === "na";

  if (!isLoaded || !dbUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-4 text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl space-y-6"
          >
            

            {/* === Box 1: Account Info === */}
            <div className="p-4 bg-white rounded-2xl shadow-md flex items-center gap-6">
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
                className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="text-sm font-medium text-gray-600">Manage Account</span>
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* === Box 2: Contact Info === */}
                <div className="p-6 bg-white rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Phone size={18} strokeWidth={2.5} className="text-gray-700" />
                    Contact Information
                    </h2>
                    {!editContact && (
                    <div>
                        {isContactInfoEmpty ? (
                        <button
                            onClick={() => setEditContact(true)}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                            Set up your Contact Information
                        </button>
                        ) : (
                        <button
                            onClick={() => setEditContact(true)}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded-lg text-sm"
                        >
                            <Edit size={16} /> Edit
                        </button>
                        )}
                    </div>
                    )}
                </div>

                {!editContact ? (
                    isContactInfoEmpty ? (
                    <p className="text-gray-500 italic">
                        Contact information not set up yet.
                    </p>
                    ) : (
                    <div className="space-y-2">
                        <p className="text-gray-700">
                        <span className="font-medium">Phone:</span>{" "}
                        {designerProfile?.contact_number}
                        </p>
                        <p className="text-gray-700">
                        <span className="font-medium">Address:</span>{" "}
                        {designerProfile?.address}
                        </p>
                    </div>
                    )
                ) : (
                    <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Contact Number"
                        value={designerForm.contact_number}
                        onChange={(e) =>
                        setDesignerForm({
                            ...designerForm,
                            contact_number: e.target.value,
                        })
                        }
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                    />
                    <input
                        type="text"
                        placeholder="Address"
                        value={designerForm.address}
                        onChange={(e) =>
                        setDesignerForm({ ...designerForm, address: e.target.value })
                        }
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                    />
                    <div className="flex justify-end gap-3">
                        <button
                        onClick={() => setEditContact(false)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                        >
                        Cancel
                        </button>
                        <button
                        onClick={saveContactInfo}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
                        >
                        Save
                        </button>
                    </div>
                    </div>
                )}
                </div>


                {/* === Box 3: Portfolio Info === */}
                <div className="p-6 bg-white rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <NotebookPenIcon size={18} strokeWidth={2.5} className="text-gray-700" />
                        Portfolio
                    </h2>
                    {!editPortfolio && (
                    <div>
                        {isPortfolioEmpty ? (
                        <button
                            onClick={() => setEditPortfolio(true)}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                            Set up your Portfolio
                        </button>
                        ) : (
                        <button
                            onClick={() => setEditPortfolio(true)}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition"
                        >
                            <Edit size={16} /> Edit
                        </button>
                        )}
                    </div>
                    )}
                </div>

                {!editPortfolio ? (
                    <div className="space-y-3 text-gray-700">
                    <p>
                        <span className="font-medium">Potfolio Title:</span>{" "}
                        {currentPortfolio?.title || "Portfolio is currently untitled"}
                    </p>

                   
                    <p>
                        <span className="font-medium">Description:</span>{" "}
                        {currentPortfolio?.description || "No description yet"}
                    </p>
                    <p>
                        <span className="font-medium">Specialization:</span>{" "}
                        {currentPortfolio?.specialization || "No specialization added"}
                    </p>
                    <p>
                        <span className="font-medium">Skills:</span>{" "}
                        {currentPortfolio?.skills?.join(", ") || "No skills added"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {currentPortfolio?.social_links?.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            className="text-sm bg-teal-50 text-teal-700 px-3 py-1 rounded-full hover:bg-teal-100 transition"
                        >
                            {link.platform}
                        </a>
                        ))}
                    </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Portfolio Title *"
                        value={portfolioForm.title}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                        required
                    />
                    <textarea
                        placeholder="Description *"
                        value={portfolioForm.description}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Specialization *"
                        value={portfolioForm.specialization}
                        onChange={(e) =>
                        setPortfolioForm({ ...portfolioForm, specialization: e.target.value })
                        }
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Skills (comma separated) *"
                        value={portfolioForm.skills.join(", ")}
                        onChange={(e) =>
                        setPortfolioForm({
                            ...portfolioForm,
                            skills: e.target.value.split(",").map((s) => s.trim()),
                        })
                        }
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                        required
                    />
                    <div className="flex justify-end gap-3">
                        <button
                        onClick={() => setEditPortfolio(false)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                        >
                        Cancel
                        </button>
                        <button
                        onClick={savePortfolio}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
                        >
                        Save
                        </button>
                    </div>
                    </div>
                )}
                </div>

          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default Portfolio;
