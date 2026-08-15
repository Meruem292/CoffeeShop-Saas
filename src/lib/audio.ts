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

export const playNotificationSound = (url?: string, volume: number = 1) => {
  try {
    if (url) {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.play().catch(e => console.error("Audio playback error:", e));
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Create dual-tone chime
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
  } catch (err) {
    console.error('Audio play failed', err);
  }
};

export const playChatNotificationSound = (volume: number = 1) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Dual ding-dong chime specifically for chat
    [0, 0.15].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      
      const freq = idx === 0 ? 880 : 1174.66; // A5 then D6
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(Math.min(volume * 0.8, 1), now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  } catch (err) {
    console.error('Chat notification sound failed', err);
  }
};

