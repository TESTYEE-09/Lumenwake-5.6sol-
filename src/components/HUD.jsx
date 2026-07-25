export function HUD({ game, focus, position, muted, hasFireworksKey, onToggleMute, onOpenApiKey }) {
  const latest = game.log.at(-1);
  const healthPercent = Math.max(0, Math.min(100, game.health));

  return (
    <div className="hud" aria-live="polite">
      <section className="status-panel glass-panel">
        <div className="eyebrow-row">
          <span>LUMENWAKE</span>
          <span className={`mode-badge mode-${game.apiMode}`}>{modeLabel(game.apiMode)}</span>
        </div>
        <h1>{game.objective}</h1>
        <div className="health-row">
          <span>Resolve</span>
          <div className="health-track"><div className="health-fill" style={{ width: `${healthPercent}%` }} /></div>
          <strong>{game.health}</strong>
        </div>
        <div className="inventory-row">
          <span className="tiny-label">Lantern inventory</span>
          <div className="chips">
            {game.inventory.length ? game.inventory.map((item) => <span className="chip" key={item}>{item}</span>) : <span className="empty-chip">Empty</span>}
          </div>
        </div>
      </section>

      <section className="map-panel glass-panel" aria-label="Minimap">
        <div className="map-title">
          <span>Memory map</span>
          <div className="map-actions">
            <button type="button" onClick={onToggleMute}>{muted ? 'Sound off' : 'Sound on'}</button>
            <button type="button" onClick={onOpenApiKey}>{hasFireworksKey ? 'API key' : 'Add key'}</button>
          </div>
        </div>
        <div className="minimap">
          <div className="map-path" />
          <MapMarker x={50} y={10} label="Jetty" active={game.phase <= 1} />
          <MapMarker x={50} y={38} label="Observatory" active={game.phase >= 2 && game.phase <= 4} />
          <MapMarker x={50} y={69} label="Archive" active={game.phase === 5 || game.phase === 6} />
          <MapMarker x={50} y={91} label="Lens" active={game.phase >= 7} />
          <div
            className="player-dot"
            style={{
              left: `${Math.max(8, Math.min(92, 50 + position[0] * 2.3))}%`,
              top: `${Math.max(5, Math.min(95, 11 + (-position[1] + 5) * 1.75))}%`,
            }}
          />
        </div>
        <div className="location-readout">{game.location}</div>
      </section>

      <section className={`story-panel glass-panel ${game.loading ? 'is-loading' : ''}`}>
        <div className="story-heading">
          <span>{game.loading ? 'The world is rewriting…' : latest?.speaker ?? 'The Lantern'}</span>
          {game.loading && <span className="thinking-dots"><i /><i /><i /></span>}
        </div>
        <p className="narration">{game.loading ? game.streamText || 'Listening to the city…' : latest?.narration || 'The sea waits above and below you.'}</p>
        {!game.loading && latest?.dialogue && <blockquote>{latest.dialogue}</blockquote>}
        {game.warning && <div className="warning">{game.warning}</div>}
        {game.choices.length > 0 && (
          <div className="choice-note">Your next choice will permanently alter this playthrough.</div>
        )}
      </section>

      {focus && !game.loading && !game.choices.length && (
        <div className="interaction-prompt"><kbd>E</kbd><span>{focus.label}</span></div>
      )}

      {!game.choices.length && !game.ending && <div className="controls-hint">WASD move · mouse look · Shift sprint · E interact · click world to capture mouse</div>}
      <div className="crosshair" aria-hidden="true"><span /><span /></div>
    </div>
  );
}

function MapMarker({ x, y, label, active }) {
  return <div className={`map-marker ${active ? 'active' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} title={label} />;
}

function modeLabel(mode) {
  if (mode === 'fireworks-personal') return 'Personal Fireworks';
  if (mode === 'fireworks') return 'Fireworks live';
  if (mode === 'pages-offline') return 'Pages offline';
  if (mode === 'offline') return 'Offline story';
  return 'Connecting';
}
