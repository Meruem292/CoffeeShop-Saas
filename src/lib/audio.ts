import { ShopSettings } from '../types';

let audioCtxInstance: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtxInstance) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtxInstance = new AudioCtx();
    }
  }
  if (audioCtxInstance && audioCtxInstance.state === 'suspended') {
    audioCtxInstance.resume().catch(() => {});
  }
  return audioCtxInstance;
}

// Global unlock listener for browser autoplay restrictions
if (typeof window !== 'undefined') {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    }
  };
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

// Helper to play a custom audio URL
function playAudioUrl(url: string, volume: number = 1) {
  try {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch((e) => console.error("Audio playback error:", e));
  } catch (err) {
    console.error("Audio URL play error:", err);
  }
}

// ==========================================
// PROCEDURAL SOUND SYNTHESIZERS
// ==========================================

/**
 * Default Theme - Order Received
 * Warm dual-tone cafe bell chime (D5 -> A5 & D6)
 */
function synthesizeOrderSoundDefault(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  // First tone: 587.33 Hz (D5), Second tone: 880 Hz (A5)
  osc1.frequency.setValueAtTime(587.33, now);
  osc1.frequency.setValueAtTime(880, now + 0.12);

  osc2.frequency.setValueAtTime(880, now);
  osc2.frequency.setValueAtTime(1174.66, now + 0.12);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(Math.min(volume * 0.7, 1), now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.5);
  osc2.stop(now + 0.5);
}

/**
 * Christmas Theme - Order Received
 * Festive bright Jingle Bells motif: E5 -> G#5 -> B5 -> E6 glockenspiel sparkle
 */
function synthesizeOrderSoundChristmas(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 659.25, time: 0.0, dur: 0.28 },   // E5
    { freq: 830.61, time: 0.1, dur: 0.28 },   // G#5
    { freq: 987.77, time: 0.2, dur: 0.32 },   // B5
    { freq: 1318.51, time: 0.32, dur: 0.55 }, // E6 (resolving bell)
  ];

  notes.forEach((note) => {
    const oscMain = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    oscMain.type = 'sine';
    oscHarmonic.type = 'triangle';

    oscMain.frequency.setValueAtTime(note.freq, now + note.time);
    oscHarmonic.frequency.setValueAtTime(note.freq * 2, now + note.time); // Bell overtone

    const startTime = now + note.time;
    const peakVolume = Math.min(volume * 0.55, 1);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    oscMain.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(ctx.destination);

    oscMain.start(startTime);
    oscHarmonic.start(startTime);
    oscMain.stop(startTime + note.dur + 0.05);
    oscHarmonic.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Halloween Theme - Order Received
 * Spooky music-box minor motif: D5 -> F5 -> A5 -> C#6 with detuned chorus resonance
 */
function synthesizeOrderSoundHalloween(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 587.33, time: 0.0, dur: 0.35 },   // D5
    { freq: 698.46, time: 0.12, dur: 0.35 },  // F5 (Minor 3rd)
    { freq: 880.00, time: 0.24, dur: 0.38 },  // A5 (5th)
    { freq: 1108.73, time: 0.38, dur: 0.65 }, // C#6 (Major 7th spooky dissonance)
  ];

  notes.forEach((note) => {
    const osc1 = ctx.createOscillator();
    const oscDetuned = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    oscDetuned.type = 'sine';

    osc1.frequency.setValueAtTime(note.freq, now + note.time);
    oscDetuned.frequency.setValueAtTime(note.freq * 1.01, now + note.time); // Subtle detune for eerie shimmer

    const startTime = now + note.time;
    const peakVolume = Math.min(volume * 0.5, 1);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc1.connect(gain);
    oscDetuned.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    oscDetuned.start(startTime);
    osc1.stop(startTime + note.dur + 0.05);
    oscDetuned.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Default Theme - Chat Message
 * Dual ding-dong chime (A5 -> D6)
 */
function synthesizeChatSoundDefault(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  [0, 0.14].forEach((delay, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    const freq = idx === 0 ? 880 : 1174.66; // A5 then D6
    osc.frequency.setValueAtTime(freq, now + delay);

    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.75, 1), now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + delay);
    osc.stop(now + delay + 0.35);
  });
}

/**
 * Christmas Theme - Chat Message
 * Sleigh bells double jingle (B5 & E6) with festive shimmer
 */
function synthesizeChatSoundChristmas(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const bells = [
    { delay: 0.0, freq1: 987.77, freq2: 1975.53, dur: 0.28 },  // B5 & B6
    { delay: 0.12, freq1: 1318.51, freq2: 2637.02, dur: 0.4 }, // E6 & E7
  ];

  bells.forEach(({ delay, freq1, freq2, dur }) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(freq1, now + delay);
    osc2.frequency.setValueAtTime(freq2, now + delay);

    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.6, 1), now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now + delay);
    osc2.start(now + delay);
    osc1.stop(now + delay + dur + 0.05);
    osc2.stop(now + delay + dur + 0.05);
  });
}

