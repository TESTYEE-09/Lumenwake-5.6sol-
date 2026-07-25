import { Float, Sparkles, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PlayerController } from './PlayerController.jsx';

const INTERACTIONS = [
  { phase: 1, id: 'observatory', action: 'approach_observatory', label: 'Enter the drowned observatory', position: [0, 0, -9.5] },
  { phase: 2, id: 'ember', action: 'take_ember', label: 'Take the ember shard', position: [-5.8, 0, -16.2] },
  { phase: 3, id: 'warden', action: 'talk_warden', label: 'Speak with Warden Ilyra', position: [5.2, 0, -17.2] },
  { phase: 4, id: 'archiveGate', action: 'enter_archive', label: 'Descend into the forbidden archive', position: [0, 0, -25.7] },
  { phase: 5, id: 'pool', action: 'touch_memory_pool', label: 'Touch the memory pool', position: [0, 0, -33.3] },
  { phase: 6, id: 'lens', action: 'reach_solar_lens', label: 'Approach the Solar Lens', position: [0, 0, -40.4] },
];

export function World({ game, onFocus, onPosition }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 68, near: 0.1, far: 180, position: [0, 1.72, 5.5] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <WorldScene game={game} onFocus={onFocus} onPosition={onPosition} />
    </Canvas>
  );
}

function WorldScene({ game, onFocus, onPosition }) {
  const { camera, scene } = useThree();
  const focusRef = useRef(null);
  const targetColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    scene.background = new THREE.Color('#090b18');
    scene.fog = new THREE.FogExp2('#0d1025', 0.026);
  }, [scene]);

  useFrame((_state, delta) => {
    targetColor.set(moodColor(game.skyMood));
    scene.background.lerp(targetColor, Math.min(1, delta * 0.65));
    scene.fog.color.lerp(targetColor, Math.min(1, delta * 0.5));

    if (game.loading || game.choices.length || game.ending) {
      setFocus(null);
      return;
    }

    const interaction = INTERACTIONS.find((item) => item.phase === game.phase);
    if (!interaction) {
      setFocus(null);
      return;
    }

    const dx = camera.position.x - interaction.position[0];
    const dz = camera.position.z - interaction.position[2];
    const distance = Math.hypot(dx, dz);
    setFocus(distance < 3.25 ? interaction : null);
  });

  function setFocus(next) {
    if (focusRef.current?.id === next?.id) return;
    focusRef.current = next;
    onFocus(next);
  }

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#98b7ff', '#130f25', 0.65]} />
      <directionalLight
        castShadow
        intensity={1.45}
        color={game.skyMood === 'dawn' ? '#ffd4a3' : '#9ea8ff'}
        position={[9, 17, 6]}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={70}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-50}
      />
      <pointLight color="#73e9ff" intensity={7} distance={18} position={[0, 3, -33]} />
      <pointLight color="#ffb15f" intensity={game.flags.emberTaken ? 3 : 7} distance={15} position={[-6, 2.4, -16]} />

      <Stars radius={90} depth={40} count={1300} factor={2.4} saturation={0.25} fade speed={0.25} />
      <Sparkles count={90} scale={[28, 9, 55]} position={[0, 3, -18]} size={1.2} speed={0.16} opacity={0.55} color="#9de9ff" />
      {game.skyMood === 'moths' && (
        <Sparkles count={160} scale={[18, 8, 26]} position={[0, 2, -22]} size={2.6} speed={0.55} opacity={0.85} color="#fff4c7" />
      )}

      <Sea mood={game.skyMood} />
      <Causeway />
      <Observatory game={game} />
      <Archive game={game} />
      <SolarLens game={game} />
      <DistantRuins />
      <InteractionBeacons game={game} />
      <PlayerController game={game} onPosition={onPosition} />
    </>
  );
}

function Sea({ mood }) {
  const material = useRef();
  useFrame((state) => {
    if (!material.current) return;
    material.current.emissiveIntensity = 0.18 + Math.sin(state.clock.elapsedTime * 0.45) * 0.04;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -1.15, -18]} receiveShadow>
      <planeGeometry args={[150, 150, 60, 60]} />
      <meshStandardMaterial
        ref={material}
        color={mood === 'dawn' ? '#31547a' : '#080c1b'}
        emissive={mood === 'ruin' ? '#7a214d' : '#17204a'}
        roughness={0.28}
        metalness={0.55}
        transparent
        opacity={0.94}
      />
    </mesh>
  );
}

