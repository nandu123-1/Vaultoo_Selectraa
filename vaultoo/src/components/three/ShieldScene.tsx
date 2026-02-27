"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";

function ShieldMesh() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Shield body - icosahedron */}
      <icosahedronGeometry args={[1.5, 1]} />
      <meshStandardMaterial
        color="#7c3aed"
        emissive="#4c1d95"
        emissiveIntensity={0.3}
        wireframe
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function InnerShield() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= delta * 0.3;
      meshRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial
        color="#a78bfa"
        emissive="#7c3aed"
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

function Particles() {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 2 + Math.random() * 0.5;
    return {
      position: [
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2,
        Math.sin(angle) * radius,
      ] as [number, number, number],
    };
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color="#a78bfa"
            emissive="#7c3aed"
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function ShieldScene() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#7c3aed" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#a78bfa" />
        <ShieldMesh />
        <InnerShield />
        <Particles />
      </Canvas>
    </div>
  );
}