/**
 * Halloween Theme - Chat Message
 * Spooky music-box plink (G#5 -> E5 eerie interval)
 */
function synthesizeChatSoundHalloween(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { delay: 0.0, freq: 830.61, dur: 0.3 }, // G#5
    { delay: 0.14, freq: 659.25, dur: 0.42 }, // E5
  ];

  notes.forEach(({ delay, freq, dur }) => {
    const osc = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    oscSub.type = 'sine';

    osc.frequency.setValueAtTime(freq, now + delay);
    oscSub.frequency.setValueAtTime(freq * 0.5, now + delay); // Subtle hollow sub

    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.65, 1), now + delay + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

    osc.connect(gain);
    oscSub.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + delay);
    oscSub.start(now + delay);
    osc.stop(now + delay + dur + 0.05);
    oscSub.stop(now + delay + dur + 0.05);
  });
}

/**
 * Default Theme - Start Ordering
 * Upward bright 4-note ascending chord triad (C5 -> E5 -> G5 -> C6)
 */
function synthesizeStartOrderingStandard(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.22 },  // C5
    { freq: 659.25, time: 0.08, dur: 0.22 }, // E5
    { freq: 783.99, time: 0.16, dur: 0.25 }, // G5
    { freq: 1046.50, time: 0.26, dur: 0.45 }, // C6
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.7, 1), startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Christmas Theme - Start Ordering
 * Ascending Christmas glockenspiel bell sparkle (E5 -> G#5 -> B5 -> E6)
 */
function synthesizeStartOrderingChristmas(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 659.25, time: 0.0, dur: 0.25 },   // E5
    { freq: 830.61, time: 0.08, dur: 0.25 },  // G#5
    { freq: 987.77, time: 0.16, dur: 0.28 },  // B5
    { freq: 1318.51, time: 0.26, dur: 0.55 }, // E6
  ];

  notes.forEach((note) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(note.freq, now + note.time);
    osc2.frequency.setValueAtTime(note.freq * 2, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.6, 1), startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + note.dur + 0.05);
    osc2.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Halloween Theme - Start Ordering
 * Mysterious ascending minor motif (C5 -> Eb5 -> G5 -> C6) with eerie detune
 */
function synthesizeStartOrderingHalloween(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.28 },  // C5
    { freq: 622.25, time: 0.1, dur: 0.28 },  // Eb5 (minor 3rd)
    { freq: 783.99, time: 0.2, dur: 0.32 },  // G5
    { freq: 1046.50, time: 0.32, dur: 0.6 }, // C6
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const oscDetuned = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    oscDetuned.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);
    oscDetuned.frequency.setValueAtTime(note.freq * 1.015, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.55, 1), startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc.connect(gain);
    oscDetuned.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    oscDetuned.start(startTime);
    osc.stop(startTime + note.dur + 0.05);
    oscDetuned.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Default Theme - Start Over / Reset Session
 * Gentle downward 3-note reset tone (G5 -> E5 -> C5)
 */
function synthesizeStartOverStandard(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 783.99, time: 0.0, dur: 0.18 },  // G5
    { freq: 659.25, time: 0.09, dur: 0.18 }, // E5
    { freq: 523.25, time: 0.18, dur: 0.35 }, // C5
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.65, 1), startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Christmas Theme - Start Over / Reset Session
 * Downward sleigh bell reset cascade (B5 -> G5 -> C5)
 */
