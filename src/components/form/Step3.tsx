import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import ColorPalette from "../ColorPalettes";

interface Step3Props {
  projectName: string;
  setProjectName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  gender: string;
  setGender: (gender: string) => void;
  size: any;
  setSize: (size: any) => void;
  sizeId: string | null;
  setSizeId: (id: string | null) => void;
  shirtType: string | null;
  referenceImages: any[];
  setReferenceImages: (images: any[]) => void;
  newPaletteColors: string[];
  setNewPaletteColors: (colors: string[]) => void;
  textileId: string | null;
  setTextileId: (id: string | null) => void;
  preferredDesignerId: string | null;
  setPreferredDesignerId: (id: string | null) => void;
}

const Step3: React.FC<Step3Props> = ({
  projectName,
  setProjectName,
  description,
  setDescription,
  gender,
  setGender,
  size,
  setSize,
  sizeId,
  setSizeId,
  shirtType,
  referenceImages,
  setReferenceImages,
  newPaletteColors,
  setNewPaletteColors,
  textileId,
  setTextileId,
  preferredDesignerId,
  setPreferredDesignerId,
}) => {
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const [showNewPaletteForm, setShowNewPaletteForm] = useState(false);
  const [paletteName, setPaletteName] = useState("");
  const [searchPalette, setSearchPalette] = useState("");
  const [filteredPalettes, setFilteredPalettes] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ Mapping UI → schema
  const typeMapping: Record<string, string> = {
    "Round Neck": "tshirt",
    "Polo Shirt": "polo",
    "V-Neck": "tshirt",
    "Jersey": "jersey",
    "Long Sleeves": "long sleeves",
  };

  // ✅ Fetch sizes, textiles, designers
  const shirtSizes = useQuery(api.shirt_sizes.getAll);
  const textiles = useQuery(api.inventory.getTextileItems);
  const designers = useQuery(api.userQueries.listDesigners);

  // ✅ Sync selected size
  useEffect(() => {
    if (shirtSizes && sizeId) {
      const selectedSize = shirtSizes.find(
        (s: any) => s._id.toString() === sizeId
      );
      if (selectedSize) setSize(selectedSize);
    }
  }, [shirtSizes, sizeId, setSize]);

  async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // 🔹 Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
  // ✅ Reference Images
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  setIsUploadingReference(true);
  const newImages = [...referenceImages];

  files.forEach(async (file) => {
    try {
      // 🔹 compress before storing
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.7);

      newImages.push({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        image: compressedDataUrl, // ✅ compressed base64, < 1 MiB
        description: "",
        file,
      });

      setReferenceImages([...newImages]);
    } catch (err) {
      console.error("Compression failed", err);
    } finally {
      setIsUploadingReference(false);
    }
  });
};
  const removeReferenceImage = (id: string) => {
    setReferenceImages(referenceImages.filter((img) => img.id !== id));
  };

  const updateReferenceDescription = (id: string, description: string) => {
    setReferenceImages(
      referenceImages.map((img) =>
        img.id === id ? { ...img, description } : img
      )
    );
  };

  // ✅ Palettes
  const handlePaletteSelect = (palette: any) => {
    setNewPaletteColors(palette.colors.slice(0, 5));
    setPaletteName(palette.title + " (Copy)");
  };

  const removeColorFromPalette = (color: string) => {
    setNewPaletteColors(newPaletteColors.filter((c) => c !== color));
  };

  const handleSetNewPaletteColors = (colors: string[]) => {
    setNewPaletteColors(colors);
  };

  return (
    <div className="h-[323px] overflow-y-auto px-4 py-6 bg-white rounded-lg shadow-md space-y-6">
      <h3 className="mb-4 text-2xl font-semibold text-gray-800">
        Colors & Details
      </h3>

      {/* Project Name */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Project Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter your project name"
          className="w-full p-3 text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          required
        />
      </div>

      {/* Color Palettes */}
      <ColorPalette
        searchPalette={searchPalette}
        setSearchPalette={setSearchPalette}
        filteredPalettes={filteredPalettes}
        isSearching={isSearching}
        handlePaletteSelect={handlePaletteSelect}
        showNewPaletteForm={showNewPaletteForm}
        setShowNewPaletteForm={setShowNewPaletteForm}
        paletteName={paletteName}
        setPaletteName={setPaletteName}
        newPaletteColors={newPaletteColors}
        setNewPaletteColors={handleSetNewPaletteColors as any}
        removeColorFromPalette={removeColorFromPalette}
      />

      {/* Shirt Size + Gender */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Shirt Size
          </label>
          {shirtSizes === undefined ? (
            <div className="flex items-center justify-center w-full p-3 bg-gray-100 border border-gray-300 rounded-md">
              <div className="w-5 h-5 mr-2 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-500">Loading sizes...</span>
            </div>
          ) : shirtSizes.length === 0 ? (
            <div className="text-gray-500">No sizes found in database</div>
          ) : (
            <select
              aria-label="Select a shirt size"
              value={sizeId || ""}
              onChange={(e) => {
                const selectedId = e.target.value || null;
                setSizeId(selectedId);
                const selectedSize = shirtSizes.find(
                  (s: any) => s._id.toString() === selectedId
                );
                if (selectedSize) setSize(selectedSize);
              }}
              className="w-full p-3 text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a size</option>
              {shirtSizes
                .filter((s: any) => {
                  if (!shirtType) return true;
                  const normalizedType =
                    typeMapping[shirtType] || shirtType.toLowerCase();
                  return s.type?.toLowerCase() === normalizedType;
                })
                .map((shirtSize: any) => (
                  <option key={shirtSize._id.toString()} value={shirtSize._id.toString()}>
                    {shirtSize.size_label || "Unnamed"} –{" "}
                    {shirtSize.type || "Unknown"} ({shirtSize.category || "No category"})
                  </option>
                ))}
            </select>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Gender
          </label>
          <select
            aria-label="Select a gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full p-3 text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="unisex">Unisex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Fabric/Textile Selection - Always visible */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Fabric / Textile
        </label>
        <select
          aria-label="Select a fabric"
          value={textileId || ""}
          onChange={(e) => setTextileId(e.target.value || null)}
          className="w-full p-3 text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">Select a fabric</option>
          {textiles?.map((fabric: any) => (
            <option key={fabric._id.toString()} value={fabric._id.toString()}>
              {fabric.name} ({fabric.category || "Uncategorized"})
            </option>
          ))}
        </select>
        {textiles === undefined && (
          <p className="text-sm text-gray-500 mt-1">Loading fabrics...</p>
        )}
        {textiles?.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No fabrics found</p>
        )}
      </div>

      {/* Preferred Designer */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Preferred Designer (Optional)
        </label>
        <select
          aria-label="Select a preferred designer"
          value={preferredDesignerId || ""}
          onChange={(e) => setPreferredDesignerId(e.target.value || null)}
          className="w-full p-3 text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">No preferred designer</option>
          {designers?.map((designer: any) => (
            <option key={designer._id.toString()} value={designer._id.toString()}>
              {designer.firstName && designer.lastName
                ? `${designer.firstName} ${designer.lastName}`
                : designer.firstName || designer.lastName || "Unnamed"}
            </option>
          ))}
        </select>
        {designers === undefined && (
          <p className="text-sm text-gray-500 mt-1">Loading designers...</p>
        )}
        {designers?.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No designers available</p>
        )}
      </div>

      {/* Project Description */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Project Description
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder="Add a description of your design..."
        />
      </div>

      {/* Reference Images */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            Reference Images (Optional)
          </label>
          <label
            htmlFor="reference-image-upload"
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 rounded-md cursor-pointer hover:bg-teal-100 transition-colors"
          >
            <Upload size={14} />
            Upload Images
          </label>
          <input
            id="reference-image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleReferenceImageUpload}
            className="hidden"
          />
        </div>

        {isUploadingReference && (
          <div className="flex items-center justify-center w-full p-4 mb-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="w-5 h-5 mr-2 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">Uploading images...</span>
          </div>
        )}

        {referenceImages.length > 0 ? (
          <div className="space-y-4">
            {referenceImages.map((ref) => (
              <div
                key={ref.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-md"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 overflow-hidden bg-white border border-gray-300 rounded-md shrink-0">
                    <img
                      src={ref.image}
                      alt="Reference"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        {ref.file?.name || "Reference Image"}
                      </p>
                      <button
                        aria-label="Remove reference image"
                        onClick={() => removeReferenceImage(ref.id)}
                        className="p-1 text-red-500 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={ref.description}
                      onChange={(e) =>
                        updateReferenceDescription(ref.id, e.target.value)
                      }
                      placeholder="Add a description (optional)"
                      className="w-full p-2 mt-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full p-6 bg-gray-50 border border-gray-200 border-dashed rounded-md">
            <ImageIcon className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No reference images uploaded</p>
            <p className="text-xs text-gray-400">
              Upload images to help the designer understand your vision
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3;
