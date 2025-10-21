import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import ThreeScreenshotHelper from "../../components/ThreeScreenshotHelper";

interface Props {
  fabricCanvas?: HTMLCanvasElement;
  canvasModifiedKey: number;
  shirtType?: string;
  onScreenshotReady?: (fn: () => string) => void;
}

const shirtModels: Record<string, string> = {
  tshirt: "/assets/tshirt.glb",
  long_sleeve: "/assets/long_sleeve.glb",
  polo: "/assets/polo.glb",
  hoodie: "/assets/hoodie.glb",
  jersey: "/assets/jersey_uv.glb",
};

const shirtRotations: Record<string, [number, number, number]> = {
  tshirt: [0, 0, 0],
  long_sleeve: [0, 0, 0],
  polo: [0, 0, 0],
  jersey: [0, 0, 0],
};

const shirtPositions: Record<string, [number, number, number]> = {
  tshirt: [0, -1.2, 0],
  long_sleeve: [0, -1.2, 0],
  polo: [0, -1.2, 0],
  jersey: [0, -1.2, 0],
};

const shirtTextureAlignments: Record<
  string,
  { repeat: [number, number]; offset: [number, number] }
> = {
  tshirt: { repeat: [0.5, 0.5], offset: [0.25, 0.0] },
  long_sleeve: { repeat: [0.45, 0.6], offset: [0.28, 0.05] },
  polo: { repeat: [0.48, 0.52], offset: [0.26, 0.02] },
  jersey: { repeat: [0.5, 0.5], offset: [-0.3, 0.5] },
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

  // Persistent texture reference
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  // 🧩 Function to (re)draw the texture from the Fabric canvas
  const drawToTexture = () => {
    if (!fabricCanvas) return;

    // Mirror the fabric canvas horizontally
    const flippedCanvas = document.createElement("canvas");
    flippedCanvas.width = fabricCanvas.width;
    flippedCanvas.height = fabricCanvas.height;
    const ctx = flippedCanvas.getContext("2d");
    if (ctx) {
      ctx.translate(fabricCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(fabricCanvas, 0, 0);
    }

    if (!textureRef.current) {
      // Create once
      const tex = new THREE.CanvasTexture(flippedCanvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = false;
      tex.anisotropy = 8;
      tex.needsUpdate = true;

      const align =
        shirtTextureAlignments[shirtType] || shirtTextureAlignments["tshirt"];
      tex.center.set(0.5, 0.5);
      tex.repeat.set(...align.repeat);
      tex.offset.set(...align.offset);

      textureRef.current = tex;

      // Apply to all meshes
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.map = tex;
          mat.needsUpdate = true;
        }
      });
    } else {
      // Update the existing texture image
      textureRef.current.image = flippedCanvas;
      textureRef.current.needsUpdate = true;
    }
  };

  // Re-draw texture whenever the Fabric canvas or key changes
  useEffect(() => {
    drawToTexture();
  }, [fabricCanvas, canvasModifiedKey, shirtType]);

  // Optional: refresh texture every frame (live updates while drawing)
  useEffect(() => {
    if (!fabricCanvas) return;
    const interval = setInterval(() => {
      if (textureRef.current && fabricCanvas) {
        drawToTexture();
      }
    }, 200); // update ~5x per second
    return () => clearInterval(interval);
  }, [fabricCanvas]);

  const rotation = shirtRotations[shirtType] || [0, 0, 0];
  const position = shirtPositions[shirtType] || [0, -1.2, 0];

  return (
    <>
      <primitive object={scene} rotation={rotation} position={position} />
      <ThreeScreenshotHelper onReady={onScreenshotReady ?? (() => {})} />
    </>
  );
};

export default FabricTexturedTShirt;
