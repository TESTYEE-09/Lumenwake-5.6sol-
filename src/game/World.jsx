import { Float, Sparkles, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PlayerController } from './PlayerController.jsx';
import { runtimeInteractions } from './runtimeWorld.js';

const CORE_INTERACTIONS = [
  { phase: 1, id: 'signal', action: 'approach_signal', label: 'Restart the signal spire', position: [0, 0, -9.5] },
  { phase: 2, id: 'atlas', action: 'take_atlas', label: 'Take the Atlas Key', position: [-5.8, 0, -16.2] },
  { phase: 4, id: 'stationGate', action: 'enter_blank_station', label: 'Enter the Unwritten Station', position: [0, 0, -25.7] },
  { phase: 5, id: 'routeHeart', action: 'take_route_heart', label: 'Take the Route Heart', position: [0, 0, -33.3] },
  { phase: 6, id: 'engine', action: 'reach_night_engine', label: 'Enter the Night Engine', position: [0, 0, -40.4] },
];

export function World({ game, onFocus, onPosition, onHazard }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ fov: 68, near: 0.1, far: 190, position: [0, 1.72, 5.5] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <WorldScene game={game} onFocus={onFocus} onPosition={onPosition} onHazard={onHazard} />
    </Canvas>
  );
}

function WorldScene({ game, onFocus, onPosition, onHazard }) {
  const { camera, scene } = useThree();
  const focusRef = useRef(null);
  const targetColor = useMemo(() => new THREE.Color(), []);
  const interactions = useMemo(
    () => [
      ...CORE_INTERACTIONS.filter((interaction) => interaction.phase === game.phase),
      ...runtimeInteractions(game.runtime),
    ],
    [game.phase, game.runtime],
  );

  useEffect(() => {
    scene.background = new THREE.Color('#050712');
    scene.fog = new THREE.FogExp2('#090d20', 0.025);
  }, [scene]);

  useFrame((_state, delta) => {
    targetColor.set(moodColor(game.skyMood));
    scene.background.lerp(targetColor, Math.min(1, delta * 0.72));
    scene.fog.color.lerp(targetColor, Math.min(1, delta * 0.55));

    if (game.loading || game.choices.length || game.ending) {
      setFocus(null);
      return;
    }

    let nearest = null;
    let nearestDistance = Infinity;
    for (const interaction of interactions) {
      const distance = Math.hypot(
        camera.position.x - interaction.position[0],
        camera.position.z - interaction.position[2],
      );
      if (distance < 3.25 && distance < nearestDistance) {
        nearest = interaction;
        nearestDistance = distance;
      }
    }
    setFocus(nearest);
  });

  function setFocus(next) {
    if (focusRef.current?.id === next?.id) return;
    focusRef.current = next;
    onFocus(next);
  }

  const weather = game.runtime?.weather || 'electric_storm';

  return (
    <>
      <ambientLight intensity={weather === 'whiteout' ? 0.68 : 0.32} />
      <hemisphereLight args={['#8bb8ff', '#140f25', 0.6]} />
      <directionalLight
        castShadow
        intensity={game.skyMood === 'dawn' ? 2.3 : 1.35}
        color={game.skyMood === 'dawn' ? '#ffd39a' : '#a2b3ff'}
        position={[8, 17, 7]}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={75}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={25}
        shadow-camera-bottom={-55}
      />
      <pointLight color="#67e6ff" intensity={5} distance={22} position={[0, 4, -14]} />
      <pointLight color="#ff587d" intensity={game.phase >= 6 ? 8 : 2} distance={18} position={[0, 4, -41]} />

      <Stars radius={92} depth={42} count={1500} factor={2.3} saturation={0.2} fade speed={0.28} />
      <WeatherParticles weather={weather} />

      <TheBlank mood={game.skyMood} />
      <RailCauseway />
      <RearDeck />
      <SignalYard game={game} />
      <UnwrittenStation game={game} />
      <NightEngine game={game} />
      <DistantTrainCity />
      <RuntimeWorld runtime={game.runtime} />
      <InteractionBeacons interactions={interactions} />
      <PlayerController game={game} onPosition={onPosition} onHazard={onHazard} />
    </>
  );
}

