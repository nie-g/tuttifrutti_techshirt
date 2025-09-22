import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

interface Props {
  fabricCanvas?: HTMLCanvasElement;
  canvasModifiedKey: number;
  shirtType?: string;
}

const shirtModels: Record<string, string> = {
  tshirt: "/assets/tshirt.glb",
  long_sleeve: "/assets/longsleeve.glb",
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

const FabricTexturedShirt: React.FC<Props> = ({
  fabricCanvas,
  canvasModifiedKey,
  shirtType = "tshirt",
}) => {
  const modelPath = shirtModels[shirtType] || shirtModels["tshirt"];
  const { scene: loadedScene } = useGLTF(modelPath);

  // Clone model so textures don’t conflict when re-rendering
  const scene = useMemo(() => loadedScene.clone(), [loadedScene]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // 🔄 Flip the canvas horizontally before texturing
    const flippedCanvas = document.createElement("canvas");
    flippedCanvas.width = fabricCanvas.width;
    flippedCanvas.height = fabricCanvas.height;
    const ctx = flippedCanvas.getContext("2d");

    if (ctx) {
      ctx.translate(fabricCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(fabricCanvas, 0, 0);
    }

    // Convert to texture
    const tex = new THREE.CanvasTexture(flippedCanvas);

    // ⚡ Alignment settings (from your basis file)
 tex.wrapS = THREE.RepeatWrapping;
tex.wrapT = THREE.RepeatWrapping;

    tex.flipY = false;

     tex.center.set(0.5, 0.5);
    tex.repeat.set(0.5, 0.5);
    tex.offset.set(0.25, 0.0);


    tex.anisotropy = 8;
    tex.needsUpdate = true;

    // Apply texture to meshes
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          map: tex,
          side: THREE.DoubleSide,
          transparent: false,
          alphaTest: 0.5,
        });
        mesh.material.needsUpdate = true;
      }
    });
  }, [scene, fabricCanvas, canvasModifiedKey]);

  const rotation = shirtRotations[shirtType] || [0, 0, 0];
  const position = shirtPositions[shirtType] || [0, -1.2, 0];

  return <primitive object={scene} rotation={rotation} position={position} scale={2} />;
};

export default FabricTexturedShirt;
