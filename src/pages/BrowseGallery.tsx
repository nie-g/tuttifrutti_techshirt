import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ImageIcon, Search } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";

type DesignerRecord = {
  _id: Id<"designers">;
  user_id: Id<"users">;
  first_name?: string;
  last_name?: string;
};

type GalleryRecord = {
  _id: Id<"galleries">;
  designer_id: Id<"designers">;
  title: string;
  caption?: string;
  created_at: number;
};

type GalleryImageRecord = {
  _id: Id<"gallery_images">;
  gallery_id: Id<"galleries">;
  image: Id<"_storage">;
  created_at: number;
};

type PortfolioRecord = {
  _id: Id<"portfolios">;
  designer_id: Id<"designers">;
  title?: string;
  description?: string;
  skills?: string[];
  specialization?: string;
  social_links?: { platform: string; url: string }[];
};

const BrowseGallery: React.FC = () => {
  const [search, setSearch] = useState("");

  // Queries
  const designers = useQuery(api.designers.listAllDesignersWithUsers) as DesignerRecord[] | undefined;
  const galleries = useQuery(api.gallery.listAllGalleries) as GalleryRecord[] | undefined;
  const imagesByGallery = useQuery(api.gallery.getAllImages) as Record<string, GalleryImageRecord[]> | undefined;
  const portfolios = useQuery(api.portfolio.listAllPortfolios) as PortfolioRecord[] | undefined;

  // Flatten all storage IDs
  const allStorageIds = useMemo(() => {
    if (!imagesByGallery) return [];
    return Object.values(imagesByGallery).flatMap((imgs) => imgs.map((i) => i.image));
  }, [imagesByGallery]);

  const previewUrls = useQuery(
    api.gallery.getPreviewUrls,
    allStorageIds.length > 0 ? { storageIds: allStorageIds } : "skip"
  ) as Record<string, string> | undefined;

  // Filter designers by search
  const filteredDesigners = useMemo(() => {
    if (!designers || !galleries) return [];
    return designers.filter((designer) => {
      const designerGalleries = galleries.filter((g) => g.designer_id === designer._id);
      const designerPortfolios = portfolios?.filter((p) => p.designer_id === designer._id) ?? [];

      return (
        designerGalleries.some(
          (g) =>
            g.title.toLowerCase().includes(search.toLowerCase()) ||
            g.caption?.toLowerCase().includes(search.toLowerCase())
        ) ||
        designerPortfolios.some(
          (p) =>
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase())
        ) ||
        `${designer.first_name ?? ""} ${designer.last_name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });
  }, [designers, galleries, portfolios, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />

        <main className="p-10 md:p-8 overflow-auto w-full max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-6">Browse Designers</h1>

            {/* Search Bar */}
            <div className="flex items-center mb-8 max-w-md w-full border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
              <Search className="w-5 h-5 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder="Search by designer, gallery, or portfolio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 p-2 outline-none"
              />
            </div>

            {/* Designer Cards */}
            {filteredDesigners.length > 0 ? (
              <div className="space-y-6">
                {filteredDesigners.map((designer) => {
                  const designerGalleries = galleries?.filter((g) => g.designer_id === designer._id) ?? [];
                  const designerImages = designerGalleries.flatMap((g) => imagesByGallery?.[g._id] ?? []);
                  const designerPortfolios = portfolios?.filter((p) => p.designer_id === designer._id) ?? [];

                  return (
                    <motion.div
                      key={designer._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
                    >
                      {/* Designer Info */}
                      <div className="p-6 border-b border-gray-100">
                          <h2 className="text-xl font-semibold text-gray-800 mb-1">
                            {designer.first_name} {designer.last_name}
                          </h2>

                          <h3 className="text-sm font-medium text-teal-700 uppercase tracking-wide mb-3">
                            Portfolio Details
                          </h3>

                                  {/* Portfolio Details */}
                                  {designerPortfolios.length > 0 ? (
                                    <div className="space-y-4">
                                      {designerPortfolios.map((p) => (
                                        <div
                                          key={p._id}
                                          className="p-4 bg-teal-50/40 rounded-lg border border-teal-100 shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                          {/* Portfolio Title */}
                                          {p.title && (
                                            <h4 className="text-lg font-semibold text-gray-700 mb-2">{p.title}</h4>
                                          )}

                                          {/* Description */}
                                          {p.description && (
                                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                              {p.description}
                                            </p>
                                          )}

                                          {/* Specialization */}
                                          {p.specialization && (
                                            <p className="text-gray-500 text-sm mb-2">
                                              <span className="font-medium text-gray-700">Specialization:</span>{" "}
                                              {p.specialization}
                                            </p>
                                          )}

                                          {/* Skills */}
                                          {p.skills && p.skills.length > 0 && (
                                            
                                            <div className="flex flex-wrap gap-2 mb-3">
                                              {p.skills.map((skill, i) => (
                                                <span
                                                  key={i}
                                                  className="bg-teal-100 text-teal-700 text-xs font-medium px-2 py-1 rounded-full"
                                                >
                                                  {skill}
                                                </span>
                                              ))}
                                            </div>
                                          )}

                                          {/* Social Links */}
                                          {p.social_links && p.social_links.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-3">
                                              {p.social_links.map((link, i) => (
                                                <a
                                                  key={i}
                                                  href={link.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center text-sm text-teal-600 hover:text-teal-800 transition-colors"
                                                >
                                                  <span className="underline font-medium">{link.platform}</span>
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 text-sm italic">No portfolio details available.</p>
                                  )}
                                </div>


                      {/* Horizontal Gallery Images */}
                      {designerImages.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto p-2">
                          {designerImages.map((img) => (
                            <div
                              key={img._id}
                              className="flex-shrink-0 w-48 h-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
                            >
                              {previewUrls?.[img.image.toString()] ? (
                                <img
                                  src={previewUrls[img.image.toString()]}
                                  alt={img._id.toString()}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                          No images uploaded
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">No designers found</p>
            )}
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
};

export default BrowseGallery;