function WeatherParticles({ weather }) {
  const settings = {
    electric_storm: { count: 120, color: '#75eaff', speed: 0.55, size: 1.3 },
    hard_rain: { count: 190, color: '#8abfff', speed: 1.1, size: 0.9 },
    reverse_rain: { count: 170, color: '#c18cff', speed: 0.85, size: 1.2 },
    whiteout: { count: 250, color: '#ffffff', speed: 0.4, size: 2 },
    still: { count: 55, color: '#ffd998', speed: 0.12, size: 1.5 },
    overdrive: { count: 230, color: '#54ddff', speed: 1.5, size: 1.2 },
    clear_lane: { count: 70, color: '#d9f7ff', speed: 0.22, size: 1.1 },
    sunrise: { count: 90, color: '#ffd47e', speed: 0.18, size: 1.4 },
    perfect_stillness: { count: 30, color: '#a9c9ff', speed: 0.05, size: 1 },
    many_roads: { count: 180, color: '#a8f5ff', speed: 0.35, size: 1.5 },
  }[weather] || { count: 100, color: '#75eaff', speed: 0.4, size: 1.2 };

  return (
    <Sparkles
      count={settings.count}
      scale={[30, 12, 62]}
      position={[0, 4, -19]}
      size={settings.size}
      speed={settings.speed}
      opacity={0.72}
      color={settings.color}
    />
  );
}

function TheBlank({ mood }) {
  const material = useRef();
  useFrame((state) => {
    if (!material.current) return;
    material.current.emissiveIntensity = 0.13 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -2.2, -18]} receiveShadow>
      <planeGeometry args={[170, 170, 50, 50]} />
      <meshStandardMaterial
        ref={material}
        color={mood === 'dawn' ? '#7e91a8' : '#e6e8ef'}
        emissive={mood === 'blank' ? '#ffffff' : '#58647e'}
        roughness={0.82}
        metalness={0.08}
        transparent
        opacity={mood === 'dawn' ? 0.45 : 0.7}
      />
    </mesh>
  );
}

function RailCauseway() {
  const ties = useMemo(
    () => Array.from({ length: 34 }, (_, index) => ({
      z: 7 - index * 1.55,
      x: Math.sin(index * 1.9) * 0.08,
      angle: Math.sin(index * 0.8) * 0.018,
    })),
    [],
  );
  return (
    <group>
      {ties.map((tie, index) => (
        <mesh key={index} castShadow receiveShadow position={[tie.x, -0.46, tie.z]} rotation={[0, tie.angle, 0]} scale={[4.8, 0.35, 0.7]}>
          <boxGeometry />
          <meshStandardMaterial color={index % 2 ? '#3b3541' : '#49414c'} roughness={0.94} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 1.7, -0.07, -18.5]} scale={[0.16, 0.16, 54]}>
          <boxGeometry />
          <meshStandardMaterial color="#a5b1c4" metalness={0.92} roughness={0.2} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={`posts-${side}`} position={[side * 3.45, 0, -19]}>
          {Array.from({ length: 8 }, (_, index) => (
            <SignalLamp key={index} position={[0, 0, 19 - index * 7.2]} color={index % 3 === 0 ? '#ff607f' : '#65e6ff'} />
          ))}
        </group>
      ))}
    </group>
  );
}

function SignalLamp({ position, color }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.07, 0.12, 2.4, 6]} />
        <meshStandardMaterial color="#181b27" metalness={0.8} roughness={0.3} />
      </mesh>
      <Float speed={1.25} rotationIntensity={0.05} floatIntensity={0.12}>
        <mesh position={[0, 2.12, 0]}>
          <boxGeometry args={[0.42, 0.52, 0.28]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.2} />
        </mesh>
      </Float>
    </group>
  );
}

