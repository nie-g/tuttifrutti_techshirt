import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import ThreeScreenshotHelper from "./ThreeScreenshotHelper"; // make sure path is correct

interface Props {
  fabricCanvas?: HTMLCanvasElement;
  canvasModifiedKey: number;
  shirtType?: string;
  onScreenshotReady?: (fn: () => string) => void; // optional callback
}

const shirtModels: Record<string, string> = {
  tshirt: "/assets/tshirt.glb",
  long_sleeve: "/assets/long_sleeve.glb",
  hoodie: "/assets/hoodie.glb",
};

const shirtRotations: Record<string, [number, number, number]> = {
  tshirt: [0, 0, 0],
  long_sleeve: [0, 0, 0],
  hoodie: [0, 0, 0],
};

const shirtPositions: Record<string, [number, number, number]> = {
  tshirt: [0, -1.2, 0],
  long_sleeve: [0, -1.2, 0],
  hoodie: [0, -1.2, 0],
};

const FabricTexturedTShirt: React.FC<Props> = ({
  fabricCanvas,
  canvasModifiedKey,
  shirtType = "tshirt",
  onScreenshotReady,
}) => {
  const modelPath = shirtModels[shirtType] || shirtModels["tshirt"];
  const { scene: loadedScene } = useGLTF(modelPath);

  const scene = useMemo(() => loadedScene.clone(), [loadedScene]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // 🔄 Flip the canvas horizontally
    const flippedCanvas = document.createElement("canvas");
    flippedCanvas.width = fabricCanvas.width;
    flippedCanvas.height = fabricCanvas.height;
    const ctx = flippedCanvas.getContext("2d");

    if (ctx) {
      ctx.translate(fabricCanvas.width, 0); // move to right edge
      ctx.scale(-1, 1); // flip horizontally
      ctx.drawImage(fabricCanvas, 0, 0); // draw the original
    }

    // Use the flipped canvas as texture
    const tex = new THREE.CanvasTexture(flippedCanvas);

    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.flipY = false;

    // ⚡ Keep existing scaling/alignment untouched
    tex.center.set(0.5, 0.5);
    tex.repeat.set(0.5, 0.5);
    tex.offset.set(0.25, 0.0);

    tex.anisotropy = 8;
    tex.needsUpdate = true;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
  }, [scene, fabricCanvas, canvasModifiedKey]);

  const rotation = shirtRotations[shirtType] || [0, 0, 0];
  const position = shirtPositions[shirtType] || [0, -1.2, 0];

  return (
    <>
      <primitive object={scene} rotation={rotation} position={position} />
      {/* Screenshot helper included */}
      <ThreeScreenshotHelper onReady={onScreenshotReady ?? (() => {})} />
    </>
  );
};

export default FabricTexturedTShirt;
