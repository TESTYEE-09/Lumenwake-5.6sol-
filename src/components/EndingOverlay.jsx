export function EndingOverlay({ ending, log, onRestart }) {
  if (!ending) return null;
  const finalBeat = log.at(-1);
  return (
    <div className={`overlay ending-overlay ending-${ending.result}`}>
      <section className="ending-card glass-panel">
        <span className="ending-kicker">{ending.result === 'win' ? 'Lumenwake remembers' : 'Lumenwake is lost'}</span>
        <h2>{ending.title}</h2>
        <p>{finalBeat?.narration}</p>
        <blockquote>{finalBeat?.dialogue}</blockquote>
        <div className="ending-summary">{ending.text}</div>
        <button type="button" onClick={onRestart}>Begin another timeline</button>
      </section>
    </div>
  );
}
