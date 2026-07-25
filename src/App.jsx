import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChoiceOverlay } from './components/ChoiceOverlay.jsx';
import { EndingOverlay } from './components/EndingOverlay.jsx';
import { HUD } from './components/HUD.jsx';
import { StartOverlay } from './components/StartOverlay.jsx';
import { createAudioEngine } from './game/audio.js';
import { useStoryGame } from './game/useStoryGame.js';
import { World } from './game/World.jsx';

export default function App() {
  const audio = useMemo(() => createAudioEngine(), []);
  const [focus, setFocus] = useState(null);
  const [position, setPosition] = useState([0, 5.5]);
  const [muted, setMuted] = useState(false);

  const handleBeat = useCallback((beat) => {
    audio.chime(beat.ending ? 'ending' : beat.choices?.length ? 'choice' : 'story');
  }, [audio]);

  const { game, sendAction, startGame, restartGame, updateLocation } = useStoryGame(handleBeat);

  useEffect(() => {
    audio.setMood(game.skyMood);
  }, [audio, game.skyMood]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'KeyE' && focus && !game.loading && !game.choices.length) {
        sendAction(focus.action);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focus, game.loading, game.choices.length, sendAction]);

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

  return (
    <main className={`app mood-${game.skyMood}`}>
      <World game={game} onFocus={setFocus} onPosition={handlePosition} />
      {game.started && <HUD game={game} focus={focus} position={position} muted={muted} onToggleMute={toggleMute} />}
      {!game.started && <StartOverlay onStart={handleStart} />}
      <ChoiceOverlay choices={game.choices} onChoose={sendAction} disabled={game.loading} />
      <EndingOverlay ending={game.ending} log={game.log} onRestart={handleRestart} />
    </main>
  );
}

function zoneFromZ(z) {
  if (z > -7) return 'The waking jetty';
  if (z > -24) return 'The drowned observatory';
  if (z > -38) return 'The forbidden archive';
  return 'The Solar Lens';
}