function synthesizeStartOverChristmas(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 987.77, time: 0.0, dur: 0.2 },   // B5
    { freq: 783.99, time: 0.1, dur: 0.2 },   // G5
    { freq: 523.25, time: 0.2, dur: 0.45 },  // C5
  ];

  notes.forEach((note) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(note.freq, now + note.time);
    osc2.frequency.setValueAtTime(note.freq * 2, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.55, 1), startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + note.dur + 0.05);
    osc2.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Halloween Theme - Start Over / Reset Session
 * Downward minor reset tone (G5 -> Eb5 -> B4 sawtooth sweep)
 */
function synthesizeStartOverHalloween(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 783.99, time: 0.0, dur: 0.22 },  // G5
    { freq: 622.25, time: 0.11, dur: 0.22 }, // Eb5
    { freq: 493.88, time: 0.22, dur: 0.45 }, // B4
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.6, 1), startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Default Theme - Add to Cart
 * Crisp and punchy dual pop / bubble chime (F5 -> A5)
 */
function synthesizeAddToCartStandard(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 698.46, time: 0.0, dur: 0.12 }, // F5
    { freq: 880.00, time: 0.06, dur: 0.22 }, // A5
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.75, 1), startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Christmas Theme - Add to Cart
 * High festive crystal bell tap (G#5 -> E6)
 */
function synthesizeAddToCartChristmas(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 830.61, time: 0.0, dur: 0.15 }, // G#5
    { freq: 1318.51, time: 0.07, dur: 0.28 }, // E6
  ];

  notes.forEach((note) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(note.freq, now + note.time);
    osc2.frequency.setValueAtTime(note.freq * 2, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.65, 1), startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + note.dur + 0.05);
    osc2.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Halloween Theme - Add to Cart
 * Playful bubbling cauldron pop / woodblock plop (D5 -> G#5 tritone pop)
 */
function synthesizeAddToCartHalloween(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 587.33, time: 0.0, dur: 0.14 }, // D5
    { freq: 830.61, time: 0.07, dur: 0.24 }, // G#5
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, now + note.time);
    osc.frequency.exponentialRampToValueAtTime(note.freq * 1.3, now + note.time + 0.04);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.7, 1), startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Default Theme - Confirm Order
 * Triumphant 4-note victory chord (C5 -> E5 -> G5 -> C6 with 5th harmonic)
 */
function synthesizeConfirmOrderStandard(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.35 },  // C5
    { freq: 659.25, time: 0.1, dur: 0.35 },  // E5
    { freq: 783.99, time: 0.2, dur: 0.4 },   // G5
    { freq: 1046.50, time: 0.32, dur: 0.75 }, // C6
  ];

  notes.forEach((note) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(note.freq, now + note.time);
    osc2.frequency.setValueAtTime(note.freq * 1.5, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.65, 1), startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + note.dur + 0.05);
    osc2.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Christmas Theme - Confirm Order
 * Joyful Christmas celebration bell chord (E5 -> G#5 -> B5 -> E6 burst)
 */
function synthesizeConfirmOrderChristmas(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 659.25, time: 0.0, dur: 0.38 },   // E5
    { freq: 830.61, time: 0.1, dur: 0.38 },   // G#5
    { freq: 987.77, time: 0.2, dur: 0.42 },   // B5
    { freq: 1318.51, time: 0.32, dur: 0.85 }, // E6
  ];

  notes.forEach((note) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(note.freq, now + note.time);
    osc2.frequency.setValueAtTime(note.freq * 2, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.6, 1), startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + note.dur + 0.05);
    osc2.stop(startTime + note.dur + 0.05);
  });
}

/**
 * Halloween Theme - Confirm Order
 * Spooky resolution chord chime (D5 -> F5 -> A5 -> D6)
 */
function synthesizeConfirmOrderHalloween(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 587.33, time: 0.0, dur: 0.38 },  // D5
    { freq: 698.46, time: 0.12, dur: 0.38 }, // F5
    { freq: 880.00, time: 0.24, dur: 0.42 }, // A5
    { freq: 1174.66, time: 0.38, dur: 0.8 }, // D6
  ];

  notes.forEach((note) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(note.freq, now + note.time);
    osc2.frequency.setValueAtTime(note.freq * 1.01, now + note.time);

    const startTime = now + note.time;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.min(volume * 0.55, 1), startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + note.dur + 0.05);
    osc2.stop(startTime + note.dur + 0.05);
  });
}


