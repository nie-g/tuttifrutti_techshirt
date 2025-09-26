// src/pages/portfolio.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Settings, Edit, Phone, NotebookPenIcon, Plus, X } from "lucide-react";
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

  // === Skills handling ===
  const [newSkill, setNewSkill] = useState("");
  const addSkill = () => {
    if (newSkill.trim() && !portfolioForm.skills.includes(newSkill.trim())) {
      setPortfolioForm({
        ...portfolioForm,
        skills: [...portfolioForm.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };
  const removeSkill = (skill: string) => {
    setPortfolioForm({
      ...portfolioForm,
      skills: portfolioForm.skills.filter((s) => s !== skill),
    });
  };
  // === Social Links handling ===
  const [newSocial, setNewSocial] = useState({ platform: "", url: "" });

  const addSocialLink = () => {
    if (newSocial.platform.trim() && newSocial.url.trim()) {
      setPortfolioForm({
        ...portfolioForm,
        social_links: [
          ...portfolioForm.social_links,
          { platform: newSocial.platform.trim(), url: newSocial.url.trim() },
        ],
      });
      setNewSocial({ platform: "", url: "" });
    }
  };

  const removeSocialLink = (index: number) => {
    setPortfolioForm({
      ...portfolioForm,
      social_links: portfolioForm.social_links.filter((_, i) => i !== index),
    });
  };


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

  // === Checks ===
  const isPortfolioEmpty =
    !currentPortfolio ||
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl space-y-6">
            
            {/* === Account Info === */}
            <div className="p-4 bg-white rounded-2xl shadow-md flex items-center gap-6">
              <img src={user?.imageUrl} alt="Profile" className="w-20 h-20 rounded-full border-2 border-gray-200" />
              <div>
                <p className="text-gray-600 text-sm">{dbUser.email}</p>
                <h2 className="text-lg font-semibold text-gray-900">{dbUser.firstName} {dbUser.lastName}</h2>
              </div>
              <button onClick={() => openUserProfile()} className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                <span className="text-sm font-medium text-gray-600">Manage Account</span>
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* === Contact Info === */}
            <div className="p-6 bg-white rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Phone size={18} strokeWidth={2.5} className="text-gray-700" />
                  Contact Information
                </h2>
                {!editContact && (
                  <div>
                    {isContactInfoEmpty ? (
                      <button onClick={() => setEditContact(true)} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm transition">
                        Set up your Contact Information
                      </button>
                    ) : (
                      <button onClick={() => setEditContact(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm">
                        <Edit size={16} /> Edit
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!editContact ? (
                isContactInfoEmpty ? (
                  <p className="text-gray-500 italic">Contact information not set up yet.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-700"><span className="font-medium">Phone:</span> {designerProfile?.contact_number}</p>
                    <p className="text-gray-700"><span className="font-medium">Address:</span> {designerProfile?.address}</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <input type="text" placeholder="Contact Number" value={designerForm.contact_number} onChange={(e) => setDesignerForm({ ...designerForm, contact_number: e.target.value })} className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Address" value={designerForm.address} onChange={(e) => setDesignerForm({ ...designerForm, address: e.target.value })} className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2" />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditContact(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={saveContactInfo} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg">Save</button>
                  </div>
                </div>
              )}
            </div>

            {/* === Portfolio Info === */}
            <div className="p-6 bg-white rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <NotebookPenIcon size={18} strokeWidth={2.5} className="text-gray-700" />
                  Portfolio
                </h2>
                {!editPortfolio && (
                  <div>
                    {isPortfolioEmpty ? (
                      <button onClick={() => setEditPortfolio(true)} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm transition">
                        Set up your Portfolio
                      </button>
                    ) : (
                      <button onClick={() => setEditPortfolio(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm">
                        <Edit size={16} /> Edit
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!editPortfolio ? (
                isPortfolioEmpty ? (
                  <p className="text-gray-500 italic">Portfolio not set up yet.</p>
                ) : (
                  <div className="space-y-3 text-gray-700">
                    <p><span className="font-medium">Portfolio Title:</span> {currentPortfolio?.title || "Untitled"}</p>
                    <p><span className="font-medium">Description:</span> {currentPortfolio?.description || "No description yet"}</p>
                    <p><span className="font-medium">Specialization:</span> {currentPortfolio?.specialization || "Not specified"}</p>
                    <p><span className="font-medium">Skills:</span> {currentPortfolio?.skills?.join(", ") || "No skills added"}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentPortfolio?.social_links?.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" className="text-sm bg-teal-50 text-teal-700 px-3 py-1 rounded-full hover:bg-teal-100 transition">
                          {link.platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <input type="text" placeholder="Portfolio Title *" value={portfolioForm.title} onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })} className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2" required />
                  <textarea placeholder="Description *" value={portfolioForm.description} onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })} className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2" required />
                  <input type="text" placeholder="Specialization *" value={portfolioForm.specialization} onChange={(e) => setPortfolioForm({ ...portfolioForm, specialization: e.target.value })} className="w-full border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2" required />

                  {/* Skills with Add/Remove */}
                  <div>
                    <label className="font-medium text-sm text-gray-700">Skills *</label>
                    <div className="flex gap-2 mt-2">
                      <input type="text" placeholder="Enter a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="flex-1 border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2" />
                      <button aria-label="Add skill" type="button" onClick={addSkill} className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"><Plus size={16} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {portfolioForm.skills.map((skill, idx) => (
                        <span key={idx} className="flex items-center gap-1 bg-gray-50 text-gray-500 border border-gray-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                          <button aria-label="Remove skill" type="button" onClick={() => removeSkill(skill)} className="ml-1 text-gray -500 hover:text-gray-700">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Social Links with Add/Remove */}
                  <div>
                    <label className="font-medium text-sm text-gray-700">Social Links</label>

                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Platform (e.g. LinkedIn, Behance)"
                        value={newSocial.platform}
                        onChange={(e) =>
                          setNewSocial({ ...newSocial, platform: e.target.value })
                        }
                        className="flex-1 border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="URL"
                        value={newSocial.url}
                        onChange={(e) =>
                          setNewSocial({ ...newSocial, url: e.target.value })
                        }
                        className="flex-1 border border-gray-300 focus:ring-2 focus:ring-teal-400 rounded-lg px-3 py-2"
                      />
                      <button
                        aria-label="Add social link"
                        type="button"
                        onClick={addSocialLink}
                        className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {portfolioForm.social_links.map((link, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-2 bg-gray-50 text-gray-500 border border-gray-700 px-3 py-1 rounded-full text-sm"
                        >
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {link.platform}
                          </a>
                          <button
                            aria-label="Remove social link"
                            type="button"
                            onClick={() => removeSocialLink(idx)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>


                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditPortfolio(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancel</button>
                    <button onClick={savePortfolio} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg">Save</button>
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