function Causeway() {
  const stones = useMemo(
    () => Array.from({ length: 25 }, (_, index) => ({
      z: 5 - index * 1.9,
      x: Math.sin(index * 1.7) * 0.17,
      rotation: Math.sin(index) * 0.035,
      scale: 0.92 + (index % 3) * 0.04,
    })),
    [],
  );

  return (
    <group>
      {stones.map((stone, index) => (
        <mesh
          key={index}
          castShadow
          receiveShadow
          position={[stone.x, -0.42, stone.z]}
          rotation={[0, stone.rotation, 0]}
          scale={[3.7 * stone.scale, 0.55, 1.55]}
        >
          <boxGeometry />
          <meshStandardMaterial color={index % 2 ? '#30354d' : '#3a3e56'} roughness={0.92} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.35, 0, -18]}>
          {Array.from({ length: 8 }, (_, index) => (
            <LanternPost key={index} position={[0, 0, 12 - index * 7]} scale={index % 2 ? 0.85 : 1} />
          ))}
        </group>
      ))}
    </group>
  );
}

function LanternPost({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.08, 0.13, 2.3, 6]} />
        <meshStandardMaterial color="#1b1d2c" metalness={0.75} roughness={0.32} />
      </mesh>
      <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.2}>
        <mesh position={[0, 2.05, 0]}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color="#b9f4ff" emissive="#5eeaff" emissiveIntensity={3.5} />
        </mesh>
      </Float>
    </group>
  );
}

function Observatory({ game }) {
  return (
    <group position={[0, 0, -15]}>
      <mesh receiveShadow position={[0, -0.55, 0]} scale={[16, 0.9, 12]}>
        <cylinderGeometry args={[1, 1.15, 1, 8]} />
        <meshStandardMaterial color="#252a40" roughness={0.88} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 9.7, 0, 0]}>
          {[-4.8, 0, 4.8].map((z) => (
            <mesh key={z} castShadow position={[0, 2, z]}>
              <cylinderGeometry args={[0.55, 0.8, 5, 6]} />
              <meshStandardMaterial color="#343950" roughness={0.82} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh castShadow position={[0, 4.5, -1]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[5.4, 0.34, 7, 32, Math.PI]} />
        <meshStandardMaterial color="#4e5675" metalness={0.25} roughness={0.7} />
      </mesh>
      <mesh position={[-5.8, 1.25, -1.2]} visible={!game.flags.emberTaken}>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial color="#ffd08a" emissive="#ff7b2f" emissiveIntensity={4} roughness={0.2} />
      </mesh>
      <Warden position={[5.2, 0, -2.2]} hostile={game.relationships.warden < 0} />
      <ArchiveGate open={game.flags.archiveGateOpen} />
    </group>
  );
}

function Warden({ position, hostile }) {
  const head = useRef();
  useFrame((state) => {
    if (head.current) head.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.15;
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.35, 0]}>
        <coneGeometry args={[0.72, 2.3, 6]} />
        <meshStandardMaterial color={hostile ? '#5b233c' : '#263650'} roughness={0.68} metalness={0.35} />
      </mesh>
      <mesh ref={head} castShadow position={[0, 2.75, 0]}>
        <dodecahedronGeometry args={[0.52, 0]} />
        <meshStandardMaterial color="#d9c4a7" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0.85, 1.45, 0]} rotation={[0, 0, -0.08]}>
        <cylinderGeometry args={[0.055, 0.055, 3.8, 6]} />
        <meshStandardMaterial color="#a9b8cf" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.85, 3.4, 0]}>
        <coneGeometry args={[0.24, 0.55, 4]} />
        <meshStandardMaterial color="#b9f4ff" emissive="#5eeaff" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}

