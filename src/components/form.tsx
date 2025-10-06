import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import * as fabric from "fabric";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import type { Id } from "../../convex/_generated/dataModel";
import Step1 from "./form/Step1";
import Step2 from "./form/Step2";
import Step3 from "./form/Step3";

interface ShirtDesignFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ShirtDesignForm: React.FC<ShirtDesignFormProps> = ({ onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [shirtType, setShirtType] = useState<string | null>(null);
  const [canvasState, setCanvasState] = useState<any>(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState("unisex");

  // ✅ sizes array (instead of single sizeId)
  const [sizes, setSizes] = useState<{ sizeId: string; quantity: number }[]>([]);
  const [referenceImages, setReferenceImages] = useState<any[]>([]);
  const [newPaletteColors, setNewPaletteColors] = useState<string[]>([]);
  const [printType, setPrintType] = useState<"Sublimation" | "Dtf" | undefined>(undefined);

  const [textileId, setTextileId] = useState<string | null>(null);
  const [preferredDesignerId, setPreferredDesignerId] = useState<string | null>(null);
  const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null);
  const [preferredDate, setPreferredDate] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const saveDesignSketchAction = useAction(api.designSketch.saveDesignSketch);


  const canvasRef = useRef<fabric.Canvas | null>(null);

  const { user: clerkUser } = useUser();
  const user = useQuery(api.userQueries.getUserByClerkId, {
    clerkId: clerkUser ? clerkUser.id : ("skip" as any),
  });

  const createNewRequestMutation = useMutation(api.design_requests.createRequest);
  const saveSelectedColorsMutation = useMutation(api.colors.saveSelectedColors);
  const saveDesignReferencesAction = useAction(api.designReferences.saveDesignReferences);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  const yardPerSize: Record<string, number> = {
  XS: 0.8,
  S: 1.0,
  M: 1.2,
  L: 1.4,
  XL: 1.6,
  XXL: 1.8,
};

  

  const saveDesign = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }
    if (!sizes || sizes.length === 0) {
      alert("Please add at least one shirt size with quantity");
      return;
    }
    if (!printType) {
      alert("Please select a print type");
      return;
    }

    setIsSubmitting(true);

    if (!user) {
      alert("Please sign in to save your design");
      setIsSubmitting(false);
      return;
    }

    try {
      const canvasDataURL =
        canvasSnapshot || canvasRef.current?.toDataURL() || "";

        const requestPayload: any = {
        clientId: user._id,
        sizes: sizes as any, // array of { sizeId, quantity }
        textileId: textileId as any,
        requestTitle: projectName,
        tshirtType: shirtType || "",
        gender: gender || "",
        description: description || "",
        printType: printType || undefined, // ✅ changed from null to undefined
        preferredDate: preferredDate || undefined,
      };

      // ✅ Only add preferredDesignerId if it exists
      if (preferredDesignerId) {
        requestPayload.preferredDesignerId = preferredDesignerId;
      }
      if (preferredDate) {
      requestPayload.preferredDate = preferredDate;
    }

      const requestId = await createNewRequestMutation(requestPayload);

      if (!requestId) {
        throw new Error("Failed to create design request");
      }
     if (canvasDataURL) {
        await saveCanvasSketchToDatabase(requestId as Id<"design_requests">, canvasDataURL);
      }


     if (referenceImages.length > 0) {
        for (const ref of referenceImages) {
          // Convert base64/URL to ArrayBuffer
          const res = await fetch(ref.image);
          const buffer = await res.arrayBuffer();

          await saveDesignReferencesAction({
            requestId,
            fileBytes: buffer,
            description: ref.description || "",
          });
        }
      }


      if (newPaletteColors.length > 0) {
        await Promise.all(
          newPaletteColors.map(async (color) => {
            let hexColor = typeof color === "string" ? color : String(color);
            if (hexColor && !hexColor.startsWith("#")) {
              hexColor = "#" + hexColor;
            }
            if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
              hexColor = "#000000";
            }
            return saveSelectedColorsMutation({
              requestId,
              hex: hexColor,
              createdAt: Date.now(),
            });
          })
        );
      }

      onSubmit({
        request_title: projectName,
        tshirt_type: shirtType || "",
        gender: gender || "",
        description: description || "",
        design_image: canvasDataURL,
        requestId,
        preferredDate,
      });
    } catch (error) {
      console.error("Error saving design:", error);
      alert("Failed to save design: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const saveCanvasSketchToDatabase = async (
  requestId: Id<"design_requests">,
  canvasDataURL: string
) => {
  if (!canvasDataURL) {
    console.warn("⚠️ No canvas snapshot to save.");
    return;
  }

  try {
    const response = await fetch(canvasDataURL);
    const arrayBuffer = await response.arrayBuffer();

    await saveDesignSketchAction({
      requestId, // ✅ Now typed correctly
      fileBytes: arrayBuffer,
    });

    console.log("✅ Canvas sketch saved successfully to request_sketches table.");
  } catch (error) {
    console.error("❌ Failed to save canvas sketch:", error);
  }
};

  const shirtSizes = useQuery(api.shirt_sizes.getAll) || [];  
    const calculateTotalYards = (): number => {
      if (!sizes || sizes.length === 0 || !textileId) return 0;

      let total = 0;

      for (const s of sizes) {
        const sizeInfo = shirtSizes.find((size: any) => size._id === s.sizeId);
        const sizeLabel = sizeInfo?.size_label ?? "M"; // fallback
        const yardage = yardPerSize[sizeLabel] ?? 1.2; // fallback
        total += s.quantity * yardage;
      }

      return total;
    };

    const textileInventory = useQuery(api.inventory.getTextileItems) || [];
    const [showStockModal, setShowStockModal] = useState(false);
    const checkFabricStock = (): boolean => {
    if (!sizes || sizes.length === 0 || !textileId) return true;

    const totalYardsNeeded = calculateTotalYards();
    const textile = textileInventory.find((t: any) => t._id === textileId);
    const availableYards = textile?.stock ?? 0; // <- use stock

    if (totalYardsNeeded > availableYards) {
      setShowStockModal(true); // trigger modal
      return false; // stop saveDesign for now
    }

    return true; // enough stock
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">
            Customize Your Shirt
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 transition hover:text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-center my-4 space-x-8">
          {["Shirt Type", "Design", "Colors & Details"].map((label, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shadow-lg ${
                  step === index + 1
                    ? "bg-teal-500 scale-110"
                    : "bg-gray-300"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm mt-1 ${
                  step === index + 1
                    ? "text-teal-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {step === 1 && (
            <Step1 shirtType={shirtType} setShirtType={setShirtType} />
          )}
          {step === 2 && (
            <Step2
              canvasRef={canvasRef}
              canvasState={canvasState}
              setCanvasState={setCanvasState}
              shirtType={shirtType}
              onSaveSnapshot={setCanvasSnapshot}
            />
          )}
          {step === 3 && (
            <Step3
              projectName={projectName}
              setProjectName={setProjectName}
              description={description}
              setDescription={setDescription}
              gender={gender}
              setGender={setGender}
              sizes={sizes}
              setSizes={setSizes}
              shirtType={shirtType}
              referenceImages={referenceImages}
              setReferenceImages={setReferenceImages}
              newPaletteColors={newPaletteColors}
              setNewPaletteColors={setNewPaletteColors}
              textileId={textileId}
              setTextileId={setTextileId}
              preferredDesignerId={preferredDesignerId}
              setPreferredDesignerId={setPreferredDesignerId}
              printType={printType}
              setPrintType={setPrintType}
              preferredDate={preferredDate}
              setPreferredDate={setPreferredDate}
              dateError={dateError}
              setDateError={setDateError}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            className={`px-8 py-1 text-gray-700 transition border rounded-md hover:bg-gray-100 ${
              step === 1 ? "invisible" : ""
            }`}
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-8 py-1 text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600"
            >
              Next
            </button>
          ) : (
            <button
             onClick={() => {
                if (checkFabricStock()) {
                  saveDesign(); // call original function if stock is enough
                }
              }}

              disabled={!projectName.trim() || sizes.length === 0 || !printType || isSubmitting}
              className="px-8 py-1 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Design"
              )}
            </button>
          )}
        </div>
        {showStockModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-6 bg-white rounded-lg shadow-2xl"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Warning: Insufficient stock</h3>
                <p className="mb-4">
                  The selected fabric does not have enough stock to fulfill your order.
                  
                </p>
                <p className="mb-4"> Required: {calculateTotalYards()} yards.</p>
                <p className="mb-6 text-red-600">
                  If you proceed, the order might be delayed for a minimum of least 7 days.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowStockModal(false);
                      saveDesign(); // call original saveDesign
                    }}
                    className="px-4 py-2 text-white bg-teal-600 rounded-md hover:bg-green-700"
                  >
                    Proceed Anyway
                  </button>
                </div>
              </motion.div>
            </div>
          )}

      </motion.div>
    </div>
  );
};

export default ShirtDesignForm;
