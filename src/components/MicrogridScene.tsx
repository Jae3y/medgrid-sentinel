"use client";

/**
 * Live 3D model of the hospital microgrid. Every visual quantity is read from one
 * engine StepResult — nothing here is decorative animation:
 *   sun height/intensity ← measured irradiance · panel glow ← PV kW · battery gauge ← SOC
 *   tank level ← litres on site · generator glow & exhaust ← generator kW
 *   ward windows ← served/demand per tier · pylon line ← grid tie state
 *   moving pulses on each cable ← power flowing, speed ∝ kW
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { StepResult } from "@/engine";

const C = {
  ground: "#2a2019",
  plinth: "#1b2c2e",
  building: "#c9d3cf",
  buildingDark: "#7d8b88",
  roof: "#9aa8a4",
  panel: "#1d2f45",
  solar: "#F2C14E",
  battery: "#7CB8FF",
  diesel: "#E06A3C",
  grid: "#A3AEC2",
  pulse: "#45E0A0",
  red: "#FF4D5E",
  window: "#ffe2a8",
};

export interface SceneProps {
  step: StepResult;
  pvKwp: number;
  batteryKwh: number;
  tankLitres: number;
}

function tierFrac(step: StepResult, t: 1 | 2 | 3): number {
  const d = step.demandKw[t];
  return d > 0.01 ? Math.min(1, step.servedKw[t] / d) : 1;
}

/** Window grid on a building face; brightness = share of that tier's demand being served. */
function Windows({ x, y, z, cols, rows, w, h, lit, warn }: { x: number; y: number; z: number; cols: number; rows: number; w: number; h: number; lit: number; warn?: boolean }) {
  const count = cols * rows;
  const matrices = useMemo(() => {
    const m = new THREE.Matrix4();
    const out: THREE.Matrix4[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        m.makeTranslation(x - w / 2 + (c + 0.5) * (w / cols), y + (r + 0.5) * (h / rows), z);
        out.push(m.clone());
      }
    return out;
  }, [x, y, z, cols, rows, w, h]);
  const dark = lit < 0.5;
  return (
    <instancedMesh
      ref={(r) => {
        if (r) {
          matrices.forEach((m, i) => r.setMatrixAt(i, m));
          r.instanceMatrix.needsUpdate = true;
        }
      }}
      args={[undefined, undefined, count]}
    >
      <planeGeometry args={[(w / cols) * 0.55, (h / rows) * 0.45]} />
      <meshStandardMaterial
        color={dark ? "#151c1d" : C.window}
        emissive={warn && dark ? C.red : C.window}
        emissiveIntensity={dark ? (warn ? 0.9 : 0) : 0.4 + 1.6 * lit}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function Hospital({ step }: { step: StepResult }) {
  const t1 = tierFrac(step, 1);
  const t2 = tierFrac(step, 2);
  const t3 = tierFrac(step, 3);
  return (
    <group position={[0, 0, -5]}>
      {/* Tier 1 — theatres, ICU, emergency (central block) */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[9, 6.4, 6]} />
        <meshStandardMaterial color={C.building} roughness={0.85} />
      </mesh>
      <Windows x={0} y={0.6} z={3.01} cols={7} rows={4} w={8} h={5.4} lit={t1} warn />
      {/* rooftop cross */}
      <group position={[0, 6.55, 0]}>
        <mesh>
          <boxGeometry args={[2.2, 0.18, 0.6]} />
          <meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={t1 > 0.99 ? 1.4 : 0.15} toneMapped={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.6, 0.18, 2.2]} />
          <meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={t1 > 0.99 ? 1.4 : 0.15} toneMapped={false} />
        </mesh>
      </group>
      {/* Tier 2 — wards, lab, pharmacy (west wing) */}
      <mesh position={[-9.5, 2.1, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[10, 4.2, 5]} />
        <meshStandardMaterial color={C.buildingDark} roughness={0.9} />
      </mesh>
      <Windows x={-9.5} y={0.5} z={3.01} cols={9} rows={3} w={9} h={3.4} lit={t2} />
      {/* Tier 3 — admin, laundry, non-critical HVAC (east wing) */}
      <mesh position={[8.6, 1.6, 0.8]} castShadow receiveShadow>
        <boxGeometry args={[8, 3.2, 4.4]} />
        <meshStandardMaterial color={C.buildingDark} roughness={0.9} />
      </mesh>
      <Windows x={8.6} y={0.5} z={3.01} cols={7} rows={2} w={7} h={2.4} lit={t3} />
    </group>
  );
}

function PvArray({ pvKw, pvKwp }: { pvKw: number; pvKwp: number }) {
  const glow = Math.min(1, pvKw / Math.max(1, pvKwp * 0.75));
  const panels = useMemo(() => {
    const out: [number, number][] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) out.push([-17 + c * 1.9, 6 + r * 2.1]);
    return out;
  }, []);
  return (
    <group>
      {panels.map(([x, z], i) => (
        <group key={i} position={[x, 0.75, z]} rotation={[-0.35, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.75, 0.06, 1.5]} />
            <meshStandardMaterial color={C.panel} metalness={0.4} roughness={0.35} emissive={C.solar} emissiveIntensity={glow * 0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Battery({ soc, active }: { soc: number; active: boolean }) {
  return (
    <group position={[7, 0, 8]}>
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 2.5, 2.3]} />
        <meshStandardMaterial color="#26394a" roughness={0.6} />
      </mesh>
      {/* SOC gauge on the container face */}
      <mesh position={[0, 1.25, 1.16]}>
        <planeGeometry args={[4.4, 0.5]} />
        <meshStandardMaterial color="#0d1a24" />
      </mesh>
      <mesh position={[-2.2 + (4.4 * Math.max(0.02, soc)) / 2, 1.25, 1.17]}>
        <planeGeometry args={[4.4 * Math.max(0.02, soc), 0.42]} />
        <meshStandardMaterial color={C.battery} emissive={C.battery} emissiveIntensity={active ? 1.3 : 0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Smoke({ on }: { on: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      c.position.y += dt * 1.1;
      const s = 0.25 + (c.position.y - 3.2) * 0.22;
      c.scale.setScalar(Math.max(0.05, s));
      if (c.position.y > 7.2) c.position.y = 3.2 + (i % 3) * 0.15;
      (c as THREE.Mesh).visible = on;
    });
  });
  return (
    <group ref={group} position={[0.9, 0, -0.4]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 3.2 + i * 0.6, 0]}>
          <sphereGeometry args={[0.5, 10, 10]} />
          <meshStandardMaterial color="#4a4a48" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Generator({ kw, unavailable }: { kw: number; unavailable: boolean }) {
  const on = kw > 0.5;
  return (
    <group position={[13.5, 0, 0.5]}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 2.2, 2.2]} />
        <meshStandardMaterial color="#4b3b33" roughness={0.7} emissive={C.diesel} emissiveIntensity={on ? 0.35 : 0} />
      </mesh>
      <mesh position={[0.9, 2.7, -0.4]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 1.6, 12]} />
        <meshStandardMaterial color="#2c2622" />
      </mesh>
      <mesh position={[-1.2, 2.35, 1.12]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color={unavailable ? C.red : on ? C.diesel : "#3a3a3a"} emissive={unavailable ? C.red : on ? C.diesel : "#000"} emissiveIntensity={unavailable || on ? 2 : 0} toneMapped={false} />
      </mesh>
      {on && <pointLight position={[0, 2.5, 1.6]} color={C.diesel} intensity={6} distance={9} />}
      <Smoke on={on} />
    </group>
  );
}

function Tank({ litres, capacity }: { litres: number; capacity: number }) {
  const f = Number.isFinite(litres) ? Math.max(0, Math.min(1, litres / Math.max(1, capacity))) : 1;
  const empty = f < 0.01;
  return (
    <group position={[19.5, 0, 6.5]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 3.2, 28, 1, true]} />
        <meshStandardMaterial color="#8a9a97" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.05 + (3.1 * f) / 2, 0]}>
        <cylinderGeometry args={[1.25, 1.25, Math.max(0.02, 3.1 * f), 28]} />
        <meshStandardMaterial color={C.diesel} emissive={C.diesel} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <torusGeometry args={[1.35, 0.05, 8, 32]} />
        <meshStandardMaterial color={empty ? C.red : "#8a9a97"} emissive={empty ? C.red : "#000"} emissiveIntensity={empty ? 2 : 0} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Pylon({ connected }: { connected: boolean }) {
  const col = connected ? C.grid : C.red;
  return (
    <group position={[17, 0, -12]}>
      {[[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].map(([x, z], i) => (
        <mesh key={i} position={[x * 0.55, 5, z * 0.55]} rotation={[z * 0.08, 0, -x * 0.08]}>
          <boxGeometry args={[0.14, 10, 0.14]} />
          <meshStandardMaterial color="#6f7a86" />
        </mesh>
      ))}
      {[8.6, 7.2].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[5, 0.15, 0.15]} />
          <meshStandardMaterial color="#6f7a86" />
        </mesh>
      ))}
      <mesh position={[0, 10.3, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={connected ? 0.6 : 3} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A cable from a source to the hospital bus with pulses whose speed and size scale with kW. */
function Feeder({ points, kw, color, reverse }: { points: [number, number, number][]; kw: number; color: string; reverse?: boolean }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1), [points]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.07, 6, false), [curve]);
  const dots = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const active = kw > 0.5;
  useFrame((_, dt) => {
    if (!dots.current) return;
    phase.current = (phase.current + dt * (0.12 + Math.min(1.2, kw / 300))) % 1;
    dots.current.children.forEach((c, i) => {
      let u = (phase.current + i / dots.current!.children.length) % 1;
      if (reverse) u = 1 - u;
      c.position.copy(curve.getPointAt(u));
      c.visible = active;
    });
  });
  const r = 0.12 + Math.min(0.16, kw / 2500);
  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial color={active ? color : "#2b3a3b"} emissive={active ? color : "#000"} emissiveIntensity={active ? 0.35 : 0} />
      </mesh>
      <group ref={dots}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[r, 10, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Tag({ position, color, title, value }: { position: [number, number, number]; color: string; title: string; value: string }) {
  return (
    <Html position={position} center distanceFactor={26} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
      <div style={{ borderLeft: `3px solid ${color}`, background: "rgba(10,26,28,0.86)", padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", fontFamily: "var(--font-archivo), sans-serif" }}>
        <div style={{ fontSize: 11, color: "#93aba8" }}>{title}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e4eeec", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      </div>
    </Html>
  );
}

function SkyAndSun({ irradiance, hour }: { irradiance: number; hour: number }) {
  const day = Math.min(1, irradiance / 700);
  // Sun path east → west across the sky between ~06:00 and ~18:45 (Maiduguri, ~12° N).
  const a = ((hour - 6.2) / 12.5) * Math.PI;
  const sunPos: [number, number, number] = [Math.cos(a) * -40, Math.max(2, Math.sin(a) * 38), 18];
  const sky = new THREE.Color("#071214").lerp(new THREE.Color("#3b5552"), day);
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 55, 120]} />
      <hemisphereLight args={["#b9d6cf", "#2a2019", 0.4 + day * 0.7]} />
      <directionalLight position={sunPos} intensity={0.18 + day * 2.8} color={day > 0.05 ? "#ffe7bf" : "#8fa9c8"} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
    </>
  );
}

export default function MicrogridScene({ step, pvKwp, batteryKwh, tankLitres }: SceneProps) {
  const bus: [number, number, number] = [1.5, 0.15, -1];
  const battKw = step.battKw; // + charging, − discharging
  const hour = step.hour;
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [24, 21, 33], fov: 38 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <SkyAndSun irradiance={step.irradianceWm2} hour={hour} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color={C.ground} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]} receiveShadow>
        <planeGeometry args={[46, 30]} />
        <meshStandardMaterial color={C.plinth} roughness={1} />
      </mesh>
      <Hospital step={step} />
      {pvKwp > 0 && <PvArray pvKw={step.pvKw} pvKwp={pvKwp} />}
      {batteryKwh > 0 && <Battery soc={step.socFrac} active={Math.abs(battKw) > 0.5} />}
      <Generator kw={step.gensetKw} unavailable={step.gensetUnavailable && step.islanded} />
      {Number.isFinite(step.fuelLitres) && <Tank litres={step.fuelLitres} capacity={tankLitres} />}
      <Pylon connected={step.gridConnected} />

      {pvKwp > 0 && <Feeder points={[[-8, 0.15, 9], [-4, 0.15, 4], bus]} kw={step.pvKw} color={C.solar} />}
      {batteryKwh > 0 && <Feeder points={[[5, 0.15, 7.6], [3, 0.15, 3], bus]} kw={Math.abs(battKw)} color={C.battery} reverse={battKw > 0} />}
      <Feeder points={[[11.6, 0.15, 0.7], [7, 0.15, 0.3], bus]} kw={step.gensetKw} color={C.diesel} />
      <Feeder points={[[17, 0.15, -10.5], [10, 0.15, -7.5], [3, 0.15, -3], bus]} kw={step.gridKw} color={C.grid} />

      {pvKwp > 0 && <Tag position={[-12, 3.2, 10]} color={C.solar} title="Solar" value={`${Math.round(step.pvKw)} kW`} />}
      {batteryKwh > 0 && <Tag position={[7, 4, 8]} color={C.battery} title="Battery" value={`${Math.round(step.socFrac * 100)}% · ${battKw < -0.5 ? `−${Math.round(-battKw)}` : battKw > 0.5 ? `+${Math.round(battKw)}` : 0} kW`} />}
      <Tag position={[13.5, 5.2, 0.5]} color={C.diesel} title={step.gensetUnavailable && step.islanded ? "Generator · unavailable" : "Generator"} value={`${Math.round(step.gensetKw)} kW`} />
      {Number.isFinite(step.fuelLitres) && <Tag position={[19.5, 4.4, 6.5]} color={step.fuelLitres < 3 ? C.red : C.diesel} title="Diesel on site" value={`${Math.round(step.fuelLitres).toLocaleString("en-US")} L`} />}
      <Tag position={[17, 12, -12]} color={step.gridConnected ? C.grid : C.red} title="330 kV line" value={step.gridConnected ? `${Math.round(step.gridKw)} kW` : "down"} />

      <OrbitControls target={[1.5, 2, 0]} enablePan={false} minDistance={28} maxDistance={70} minPolarAngle={0.5} maxPolarAngle={1.25} />
    </Canvas>
  );
}
