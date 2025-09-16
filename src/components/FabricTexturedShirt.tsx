// src/components/FabricTexturedTShirt.tsx
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

interface Props {
  fabricCanvas?: HTMLCanvasElement;
  canvasModifiedKey: number;
  shirtType?: string;
  partCanvases?: Record<string, HTMLCanvasElement | undefined>;
  currentCategory?: "front" | "back" | "left_sleeve" | "right_sleeve" | "collar" | "other";
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
  partCanvases = {},
  currentCategory,
}) => {
  const modelPath = shirtModels[shirtType] || shirtModels["tshirt"];
  const { scene: loadedScene } = useGLTF(modelPath);

  const scene = useMemo(() => loadedScene.clone(), [loadedScene]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        const matName = mat.name || mesh.name;
        let canvasForPart: HTMLCanvasElement | undefined =
          partCanvases[matName] || fabricCanvas;

        if (!canvasForPart) return;

        const tex = new THREE.CanvasTexture(canvasForPart);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.center.set(0.5, 0.5);
        tex.rotation = 0;

        // ✅ Default (front) mapping stays as-is
        tex.repeat.set(0.5, 1);
        tex.offset.set(0.25, 0);

        // Adjust based on part
        if (matName.toLowerCase().includes("back") || currentCategory === "back") {
          tex.repeat.set(0.5, 1);
          tex.offset.set(0.75, 0);  // right half
        }
        else if (matName.toLowerCase().includes("left_sleeve") || currentCategory === "left_sleeve") {
          // Left sleeve → left half of the canvas, upright
          tex.repeat.set(0.5, 1);
          tex.offset.set(0, 0);
        }

        else if (matName.toLowerCase().includes("right_sleeve") || currentCategory === "right_sleeve") {
          // Right sleeve → right half of the canvas, upright
          tex.repeat.set(0.5, 1);
          tex.offset.set(0.5, 0);
        }

        else if (matName.toLowerCase().includes("collar") || currentCategory === "collar") {
          tex.repeat.set(0.25, 1);
          tex.offset.set(0.375, 0);
        }

        tex.needsUpdate = true;
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
  }, [scene, fabricCanvas, partCanvases, canvasModifiedKey, currentCategory]);

  const rotation = shirtRotations[shirtType] || [0, 0, 0];
  const position = shirtPositions[shirtType] || [0, -1.2, 0];

  return <primitive object={scene} rotation={rotation} position={position} />;
};

export default FabricTexturedTShirt;
