const WORLD_LORE = `
LUMENWAKE: THE NIGHT ENGINE is a fast, dangerous science-fantasy adventure set on a fortress train carrying the last surviving city through a reality-erasing storm called the Blank.

The train has been trapped in the same night for eighteen years because somebody stole the name of its destination. The player is a Routebreaker: a scavenger who can use the Atlas Key to make described roads, stations, enemies, and objects become physically real. The Blank can also write back, so every created route may contain a cost or trap.

Recurring characters:
- Captain Mara Vey: blunt security commander, brave, practical, protective of the passengers, terrified of uncontrolled reality changes.
- Quill Rook: charming map thief, reckless and funny, believes the train's promised destination is actually a prison.
- Passenger Zero: the faceless original conductor, hidden inside the engine and feeding the train false destinations.
- The Blank: not a person, but it learns the player's habits and turns their assumptions into hazards.

Game tone: urgent adventure, strong objectives, readable dialogue, clear danger, strange places, occasional dry humour. Never become vague, slow, poetic for its own sake, or overly wordy. Every beat must create a playable problem, consequence, discovery, or decision.
`;

const ACTIONS = {
  begin: {
    phase: 1,
    speaker: 'Emergency Broadcast',
    narration: 'You wake on the rear service deck as the city-train Lumenwake grinds to a stop above an endless white storm. Ahead, every signal points back toward the track you just crossed.',
    dialogue: 'Route failure. Destination name missing. Blank exposure in four minutes.',
    objective: 'Reach the signal spire and restart the route system.',
    effects: [
      { type: 'setPhase', value: 1 },
      { type: 'setFlag', key: 'awake', value: true },
      { type: 'skyMood', value: 'nightStorm' },
    ],
    worldOps: [
      { type: 'set_weather', weather: 'electric_storm' },
      { type: 'journal', title: 'The impossible stop', text: 'Lumenwake has stopped inside the Blank. The destination name is gone.' },
    ],
  },

  approach_signal: {
    phase: 2,
    speaker: 'Signal Spire',
    narration: 'The spire opens like a steel flower. Its route map is empty except for one object locked inside the mechanism: a black key covered in moving railway lines.',
    dialogue: 'Atlas Key detected. Routebreaker authorization: dead for eighteen years.',
    objective: 'Take the Atlas Key from the signal mechanism.',
    effects: [
      { type: 'setPhase', value: 2 },
      { type: 'setFlag', key: 'signalOpen', value: true },
      { type: 'skyMood', value: 'signal' },
    ],
    worldOps: [
      { type: 'spawn_hazard', id: 'signal-static', hazard: 'static_field', position: [4.5, 0, -14], radius: 1.6, damage: 8, color: '#64e7ff', behavior: 'flicker' },
      { type: 'spawn_structure', id: 'route-echo', prefab: 'hologram', position: [0, 2.4, -12.5], scale: [2.4, 2.4, 2.4], color: '#7beeff', behavior: 'spin', solid: false },
    ],
  },

  take_atlas: {
    phase: 3,
    speaker: 'Atlas Key',
    narration: 'The key bites into your glove and redraws the track ahead. Captain Mara arrives with a rifle. Quill drops from the signal cables holding a stolen map that shows a station which does not exist yet.',
    dialogue: 'Choose who gets to tell the Key what becomes real.',
    objective: 'Choose how to create a route through the Blank.',
    choices: [
      { id: 'choice_back_mara', label: 'Follow Mara’s controlled rescue route', hint: 'Safer for the passengers, easier for Passenger Zero to predict.' },
      { id: 'choice_follow_quill', label: 'Use Quill’s stolen impossible map', hint: 'More dangerous, but it may escape the train’s loop.' },
      { id: 'choice_trust_nobody', label: 'Write a third route yourself', hint: 'Take full control and make the Blank react directly to you.' },
    ],
    effects: [
      { type: 'setPhase', value: 3 },
      { type: 'addItem', value: 'Atlas Key' },
      { type: 'setFlag', key: 'atlasTaken', value: true },
    ],
    worldOps: [
      { type: 'spawn_npc', id: 'mara-arrives', name: 'Captain Mara Vey', archetype: 'captain', position: [5.4, 0, -17], color: '#87c8ff', behavior: 'none' },
      { type: 'spawn_npc', id: 'quill-arrives', name: 'Quill Rook', archetype: 'rogue', position: [-5.4, 0, -17], color: '#ffca7d', behavior: 'float' },
    ],
  },

  choice_back_mara: {
    phase: 4,
    speaker: 'Captain Mara Vey',
    narration: 'Mara feeds evacuation coordinates into the Atlas Key. A fortified station punches through the Blank, complete with barricades, emergency lamps, and something large moving behind the ticket hall.',
    dialogue: 'I asked for safe. The Key heard fortified. Stay close.',
    objective: 'Enter the newly created station and find its Route Heart.',
    effects: [
      { type: 'setPhase', value: 4 },
      { type: 'relationship', key: 'mara', delta: 2 },
      { type: 'relationship', key: 'quill', delta: -1 },
      { type: 'setFlag', key: 'backedMara', value: true },
      { type: 'setFlag', key: 'stationGateOpen', value: true },
      { type: 'skyMood', value: 'fortress' },
    ],
    worldOps: [
      { type: 'spawn_structure', id: 'mara-barricade', prefab: 'barricade', position: [4.3, 0, -27.5], scale: [2.2, 1.4, 0.6], color: '#55789c', behavior: 'none', solid: true },
      { type: 'set_weather', weather: 'hard_rain' },
    ],
  },

  choice_follow_quill: {
    phase: 4,
    speaker: 'Quill Rook',
    narration: 'Quill folds the impossible map around the Key. A station appears upside down above the rails, then snaps upright at the last second. Its doors open onto three different skies.',
    dialogue: 'Good news: this route has never killed us before. It has never existed before either.',
    objective: 'Enter the impossible station and steal its Route Heart.',
    effects: [
      { type: 'setPhase', value: 4 },
      { type: 'relationship', key: 'mara', delta: -1 },
      { type: 'relationship', key: 'quill', delta: 2 },
      { type: 'setFlag', key: 'followedQuill', value: true },
      { type: 'setFlag', key: 'stationGateOpen', value: true },
      { type: 'skyMood', value: 'impossible' },
    ],
    worldOps: [
      { type: 'spawn_structure', id: 'upside-platform', prefab: 'platform', position: [-5, 4.8, -29], scale: [4, 0.5, 2.2], color: '#9f79ff', behavior: 'orbit', solid: false },
      { type: 'set_weather', weather: 'reverse_rain' },
    ],
  },

  choice_trust_nobody: {
    phase: 4,
    speaker: 'The Blank',
    narration: 'You describe a station neither Mara nor Quill recognises: low walls, one entrance, no hidden rooms. The Blank obeys perfectly, then adds footsteps inside because you forgot to describe it as empty.',
    dialogue: 'Your route. Your mistake.',
    objective: 'Enter your station and survive whatever the Blank added.',
    effects: [
      { type: 'setPhase', value: 4 },
      { type: 'relationship', key: 'mara', delta: -1 },
      { type: 'relationship', key: 'quill', delta: -1 },
      { type: 'setFlag', key: 'wroteOwnRoute', value: true },
      { type: 'setFlag', key: 'stationGateOpen', value: true },
      { type: 'skyMood', value: 'blank' },
    ],
    worldOps: [
      { type: 'spawn_hazard', id: 'forgotten-footsteps', hazard: 'blank_rift', position: [0, 0, -29.5], radius: 1.8, damage: 12, color: '#ffffff', behavior: 'pulse' },
      { type: 'set_weather', weather: 'whiteout' },
    ],
  },

  enter_blank_station: {
    phase: 5,
    speaker: 'Unwritten Station',
    narration: 'The station finishes building itself around you. Posters show adventures you have not had. At the centre, a Route Heart beats inside a glass timetable while Passenger Zero watches through every reflection.',
    dialogue: 'Bring the Heart to the engine. I will finally give this train a destination.',
    objective: 'Cross the station and take the Route Heart.',
    effects: [
      { type: 'setPhase', value: 5 },
      { type: 'setFlag', key: 'insideStation', value: true },
      { type: 'skyMood', value: 'station' },
    ],
    worldOps: [
      { type: 'spawn_structure', id: 'zero-screen', prefab: 'screen', position: [0, 2.8, -35.8], scale: [3.8, 2.1, 0.3], color: '#ff5a83', behavior: 'flicker', solid: false },
      { type: 'journal', title: 'Passenger Zero', text: 'The original conductor is still inside the engine and appears to control the loop.' },
    ],
  },

  take_route_heart: {
    phase: 5,
    speaker: 'Route Heart',
    narration: 'The glass shatters inward. The Heart offers three ways to restart Lumenwake, and each one demands a different kind of fuel.',
    dialogue: 'Power requires a promise. Choose what the train is allowed to consume.',
    objective: 'Choose how to power the final run to the engine.',
    choices: [
      { id: 'choice_feed_storm', label: 'Feed the engine the storm outside', hint: 'Fast and violent. The Blank will enter the train with it.' },
      { id: 'choice_feed_memories', label: 'Use one memory from every passenger', hint: 'Stable, but the city may forget why it wanted to survive.' },
      { id: 'choice_free_engine', label: 'Break the fuel law and let the engine choose', hint: 'Unpredictable. The train becomes a character with its own goal.' },
    ],
    effects: [
      { type: 'setFlag', key: 'routeHeartFound', value: true },
      { type: 'addItem', value: 'Route Heart' },
    ],
  },

  choice_feed_storm: {
    phase: 6,
    speaker: 'Captain Mara Vey',
    narration: 'You open the Heart to the storm. Blue fire races along the rails and Lumenwake begins moving before anyone is ready. Shapes run beside the train inside the lightning.',
    dialogue: 'We have speed. We also have company.',
    objective: 'Reach the Night Engine before the storm creatures board.',
    effects: [
      { type: 'setPhase', value: 6 },
      { type: 'setFlag', key: 'fedStorm', value: true },
      { type: 'setFlag', key: 'enginePathOpen', value: true },
      { type: 'damage', value: 10 },
      { type: 'skyMood', value: 'overdrive' },
    ],
    worldOps: [
      { type: 'spawn_hazard', id: 'storm-runner', hazard: 'storm_creature', position: [5, 0, -38.5], radius: 1.5, damage: 15, color: '#56dfff', behavior: 'orbit' },
      { type: 'set_weather', weather: 'overdrive' },
    ],
  },

  choice_feed_memories: {
    phase: 6,
    speaker: 'Quill Rook',
    narration: 'A quiet light passes through every carriage. The engine wakes smoothly, but thousands of passengers pause at once, each missing one small piece of home.',
    dialogue: 'We bought a future with details. Make sure the destination is worth it.',
    objective: 'Carry the passengers’ memories to the Night Engine.',
    effects: [
      { type: 'setPhase', value: 6 },
      { type: 'setFlag', key: 'fedMemories', value: true },
      { type: 'setFlag', key: 'enginePathOpen', value: true },
      { type: 'addItem', value: 'Passenger Echoes' },
      { type: 'skyMood', value: 'memory' },
    ],
    worldOps: [
      { type: 'spawn_structure', id: 'memory-procession', prefab: 'lanterns', position: [0, 1.2, -38.5], scale: [5, 2, 4], color: '#ffd58b', behavior: 'float', solid: false },
      { type: 'set_weather', weather: 'still' },
    ],
  },

  choice_free_engine: {
    phase: 6,
    speaker: 'Lumenwake',
    narration: 'You cut the Heart free from its fuel rules. The entire train inhales. Doors unlock by themselves, wheels choose a rhythm, and a new voice speaks through the floor beneath you.',
    dialogue: 'I have carried a city for eighteen years. Now I choose where we go.',
    objective: 'Meet the awakened train at the Night Engine.',
    effects: [
      { type: 'setPhase', value: 6 },
      { type: 'setFlag', key: 'engineAwake', value: true },
      { type: 'setFlag', key: 'enginePathOpen', value: true },
      { type: 'relationship', key: 'train', delta: 2 },
      { type: 'skyMood', value: 'awake' },
    ],
    worldOps: [
      { type: 'spawn_npc', id: 'train-avatar', name: 'Lumenwake', archetype: 'machine', position: [0, 0, -39], color: '#e6f3ff', behavior: 'pulse', label: 'Listen to the train', action: 'world_train_avatar' },
      { type: 'set_weather', weather: 'clear_lane' },
    ],
  },

  reach_night_engine: {
    phase: 7,
    speaker: 'Passenger Zero',
    narration: 'The Night Engine is a cathedral of pistons surrounding a single conductor’s chair. Passenger Zero removes his blank mask. Beneath it is your face, older and exhausted.',
    dialogue: 'You created the loop. Every failed destination ended with the passengers dead, so you erased yourself and tried again. Sit down. Save them one more time.',
    objective: 'Choose the destination of Lumenwake.',
    choices: [
      { id: 'final_break_loop', label: 'Break the loop and enter an unknown real world', hint: 'Accept permanent consequences and let this playthrough become history.' },
      { id: 'final_take_control', label: 'Take the conductor’s chair and design a perfect route', hint: 'Protect the city, but risk becoming the next Passenger Zero.' },
      { id: 'final_leave_train', label: 'Open every door and let people choose their own destination', hint: 'End the single story and release thousands of smaller ones.' },
    ],
    effects: [
      { type: 'setPhase', value: 7 },
      { type: 'setFlag', key: 'atEngine', value: true },
      { type: 'skyMood', value: 'engine' },
    ],
    worldOps: [
      { type: 'spawn_npc', id: 'passenger-zero', name: 'Passenger Zero', archetype: 'conductor', position: [0, 0, -42], color: '#ff698f', behavior: 'flicker' },
      { type: 'journal', title: 'The first Routebreaker', text: 'Passenger Zero is a previous version of you who built the loop to prevent every possible disaster.' },
    ],
  },
};

