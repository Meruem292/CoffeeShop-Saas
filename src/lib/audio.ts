export const playNotificationSound = (url?: string, volume: number = 1) => {
  try {
    if (url) {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.play().catch(e => console.error("Audio playback error:", e));
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Create oscillator
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    
    // E5 note
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    // Drop to C5 note
    osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.1);
    
    // Envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.error('Audio play failed', err);
  }
};
