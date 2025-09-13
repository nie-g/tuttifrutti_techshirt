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
}) => {
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const [showNewPaletteForm, setShowNewPaletteForm] = useState(false);
  const [paletteName, setPaletteName] = useState("");
  const [searchPalette, setSearchPalette] = useState("");
  const [filteredPalettes, setFilteredPalettes] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ Mapping UI → schema
  const typeMapping: Record<string, string> = {
    "Round Neck tshirt": "tshirt",
    "Polo Shirt": "polo",
    "Jersey": "jersey",
    "Long Sleeves": "long sleeves",
  };

  // ✅ Fetch all shirt sizes from Convex
  const shirtSizes = useQuery(api.shirt_sizes.getAll);

  // ✅ Debug logs
  useEffect(() => {
    console.log("Fetched shirt sizes:", shirtSizes);
    console.log("Current shirtType:", shirtType);
  }, [shirtSizes, shirtType]);

  // ✅ Sync selected size with DB results
  useEffect(() => {
    if (shirtSizes && sizeId) {
      const selectedSize = shirtSizes.find(
        (s: any) =>
          (s._id ? s._id.toString() : s.id?.toString()) === sizeId
      );
      if (selectedSize) {
        setSize(selectedSize);
      }
    }
  }, [shirtSizes, sizeId, setSize]);

  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingReference(true);
    const newImages = [...referenceImages];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push({
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          image: event.target?.result,
          description: "",
          file: file,
        });
        setReferenceImages(newImages);
        setIsUploadingReference(false);
      };
      reader.readAsDataURL(file);
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
      <h3 className="mb-4 text-2xl font-semibold text-gray-800">Colors & Details</h3>

      {/* Project Name */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Project Name</label>
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
          <label className="block mb-2 text-sm font-semibold text-gray-700">Shirt Size</label>
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
                  (s: any) =>
                    (s._id ? s._id.toString() : s.id?.toString()) === selectedId
                );
                if (selectedSize) {
                  setSize(selectedSize);
                }
              }}
              className="w-full p-3 text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a size</option>
              {shirtSizes
                .filter((s: any) => {
                  if (!shirtType) return true;
                  const normalizedType =
                    typeMapping[shirtType] || shirtType.toLowerCase();
                  const match = s.type?.toLowerCase() === normalizedType;
                  console.log("Filtering:", {
                    dbType: s.type,
                    currentShirtType: shirtType,
                    normalizedType,
                    match,
                  });
                  return match;
                })
                .map((shirtSize: any) => (
                  <option
                    key={shirtSize._id ? shirtSize._id.toString() : shirtSize.id}
                    value={shirtSize._id ? shirtSize._id.toString() : shirtSize.id}
                  >
                    {shirtSize.size_label || "Unnamed"} –{" "}
                    {shirtSize.type || "Unknown"} ({shirtSize.category || "No category"})
                  </option>
                ))}
            </select>
          )}
          {size && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Width: {size.w}cm, Height: {size.h}cm</p>
              {size.sleeves_w && size.sleeves_h && (
                <p>Sleeves: {size.sleeves_w}cm x {size.sleeves_h}cm</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">Gender</label>
          <select
            aria-label="Select gender"
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

      {/* Project Description */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">Project Description</label>
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
          <label className="text-sm font-semibold text-gray-700">Reference Images (Optional)</label>
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
              <div key={ref.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
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
                      onChange={(e) => updateReferenceDescription(ref.id, e.target.value)}
                      placeholder="Add a description for this reference image (optional)"
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