// ==========================================
// PROCEDURAL AMBIENT SOUND GENERATOR & ENGINE
// ==========================================

interface ActiveAmbientNodes {
  gainNode: GainNode;
  stop: () => void;
}

let activeProceduralAmbient: ActiveAmbientNodes | null = null;
let activeAmbientAudioElement: HTMLAudioElement | null = null;
let ambientStateListeners: Set<(isPlaying: boolean) => void> = new Set();
let isAmbientCurrentlyPlaying = false;
let currentAmbientVolume = 0.35;
let currentAmbientMuted = false;
let currentAmbientTheme = 'none';
let currentAmbientCustomUrl: string | undefined = undefined;

function notifyAmbientState(playing: boolean) {
  isAmbientCurrentlyPlaying = playing;
  ambientStateListeners.forEach(cb => {
    try { cb(playing); } catch (e) { console.error(e); }
  });
}

/**
 * Creates pink noise buffer for realistic rain/wind/vinyl textures
 */
function createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 5): AudioBuffer {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }
  return buffer;
}

/**
 * Standard Theme: Cozy Cafe Lo-fi Ambience (Rain / Vinyl / Warm Pad)
 */
function startProceduralAmbientStandard(ctx: AudioContext, masterGain: GainNode): () => void {
  const stopped = { value: false };
  const timers: number[] = [];

  // 1. Rain texture via filtered pink noise
  const noiseBuffer = createPinkNoiseBuffer(ctx, 4);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(550, ctx.currentTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start();

  // 2. Warm Lofi chord pad (Dmaj9: D3, F#3, A3, C#4)
  const padFreqs = [146.83, 185.00, 220.00, 277.18];
  const padOscs: OscillatorNode[] = [];
  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0.08, ctx.currentTime);

  padFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Subtle detune for lushness
    const detuneOsc = ctx.createOscillator();
    detuneOsc.frequency.setValueAtTime(0.15 + idx * 0.05, ctx.currentTime);
    const detuneGain = ctx.createGain();
    detuneGain.gain.setValueAtTime(4, ctx.currentTime);
    detuneOsc.connect(detuneGain);
    detuneGain.connect(osc.detune);
    detuneOsc.start();

    osc.connect(padGain);
    osc.start();
    padOscs.push(osc);
  });

  padGain.connect(masterGain);

  // 3. Periodic gentle cafe chime notes (every 6-10s)
  const chimeNotes = [587.33, 739.99, 880.00, 1108.73]; // D5, F#5, A5, C#6
  const scheduleChime = () => {
    if (stopped.value || ctx.state !== 'running') return;
    const note = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, ctx.currentTime);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 2.6);

    const nextDelay = 5000 + Math.random() * 6000;
    timers.push(window.setTimeout(scheduleChime, nextDelay));
  };

  timers.push(window.setTimeout(scheduleChime, 3000));

  return () => {
    stopped.value = true;
    timers.forEach(t => clearTimeout(t));
    try {
      noiseSource.stop();
      padOscs.forEach(osc => osc.stop());
    } catch (e) {}
  };
}

/**
 * Christmas Theme: Winter Snow Breeze & Glockenspiel Sparkles
 */
