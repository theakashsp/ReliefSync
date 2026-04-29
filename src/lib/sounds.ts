// Web Audio API sound alerts — no external files required
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  durationSec: number,
  gainValue: number,
  delayMs = 0
) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  setTimeout(() => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // ignore
    }
  }, delayMs);
}

let muted = false;

export function setSoundMuted(m: boolean) {
  muted = m;
  if (typeof window !== "undefined") {
    localStorage.setItem("rl_sound_muted", m ? "1" : "0");
  }
}

export function isSoundMuted(): boolean {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("rl_sound_muted");
    if (stored !== null) muted = stored === "1";
  }
  return muted;
}

export function playAlert(type: "critical" | "new" | "complete") {
  if (isSoundMuted()) return;
  // Resume context if suspended (browser autoplay policy)
  const ctx = getAudioCtx();
  if (ctx?.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  if (type === "critical") {
    // Urgent double beep
    playTone(880, "square", 0.25, 0.3, 0);
    playTone(880, "square", 0.25, 0.3, 300);
    playTone(1100, "square", 0.35, 0.3, 600);
  } else if (type === "new") {
    // Gentle ascending chime
    playTone(523, "sine", 0.2, 0.2, 0);
    playTone(659, "sine", 0.2, 0.2, 150);
    playTone(784, "sine", 0.3, 0.2, 300);
  } else if (type === "complete") {
    // Success descending
    playTone(784, "sine", 0.2, 0.15, 0);
    playTone(659, "sine", 0.2, 0.15, 150);
    playTone(523, "sine", 0.3, 0.15, 300);
  }
}
