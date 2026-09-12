let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.15) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch {
    // AudioContext not available
  }
}

export function soundCopy() {
  playTone(880, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(1100, 0.08, 'sine', 0.1), 60);
}

export function soundSuccess() {
  playTone(523, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 80);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 160);
}

export function soundReward() {
  playTone(660, 0.1, 'triangle', 0.15);
  setTimeout(() => playTone(880, 0.1, 'triangle', 0.15), 100);
  setTimeout(() => playTone(1100, 0.15, 'triangle', 0.18), 200);
  setTimeout(() => playTone(1320, 0.2, 'triangle', 0.12), 320);
}

export function soundClick() {
  playTone(600, 0.04, 'square', 0.06);
}

export function soundError() {
  playTone(300, 0.15, 'sawtooth', 0.1);
  setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.08), 120);
}

export function soundNotification() {
  playTone(880, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(1175, 0.15, 'sine', 0.1), 120);
}
