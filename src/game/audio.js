export function createAudioEngine() {
  let context = null;
  let master = null;
  let ambientGain = null;
  let oscillators = [];
  let muted = false;

  function start() {
    if (context) {
      context.resume();
      return;
    }

    context = new AudioContext();
    master = context.createGain();
    ambientGain = context.createGain();
    master.gain.value = 0.32;
    ambientGain.gain.value = 0.12;
    ambientGain.connect(master);
    master.connect(context.destination);

    const notes = [55, 82.41, 110];
    oscillators = notes.map((frequency, index) => {
      const osc = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      osc.type = index === 1 ? 'triangle' : 'sine';
      osc.frequency.value = frequency;
      filter.type = 'lowpass';
      filter.frequency.value = 260 + index * 90;
      gain.gain.value = 0.18 / (index + 1);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ambientGain);
      osc.start();
      return { osc, filter, gain };
    });
  }

  function setMood(mood) {
    if (!context || !ambientGain) return;
    const now = context.currentTime;
    const settings = {
      twilight: [0.11, 250],
      storm: [0.16, 180],
      calm: [0.09, 330],
      moths: [0.13, 430],
      archive: [0.12, 520],
      lens: [0.18, 620],
      dawn: [0.15, 900],
      goldTwilight: [0.13, 720],
      ruin: [0.2, 120],
    }[mood] ?? [0.11, 250];

    ambientGain.gain.cancelScheduledValues(now);
    ambientGain.gain.linearRampToValueAtTime(settings[0], now + 1.5);
    oscillators.forEach(({ filter }, index) => {
      filter.frequency.linearRampToValueAtTime(settings[1] + index * 80, now + 1.5);
    });
  }

  function chime(kind = 'story') {
    if (!context || !master || muted) return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(kind === 'choice' ? 440 : kind === 'ending' ? 220 : 330, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'ending' ? 880 : 660, now + 0.45);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  function toggleMuted() {
    muted = !muted;
    if (master && context) {
      master.gain.setTargetAtTime(muted ? 0 : 0.32, context.currentTime, 0.04);
    }
    return muted;
  }

  return { start, setMood, chime, toggleMuted, get muted() { return muted; } };
}
