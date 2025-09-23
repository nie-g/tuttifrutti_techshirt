import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import * as fabric from 'fabric';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

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
  const [size, setSize] = useState<any>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<any[]>([]);
  const [newPaletteColors, setNewPaletteColors] = useState<string[]>([]);

  const canvasRef = useRef<fabric.Canvas | null>(null);
  const { user: clerkUser } = useUser();
  const user = useQuery(api.userQueries.getUserByClerkId, { clerkId: clerkUser ? clerkUser.id : ("skip" as any) });


  const createNewRequestMutation = useMutation(api.design_requests.createRequest);
  const saveMultipleReferencesMutation = useMutation(api.designReferences.saveMultipleReferences);
  const saveSelectedColorsMutation = useMutation(api.colors.saveSelectedColors);
  const [textileId, setTextileId] = useState<string | null>(null);
  const [preferredDesignerId, setPreferredDesignerId] = useState<string | null>(null);
  const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

const saveDesign = async () => {
  if (!projectName.trim()) {
    alert('Please enter a project name');
    return;
  }
  if (!sizeId) {
    alert('Please select a shirt size');
    return;
  }

  setIsSubmitting(true);

  if (!user) {
    alert('Please sign in to save your design');
    setIsSubmitting(false);
    return;
  }

  try {
    const canvasDataURL =
      canvasSnapshot || canvasRef.current?.toDataURL() || ""; // 👈 use saved snapshot if available

    const requestId = await createNewRequestMutation({
      clientId: user._id,
      sizeId: sizeId as any,
      textileId: textileId as any,
      requestTitle: projectName,
      tshirtType: shirtType || "",
      gender: gender || "",
      sketch: canvasDataURL, // 👈 goes to request.sketch
      description: description || "",
    });

    if (!requestId) {
      throw new Error("Failed to create design request");
    }

    if (referenceImages.length > 0) {
      await saveMultipleReferencesMutation({
        requestId: requestId,
        references: referenceImages.map((ref) => ({
          designImage: ref.image,
          description: ref.description || "",
        })),
      });
    }

    if (newPaletteColors.length > 0) {
      await Promise.all(
        newPaletteColors.map(async (color) => {
          let hexColor = color;
          if (typeof hexColor !== "string") {
            hexColor = String(hexColor);
          }
          if (hexColor && !hexColor.startsWith("#")) {
            hexColor = "#" + hexColor;
          }
          if (!hexColor || !/^#[0-9A-F]{6}$/i.test(hexColor)) {
            hexColor = "#000000";
          }

          return saveSelectedColorsMutation({
            requestId: requestId,
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
      requestId: requestId,
    });
  } catch (error) {
    console.error("Error saving design:", error);
    alert("Failed to save design: " + (error as Error).message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">Customize Your Shirt</h2>
          <button onClick={onClose} className="text-gray-500 transition hover:text-red-500">
            ✕
          </button>
        </div>

        <div className="flex justify-center my-4 space-x-8">
          {["Shirt Type", "Design", "Colors & Details"].map((label, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shadow-lg ${
                  step === index + 1 ? "bg-teal-500 scale-110" : "bg-gray-300"
                }`}
              >
                {index + 1}
              </div>
              <span className={`text-sm mt-1 ${step === index + 1 ? "text-teal-600 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content with scroll */}
<div className="max-h-[50vh] overflow-y-auto pr-2">
  {step === 1 && <Step1 shirtType={shirtType} setShirtType={setShirtType} />}
  {step === 2 && (
    <Step2
    canvasRef={canvasRef}
    canvasState={canvasState}
    setCanvasState={setCanvasState}
    shirtType={shirtType}
    onSaveSnapshot={setCanvasSnapshot} // 👈 NEW
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
      size={size}
      setSize={setSize}
      sizeId={sizeId}
      setSizeId={setSizeId}
      shirtType={shirtType}
      referenceImages={referenceImages}
      setReferenceImages={setReferenceImages}
      newPaletteColors={newPaletteColors}
      setNewPaletteColors={setNewPaletteColors}
      textileId={textileId}
      setTextileId={setTextileId}
      preferredDesignerId={preferredDesignerId}
      setPreferredDesignerId={setPreferredDesignerId}
    />
  )}
</div>


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
              onClick={saveDesign}
              disabled={!projectName.trim() || !sizeId || isSubmitting}
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
      </motion.div>
    </div>
  );
};

export default ShirtDesignForm;