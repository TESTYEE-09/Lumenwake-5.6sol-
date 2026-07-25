import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { runtimeColliders } from './runtimeWorld.js';

const WORLD_BOUNDS = { minX: -15.5, maxX: 15.5, minZ: -43.5, maxZ: 8 };
const BASE_COLLIDERS = [
  { minX: -15, maxX: -8.7, minZ: -21, maxZ: -8.5 },
  { minX: 8.7, maxX: 15, minZ: -21, maxZ: -8.5 },
  { minX: -15, maxX: -5.8, minZ: -38.8, maxZ: -25.2 },
  { minX: 5.8, maxX: 15, minZ: -38.8, maxZ: -25.2 },
  { minX: -2.2, maxX: 2.2, minZ: -35.5, maxZ: -31.2 },
];

export function PlayerController({ game, onPosition, onHazard }) {
  const controls = useRef();
  const keys = useRef(new Set());
  const lastPositionReport = useRef(0);
  const velocity = useRef(new THREE.Vector3());
  const { camera } = useThree();
  const generatedColliders = useMemo(() => runtimeColliders(game.runtime), [game.runtime]);

  useEffect(() => {
    camera.position.set(0, 1.72, 5.5);
  }, [camera]);

  useEffect(() => {
    const down = (event) => keys.current.add(event.code);
    const up = (event) => keys.current.delete(event.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    if (game.loading || game.choices.length > 0 || game.ending) {
      controls.current?.unlock();
    }
  }, [game.loading, game.choices.length, game.ending]);

  useFrame((state, delta) => {
    if (!controls.current?.isLocked || game.loading || game.choices.length > 0 || game.ending) {
      velocity.current.multiplyScalar(Math.max(0, 1 - delta * 10));
      return;
    }

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    const input = new THREE.Vector3();
    if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) input.add(forward);
    if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) input.sub(forward);
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) input.add(right);
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) input.sub(right);
    if (input.lengthSq() > 0) input.normalize();

    const sprinting = keys.current.has('ShiftLeft') || keys.current.has('ShiftRight');
    const targetSpeed = sprinting ? 7.2 : 4.8;
    velocity.current.lerp(input.multiplyScalar(targetSpeed), 1 - Math.exp(-delta * 13));

    const oldX = camera.position.x;
    const oldZ = camera.position.z;
    camera.position.x += velocity.current.x * delta;
    camera.position.z += velocity.current.z * delta;

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

    if (!game.flags.stationGateOpen && camera.position.z < -23.1) camera.position.z = -23.1;
    if (!game.flags.enginePathOpen && camera.position.z < -38.1) camera.position.z = -38.1;

    const radius = 0.42;
    for (const collider of [...BASE_COLLIDERS, ...generatedColliders]) {
      if (circleHitsBox(camera.position.x, camera.position.z, radius, collider)) {
        camera.position.x = oldX;
        camera.position.z = oldZ;
        velocity.current.multiplyScalar(0.18);
        break;
      }
    }

    for (const hazard of game.runtime?.hazards ?? []) {
      const dx = camera.position.x - hazard.position[0];
      const dz = camera.position.z - hazard.position[2];
      if (Math.hypot(dx, dz) < Number(hazard.radius || 1.2) + 0.3) {
        onHazard?.(hazard.id, hazard.damage);
      }
    }

    const moving = velocity.current.lengthSq() > 0.25;
    camera.position.y = 1.72 + (moving ? Math.sin(state.clock.elapsedTime * 10.5) * 0.025 : 0);

    if (state.clock.elapsedTime - lastPositionReport.current > 0.12) {
      lastPositionReport.current = state.clock.elapsedTime;
      onPosition?.([camera.position.x, camera.position.z]);
    }
  });

  return <PointerLockControls ref={controls} pointerSpeed={0.72} />;
}

function circleHitsBox(x, z, radius, box) {
  const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
  const nearestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}
