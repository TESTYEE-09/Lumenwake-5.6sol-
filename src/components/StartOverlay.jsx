export function StartOverlay({ onStart }) {
  return (
    <div className="overlay start-overlay">
      <div className="start-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="sun-core" />
      </div>
      <section className="start-card">
        <div className="start-eyebrow">A live-written 3D narrative</div>
        <h1>LUMENWAKE</h1>
        <p>
          The sun has been missing for 113 years. Your lantern can turn memories into reality, and the drowned city changes its story around every decision you make.
        </p>
        <button type="button" onClick={onStart}>Wake the lantern</button>
        <small>Headphones recommended · no account required · offline story fallback included</small>
      </section>
    </div>
  );
}
