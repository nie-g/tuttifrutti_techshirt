import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

interface Props {
  onReady: (fn: () => string) => void;
}

/**
 * Provides a screenshot function from the active R3F renderer.
 * Usage:
 *   <ThreeScreenshotHelper onReady={(fn) => (window.__takeThreeScreenshot = fn)} />
 */
const ThreeScreenshotHelper: React.FC<Props> = ({ onReady }) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const takeScreenshot = () => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png"); // ✅ screenshot as base64
      } catch (e) {
        console.error("Failed to take screenshot", e);
        return "";
      }
    };

    if (onReady) onReady(takeScreenshot);
  }, [gl, scene, camera, onReady]);

  return null;
};

export default ThreeScreenshotHelper;
