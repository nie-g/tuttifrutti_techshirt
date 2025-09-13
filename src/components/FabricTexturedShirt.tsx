// src/components/FabricTexturedTShirt.tsx
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

interface Props {
  // still supports a live canvas from FabricCanvas for editing
  fabricCanvas?: HTMLCanvasElement;
  canvasModifiedKey: number;
  shirtType?: string;
  // 🔹 all canvases from DB for each category
  partCanvases?: Record<string, HTMLCanvasElement | undefined>;
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
}) => {
  const modelPath = shirtModels[shirtType] || shirtModels["tshirt"];
  const { scene: loadedScene } = useGLTF(modelPath);

  const scene = useMemo(() => loadedScene.clone(), [loadedScene]);

  useEffect(() => {
    // traverse and apply textures
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        // If GLB material has a name (e.g. "Front", "Back"), try to map
        const matName = mat.name || mesh.name;

        // pick canvas for this part
        let canvasForPart: HTMLCanvasElement | undefined;

        if (fabricCanvas && partCanvases && Object.keys(partCanvases).length > 0) {
          // live edited category overrides partCanvases
          canvasForPart = partCanvases[matName] || fabricCanvas;
        } else {
          canvasForPart = partCanvases[matName] || fabricCanvas;
        }

        if (canvasForPart) {
         const tex = new THREE.CanvasTexture(canvasForPart);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;

          // scale so the fabric image covers the whole shirt without splitting
          tex.repeat.set(0.5, 1);     // shrink horizontally to fit one side of UV
          tex.offset.set(0.25, 0);    // shift so it aligns in the middle

          tex.center.set(0.5, 0.5);
          tex.rotation = 0;
          tex.needsUpdate = true;

          mat.map = tex;
          mat.needsUpdate = true;

        }
      }
    });
  }, [scene, fabricCanvas, partCanvases, canvasModifiedKey]);

  const rotation = shirtRotations[shirtType] || [0, 0, 0];
  const position = shirtPositions[shirtType] || [0, 0, 0];

  return <primitive object={scene} rotation={rotation} position={position} />;
};

export default FabricTexturedTShirt;