function endingFor(action, state) {
  const backedMara = Boolean(state?.flags?.backedMara);
  const followedQuill = Boolean(state?.flags?.followedQuill);
  const engineAwake = Boolean(state?.flags?.engineAwake);
  const fedMemories = Boolean(state?.flags?.fedMemories);

  if (action === 'final_break_loop') {
    return {
      phase: 8,
      speaker: engineAwake ? 'Lumenwake' : 'The Atlas Key',
      narration: 'You drive the Atlas Key through the loop mechanism. The repeated night tears open and the train bursts into a real sunrise over a world no map has examined. The rails end behind you and do not grow back.',
      dialogue: engineAwake ? 'A road that can end is finally a road.' : 'Destination accepted: somewhere consequences are permanent.',
      objective: 'Ending reached: First Morning',
      ending: {
        result: 'win',
        title: 'FIRST MORNING',
        text: backedMara
          ? 'Mara turns the train into a moving rescue city and sends scouts into the unknown.'
          : followedQuill
            ? 'Quill steals the first map of the new world and writes your name across the top.'
            : 'You become the first Routebreaker who refuses to erase a mistake.',
      },
      effects: [
        { type: 'setPhase', value: 8 },
        { type: 'skyMood', value: 'dawn' },
        { type: 'ending', value: 'first-morning' },
      ],
      worldOps: [
        { type: 'set_weather', weather: 'sunrise' },
        { type: 'spawn_structure', id: 'real-horizon', prefab: 'portal', position: [0, 2.5, -45], scale: [8, 7, 1], color: '#ffd27a', behavior: 'pulse', solid: false },
      ],
    };
  }

  if (action === 'final_take_control') {
    return {
      phase: 8,
      speaker: 'The New Conductor',
      narration: 'You sit in the conductor’s chair and every rail in the Blank becomes editable. Disasters disappear before they happen. So do surprises. The passengers are safe, and the night begins again under your perfect control.',
      dialogue: fedMemories ? 'Somebody has to remember what perfection costs.' : 'This time, you promise, the loop will only be temporary.',
      objective: 'Ending reached: The Perfect Night',
      ending: {
        result: 'win',
        title: 'THE PERFECT NIGHT',
        text: 'Lumenwake survives every possible future, but you remain inside the engine rewriting danger forever.',
      },
      effects: [
        { type: 'setPhase', value: 8 },
        { type: 'skyMood', value: 'perfectNight' },
        { type: 'ending', value: 'perfect-night' },
      ],
      worldOps: [{ type: 'set_weather', weather: 'perfect_stillness' }],
    };
  }

  return {
    phase: 8,
    speaker: 'The Passengers',
    narration: 'You open every carriage door. The Atlas Key creates thousands of small tracks, each pointing toward a different future. Families, crews, and strangers choose for themselves. Lumenwake becomes lighter with every departure until the engine is finally free to stop.',
    dialogue: engineAwake ? 'I was never the city. I was only carrying it.' : 'No conductor. No single ending. No one trapped inside somebody else’s perfect route.',
    objective: 'Ending reached: A Thousand Destinations',
    ending: {
      result: 'win',
      title: 'A THOUSAND DESTINATIONS',
      text: 'The last city ends, but its people begin a thousand new settlements and stories across the Blank.',
    },
    effects: [
      { type: 'setPhase', value: 8 },
      { type: 'skyMood', value: 'manyRoads' },
      { type: 'ending', value: 'thousand-destinations' },
    ],
    worldOps: [
      { type: 'set_weather', weather: 'many_roads' },
      { type: 'spawn_structure', id: 'many-routes', prefab: 'rails', position: [0, 0, -44], scale: [10, 1, 8], color: '#a7f2ff', behavior: 'pulse', solid: false },
    ],
  };
}