function RearDeck() {
  return (
    <group position={[0, 0, 3.2]}>
      <mesh receiveShadow position={[0, -0.55, 0]} scale={[10, 0.8, 5.2]}>
        <boxGeometry />
        <meshStandardMaterial color="#252a3b" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, 2.1, 3.8]} scale={[7, 4.4, 1]}>
        <boxGeometry />
        <meshStandardMaterial color="#121622" metalness={0.4} roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.15, 3.25]} scale={[3.8, 1.5, 0.16]}>
        <planeGeometry />
        <meshStandardMaterial color="#142c44" emissive="#4bdfff" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

function SignalYard({ game }) {
  return (
    <group position={[0, 0, -15]}>
      <mesh receiveShadow position={[0, -0.58, 0]} scale={[17, 0.9, 12]}>
        <boxGeometry />
        <meshStandardMaterial color="#252b3c" roughness={0.9} />
      </mesh>
      <SignalSpire open={game.flags.signalOpen} />
      {!game.flags.atlasTaken && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.35}>
          <mesh position={[-5.8, 1.45, -1.2]} rotation={[0.3, 0.4, 0]}>
            <octahedronGeometry args={[0.62, 0]} />
            <meshStandardMaterial color="#11131c" emissive="#62e8ff" emissiveIntensity={3.8} metalness={0.7} roughness={0.18} />
          </mesh>
        </Float>
      )}
      <CrewNpc position={[5.3, 0, -2]} color="#6ab6e8" archetype="captain" visible={game.phase >= 3} />
      <CrewNpc position={[-5.3, 0, -2]} color="#e0a95f" archetype="rogue" visible={game.phase >= 3} />
      <StationGate open={game.flags.stationGateOpen} />
    </group>
  );
}

function SignalSpire({ open }) {
  const crown = useRef();
  useFrame((state, delta) => {
    if (!crown.current) return;
    crown.current.rotation.y += delta * (open ? 0.65 : 0.12);
    crown.current.position.y = THREE.MathUtils.damp(crown.current.position.y, open ? 4.8 : 3.9, 4, delta);
  });
  return (
    <group position={[0, 0, 5.2]}>
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.55, 1.1, 4.1, 7]} />
        <meshStandardMaterial color="#353c50" metalness={0.35} roughness={0.6} />
      </mesh>
      <group ref={crown} position={[0, 3.9, 0]}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} rotation={[index * 0.9, index * 0.7, 0]}>
            <torusGeometry args={[1.2 + index * 0.42, 0.1, 6, 32]} />
            <meshStandardMaterial color="#a5efff" emissive="#55dfff" emissiveIntensity={open ? 2.8 : 0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CrewNpc({ position, color, archetype, visible = true }) {
  if (!visible) return null;
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.25, 0]}>
        {archetype === 'captain' ? <coneGeometry args={[0.72, 2.25, 6]} /> : <cylinderGeometry args={[0.52, 0.72, 2.2, 7]} />}
        <meshStandardMaterial color={color} roughness={0.62} metalness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 2.7, 0]}>
        <dodecahedronGeometry args={[0.48, 0]} />
        <meshStandardMaterial color="#d8c9b9" roughness={0.78} />
      </mesh>
      <mesh position={[0, 2.72, 0.45]} scale={[0.5, 0.12, 0.08]}>
        <boxGeometry />
        <meshStandardMaterial color="#c4f7ff" emissive="#5de8ff" emissiveIntensity={1.7} />
      </mesh>
    </group>
  );
}

function StationGate({ open }) {
  const gate = useRef();
  useFrame((_state, delta) => {
    if (!gate.current) return;
    gate.current.position.y = THREE.MathUtils.damp(gate.current.position.y, open ? -3.8 : 1.55, 4, delta);
  });
  return (
    <group position={[0, 0, -10.4]}>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 2.5, 1.8, 0]} scale={[0.8, 5.4, 1]}>
          <boxGeometry />
          <meshStandardMaterial color="#1d2231" roughness={0.84} />
        </mesh>
      ))}
      <mesh ref={gate} castShadow position={[0, 1.55, 0]} scale={[4.2, 4.6, 0.34]}>
        <boxGeometry />
        <meshStandardMaterial color="#0d111d" emissive="#b64b6c" emissiveIntensity={open ? 0.1 : 0.7} metalness={0.82} roughness={0.26} />
      </mesh>
    </group>
  );
}

