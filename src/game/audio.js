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

    const notes = [41.2, 61.74, 82.41, 123.47];
    oscillators = notes.map((frequency, index) => {
      const osc = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      osc.type = index % 2 ? 'triangle' : 'sine';
      osc.frequency.value = frequency;
      filter.type = 'lowpass';
      filter.frequency.value = 210 + index * 95;
      gain.gain.value = 0.16 / (index + 1);
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
      nightStorm: [0.14, 220],
      signal: [0.12, 420],
      fortress: [0.16, 260],
      impossible: [0.13, 560],
      blank: [0.08, 120],
      station: [0.15, 340],
      overdrive: [0.2, 720],
      memory: [0.1, 610],
      awake: [0.14, 520],
      engine: [0.19, 180],
      dawn: [0.15, 920],
      perfectNight: [0.11, 300],
      manyRoads: [0.14, 780],
    }[mood] ?? [0.12, 260];

    ambientGain.gain.cancelScheduledValues(now);
    ambientGain.gain.linearRampToValueAtTime(settings[0], now + 1.2);
    oscillators.forEach(({ filter, osc }, index) => {
      filter.frequency.linearRampToValueAtTime(settings[1] + index * 85, now + 1.2);
      const ratio = mood === 'overdrive' ? 1.08 : mood === 'dawn' ? 1.18 : 1;
      osc.detune.linearRampToValueAtTime((ratio - 1) * 420 + index * 2, now + 1.2);
    });
  }

  function chime(kind = 'story') {
    if (!context || !master || muted) return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    osc.type = kind === 'choice' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(kind === 'choice' ? 392 : kind === 'ending' ? 196 : 294, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'ending' ? 784 : 622, now + 0.45);
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