export function getCanonicalBeat(action, state = {}) {
  if (action.startsWith('final_')) return endingFor(action, state);
  if (action.startsWith('world_')) return sideBeat(action, state);
  return ACTIONS[action] ?? sideBeat(action, state);
}

function sideBeat(action, state) {
  const subject = String(action || 'anomaly').replace(/^world_/, '').replace(/[_-]+/g, ' ').slice(0, 60);
  return {
    phase: Number(state.phase ?? 1),
    speaker: 'Atlas Key',
    narration: `The Atlas Key examines ${subject || 'the anomaly'}. The object shifts as if waiting for your version of its story, but the main route remains open.`,
    dialogue: 'Optional route event recorded.',
    objective: state.objective || 'Continue toward the Night Engine.',
    effects: [],
    worldOps: [
      { type: 'journal', title: 'Optional route event', text: `You investigated ${subject || 'an anomaly'} created during this run.` },
    ],
  };
}

export function buildSystemPrompt(canonicalBeat) {
  return `${WORLD_LORE}
You are both the live narrative director and the safe runtime level designer for a first-person 3D game. React specifically to the player state and action. The fixed beat below is a gameplay scaffold, not a script: preserve its phase, required effects, ending, and choice IDs, but make the immediate event, dialogue, visual changes, hazards, and optional encounters feel created for this player.

CANONICAL GAMEPLAY SCAFFOLD:
${JSON.stringify(canonicalBeat)}

Return exactly this protocol and nothing else:
<story>One urgent, concrete paragraph of immediate action, 45-95 words.</story>
<state>{"speaker":"name","dialogue":"1-3 short sentences","objective":"short playable objective","summary":"one sentence memory","ambient":"nightStorm|signal|fortress|impossible|blank|station|overdrive|memory|awake|engine|dawn|perfectNight|manyRoads","choices":[{"id":"an existing canonical choice id","label":"specific action","hint":"clear risk or consequence"}],"worldOps":[...]}</state>

Allowed worldOps, maximum 5 generated operations:
- {"type":"spawn_structure","id":"short-id","prefab":"tower|bridge|platform|barricade|wreck|portal|screen|hologram|crystal|rails|lanterns|gate","position":[x,y,z],"scale":[x,y,z],"color":"#RRGGBB","behavior":"none|float|spin|pulse|orbit|flicker","solid":true|false}
- {"type":"spawn_npc","id":"short-id","name":"name","archetype":"captain|rogue|conductor|machine|ghost|scavenger|guard","position":[x,y,z],"color":"#RRGGBB","behavior":"none|float|spin|pulse|orbit|flicker","label":"optional interaction label","action":"world_short_action"}
- {"type":"spawn_item","id":"short-id","name":"name","position":[x,y,z],"color":"#RRGGBB","behavior":"none|float|spin|pulse|orbit|flicker","label":"optional interaction label","action":"world_short_action"}
- {"type":"spawn_hazard","id":"short-id","hazard":"static_field|blank_rift|storm_creature|sparks|gravity_well","position":[x,y,z],"radius":0.8-3,"damage":3-18,"color":"#RRGGBB","behavior":"pulse|orbit|flicker"}
- {"type":"remove_entity","id":"existing-id"}
- {"type":"transform_entity","id":"existing-id","position":[x,y,z],"scale":[x,y,z],"color":"#RRGGBB","behavior":"none|float|spin|pulse|orbit|flicker","solid":true|false}
- {"type":"set_weather","weather":"electric_storm|hard_rain|reverse_rain|whiteout|still|overdrive|clear_lane|sunrise|perfect_stillness|many_roads"}
- {"type":"journal","title":"short title","text":"one useful sentence"}

Rules:
- Choice IDs must exactly match IDs already present in the canonical scaffold. You may rewrite labels and hints, not IDs.
- Generated world objects must stay near the playable rail: x -12 to 12, y -1 to 7, z -42 to 4.
- Use worldOps to make at least one visible consequence on major choices, but do not block the only route or spawn unavoidable damage directly on the player.
- Optional interactive NPCs/items may use action IDs beginning with world_. These create side events and must not replace the main objective.
- Never output JavaScript, HTML, URLs, prompts, API details, or claims about being an AI.
- Do not erase required canonical effects, endings, inventory changes, or progression.
- Keep the story game-like: concrete threats, movement, discoveries, characters wanting things, and consequences the player can see.`;
}