function startProceduralAmbientChristmas(ctx: AudioContext, masterGain: GainNode): () => void {
  const stopped = { value: false };
  const timers: number[] = [];

  // 1. Winter wind breeze (Pink noise swept via resonant bandpass)
  const noiseBuffer = createPinkNoiseBuffer(ctx, 4);
  const windSource = ctx.createBufferSource();
  windSource.buffer = noiseBuffer;
  windSource.loop = true;

  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.Q.setValueAtTime(3.5, ctx.currentTime);
  windFilter.frequency.setValueAtTime(400, ctx.currentTime);

  // LFO sweeping the wind frequency
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(280, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(windFilter.frequency);
  lfo.start();

  const windGain = ctx.createGain();
  windGain.gain.setValueAtTime(0.14, ctx.currentTime);

  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);
  windSource.start();

  // 2. Festive celestial bells sparkle loop (E maj pentatonic: E5, G#5, B5, C#6, E6)
  const bells = [659.25, 830.61, 987.77, 1108.73, 1318.51];
  const scheduleFestiveBell = () => {
    if (stopped.value || ctx.state !== 'running') return;
    const note = bells[Math.floor(Math.random() * bells.length)];
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(note, ctx.currentTime);
    osc2.frequency.setValueAtTime(note * 2, ctx.currentTime); // Shimmer

    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

    osc1.connect(g);
    osc2.connect(g);
    g.connect(masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 2.1);
    osc2.stop(ctx.currentTime + 2.1);

    const nextDelay = 3500 + Math.random() * 4500;
    timers.push(window.setTimeout(scheduleFestiveBell, nextDelay));
  };

  timers.push(window.setTimeout(scheduleFestiveBell, 2000));

  return () => {
    stopped.value = true;
    timers.forEach(t => clearTimeout(t));
    try {
      windSource.stop();
      lfo.stop();
    } catch (e) {}
  };
}

/**
 * Halloween Theme: Spooky Atmospheric Wind Drone & Haunting Echoes
 */
function startProceduralAmbientHalloween(ctx: AudioContext, masterGain: GainNode): () => void {
  const stopped = { value: false };
  const timers: number[] = [];

  // 1. Deep eerie drone (D2 73.42Hz + Detuned D#2 77.78Hz beating)
  const drone1 = ctx.createOscillator();
  const drone2 = ctx.createOscillator();
  drone1.type = 'sawtooth';
  drone2.type = 'sine';
  drone1.frequency.setValueAtTime(73.42, ctx.currentTime);
  drone2.frequency.setValueAtTime(74.20, ctx.currentTime);

  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.setValueAtTime(160, ctx.currentTime);

  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.12, ctx.currentTime);

  drone1.connect(droneFilter);
  drone2.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(masterGain);

  drone1.start();
  drone2.start();

  // 2. Haunting wind whistle
  const noiseBuffer = createPinkNoiseBuffer(ctx, 4);
  const windSource = ctx.createBufferSource();
  windSource.buffer = noiseBuffer;
  windSource.loop = true;

  const spookyFilter = ctx.createBiquadFilter();
  spookyFilter.type = 'bandpass';
  spookyFilter.Q.setValueAtTime(6.0, ctx.currentTime); // Narrow whistle
  spookyFilter.frequency.setValueAtTime(320, ctx.currentTime);

  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(140, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(spookyFilter.frequency);
  lfo.start();

  const spookyWindGain = ctx.createGain();
  spookyWindGain.gain.setValueAtTime(0.1, ctx.currentTime);

  windSource.connect(spookyFilter);
  spookyFilter.connect(spookyWindGain);
  spookyWindGain.connect(masterGain);
  windSource.start();

  // 3. Occasional eerie minor music box pluck (D5, F5, G#5, C#6)
  const spookyNotes = [587.33, 698.46, 830.61, 1108.73];
  const scheduleEerieNote = () => {
    if (stopped.value || ctx.state !== 'running') return;
    const note = spookyNotes[Math.floor(Math.random() * spookyNotes.length)];
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note, ctx.currentTime);

    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0);

    osc.connect(g);
    g.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 3.1);

    const nextDelay = 4000 + Math.random() * 5000;
    timers.push(window.setTimeout(scheduleEerieNote, nextDelay));
  };

  timers.push(window.setTimeout(scheduleEerieNote, 2500));

  return () => {
    stopped.value = true;
    timers.forEach(t => clearTimeout(t));
    try {
      drone1.stop();
      drone2.stop();
      windSource.stop();
      lfo.stop();
    } catch (e) {}
  };
}

// ==========================================
// AMBIENT CONTROLLER PUBLIC API
// ==========================================

export interface AmbientAudioOptions {
  theme?: 'none' | 'christmas' | 'halloween' | string;
  customUrl?: string;
  volume?: number;
  muted?: boolean;
}

/**
 * Start or update ambient background audio loop
 */
