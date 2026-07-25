import { useCallback, useEffect, useMemo, useState } from 'react';
import './api-key.css';
import './runtime-world.css';
import { ApiKeyOverlay } from './components/ApiKeyOverlay.jsx';
import { ChoiceOverlay } from './components/ChoiceOverlay.jsx';
import { EndingOverlay } from './components/EndingOverlay.jsx';
import { HUD } from './components/HUD.jsx';
import { StartOverlay } from './components/StartOverlay.jsx';
import { createAudioEngine } from './game/audio.js';
import { useStoryGame } from './game/useStoryGame.js';
import { World } from './game/World.jsx';

const FIREWORKS_KEY_STORAGE = 'lumenwake.fireworksApiKey';

export default function App() {
  const audio = useMemo(() => createAudioEngine(), []);
  const [focus, setFocus] = useState(null);
  const [position, setPosition] = useState([0, 5.5]);
  const [muted, setMuted] = useState(false);
  const [fireworksKey, setFireworksKey] = useState(readStoredKey);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(() => !readStoredKey());

  const handleBeat = useCallback((beat) => {
    audio.chime(beat.ending ? 'ending' : beat.choices?.length ? 'choice' : 'story');
  }, [audio]);

  const {
    game,
    sendAction,
    startGame,
    restartGame,
    updateLocation,
    hitHazard,
  } = useStoryGame(handleBeat, fireworksKey);

  useEffect(() => {
    audio.setMood(game.skyMood);
  }, [audio, game.skyMood]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'KeyE' && focus && !game.loading && !game.choices.length && !showApiKeyPrompt) {
        sendAction(focus.action);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focus, game.loading, game.choices.length, sendAction, showApiKeyPrompt]);

  const handleStart = () => {
    audio.start();
    startGame();
  };

  const handleRestart = () => {
    audio.start();
    setFocus(null);
    setPosition([0, 5.5]);
    restartGame();
  };

  const handlePosition = useCallback((nextPosition) => {
    setPosition(nextPosition);
    updateLocation(zoneFromZ(nextPosition[1]));
  }, [updateLocation]);

  const toggleMute = () => {
    setMuted(audio.toggleMuted());
  };

  const openApiKeyPrompt = () => {
    document.exitPointerLock?.();
    setShowApiKeyPrompt(true);
  };

  const saveFireworksKey = (key) => {
    try {
      window.localStorage.setItem(FIREWORKS_KEY_STORAGE, key);
    } catch {
      // The game can still use the key for this tab if storage is unavailable.
    }
    setFireworksKey(key);
    setShowApiKeyPrompt(false);
  };

  const playOffline = () => {
    try {
      window.localStorage.removeItem(FIREWORKS_KEY_STORAGE);
    } catch {
      // Ignore storage errors and continue in offline mode.
    }
    setFireworksKey('');
    setShowApiKeyPrompt(false);
  };

  return (
    <main className={`app mood-${game.skyMood}`}>
      <World
        game={game}
        onFocus={setFocus}
        onPosition={handlePosition}
        onHazard={hitHazard}
      />
      {game.started && (
        <HUD
          game={game}
          focus={focus}
          position={position}
          muted={muted}
          hasFireworksKey={Boolean(fireworksKey)}
          onToggleMute={toggleMute}
          onOpenApiKey={openApiKeyPrompt}
        />
      )}
      {!game.started && <StartOverlay onStart={handleStart} />}
      <ChoiceOverlay choices={game.choices} onChoose={sendAction} disabled={game.loading} />
      <EndingOverlay ending={game.ending} log={game.log} onRestart={handleRestart} />
      {showApiKeyPrompt && (
        <ApiKeyOverlay
          currentKey={fireworksKey}
          onSave={saveFireworksKey}
          onPlayOffline={playOffline}
          onClose={fireworksKey ? () => setShowApiKeyPrompt(false) : null}
        />
      )}
    </main>
  );
}

function readStoredKey() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(FIREWORKS_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function zoneFromZ(z) {
  if (z > -7) return 'Rear service deck';
  if (z > -24) return 'Signal yard';
  if (z > -38) return 'Unwritten Station';
  return 'Night Engine crown';
}