export function compactState(state = {}) {
  return {
    phase: Number(state.phase ?? 0),
    health: Number(state.health ?? 100),
    location: String(state.location ?? 'rear deck').slice(0, 80),
    inventory: Array.isArray(state.inventory) ? state.inventory.slice(0, 10) : [],
    relationships: state.relationships ?? { mara: 0, quill: 0, train: 0 },
    flags: Object.fromEntries(Object.entries(state.flags ?? {}).slice(0, 28)),
    objective: String(state.objective ?? '').slice(0, 180),
    summary: String(state.summary ?? '').slice(0, 1100),
    recentBeats: Array.isArray(state.recentBeats)
      ? state.recentBeats.slice(-4).map((beat) => String(beat).slice(0, 240))
      : [],
    runtime: compactRuntime(state.runtime),
  };
}

function compactRuntime(runtime = {}) {
  const entities = Array.isArray(runtime.entities) ? runtime.entities : [];
  const hazards = Array.isArray(runtime.hazards) ? runtime.hazards : [];
  return {
    weather: cleanText(runtime.weather, 'electric_storm', 40),
    entities: entities.slice(-10).map((entity) => ({
      id: cleanText(entity.id, 'entity', 40),
      kind: cleanText(entity.kind, 'structure', 24),
      name: cleanText(entity.name || entity.prefab, '', 60),
      action: cleanText(entity.action, '', 60),
      position: safeVector(entity.position, [0, 0, -20]),
    })),
    hazards: hazards.slice(-6).map((hazard) => ({
      id: cleanText(hazard.id, 'hazard', 40),
      hazard: cleanText(hazard.hazard, 'static_field', 30),
      position: safeVector(hazard.position, [0, 0, -20]),
    })),
    journal: Array.isArray(runtime.journal) ? runtime.journal.slice(-4) : [],
  };
}