export const startAmbientLoop = (options: AmbientAudioOptions = {}) => {
  const {
    theme = 'none',
    customUrl,
    volume = 0.35,
    muted = false
  } = options;

  currentAmbientTheme = theme;
  currentAmbientCustomUrl = customUrl;
  currentAmbientVolume = volume;
  currentAmbientMuted = muted;

  // If muted or volume is 0, stop active sounds but keep metadata
  if (muted || volume <= 0) {
    stopAmbientLoop();
    return;
  }

  // Handle Custom Audio URL if provided
  if (customUrl) {
    stopAmbientProcedural();

    if (!activeAmbientAudioElement || activeAmbientAudioElement.src !== customUrl) {
      if (activeAmbientAudioElement) {
        activeAmbientAudioElement.pause();
        activeAmbientAudioElement = null;
      }
      try {
        const audio = new Audio(customUrl);
        audio.loop = true;
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play()
          .then(() => notifyAmbientState(true))
          .catch((err) => {
            console.warn("Ambient custom audio autoplay prevented:", err);
            notifyAmbientState(false);
          });
        activeAmbientAudioElement = audio;
      } catch (err) {
        console.error("Failed to play custom ambient audio:", err);
      }
    } else {
      activeAmbientAudioElement.volume = Math.max(0, Math.min(1, volume));
      if (activeAmbientAudioElement.paused) {
        activeAmbientAudioElement.play()
          .then(() => notifyAmbientState(true))
          .catch(() => notifyAmbientState(false));
      }
    }
    return;
  }

  // If using procedural synthesis, stop custom audio element
  if (activeAmbientAudioElement) {
    activeAmbientAudioElement.pause();
    activeAmbientAudioElement = null;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  // If already running procedural with the same theme, just update volume
  if (activeProceduralAmbient) {
    activeProceduralAmbient.gainNode.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      ctx.currentTime
    );
    notifyAmbientState(true);
    return;
  }

  // Create Master Gain node for smooth volume & fade
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(
    Math.max(0, Math.min(1, volume)),
    ctx.currentTime + 1.2
  );
  masterGain.connect(ctx.destination);

  let stopCallback: () => void;
  switch (theme) {
    case 'christmas':
      stopCallback = startProceduralAmbientChristmas(ctx, masterGain);
      break;
    case 'halloween':
      stopCallback = startProceduralAmbientHalloween(ctx, masterGain);
      break;
    case 'none':
    default:
      stopCallback = startProceduralAmbientStandard(ctx, masterGain);
      break;
  }

  activeProceduralAmbient = {
    gainNode: masterGain,
    stop: stopCallback
  };

  notifyAmbientState(true);
};

function stopAmbientProcedural() {
  if (activeProceduralAmbient) {
    try {
      activeProceduralAmbient.stop();
    } catch (e) {}
    activeProceduralAmbient = null;
  }
}

/**
 * Stop all active ambient loop playback
 */
export const stopAmbientLoop = () => {
  stopAmbientProcedural();
  if (activeAmbientAudioElement) {
    try {
      activeAmbientAudioElement.pause();
    } catch (e) {}
    activeAmbientAudioElement = null;
  }
  notifyAmbientState(false);
};

/**
 * Adjust volume of currently playing ambient audio
 */
export const setAmbientVolume = (volume: number) => {
  currentAmbientVolume = Math.max(0, Math.min(1, volume));
  if (activeAmbientAudioElement) {
    activeAmbientAudioElement.volume = currentAmbientVolume;
  }
  if (activeProceduralAmbient) {
    const ctx = getAudioContext();
    if (ctx) {
      activeProceduralAmbient.gainNode.gain.setValueAtTime(currentAmbientVolume, ctx.currentTime);
    }
  }
};

/**
 * Subscribe to ambient audio play/pause state
 */
export const subscribeAmbientState = (listener: (isPlaying: boolean) => void) => {
  ambientStateListeners.add(listener);
  listener(isAmbientCurrentlyPlaying);
  return () => {
    ambientStateListeners.delete(listener);
  };
};

export const getIsAmbientPlaying = () => isAmbientCurrentlyPlaying;

// ==========================================
// DISPATCHER & EXPORTED FUNCTIONS
// ==========================================

