export function StartOverlay({ onStart }) {
  return (
    <div className="overlay start-overlay">
      <div className="start-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="sun-core" />
      </div>
      <section className="start-card">
        <div className="start-eyebrow">A live-built 3D adventure</div>
        <h1>LUMENWAKE</h1>
        <p>
          The last city is a fortress train trapped in the same night. You carry the Atlas Key, a machine that makes described routes real. DeepSeek can build new stations, strangers, hazards, and side paths around the choices you make.
        </p>
        <button type="button" onClick={onStart}>Board the Night Engine</button>
        <small>WASD exploration · live world generation with Fireworks · complete offline campaign included</small>
      </section>
    </div>
  );
}
