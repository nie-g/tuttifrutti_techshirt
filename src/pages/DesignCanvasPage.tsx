import React, { useCallback, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import FabricCanvas from "../components/FabricCanvas";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import FabricTexturedTShirt from "../components/FabricTexturedShirt";
import ThreeScreenshotHelper from "../components/ThreeScreenshotHelper";

import type { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";


interface DesignRequest {
  _id: Id<"design_requests">;
  designId: Id<"design">;
  tshirt_type?: string;
  [key: string]: any;
}

type FabricCanvasRecord = {
  _id: Id<"fabric_canvases">;
  canvas_json?: string;
  design_id: Id<"design">;
  created_at: number;
  updated_at: number;
  version?: string;
  thumbnail?: string;
};

const DesignerCanvasPage: React.FC = () => {
 
  const location = useLocation();
  const request: DesignRequest | undefined = location.state?.request;

  const [fabricCanvas, setFabricCanvas] = useState<HTMLCanvasElement | undefined>(undefined);
  const [canvasModifiedKey, setCanvasModifiedKey] = useState(0);

  const handleCanvasModified = useCallback(() => {
    setCanvasModifiedKey((prev) => prev + 1);
  }, []);
   // Determine shirt type: prefer request.tshirt_type, fallback to 'tshirt'
  

  const screenshotRef = useRef<() => string>(() => "");

  // Fetch the single canvas for this design
  const canvasDoc = useQuery(
    api.fabric_canvases.getByDesign,
    request?.designId ? { designId: request.designId } : "skip"
  ) as FabricCanvasRecord | undefined;

  const shirtType = (request?.tshirt_type?.toLowerCase?.() || "tshirt");


  // Left panel content
  let canvasContent;
  if (!request) {
    canvasContent = <p className="text-gray-600">No design request provided</p>;
  } else if (!request.designId) {
    canvasContent = <p className="text-gray-500">No design available yet.</p>;
  } else if (!canvasDoc) {
    canvasContent = <p className="text-gray-400 text-center">Loading canvas...</p>;
  } else {
    canvasContent = (
      <FabricCanvas
        designId={request.designId}
        initialCanvasJson={canvasDoc?.canvas_json ?? undefined}
        onReady={setFabricCanvas}
        onModified={handleCanvasModified}
        getThreeScreenshot={() => screenshotRef.current()}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
      className="relative p-4 flex flex-col md:flex-row gap-4 max-h-[80vh]"
    >
     

      {/* Left side: Fabric Canvas */}
      <motion.div
       className="basis-4/7 border border-gray-400 rounded-lg h-[43.6vw] p-2 shadow-sm bg-white flex items-center justify-center"
  initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {canvasContent}
      </motion.div>

      {/* Right side: 3D shirt preview */}
      <motion.div
         className="basis-3/7 border border-gray-400 h-[43.5vw] rounded-lg p-2 shadow-sm bg-white"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <ThreeCanvas
          camera={{ position: [0, 1, 2.5], fov: 45 }}
          className="r3f-canvas w-full h-full rounded-lg"
        >
          <color attach="background" args={["#F8F9FA"]} />
          <PresentationControls>
            <Stage>
              <FabricTexturedTShirt
                fabricCanvas={fabricCanvas}
                canvasModifiedKey={canvasModifiedKey}
                shirtType={shirtType}
              />
            </Stage>
          </PresentationControls>

          {/* Screenshot helper inside Canvas */}
          <ThreeScreenshotHelper onReady={(fn) => (screenshotRef.current = fn)} />
        </ThreeCanvas>
      </motion.div>
    </motion.div>
  );
};

export default DesignerCanvasPage;