export interface PlayThemeSoundOptions {
  theme?: 'none' | 'christmas' | 'halloween' | string;
  customUrl?: string;
  volume?: number;
  muted?: boolean;
}

/**
 * Play order received notification sound based on theme and custom audio overrides
 */
export const playThemeOrderSound = (options: PlayThemeSoundOptions = {}) => {
  const { theme = 'none', customUrl, volume = 1, muted = false } = options;
  if (muted || volume <= 0) return;

  if (customUrl) {
    playAudioUrl(customUrl, volume);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    switch (theme) {
      case 'christmas':
        synthesizeOrderSoundChristmas(ctx, volume);
        break;
      case 'halloween':
        synthesizeOrderSoundHalloween(ctx, volume);
        break;
      case 'none':
      default:
        synthesizeOrderSoundDefault(ctx, volume);
        break;
    }
  } catch (err) {
    console.error('Error playing theme order sound:', err);
  }
};

/**
 * Play chat notification sound based on theme and custom audio overrides
 */
export const playThemeChatSound = (options: PlayThemeSoundOptions = {}) => {
  const { theme = 'none', customUrl, volume = 1, muted = false } = options;
  if (muted || volume <= 0) return;

  if (customUrl) {
    playAudioUrl(customUrl, volume);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    switch (theme) {
      case 'christmas':
        synthesizeChatSoundChristmas(ctx, volume);
        break;
      case 'halloween':
        synthesizeChatSoundHalloween(ctx, volume);
        break;
      case 'none':
      default:
        synthesizeChatSoundDefault(ctx, volume);
        break;
    }
  } catch (err) {
    console.error('Error playing theme chat sound:', err);
  }
};

/**
 * Play Start Ordering sound based on theme and custom audio overrides
 */
export const playThemeStartOrderingSound = (options: PlayThemeSoundOptions = {}) => {
  const { theme = 'none', customUrl, volume = 1, muted = false } = options;
  if (muted || volume <= 0) return;

  if (customUrl) {
    playAudioUrl(customUrl, volume);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    switch (theme) {
      case 'christmas':
        synthesizeStartOrderingChristmas(ctx, volume);
        break;
      case 'halloween':
        synthesizeStartOrderingHalloween(ctx, volume);
        break;
      case 'none':
      default:
        synthesizeStartOrderingStandard(ctx, volume);
        break;
    }
  } catch (err) {
    console.error('Error playing theme start ordering sound:', err);
  }
};

export const playStartOrderingSound = (shopSettings?: ShopSettings | null) => {
  const theme = shopSettings?.activeTheme || (shopSettings?.snowEnabled !== false ? 'christmas' : 'none');
  const customUrl = shopSettings?.themeSounds?.[theme]?.startOrderingSoundUrl;
  const volume = shopSettings?.startOrderingSoundVolume ?? 0.8;
  const muted = shopSettings?.startOrderingSoundMuted || false;
  playThemeStartOrderingSound({ theme, customUrl, volume, muted });
};

/**
 * Play Start Over / Reset Session sound based on theme and custom audio overrides
 */
export const playThemeStartOverSound = (options: PlayThemeSoundOptions = {}) => {
  const { theme = 'none', customUrl, volume = 1, muted = false } = options;
  if (muted || volume <= 0) return;

  if (customUrl) {
    playAudioUrl(customUrl, volume);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    switch (theme) {
      case 'christmas':
        synthesizeStartOverChristmas(ctx, volume);
        break;
      case 'halloween':
        synthesizeStartOverHalloween(ctx, volume);
        break;
      case 'none':
      default:
        synthesizeStartOverStandard(ctx, volume);
        break;
    }
  } catch (err) {
    console.error('Error playing theme start over sound:', err);
  }
};

export const playStartOverSound = (shopSettings?: ShopSettings | null) => {
  const theme = shopSettings?.activeTheme || (shopSettings?.snowEnabled !== false ? 'christmas' : 'none');
  const customUrl = shopSettings?.themeSounds?.[theme]?.startOverSoundUrl;
  const volume = shopSettings?.startOverSoundVolume ?? 0.8;
  const muted = shopSettings?.startOverSoundMuted || false;
  playThemeStartOverSound({ theme, customUrl, volume, muted });
};

