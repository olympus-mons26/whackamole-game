/**
 * Web Audio API Sound Effects Synthesizer for Whack-a-Mole
 * Generates arcade-style sound effects purely in code with zero external assets/files.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      this.enabled = localStorage.getItem('whack-a-mole-sound') !== 'off';
    } catch {
      this.enabled = true;
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioContextClass();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => undefined);
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Sound played when an animal pops up from a burrow.
   * Playful slide-up "pop" sound.
   */
  public playPop() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    } catch {
      // Audio safety
    }
  }

  /**
   * Sound played when the player successfully whacks an animal.
   * Punchy, resonant arcade "whack/bonk" + celebratory chime.
   */
  public playWhack() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Punchy thump/bonk
      const oscThump = ctx.createOscillator();
      const gainThump = ctx.createGain();
      oscThump.type = 'triangle';
      oscThump.frequency.setValueAtTime(450, now);
      oscThump.frequency.exponentialRampToValueAtTime(110, now + 0.09);

      gainThump.gain.setValueAtTime(0.2, now);
      gainThump.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      oscThump.connect(gainThump);
      gainThump.connect(ctx.destination);
      oscThump.start(now);
      oscThump.stop(now + 0.11);

      // Bright chime/ding
      const oscDing = ctx.createOscillator();
      const gainDing = ctx.createGain();
      oscDing.type = 'sine';
      oscDing.frequency.setValueAtTime(880, now + 0.02);
      oscDing.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gainDing.gain.setValueAtTime(0.001, now);
      gainDing.gain.setValueAtTime(0.12, now + 0.02);
      gainDing.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      oscDing.connect(gainDing);
      gainDing.connect(ctx.destination);
      oscDing.start(now + 0.02);
      oscDing.stop(now + 0.23);
    } catch {
      // Audio safety
    }
  }

  /**
   * Sound played when the player clicks an empty hole (miss).
   * Soft low thud.
   */
  public playMiss() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio safety
    }
  }

  /**
   * Sound played when round starts.
   * Upbeat 3-note ascending fanfare (C5 -> E5 -> G5).
   */
  public playStart() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.17);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Sound played when the round finishes.
   * Descending or celebratory end fanfare depending on high score.
   */
  public playFinish(isNewHighScore: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      if (isNewHighScore) {
        // High score celebratory fanfare (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const start = now + idx * 0.1;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + (idx === 3 ? 0.35 : 0.18));

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + (idx === 3 ? 0.36 : 0.19));
        });
      } else {
        // Standard game over sound (G4 -> E4 -> C4)
        const notes = [783.99, 659.25, 523.25, 392.0];
        notes.forEach((freq, idx) => {
          const start = now + idx * 0.11;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.95, start + 0.18);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.21);
        });
      }
    } catch {
      // Audio safety
    }
  }

  /**
   * Sound played on button click or settings toggle.
   */
  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio safety
    }
  }

  public close() {
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundManager();
