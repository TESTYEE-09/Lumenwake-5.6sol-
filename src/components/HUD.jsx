export function HUD({ game, focus, position, muted, hasFireworksKey, onToggleMute, onOpenApiKey }) {
  const latest = game.log.at(-1);
  const healthPercent = Math.max(0, Math.min(100, game.health));
  const journalEntry = game.runtime?.journal?.at(-1);
  const generatedCount = (game.runtime?.entities?.length || 0) + (game.runtime?.hazards?.length || 0);

  return (
    <div className="hud" aria-live="polite">
      <section className="status-panel glass-panel">
        <div className="eyebrow-row">
          <span>LUMENWAKE · NIGHT ENGINE</span>
          <span className={`mode-badge mode-${game.apiMode}`}>{modeLabel(game.apiMode)}</span>
        </div>
        <h1>{game.objective}</h1>
        <div className="health-row">
          <span>Resolve</span>
          <div className="health-track"><div className="health-fill" style={{ width: `${healthPercent}%` }} /></div>
          <strong>{game.health}</strong>
        </div>
        <div className="inventory-row">
          <span className="tiny-label">Route inventory</span>
          <div className="chips">
            {game.inventory.length ? game.inventory.map((item) => <span className="chip" key={item}>{item}</span>) : <span className="empty-chip">Empty</span>}
            <span className="chip">World edits {generatedCount}</span>
          </div>
        </div>
        {journalEntry && (
          <div className="route-journal">
            <strong>{journalEntry.title}</strong>
            <span>{journalEntry.text}</span>
          </div>
        )}
      </section>

      <section className="map-panel glass-panel" aria-label="Route map">
        <div className="map-title">
          <span>Live route</span>
          <div className="map-actions">
            <button type="button" onClick={onToggleMute}>{muted ? 'Sound off' : 'Sound on'}</button>
            <button type="button" onClick={onOpenApiKey}>{hasFireworksKey ? 'API key' : 'Add key'}</button>
          </div>
        </div>
        <div className="minimap">
          <div className="map-path" />
          <MapMarker x={50} y={10} label="Rear deck" active={game.phase <= 1} />
          <MapMarker x={50} y={38} label="Signal yard" active={game.phase >= 2 && game.phase <= 4} />
          <MapMarker x={50} y={69} label="Unwritten Station" active={game.phase === 5} />
          <MapMarker x={50} y={91} label="Night Engine" active={game.phase >= 6} />
          <div
            className="player-dot"
            style={{
              left: `${Math.max(8, Math.min(92, 50 + position[0] * 2.3))}%`,
              top: `${Math.max(5, Math.min(95, 11 + (-position[1] + 5) * 1.75))}%`,
            }}
          />
        </div>
        <div className="location-readout">{game.location} · {weatherLabel(game.runtime?.weather)}</div>
      </section>

      <section className={`story-panel glass-panel ${game.loading ? 'is-loading' : ''}`}>
        <div className="story-heading">
          <span>{game.loading ? 'The route is compiling…' : latest?.speaker ?? 'Atlas Key'}</span>
          {game.loading && <span className="thinking-dots"><i /><i /><i /></span>}
        </div>
        <p className="narration">{game.loading ? game.streamText || 'The Blank is deciding what becomes real…' : latest?.narration || 'The train waits above a world that has not been written yet.'}</p>
        {!game.loading && latest?.dialogue && <blockquote>{latest.dialogue}</blockquote>}
        {game.warning && <div className="warning">{game.warning}</div>}
        {game.choices.length > 0 && (
          <div className="choice-note">This choice changes the route, characters, and objects that can exist later.</div>
        )}
      </section>

      {focus && !game.loading && !game.choices.length && (
        <div className="interaction-prompt"><kbd>E</kbd><span>{focus.label}</span></div>
      )}

      {!game.choices.length && !game.ending && <div className="controls-hint">WASD move · mouse look · Shift sprint · E interact · avoid generated hazards</div>}
      <div className="crosshair" aria-hidden="true"><span /><span /></div>
    </div>
  );
}

function MapMarker({ x, y, label, active }) {
  return <div className={`map-marker ${active ? 'active' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} title={label} />;
}

function modeLabel(mode) {
  if (mode === 'fireworks-personal') return 'Live world director';
  if (mode === 'fireworks') return 'Server world director';
  if (mode === 'pages-offline') return 'Handcrafted route';
  if (mode === 'offline') return 'Fallback route';
  return 'Connecting';
}

function weatherLabel(weather) {
  return String(weather || 'electric_storm').replace(/_/g, ' ');
}
