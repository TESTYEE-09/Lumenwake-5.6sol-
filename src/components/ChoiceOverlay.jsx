export function ChoiceOverlay({ choices, onChoose, disabled }) {
  if (!choices.length) return null;

  return (
    <div className="overlay choice-overlay">
      <section className="choice-card glass-panel">
        <span className="choice-kicker">A memory becomes real</span>
        <h2>What do you do?</h2>
        <div className="choice-list">
          {choices.map((choice, index) => (
            <button key={choice.id} type="button" disabled={disabled} onClick={() => onChoose(choice.id)}>
              <span className="choice-number">0{index + 1}</span>
              <span><strong>{choice.label}</strong><small>{choice.hint}</small></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