function UnwrittenStation({ game }) {
  return (
    <group position={[0, 0, -32.5]}>
      <mesh receiveShadow position={[0, -0.58, 0]} scale={[15, 0.9, 12]}>
        <boxGeometry />
        <meshStandardMaterial color="#222839" roughness={0.88} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 7, 0, 0]}>
          {[-4, 0, 4].map((z, index) => (
            <mesh key={z} castShadow position={[0, 2.1, z]} scale={[1.2, 4.8, 1.2]}>
              <boxGeometry />
              <meshStandardMaterial color={index % 2 ? '#353145' : '#2c3347'} roughness={0.82} />
            </mesh>
          ))}
        </group>
      ))}
      <RouteHeart taken={game.flags.routeHeartFound} />
      <mesh castShadow position={[0, 3.2, -6.5]} scale={[6.2, 6.2, 0.5]}>
        <boxGeometry />
        <meshStandardMaterial color="#151925" roughness={0.58} metalness={0.34} />
      </mesh>
      <mesh position={[0, 3.2, -6.2]} scale={[2.8, 2.8, 0.14]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#331629" emissive="#ff4e7d" emissiveIntensity={game.flags.enginePathOpen ? 3 : 0.8} />
      </mesh>
    </group>
  );
}

function RouteHeart({ taken }) {
  const heart = useRef();
  useFrame((state, delta) => {
    if (!heart.current) return;
    heart.current.rotation.y += delta * 0.8;
    heart.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.06);
  });
  if (taken) return null;
  return (
    <group position={[0, 1.25, -0.8]}>
      <mesh castShadow position={[0, -0.45, 0]}>
        <cylinderGeometry args={[2, 2.3, 0.6, 10]} />
        <meshStandardMaterial color="#171d2a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={heart}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#ff9d64" emissive="#ff3f72" emissiveIntensity={4.5} roughness={0.15} />
      </mesh>
    </group>
  );
}

function NightEngine({ game }) {
  const rings = useRef();
  useFrame((state, delta) => {
    if (!rings.current) return;
    rings.current.rotation.y += delta * (game.phase >= 6 ? 0.72 : 0.16);
    rings.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.13;
  });
  return (
    <group position={[0, 2.4, -41.5]}>
      <mesh receiveShadow position={[0, -2.95, 0]} scale={[10, 0.9, 7.5]}>
        <cylinderGeometry args={[1, 1.2, 1, 8]} />
        <meshStandardMaterial color="#282d3e" roughness={0.86} />
      </mesh>
      <group ref={rings}>
        {[3.6, 2.7, 1.8].map((radius, index) => (
          <mesh key={radius} rotation={[index * 0.78, index * 0.43, 0]}>
            <torusGeometry args={[radius, 0.14 + index * 0.025, 8, 48]} />
            <meshStandardMaterial color="#ffafc1" emissive="#ff416e" emissiveIntensity={1.8 + index} metalness={0.72} roughness={0.2} />
          </mesh>
        ))}
      </group>
      <Float speed={2.2} rotationIntensity={0.28} floatIntensity={0.48}>
        <mesh>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#fff0df" emissive={game.skyMood === 'dawn' ? '#ffbe69' : '#ff3e70'} emissiveIntensity={5} roughness={0.16} />
        </mesh>
      </Float>
    </group>
  );
}

