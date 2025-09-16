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
}) => {
  const modelPath = shirtModels[shirtType] || shirtModels["tshirt"];
  const { scene: loadedScene } = useGLTF(modelPath);

  const scene = useMemo(() => loadedScene.clone(), [loadedScene]);

  useEffect(() => {
    if (!fabricCanvas) return;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        const tex = new THREE.CanvasTexture(fabricCanvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.center.set(0.5, 0.5);
        tex.rotation = 0;
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);

        tex.needsUpdate = true;
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
  }, [scene, fabricCanvas, canvasModifiedKey]);

  const rotation = shirtRotations[shirtType] || [0, 0, 0];
  const position = shirtPositions[shirtType] || [0, -1.2, 0];

  return <primitive object={scene} rotation={rotation} position={position} />;
};

export default FabricTexturedTShirt;