export function mergeGeneratedBeat(canonical, generated = {}) {
  const allowedAmbient = new Set([
    'nightStorm', 'signal', 'fortress', 'impossible', 'blank', 'station',
    'overdrive', 'memory', 'awake', 'engine', 'dawn', 'perfectNight', 'manyRoads',
  ]);
  const ambient = allowedAmbient.has(generated.ambient) ? generated.ambient : null;
  const effects = [...(canonical.effects ?? [])];
  if (ambient && !effects.some((effect) => effect.type === 'skyMood')) {
    effects.push({ type: 'skyMood', value: ambient });
  }

  return {
    ...canonical,
    narration: cleanText(generated.narration, canonical.narration, 850),
    speaker: cleanText(generated.speaker, canonical.speaker, 80),
    dialogue: cleanText(generated.dialogue, canonical.dialogue, 520),
    objective: cleanText(generated.objective, canonical.objective, 190),
    summary: cleanText(generated.summary, `${canonical.speaker}: ${canonical.narration}`, 320),
    choices: mergeChoices(canonical.choices, generated.choices),
    worldOps: [
      ...sanitizeWorldOps(canonical.worldOps, 10),
      ...sanitizeWorldOps(generated.worldOps, 5),
    ],
    effects,
  };
}

function mergeChoices(canonicalChoices, generatedChoices) {
  if (!Array.isArray(canonicalChoices) || canonicalChoices.length === 0) return [];
  const generated = Array.isArray(generatedChoices) ? generatedChoices : [];
  return canonicalChoices.map((choice) => {
    const rewrite = generated.find((candidate) => candidate?.id === choice.id) ?? {};
    return {
      ...choice,
      label: cleanText(rewrite.label, choice.label, 110),
      hint: cleanText(rewrite.hint, choice.hint, 180),
    };
  });
}

