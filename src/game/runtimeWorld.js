import { sanitizeWorldOps } from '../../server/storyEngine.js';

export const INITIAL_RUNTIME_WORLD = Object.freeze({
  weather: 'electric_storm',
  entities: [],
  hazards: [],
  journal: [],
  revision: 0,
});

export function createRuntimeWorld() {
  return {
    weather: INITIAL_RUNTIME_WORLD.weather,
    entities: [],
    hazards: [],
    journal: [],
    revision: 0,
  };
}

export function applyWorldOps(runtime, rawOperations) {
  const operations = sanitizeWorldOps(rawOperations, 16);
  if (!operations.length) return runtime;

  let next = {
    weather: runtime?.weather || 'electric_storm',
    entities: Array.isArray(runtime?.entities) ? [...runtime.entities] : [],
    hazards: Array.isArray(runtime?.hazards) ? [...runtime.hazards] : [],
    journal: Array.isArray(runtime?.journal) ? [...runtime.journal] : [],
    revision: Number(runtime?.revision || 0),
  };

  for (const operation of operations) {
    if (operation.type === 'spawn_structure') {
      next.entities = upsert(next.entities, {
        ...operation,
        kind: 'structure',
        name: operation.prefab,
        used: false,
      });
    } else if (operation.type === 'spawn_npc') {
      next.entities = upsert(next.entities, {
        ...operation,
        kind: 'npc',
        used: false,
      });
    } else if (operation.type === 'spawn_item') {
      next.entities = upsert(next.entities, {
        ...operation,
        kind: 'item',
        used: false,
      });
    } else if (operation.type === 'spawn_hazard') {
      next.hazards = upsert(next.hazards, operation);
    } else if (operation.type === 'remove_entity') {
      next.entities = next.entities.filter((entity) => entity.id !== operation.id);
      next.hazards = next.hazards.filter((hazard) => hazard.id !== operation.id);
    } else if (operation.type === 'transform_entity') {
      next.entities = next.entities.map((entity) => (
        entity.id === operation.id ? { ...entity, ...withoutType(operation) } : entity
      ));
      next.hazards = next.hazards.map((hazard) => (
        hazard.id === operation.id ? { ...hazard, ...withoutType(operation) } : hazard
      ));
    } else if (operation.type === 'set_weather') {
      next.weather = operation.weather;
    } else if (operation.type === 'journal') {
      const entry = { title: operation.title, text: operation.text };
      if (!next.journal.some((item) => item.title === entry.title && item.text === entry.text)) {
        next.journal = [...next.journal, entry].slice(-10);
      }
    }
  }

  next.entities = next.entities.slice(-28);
  next.hazards = next.hazards.slice(-10);
  next.revision += 1;
  return next;
}

export function markRuntimeInteractionUsed(runtime, action) {
  if (!action?.startsWith('world_')) return runtime;
  let changed = false;
  const entities = runtime.entities.map((entity) => {
    if (entity.action !== action || entity.used) return entity;
    changed = true;
    return { ...entity, used: true };
  });
  return changed ? { ...runtime, entities, revision: runtime.revision + 1 } : runtime;
}

export function runtimeInteractions(runtime) {
  return (runtime?.entities ?? [])
    .filter((entity) => entity.action && entity.label && !entity.used)
    .map((entity) => ({
      id: `runtime-${entity.id}`,
      action: entity.action,
      label: entity.label,
      position: entity.position,
      runtime: true,
    }));
}

export function runtimeColliders(runtime) {
  return (runtime?.entities ?? [])
    .filter((entity) => entity.kind === 'structure' && entity.solid)
    .map((entity) => {
      const [x, , z] = entity.position;
      const [sx, , sz] = entity.scale ?? [1, 1, 1];
      const halfX = Math.max(0.35, sx * 0.52);
      const halfZ = Math.max(0.35, sz * 0.52);
      return {
        id: entity.id,
        minX: x - halfX,
        maxX: x + halfX,
        minZ: z - halfZ,
        maxZ: z + halfZ,
      };
    });
}

function upsert(items, value) {
  const index = items.findIndex((item) => item.id === value.id);
  if (index === -1) return [...items, value];
  const next = [...items];
  next[index] = { ...items[index], ...value };
  return next;
}

function withoutType(operation) {
  const { type: _type, id: _id, ...rest } = operation;
  return rest;
}