function ArchiveGate({ open }) {
  const gate = useRef();
  useFrame((_state, delta) => {
    if (!gate.current) return;
    gate.current.position.y = THREE.MathUtils.damp(gate.current.position.y, open ? -3.8 : 1.45, 4, delta);
  });
  return (
    <group position={[0, 0, -9.9]}>
      <mesh castShadow position={[-2.3, 1.8, 0]} scale={[0.8, 5.2, 1.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#252a40" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[2.3, 1.8, 0]} scale={[0.8, 5.2, 1.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#252a40" roughness={0.9} />
      </mesh>
      <mesh ref={gate} castShadow position={[0, 1.45, 0]} scale={[3.8, 4.5, 0.35]}>
        <boxGeometry />
        <meshStandardMaterial color="#141827" metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Archive({ game }) {
  return (
    <group position={[0, 0, -32.5]}>
      <mesh receiveShadow position={[0, -0.6, 0]} scale={[13, 0.9, 11]}>
        <cylinderGeometry args={[1, 1.18, 1, 10]} />
        <meshStandardMaterial color="#20283a" roughness={0.88} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 7.2, 0, 0]}>
          {Array.from({ length: 4 }, (_, index) => (
            <mesh key={index} castShadow position={[0, 1.4 + index * 0.9, -4 + index * 2.6]} scale={[1.7, 0.34, 0.55]}>
              <boxGeometry />
              <meshStandardMaterial color={index % 2 ? '#364158' : '#2d3549'} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      <MemoryPool awake={game.flags.poolAwake} />
      <mesh castShadow position={[0, 3.2, -6.6]} scale={[5.8, 6.2, 0.55]}>
        <boxGeometry />
        <meshStandardMaterial color="#171c2d" roughness={0.68} metalness={0.22} />
      </mesh>
      <mesh position={[0, 3.2, -6.25]} scale={[2.4, 2.4, 0.18]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#1a2e50" emissive="#6cf5ff" emissiveIntensity={game.flags.lensPathOpen ? 2.7 : 0.3} />
      </mesh>
    </group>
  );
}

function MemoryPool({ awake }) {
  const pool = useRef();
  useFrame((state) => {
    if (!pool.current) return;
    pool.current.rotation.z = state.clock.elapsedTime * 0.08;
    pool.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.025);
  });
  return (
    <group position={[0, 0, -0.8]}>
      <mesh receiveShadow position={[0, -0.24, 0]}>
        <cylinderGeometry args={[2.55, 2.9, 0.55, 12]} />
        <meshStandardMaterial color="#1a2030" roughness={0.75} metalness={0.42} />
      </mesh>
      <mesh ref={pool} rotation-x={-Math.PI / 2} position={[0, 0.08, 0]}>
        <circleGeometry args={[2.25, 64]} />
        <meshStandardMaterial
          color="#6dd9ff"
          emissive="#4b8dff"
          emissiveIntensity={awake ? 3.8 : 2.2}
          roughness={0.12}
          metalness={0.5}
          transparent
          opacity={0.82}
        />
      </mesh>
    </group>
  );
}

function SolarLens({ game }) {
  const rings = useRef();
  useFrame((state, delta) => {
    if (!rings.current) return;
    rings.current.rotation.y += delta * (game.phase >= 7 ? 0.65 : 0.18);
    rings.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
  });
  return (
    <group position={[0, 2.3, -41]}>
      <mesh receiveShadow position={[0, -2.85, 0]} scale={[9.5, 0.9, 7]}>
        <cylinderGeometry args={[1, 1.2, 1, 8]} />
        <meshStandardMaterial color="#292f43" roughness={0.88} />
      </mesh>
      <group ref={rings}>
        {[3.4, 2.45, 1.55].map((radius, index) => (
          <mesh key={radius} rotation={[index * 0.75, index * 0.42, 0]}>
            <torusGeometry args={[radius, 0.13 + index * 0.025, 8, 48]} />
            <meshStandardMaterial color="#cabdff" emissive="#6d58ff" emissiveIntensity={1.6 + index} metalness={0.7} roughness={0.22} />
          </mesh>
        ))}
      </group>
      <Float speed={2.1} rotationIntensity={0.35} floatIntensity={0.6}>
        <mesh>
          <icosahedronGeometry args={[0.92, 2]} />
          <meshStandardMaterial
            color={game.skyMood === 'dawn' ? '#fff0ae' : '#ffb568'}
            emissive={game.skyMood === 'ruin' ? '#ff2e74' : '#ff8c42'}
            emissiveIntensity={5}
            roughness={0.18}
          />
        </mesh>
      </Float>
    </group>
  );
}

function DistantRuins() {
  const ruins = useMemo(
    () => Array.from({ length: 34 }, (_, index) => ({
      x: Math.sin(index * 12.91) * (23 + (index % 4) * 7),
      z: 12 - (index % 11) * 7.8,
      y: -0.4 + (index % 3) * 0.25,
      height: 2.5 + (index % 7) * 1.2,
      width: 1.5 + (index % 4) * 0.6,
      rotation: (index % 8) * 0.17,
    })),
    [],
  );
  return (
    <group>
      {ruins.map((ruin, index) => (
        <mesh key={index} position={[ruin.x, ruin.y + ruin.height / 2, ruin.z]} rotation={[0, ruin.rotation, 0]} scale={[ruin.width, ruin.height, ruin.width]}>
          <boxGeometry />
          <meshStandardMaterial color="#171b2e" roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function InteractionBeacons({ game }) {
  return (
    <group>
      {INTERACTIONS.map((interaction) => {
        const active = interaction.phase === game.phase;
        return (
          <Beacon key={interaction.id} position={interaction.position} active={active} />
        );
      })}
    </group>
  );
}

function Beacon({ position, active }) {
  const ring = useRef();
  useFrame((state, delta) => {
    if (!ring.current) return;
    ring.current.rotation.z += delta * 0.7;
    ring.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });
  if (!active) return null;
  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.3}>
        <torusGeometry args={[0.7, 0.055, 6, 32]} />
        <meshStandardMaterial color="#e8fbff" emissive="#5eeaff" emissiveIntensity={4} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color="#6cf5ff" intensity={2.5} distance={4} />
    </group>
  );
}

function moodColor(mood) {
  return {
    twilight: '#090b18',
    storm: '#101428',
    calm: '#11182b',
    moths: '#171329',
    archive: '#071b28',
    lens: '#17102c',
    dawn: '#6f6b7f',
    goldTwilight: '#39283b',
    ruin: '#240817',
  }[mood] ?? '#090b18';
}
