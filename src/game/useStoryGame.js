import { useCallback, useEffect, useRef, useState } from 'react';
import { getCanonicalBeat, mergeGeneratedBeat } from '../../server/storyEngine.js';

const STORY_API_BASE = String(import.meta.env.VITE_STORY_API_URL || '').replace(/\/$/, '');
const IS_GITHUB_PAGES = typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');

const INITIAL_GAME = {
  started: false,
  loading: false,
  health: 100,
  phase: 0,
  location: 'The waking jetty',
  inventory: [],
  relationships: { warden: 0, archivist: 0 },
  flags: {},
  objective: 'Wake the lantern.',
  choices: [],
  log: [],
  summary: '',
  streamText: '',
  warning: '',
  ending: null,
  skyMood: 'twilight',
  apiMode: 'unknown',
};

export function useStoryGame(onBeat) {
  const [game, setGame] = useState(INITIAL_GAME);
  const gameRef = useRef(game);
  const requestRef = useRef(null);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const updateLocation = useCallback((location) => {
    if (!location || gameRef.current.location === location) return;
    setGame((current) => ({ ...current, location }));
  }, []);

  const sendAction = useCallback(
    async (action) => {
      if (!action || gameRef.current.loading || gameRef.current.ending) return;

      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      const snapshot = gameRef.current;
      setGame((current) => ({
        ...current,
        loading: true,
        streamText: '',
        warning: '',
        choices: [],
      }));

      try {
        if (IS_GITHUB_PAGES && !STORY_API_BASE) {
          await runLocalStory(action, snapshot, controller.signal, setGame, onBeat, true);
          return;
        }

        const response = await fetch(`${STORY_API_BASE}/api/story`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            action,
            state: stateForRequest(snapshot),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Story server returned ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const packets = buffer.split('\n\n');
          buffer = packets.pop() ?? '';

          for (const packet of packets) {
            handlePacket(packet, setGame, onBeat);
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error);
          await runLocalStory(action, snapshot, controller.signal, setGame, onBeat, false);
        }
      } finally {
        requestRef.current = null;
      }
    },
    [onBeat],
  );

  const startGame = useCallback(() => {
    setGame((current) => ({ ...current, started: true }));
    window.setTimeout(() => sendAction('begin'), 80);
  }, [sendAction]);

  const restartGame = useCallback(() => {
    requestRef.current?.abort();
    setGame({ ...INITIAL_GAME, started: true });
    window.setTimeout(() => sendAction('begin'), 80);
  }, [sendAction]);

  return { game, sendAction, startGame, restartGame, updateLocation };
}

function stateForRequest(snapshot) {
  return {
    phase: snapshot.phase,
    health: snapshot.health,
    location: snapshot.location,
    inventory: snapshot.inventory,
    relationships: snapshot.relationships,
    flags: snapshot.flags,
    objective: snapshot.objective,
    summary: snapshot.summary,
    recentBeats: snapshot.log.slice(-3).map((entry) => entry.narration),
  };
}

async function runLocalStory(action, snapshot, signal, setGame, onBeat, pagesMode) {
  const canonical = getCanonicalBeat(action, stateForRequest(snapshot));
  const beat = mergeGeneratedBeat(canonical, {});
  const warning = pagesMode
    ? 'GitHub Pages cannot safely store an API key, so this hosted build is using the complete offline story director.'
    : 'The live story server could not be reached, so the offline story director took over.';

  setGame((current) => ({
    ...current,
    apiMode: pagesMode ? 'pages-offline' : 'offline',
    streamText: '',
    warning,
  }));

  for (const word of beat.narration.split(/(\s+)/)) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    setGame((current) => ({ ...current, streamText: `${current.streamText}${word}` }));
    await sleep(10);
  }

  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  setGame((current) => applyBeat(current, beat));
  onBeat?.(beat);
}

function handlePacket(packet, setGame, onBeat) {
  const event = packet.match(/^event:\s*(.+)$/m)?.[1]?.trim() ?? 'message';
  const rawData = packet.match(/^data:\s*(.+)$/m)?.[1];
  if (!rawData) return;

  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    return;
  }

  if (event === 'token') {
    setGame((current) => ({
      ...current,
      streamText: `${current.streamText}${data.text ?? ''}`,
    }));
  } else if (event === 'meta') {
    setGame((current) => ({ ...current, apiMode: data.mode ?? 'unknown' }));
  } else if (event === 'warning') {
    setGame((current) => ({ ...current, warning: data.message ?? '' }));
  } else if (event === 'story') {
    setGame((current) => applyBeat(current, data));
    onBeat?.(data);
  } else if (event === 'done') {
    setGame((current) => ({ ...current, loading: false, streamText: '' }));
  }
}

function applyBeat(game, beat) {
  let next = {
    ...game,
    loading: false,
    streamText: '',
    objective: beat.objective || game.objective,
    choices: Array.isArray(beat.choices) ? beat.choices : [],
    summary: beat.summary || `${beat.speaker}: ${beat.narration}`,
    ending: beat.ending ?? game.ending,
    log: [
      ...game.log,
      {
        speaker: beat.speaker || 'The Lantern',
        narration: beat.narration || '',
        dialogue: beat.dialogue || '',
      },
    ].slice(-12),
  };

  for (const effect of beat.effects ?? []) {
    next = applyEffect(next, effect);
  }

  return next;
}

function applyEffect(game, effect) {
  switch (effect.type) {
    case 'setPhase':
      return { ...game, phase: Number(effect.value) };
    case 'addItem':
      return game.inventory.includes(effect.value)
        ? game
        : { ...game, inventory: [...game.inventory, effect.value] };
    case 'removeItem':
      return { ...game, inventory: game.inventory.filter((item) => item !== effect.value) };
    case 'setFlag':
      return { ...game, flags: { ...game.flags, [effect.key]: effect.value } };
    case 'relationship':
      return {
        ...game,
        relationships: {
          ...game.relationships,
          [effect.key]: (game.relationships[effect.key] ?? 0) + Number(effect.delta ?? 0),
        },
      };
    case 'damage':
      return { ...game, health: Math.max(0, game.health - Number(effect.value ?? 0)) };
    case 'heal':
      return { ...game, health: Math.min(100, game.health + Number(effect.value ?? 0)) };
    case 'skyMood':
      return { ...game, skyMood: effect.value };
    case 'ending':
      return { ...game, flags: { ...game.flags, endingId: effect.value } };
    default:
      return game;
  }
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
