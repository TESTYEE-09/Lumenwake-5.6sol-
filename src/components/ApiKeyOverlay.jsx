import { useEffect, useState } from 'react';

export function ApiKeyOverlay({ currentKey, onSave, onPlayOffline, onClose }) {
  const [value, setValue] = useState(currentKey || '');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(currentKey || '');
    setError('');
  }, [currentKey]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const key = value.trim();
    if (key.length < 12) {
      setError('Paste a valid Fireworks API key, or choose offline mode.');
      return;
    }
    onSave(key);
  };

  return (
    <div className="overlay api-key-overlay" role="dialog" aria-modal="true" aria-labelledby="api-key-title">
      <section className="api-key-card glass-panel">
        <div className="api-key-kicker">Connect the live storyteller</div>
        <h2 id="api-key-title">Add your Fireworks API key</h2>
        <p>
          Lumenwake uses your key to generate live DeepSeek V4 Flash story beats. The key is saved only in this browser and sent directly to Fireworks. It is never committed to GitHub.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="fireworks-key">Fireworks API key</label>
          <div className="api-key-input-row">
            <input
              id="fireworks-key"
              type={visible ? 'text' : 'password'}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError('');
              }}
              placeholder="Paste your Fireworks key"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
              autoFocus
            />
            <button className="key-visibility-button" type="button" onClick={() => setVisible((shown) => !shown)}>
              {visible ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <div className="api-key-error">{error}</div>}

          <div className="api-key-actions">
            <button className="primary-key-button" type="submit">Save key and continue</button>
            <button className="secondary-key-button" type="button" onClick={onPlayOffline}>Play offline</button>
            {onClose && <button className="text-key-button" type="button" onClick={onClose}>Cancel</button>}
          </div>
        </form>

        <div className="api-key-footer">
          <a href="https://app.fireworks.ai/settings/users/api-keys" target="_blank" rel="noreferrer">Create or manage a Fireworks key</a>
          <span>Do not save a key on a shared device.</span>
        </div>
      </section>
    </div>
  );
}