function DistantTrainCity() {
  const cars = useMemo(
    () => Array.from({ length: 28 }, (_, index) => ({
      side: index % 2 ? -1 : 1,
      x: (18 + (index % 5) * 6) * (index % 2 ? -1 : 1),
      z: 9 - (index % 14) * 4.3,
      y: -0.4 + (index % 3) * 0.2,
      width: 3 + (index % 4),
      height: 2.8 + (index % 6) * 0.8,
    })),
    [],
  );
  return (
    <group>
      {cars.map((car, index) => (
        <mesh key={index} position={[car.x, car.y + car.height / 2, car.z]} scale={[car.width, car.height, 5]}>
          <boxGeometry />
          <meshStandardMaterial color="#121726" emissive={index % 5 === 0 ? '#16334a' : '#121726'} emissiveIntensity={0.5} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function RuntimeWorld({ runtime }) {
  return (
    <group>
      {(runtime?.entities ?? []).map((entity) => <RuntimeEntity key={entity.id} entity={entity} />)}
      {(runtime?.hazards ?? []).map((hazard) => <RuntimeHazard key={hazard.id} hazard={hazard} />)}
    </group>
  );
}

function RuntimeEntity({ entity }) {
  const group = useRef();
  const base = useMemo(() => new THREE.Vector3(...entity.position), [entity.position]);
  useFrame((state, delta) => {
    if (!group.current) return;
    animateRuntimeObject(group.current, entity.behavior, base, state.clock.elapsedTime, delta);
  });

  return (
    <group ref={group} position={entity.position} scale={entity.scale || [1, 1, 1]}>
      {entity.kind === 'npc' ? (
        <RuntimeNpc entity={entity} />
      ) : entity.kind === 'item' ? (
        <RuntimeItem entity={entity} />
      ) : (
        <RuntimeStructure entity={entity} />
      )}
    </group>
  );
}

function RuntimeStructure({ entity }) {
  const color = entity.color || '#79dfff';

  if (entity.prefab === 'portal') {
    return <mesh rotation-x={Math.PI / 2}><torusGeometry args={[1.6, 0.22, 8, 40]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>;
  }
  if (entity.prefab === 'crystal' || entity.prefab === 'hologram') {
    return <mesh><icosahedronGeometry args={[1, 1]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>;
  }
  if (entity.prefab === 'tower') {
    return (
      <group>
        <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.65, 1, 2.6, 7]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>
        <mesh position={[0, 3, 0]}><coneGeometry args={[1.2, 1.2, 7]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>
      </group>
    );
  }
  if (entity.prefab === 'rails') {
    return (
      <group>
        {[-1, 0, 1].map((offset) => <mesh key={offset} position={[offset * 1.4, 0, 0]} scale={[0.12, 0.12, 4]}><boxGeometry /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>)}
      </group>
    );
  }
  if (entity.prefab === 'lanterns') {
    return (
      <group>
        {[-2, -1, 0, 1, 2].map((offset) => <mesh key={offset} position={[offset, Math.abs(offset) * 0.25, 0]}><octahedronGeometry args={[0.3, 0]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>)}
      </group>
    );
  }
  if (entity.prefab === 'screen') {
    return <mesh><boxGeometry args={[2.8, 1.6, 0.2]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>;
  }
  if (entity.prefab === 'wreck') {
    return <mesh rotation={[0.2, 0.4, 0.12]}><boxGeometry args={[3.2, 1.4, 1.8]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>;
  }
  if (entity.prefab === 'bridge') {
    return <mesh><boxGeometry args={[5, 0.4, 1.6]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>;
  }
  return <mesh><boxGeometry args={entity.prefab === 'barricade' ? [2.4, 1.3, 0.5] : [2.2, 0.5, 2.2]} /><RuntimeMaterial color={color} prefab={entity.prefab} /></mesh>;
}

function RuntimeMaterial({ color, prefab }) {
  const glowing = ['portal', 'screen', 'hologram', 'crystal', 'lanterns'].includes(prefab);
  return (
    <meshStandardMaterial
      color={color}
      emissive={glowing ? color : '#000000'}
      emissiveIntensity={glowing ? 2.2 : 0}
      roughness={0.48}
      metalness={0.38}
      transparent={prefab === 'hologram'}
      opacity={prefab === 'hologram' ? 0.55 : 1}
    />
  );
}

function RuntimeNpc({ entity }) {
  const color = entity.color || '#dcecff';
  return (
    <group>
      <mesh castShadow position={[0, 1.15, 0]}>
        {entity.archetype === 'conductor' ? <coneGeometry args={[0.7, 2.2, 6]} /> : <cylinderGeometry args={[0.45, 0.68, 2.1, 7]} />}
        <meshStandardMaterial color={color} emissive={entity.archetype === 'ghost' || entity.archetype === 'machine' ? color : '#000000'} emissiveIntensity={1.2} roughness={0.58} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 2.55, 0]}>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#ddd4c8" roughness={0.72} />
      </mesh>
      <pointLight color={color} intensity={1.4} distance={4} position={[0, 1.8, 0]} />
    </group>
  );
}

function RuntimeItem({ entity }) {
  const color = entity.color || '#ffd17a';
  return (
    <group>
      <mesh castShadow>
        <octahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} roughness={0.2} metalness={0.45} />
      </mesh>
      <pointLight color={color} intensity={2} distance={4} />
    </group>
  );
}

function RuntimeHazard({ hazard }) {
  const group = useRef();
  const base = useMemo(() => new THREE.Vector3(...hazard.position), [hazard.position]);
  useFrame((state, delta) => {
    if (!group.current) return;
    animateRuntimeObject(group.current, hazard.behavior, base, state.clock.elapsedTime, delta);
  });
  const color = hazard.color || '#ff668e';
  return (
    <group ref={group} position={hazard.position}>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[hazard.radius * 0.72, 0.11, 7, 36]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.6} transparent opacity={0.78} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[hazard.radius * 0.28, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} transparent opacity={0.62} />
      </mesh>
      <pointLight color={color} intensity={3} distance={hazard.radius * 3.2} />
    </group>
  );
}

function animateRuntimeObject(object, behavior, base, time, delta) {
  if (behavior === 'spin') object.rotation.y += delta * 0.9;
  if (behavior === 'float') object.position.y = base.y + Math.sin(time * 1.5) * 0.3;
  if (behavior === 'pulse') object.scale.setScalar(1 + Math.sin(time * 2.4) * 0.08);
  if (behavior === 'orbit') {
    object.position.x = base.x + Math.cos(time * 0.8) * 0.65;
    object.position.z = base.z + Math.sin(time * 0.8) * 0.65;
    object.rotation.y += delta * 0.5;
  }
  if (behavior === 'flicker') object.visible = Math.sin(time * 17) > -0.72;
}

function InteractionBeacons({ interactions }) {
  return (
    <group>
      {interactions.map((interaction) => (
        <Beacon key={interaction.id} position={interaction.position} runtime={interaction.runtime} />
      ))}
    </group>
  );
}

function Beacon({ position, runtime }) {
  const ring = useRef();
  useFrame((state, delta) => {
    if (!ring.current) return;
    ring.current.rotation.z += delta * (runtime ? 1.2 : 0.72);
    ring.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });
  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.35}>
        <torusGeometry args={[runtime ? 0.55 : 0.72, 0.055, 6, 32]} />
        <meshStandardMaterial color={runtime ? '#ffd47e' : '#e8fbff'} emissive={runtime ? '#ff9d50' : '#5eeaff'} emissiveIntensity={4} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color={runtime ? '#ffb15f' : '#6cf5ff'} intensity={2.4} distance={4} />
    </group>
  );
}

function moodColor(mood) {
  return {
    nightStorm: '#050712',
    signal: '#071625',
    fortress: '#101728',
    impossible: '#190f2b',
    blank: '#777c88',
    station: '#11101d',
    overdrive: '#03192a',
    memory: '#24182a',
    awake: '#0e2030',
    engine: '#260916',
    dawn: '#827069',
    perfectNight: '#071023',
    manyRoads: '#173147',
  }[mood] ?? '#050712';
}
