import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import { getRiskColor } from '../../utils/riskHelpers';
import * as THREE from 'three';
import { useSelector } from 'react-redux';
// ─── Loading Component ───────────────────────────────────────────────────────
const Loader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-2">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-sm text-gray-500">Loading 3D Model...</p>
    </div>
  </Html>
);

// ─── Main 3D Mine Model ──────────────────────────────────────────────────────
const MineModel = ({ modelPath }) => {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef();
  return <primitive ref={modelRef} object={scene} scale={2} position={[0, 0, 0]} />;
};

// ─── Risk Marker ─────────────────────────────────────────────────────────────
const RiskMarker = ({ position, zone }) => {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const color = getRiskColor(zone.riskLevel);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setClicked(!clicked)}
      >
        <sphereGeometry args={[clicked ? 1 : hovered ? 0.8 : 0.6, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={clicked ? 1.5 : hovered ? 1.2 : 0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {(hovered || clicked) && (
        <Html distanceFactor={10} position={[0, 1.5, 0]}>
          <div
            className={`rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-xs text-white shadow-xl transition-all ${clicked ? 'w-48' : 'whitespace-nowrap'}`}
          >
            <p className="text-sm font-semibold">{zone.zoneName}</p>
            <p className="mt-1 capitalize text-gray-300">Risk: {zone.riskLevel}</p>
            <p className="text-gray-400">Confidence: {(zone.confidenceScore * 100).toFixed(1)}%</p>
            {clicked && (
              <>
                <hr className="my-2 border-gray-700" />
                <p className="text-xs text-gray-400">Type: {zone.zoneType}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setClicked(false);
                  }}
                  className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-xs transition hover:bg-blue-700"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </Html>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.7, clicked ? 1.5 : 1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ─── Ground Plane ─────────────────────────────────────────────────────────────
const GroundPlane = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
    <planeGeometry args={[100, 100]} />
    <meshStandardMaterial color="#04091a" roughness={2} metalness={0} />
  </mesh>
);

// ─── Custom Hook: Fetch zones + latest risks, merge them ─────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const useZonesWithRisk = (pollingInterval = 30000) => {
  const [zonesWithRisk, setZonesWithRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep a ref to the latest zones so the socket handler can access it
  const zonesRef = useRef([]);

  useEffect(() => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('accessToken');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // ── REST fetch (initial load + periodic sync) ──────────────────────────
    const fetchData = async () => {
      try {
        const [zonesRes, risksRes] = await Promise.all([
          fetch(`${API_BASE}/api/zones`, { headers }),
          fetch(`${API_BASE}/api/risks/latest`, { headers }),
        ]);

        if (!zonesRes.ok) throw new Error(`Zones fetch failed: ${zonesRes.status}`);
        if (!risksRes.ok) throw new Error(`Risks fetch failed: ${risksRes.status}`);

        const zonesRaw = await zonesRes.json();
        const risksRaw = await risksRes.json();

        const zones = zonesRaw?.zones ?? zonesRaw;
        const risks = risksRaw?.risks ?? [];

        const riskByZoneId = risks.reduce((acc, risk) => {
          const id = risk.zoneId?._id ?? risk.zoneId;
          if (!acc[id]) acc[id] = risk;
          return acc;
        }, {});

        const merged = zones.map((zone) => ({
          ...zone,
          riskLevel: riskByZoneId[zone._id]?.riskLevel ?? 'low',
          confidenceScore: riskByZoneId[zone._id]?.confidenceScore ?? 0,
        }));

        zonesRef.current = merged;
        setZonesWithRisk(merged);
        setError(null);
      } catch (err) {
        console.error('Error fetching zone/risk data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const pollId = setInterval(fetchData, pollingInterval);

    // ── WebSocket (instant ML updates) ────────────────────────────────────
    // Matches what broadcastRiskUpdate() sends:
    // { _id, zoneName, riskLevel, confidenceScore }
    const WS_URL = API_BASE.replace(/^http/, 'ws');
    const socket = new WebSocket(`${WS_URL}?token=${token}`);

    socket.onopen = () => console.log('🔌 WebSocket connected to risk updates');

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type !== 'RISK_UPDATE') return;
        const update = message.data ?? message;
        console.log('⚡ Live risk update received:', update);

        // Patch just the affected zone — no refetch needed
        setZonesWithRisk((prev) =>
          prev.map((zone) =>
            zone._id === update._id
              ? {
                  ...zone,
                  riskLevel: update.riskLevel,
                  confidenceScore: update.confidenceScore,
                }
              : zone,
          ),
        );
      } catch (err) {
        console.warn('WebSocket message parse error:', err);
      }
    };

    socket.onerror = (err) => console.warn('⚠️ WebSocket error:', err);
    socket.onclose = () => console.log('🔌 WebSocket disconnected');

    return () => {
      clearInterval(pollId);
      socket.close();
    };
  }, [pollingInterval]);

  return { zonesWithRisk, loading, error };
};
// ─── Main Canvas Component ───────────────────────────────────────────────────
const Model3DViewer = ({ modelPath = '/models/pitmin.glb', token }) => {
  const { zonesWithRisk, loading, error } = useZonesWithRisk(token);
  const zonePositions = {
    'Zone D': [5, 1, 4],
    'Zone B': [-2, 1, 4],
    'Zone C': [6, 1, -5],
    'Zone A': [0, 1, -5],
  };

  // x -- 4 to -3
  // z -- 5 to -3

  // Resolve a position for a zone by matching its name
  const resolvePosition = (zoneName = '') => {
    const key = Object.keys(zonePositions).find((k) =>
      zoneName.toLowerCase().includes(k.toLowerCase()),
    );
    return key ? zonePositions[key] : null;
  };

  return (
    <div className="relative h-full w-full">
      {/* Status badges – outside the Canvas so they're normal DOM elements */}
      {loading && (
        <div className="absolute left-4 top-4 z-10 rounded-lg border border-gray-700 bg-gray-900 bg-opacity-90 px-3 py-2 text-xs text-blue-400">
          ⏳ Loading zone data…
        </div>
      )}
      {error && (
        <div className="absolute left-4 top-4 z-10 rounded-lg border border-red-700 bg-red-900 bg-opacity-90 px-3 py-2 text-xs text-red-300">
          ⚠️ {error}
        </div>
      )}
      {!loading && !error && (
        <div className="absolute left-4 top-4 z-10 rounded-lg border border-gray-700 bg-gray-900 bg-opacity-90 px-3 py-2 text-xs text-green-400">
          ✅ {zonesWithRisk.length} zone{zonesWithRisk.length !== 1 ? 's' : ''} loaded
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [20, 15, 20], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        {/* <directionalLight
          position={[10, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        /> */}
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        <color attach="background" args={['#04091a']} />
        <Environment preset="sunset" />
        {/* <GroundPlane /> */}

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={25}
          maxPolarAngle={Math.PI / 3}
        />

        <Suspense fallback={<Loader />}>
          <MineModel modelPath={modelPath} />
        </Suspense>

        {/* Render a marker for every zone that has a known 3-D position */}
        {zonesWithRisk.map((zone) => {
          const position = resolvePosition(zone.zoneName);
          if (!position) return null;
          return <RiskMarker key={zone._id} position={position} zone={zone} />;
        })}
      </Canvas>

      {/* Controls legend */}
      <div className="absolute bottom-4 right-4 space-y-1 rounded-lg border border-gray-700 bg-gray-900 bg-opacity-90 px-4 py-3 text-xs text-white shadow-xl">
        <p className="mb-1 font-semibold text-gray-300">🎮 Controls</p>
        <p>
          <span className="text-blue-400">Left Click + Drag:</span> Rotate
        </p>
        <p>
          <span className="text-blue-400">Right Click + Drag:</span> Pan
        </p>
        <p>
          <span className="text-blue-400">Scroll:</span> Zoom
        </p>
      </div>
    </div>
  );
};

useGLTF.preload('/models/pitmin.glb');
export default Model3DViewer;
