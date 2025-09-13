
import React from "react";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls } from "@react-three/drei";

// ✅ Dynamic 3D model loader: loads a model based on shirtType
function TShirtModel({ shirtType }: { shirtType: string }) {
  let modelPath = "/assets/tshirt.glb"; // default to Round Neck
  if (shirtType === "Polo Shirt (Short Sleeve)") {
    modelPath = "/assets/polo.glb";
  } else if (shirtType === "V-Neck T-Shirt") {
    modelPath = "/assets/tshirt.glb"; // Optional: change if you have a separate model
  }
  const { scene } = useGLTF(modelPath);
  return <primitive object={scene} scale={1.2} />;
}

interface Step1Props {
  shirtType: string | null;
  setShirtType: (type: string) => void;
}

const Step1: React.FC<Step1Props> = ({ shirtType, setShirtType }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="flex items-center justify-center bg-gray-100 rounded-lg shadow-md h-80">
        {shirtType ? (
          <ThreeCanvas camera={{ position: [0, 1, 2.5], fov: 45 }} className="w-full h-full">
            <color attach="background" args={["#F8F9FA"]} />
            <PresentationControls>
              <Stage>
                <TShirtModel shirtType={shirtType} />
              </Stage>
            </PresentationControls>
          </ThreeCanvas>
        ) : (
          <p className="text-gray-500">Select a shirt type to see the preview</p>
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-700">Select Shirt Type</h3>
        <div className="mt-4 space-y-3 text-gray-700">
          {["Round Neck tshirt", "V-Neck tshirt", "Polo Shirt (Short Sleeve)", "Jersey"].map((type) => (
            <button
              key={type}
              onClick={() => setShirtType(type)}
              className={`w-full p-3 border rounded-lg transition duration-200 ${
                shirtType === type
                  ? "border-teal-500 bg-teal-100 text-teal-700 font-medium"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step1;
