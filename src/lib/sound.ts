/**
 * Two short chimes made with the Web Audio API (no audio files): a rising pair of notes for a right
 * answer, a low soft blip for a wrong one. Silent when the browser blocks audio.
 */
let ctx: AudioContext | null = null;

function tone(freq: number, start: number, length: number, type: OscillatorType, gain: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + length);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + length + 0.05);
}

export function playSound(kind: "right" | "wrong" | "done") {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    if (kind === "right") {
      tone(784, 0, 0.16, "sine", 0.18);
      tone(1175, 0.09, 0.22, "sine", 0.16);
    } else if (kind === "wrong") {
      tone(220, 0, 0.22, "triangle", 0.16);
      tone(185, 0.1, 0.24, "triangle", 0.12);
    } else {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, "sine", 0.15));
    }
  } catch {
    // no audio: nothing to do
  }
}