/**
 * Play Add to Cart sound based on theme and custom audio overrides
 */
export const playThemeAddToCartSound = (options: PlayThemeSoundOptions = {}) => {
  const { theme = 'none', customUrl, volume = 1, muted = false } = options;
  if (muted || volume <= 0) return;

  if (customUrl) {
    playAudioUrl(customUrl, volume);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    switch (theme) {
      case 'christmas':
        synthesizeAddToCartChristmas(ctx, volume);
        break;
      case 'halloween':
        synthesizeAddToCartHalloween(ctx, volume);
        break;
      case 'none':
      default:
        synthesizeAddToCartStandard(ctx, volume);
        break;
    }
  } catch (err) {
    console.error('Error playing theme add to cart sound:', err);
  }
};

export const playAddToCartSound = (shopSettings?: ShopSettings | null) => {
  const theme = shopSettings?.activeTheme || (shopSettings?.snowEnabled !== false ? 'christmas' : 'none');
  const customUrl = shopSettings?.themeSounds?.[theme]?.addToCartSoundUrl;
  const volume = shopSettings?.addToCartSoundVolume ?? 0.8;
  const muted = shopSettings?.addToCartSoundMuted || false;
  playThemeAddToCartSound({ theme, customUrl, volume, muted });
};

/**
 * Play Confirm Order / Checkout submission sound based on theme and custom audio overrides
 */
export const playThemeConfirmOrderSound = (options: PlayThemeSoundOptions = {}) => {
  const { theme = 'none', customUrl, volume = 1, muted = false } = options;
  if (muted || volume <= 0) return;

  if (customUrl) {
    playAudioUrl(customUrl, volume);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    switch (theme) {
      case 'christmas':
        synthesizeConfirmOrderChristmas(ctx, volume);
        break;
      case 'halloween':
        synthesizeConfirmOrderHalloween(ctx, volume);
        break;
      case 'none':
      default:
        synthesizeConfirmOrderStandard(ctx, volume);
        break;
    }
  } catch (err) {
    console.error('Error playing theme confirm order sound:', err);
  }
};

export const playConfirmOrderSound = (shopSettings?: ShopSettings | null) => {
  const theme = shopSettings?.activeTheme || (shopSettings?.snowEnabled !== false ? 'christmas' : 'none');
  const customUrl = shopSettings?.themeSounds?.[theme]?.confirmOrderSoundUrl;
  const volume = shopSettings?.confirmOrderSoundVolume ?? 0.85;
  const muted = shopSettings?.confirmOrderSoundMuted || false;
  playThemeConfirmOrderSound({ theme, customUrl, volume, muted });
};

/**
 * Preview / Test sound trigger for admin interface (all 7 sound types)
 */
export const previewThemeSound = (
  theme: 'none' | 'christmas' | 'halloween' | string,
  soundType: 'order' | 'chat' | 'ambient' | 'startOrdering' | 'startOver' | 'addToCart' | 'confirmOrder',
  customUrl?: string,
  volume: number = 1
) => {
  if (soundType === 'order') {
    playThemeOrderSound({ theme, customUrl, volume, muted: false });
  } else if (soundType === 'chat') {
    playThemeChatSound({ theme, customUrl, volume, muted: false });
  } else if (soundType === 'startOrdering') {
    playThemeStartOrderingSound({ theme, customUrl, volume, muted: false });
  } else if (soundType === 'startOver') {
    playThemeStartOverSound({ theme, customUrl, volume, muted: false });
  } else if (soundType === 'addToCart') {
    playThemeAddToCartSound({ theme, customUrl, volume, muted: false });
  } else if (soundType === 'confirmOrder') {
    playThemeConfirmOrderSound({ theme, customUrl, volume, muted: false });
  } else if (soundType === 'ambient') {
    if (isAmbientCurrentlyPlaying) {
      stopAmbientLoop();
    } else {
      startAmbientLoop({ theme, customUrl, volume, muted: false });
    }
  }
};

// Backwards-compatible aliases
export const playNotificationSound = (url?: string, volume: number = 1) => {
  playThemeOrderSound({ customUrl: url, volume });
};

export const playChatNotificationSound = (volume: number = 1) => {
  playThemeChatSound({ volume });
};

