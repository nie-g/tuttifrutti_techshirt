import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, Trash2, ImageIcon, TriangleAlert, CircleCheck } from "lucide-react";
import ColorPalette from "../ColorPalettes";

interface Step3Props {
  projectName: string;
  setProjectName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  gender: string;
  setGender: (gender: string) => void;
  sizes: { sizeId: string; quantity: number }[];
  setSizes: (sizes: { sizeId: string; quantity: number }[]) => void;
  shirtType: string | null;
  referenceImages: any[];
  setReferenceImages: (images: any[]) => void;
  newPaletteColors: string[];
  setNewPaletteColors: (colors: string[]) => void;
  textileId: string | null;
  setTextileId: (id: string | null) => void;
  preferredDesignerId: string | null;
  setPreferredDesignerId: (id: string | null) => void;
  printType: "Sublimation" | "Dtf" | undefined;
  setPrintType: (type: "Sublimation" | "Dtf" | undefined) => void;
  preferredDate: string | null;
  setPreferredDate: (date: string | null) => void;
  dateError: string | null;
  setDateError: (error: string | null) => void;

}

const Step3: React.FC<Step3Props> = ({
  projectName,
  setProjectName,
  description,
  setDescription,
  gender,
  setGender,
  sizes,
  setSizes,
  referenceImages,
  setReferenceImages,
  newPaletteColors,
  setNewPaletteColors,
  shirtType,   // 👈 add this
  textileId,
  setTextileId,
  preferredDesignerId,
  setPreferredDesignerId,
  printType,
  setPrintType,
  preferredDate,
  setPreferredDate,
  dateError,
  setDateError,
}) => {
  const [isUploadingReference, setIsUploadingReference] = useState(false);
 

  // ✅ Fetch sizes, textiles, designers (with fallbacks)
  const shirtSizes = useQuery(api.shirt_sizes.getAll) || [];
  const textiles = useQuery(api.inventory.getTextileItems) || [];
  const designers = useQuery(api.userQueries.listDesigners) || [];
  const typeMapping: Record<string, string> = {
    "Round Neck": "tshirt",
    "V-neck": "tshirt",      // V-neck is still a tshirt in schema
    "Polo": "polo",
    "Jersey": "jersey",
    "Long Sleeves": "long sleeves",
  };

  const filteredShirtSizes = useMemo(() => {
    if (!shirtType) return shirtSizes;
    const normalizedType = typeMapping[shirtType] || shirtType.toLowerCase();
    return shirtSizes.filter((s: any) => s.type === normalizedType);
  }, [shirtSizes, shirtType]);

  

  // ✅ Size handling
  const addSizeRow = () => {
    setSizes([...sizes, { sizeId: "", quantity: 1 }]);
  };

  const updateSizeRow = (
    index: number,
    field: "sizeId" | "quantity",
    value: any
  ) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };
    setSizes(updated);
  };

  const removeSizeRow = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  // ✅ Reference images
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

  const handleReferenceImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingReference(true);
    const newImages = [...referenceImages];

    files.forEach(async (file) => {
      try {
        const compressedDataUrl = await compressImageFile(file, 800, 800, 0.7);

        newImages.push({
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          image: compressedDataUrl,
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
  const handleSetNewPaletteColors = (colors: string[]) => {
    setNewPaletteColors(colors);
  };

  // ✅ Print Type Recommendation Logic
  function getRecommendedPrintType(
    fabricName?: string | null
  ): "Sublimation" | "Dtf" | null {
    if (!fabricName) return null;
    const name = fabricName.toLowerCase();

    if (
      name.includes("dryfit") ||
      name.includes("dry-fit") ||
      name.includes("dry fit") ||
      name.includes("polyester")
    ) {
      return "Sublimation";
    }
    if (name.includes("polydex") || name.includes("polydex®") || name.includes("cotton")) {
      return "Dtf";
    }
    return null;
  }

  const selectedFabric = useMemo(() => {
    if (!textileId) return null;
    return (
      textiles.find((t: any) => {
        try {
          return String(t._id) === String(textileId);
        } catch {
          return false;
        }
      }) || null
    );
  }, [textileId, textiles]);

  const recommendedPrintType = useMemo(
    () =>
      getRecommendedPrintType(
        selectedFabric?.name ??
    
          selectedFabric?.description
      ),
    [selectedFabric]
  );

  // --- Inside Step3 component ---

    // Minimum selectable date: 1 week from today
  const minDate = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);

    // Use local date instead of ISO string
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

    // Handle date change
    const handlePreferredDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.value;
      const selectedDate = new Date(selected);
      const todayPlusWeek = new Date();
      todayPlusWeek.setDate(todayPlusWeek.getDate() + 7);

      if (selectedDate < todayPlusWeek) {
        setDateError("We do not accept orders that are needed within less than a week. Please select a date at least 7 days from today.");
        setPreferredDate(null);
      } else {
        setDateError(null);
        setPreferredDate(selected);
      }
    };

  // ✅ Auto-set print type if recommended
  useEffect(() => {
    if (!printType && recommendedPrintType) {
      setPrintType(recommendedPrintType);
    }
  }, [recommendedPrintType, printType, setPrintType]);

  return (
    <div className="h-[323px] px-4 py-6 bg-white rounded-lg shadow-md space-y-6">
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
        newPaletteColors={newPaletteColors}
        setNewPaletteColors={handleSetNewPaletteColors as any}
      />

      {/* Shirt Sizes & Gender */}
      <div className="space-y-4 mt-6">
        <label className="block text-sm font-semibold text-gray-700">
          Shirt Sizes & Quantities
        </label>

        {sizes.length === 0 && (
          <p className="text-sm text-gray-400">
            No sizes added yet. Click{" "}
            <span className="font-medium">+ Add Size</span> to start.
          </p>
        )}

        {sizes.map((row, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-3 items-center">
            {/* Size dropdown */}
            <select
              aria-label="Select a shirt size"
              value={row.sizeId}
              onChange={(e) => updateSizeRow(idx, "sizeId", e.target.value)}
              className="w-full p-2 text-gray-700 bg-white border border-gray-300 rounded-md"
            >
              <option value="">Select a size</option>
              {filteredShirtSizes.map((s: any) => (
                <option key={s._id.toString()} value={s._id.toString()}>
                  {s.size_label || "Unnamed"}
                </option>
              ))}
            </select>

            {/* Quantity input */}
            <input
              aria-label="Enter quantity"
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) =>
                updateSizeRow(idx, "quantity", parseInt(e.target.value) || 1)
              }
              className="w-full p-2 text-gray-700 bg-white border border-gray-300 rounded-md"
            />

            {/* Remove button */}
            <button
              aria-label="Remove size"
              type="button"
              onClick={() => removeSizeRow(idx)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}


        {/* Add size button */}
        <button
          type="button"
          onClick={addSizeRow}
          className="px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 rounded-md hover:bg-teal-100 transition-colors"
        >
          + Add Size
        </button>
      </div>

      {/* Gender */}
      <div className="grid grid-cols-2 gap-4">
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
      {/* Preferred Date */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Preferred Date (Optional)
          </label>
          <input
            aria-label="Select a preferred date"
            type="date"
            value={preferredDate || ""}
            min={minDate}
            onChange={handlePreferredDateChange}
            className={`w-full p-3 text-gray-700 bg-white border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
              dateError ? "border-red-500" : "border-gray-300"
            }`}
          />
          {!dateError && (
            <div className="mt-1 text-xs bg-green-100 p-1 px-3 rounded-full">
              <p className=" text-xs text-green-700">
                We only accept orders that are needed at least 1 week from today.
              </p>
            </div>
          )}
          {dateError && (
            <p className="mt-1 text-xs text-red-500">{dateError}</p>
          )}
        </div>
      </div>
      


      {/* Fabric/Textile + Print Type */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fabric/Textile */}
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
            {textiles.map((fabric: any) => (
              <option key={fabric._id.toString()} value={fabric._id.toString()}>
                {fabric.name} - {fabric.description}
              </option>
            ))}
          </select>
        </div>

        {/* Print Type */}
        {/* Print Type */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Print Type
          </label>
          <select
            aria-label="Select a print type"
            value={printType || ""}
            onChange={(e) =>
              setPrintType(
                e.target.value
                  ? (e.target.value as "Sublimation" | "Dtf")
                  : undefined
              )
            }
            className="w-full p-3 text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">Select a print type</option>
            <option value="Sublimation">Sublimation</option>
            <option value="Dtf">DTF</option>
          </select>

          {/* Recommendation label */}
          {printType && (
            <p
              className={`mt-1 text-xs ${
                printType === recommendedPrintType
                  ? "text-green-600 font-medium"
                  : "text-red-500 font-medium"
              }`}
            >
              {printType && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    printType === recommendedPrintType ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {printType === recommendedPrintType ? (
                    <>
                      <CircleCheck size={14} />
                      Recommended for this fabric
                    </>
                  ) : (
                    <>
                      <TriangleAlert size={14} />
                      Not recommended for this fabric
                    </>
                  )}
                </p>
              )}
            </p>
          )}

          {/* Hint before user selects */}
          {!printType && recommendedPrintType && (
            <p className="mt-1 text-xs text-gray-500">
              Recommended: <span className="font-medium">{recommendedPrintType}</span>
            </p>
          )}
        </div>

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
          {designers.map((designer: any) => (
            <option key={designer._id.toString()} value={designer._id.toString()}>
              {designer.firstName && designer.lastName
                ? `${designer.firstName} ${designer.lastName}`
                : designer.firstName || designer.lastName || "Unnamed"}{" "}
              – {designer.specialization || "General"}
            </option>
          ))}
        </select>
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