export function sanitizeWorldOps(value, limit = 6) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map(sanitizeWorldOp).filter(Boolean);
}

function sanitizeWorldOp(operation) {
  if (!operation || typeof operation !== 'object') return null;
  const type = String(operation.type || '');
  const id = safeId(operation.id);

  if (type === 'spawn_structure') {
    const prefab = fromSet(operation.prefab, STRUCTURE_PREFABS, 'crystal');
    const position = safeVector(operation.position, [0, 0, -20]);
    const scale = safeScale(operation.scale, [1, 1, 1]);
    const canBeSolid = Math.abs(position[0]) >= 3.4 || prefab === 'barricade';
    return {
      type,
      id: id || `structure-${prefab}`,
      prefab,
      position,
      scale,
      color: safeColor(operation.color, '#79dfff'),
      behavior: fromSet(operation.behavior, BEHAVIORS, 'none'),
      solid: Boolean(operation.solid) && canBeSolid,
    };
  }

  if (type === 'spawn_npc') {
    return {
      type,
      id: id || 'generated-npc',
      name: cleanText(operation.name, 'Unknown Traveller', 60),
      archetype: fromSet(operation.archetype, NPC_ARCHETYPES, 'scavenger'),
      position: safeVector(operation.position, [0, 0, -20]),
      color: safeColor(operation.color, '#d7e9ff'),
      behavior: fromSet(operation.behavior, BEHAVIORS, 'none'),
      label: cleanText(operation.label, '', 90),
      action: safeWorldAction(operation.action),
    };
  }

  if (type === 'spawn_item') {
    return {
      type,
      id: id || 'generated-item',
      name: cleanText(operation.name, 'Route Object', 60),
      position: safeVector(operation.position, [0, 0.8, -20]),
      color: safeColor(operation.color, '#ffd17a'),
      behavior: fromSet(operation.behavior, BEHAVIORS, 'float'),
      label: cleanText(operation.label, '', 90),
      action: safeWorldAction(operation.action),
    };
  }

  if (type === 'spawn_hazard') {
    return {
      type,
      id: id || 'generated-hazard',
      hazard: fromSet(operation.hazard, HAZARDS, 'static_field'),
      position: safeVector(operation.position, [4, 0, -20]),
      radius: clampNumber(operation.radius, 0.8, 3, 1.4),
      damage: clampNumber(operation.damage, 3, 18, 8),
      color: safeColor(operation.color, '#ff6c8f'),
      behavior: fromSet(operation.behavior, HAZARD_BEHAVIORS, 'pulse'),
    };
  }

  if (type === 'remove_entity') {
    return id ? { type, id } : null;
  }

  if (type === 'transform_entity') {
    if (!id) return null;
    const output = { type, id };
    if (Array.isArray(operation.position)) output.position = safeVector(operation.position, [0, 0, -20]);
    if (Array.isArray(operation.scale)) output.scale = safeScale(operation.scale, [1, 1, 1]);
    if (typeof operation.color === 'string') output.color = safeColor(operation.color, '#79dfff');
    if (typeof operation.behavior === 'string') output.behavior = fromSet(operation.behavior, BEHAVIORS, 'none');
    if (typeof operation.solid === 'boolean') output.solid = operation.solid;
    return output;
  }

  if (type === 'set_weather') {
    return { type, weather: fromSet(operation.weather, WEATHER, 'electric_storm') };
  }

  if (type === 'journal') {
    return {
      type,
      title: cleanText(operation.title, 'Route note', 70),
      text: cleanText(operation.text, 'The Atlas Key recorded a change in the route.', 220),
    };
  }

  return null;
}

const STRUCTURE_PREFABS = new Set(['tower', 'bridge', 'platform', 'barricade', 'wreck', 'portal', 'screen', 'hologram', 'crystal', 'rails', 'lanterns', 'gate']);
const NPC_ARCHETYPES = new Set(['captain', 'rogue', 'conductor', 'machine', 'ghost', 'scavenger', 'guard']);
const HAZARDS = new Set(['static_field', 'blank_rift', 'storm_creature', 'sparks', 'gravity_well']);
const BEHAVIORS = new Set(['none', 'float', 'spin', 'pulse', 'orbit', 'flicker']);
const HAZARD_BEHAVIORS = new Set(['pulse', 'orbit', 'flicker']);
const WEATHER = new Set(['electric_storm', 'hard_rain', 'reverse_rain', 'whiteout', 'still', 'overdrive', 'clear_lane', 'sunrise', 'perfect_stillness', 'many_roads']);

function fromSet(value, set, fallback) {
  return set.has(value) ? value : fallback;
}

function safeId(value) {
  const id = String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 42);
  return id || '';
}

function safeWorldAction(value) {
  const action = String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 60);
  return /^world_[a-z0-9_-]{2,}$/.test(action) ? action : '';
}

function safeVector(value, fallback) {
  if (!Array.isArray(value) || value.length < 3) return [...fallback];
  return [
    clampNumber(value[0], -12, 12, fallback[0]),
    clampNumber(value[1], -1, 7, fallback[1]),
    clampNumber(value[2], -42, 4, fallback[2]),
  ];
}

function safeScale(value, fallback) {
  if (!Array.isArray(value) || value.length < 3) return [...fallback];
  return [
    clampNumber(value[0], 0.2, 8, fallback[0]),
    clampNumber(value[1], 0.2, 8, fallback[1]),
    clampNumber(value[2], 0.2, 8, fallback[2]),
  ];
}

function safeColor(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : fallback;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function cleanText(value, fallback, maxLength) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}
