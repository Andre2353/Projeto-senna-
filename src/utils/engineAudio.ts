import { gameRuntime } from './runtime';

export class EngineAudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private oscPrimary: OscillatorNode | null = null;
  private oscHarmonic: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private initialized = false;

  public init(): void {
    if (this.initialized || typeof window === 'undefined') {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      return;
    }

    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;

      // Engine synth: 2 persistent oscillators -> lowpass filter -> engineGain -> masterGain
      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 320;
      engineFilter.Q.value = 3.2;

      const engineGain = ctx.createGain();
      engineGain.gain.value = 0.16;

      const oscPrimary = ctx.createOscillator();
      oscPrimary.type = 'sawtooth';
      oscPrimary.frequency.value = 72;

      const oscHarmonic = ctx.createOscillator();
      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.value = 144;

      oscPrimary.connect(engineFilter);
      oscHarmonic.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(masterGain);

      oscPrimary.start();
      oscHarmonic.start();

      // Continuous noise buffer for rain + high-speed wind rush
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 900;
      noiseFilter.Q.value = 0.8;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0;

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start();

      this.engineFilter = engineFilter;
      this.engineGain = engineGain;
      this.oscPrimary = oscPrimary;
      this.oscHarmonic = oscHarmonic;
      this.noiseSource = noiseSource;
      this.noiseFilter = noiseFilter;
      this.noiseGain = noiseGain;
      this.initialized = true;

      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
    } catch {
      this.initialized = false;
    }
  }

  public update(active: boolean, muted: boolean, masterVolume: number): void {
    if (!this.initialized || !this.ctx || !this.masterGain) {
      return;
    }

    if (this.ctx.state === 'suspended' && active && !muted) {
      void this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const targetMaster = active && !muted ? Math.max(0, Math.min(1, masterVolume)) * 0.45 : 0;
    this.masterGain.gain.setTargetAtTime(targetMaster, now, 0.08);

    if (!this.oscPrimary || !this.oscHarmonic || !this.engineFilter || !this.engineGain) {
      return;
    }

    const rpmNorm = Math.max(0, Math.min(1, (gameRuntime.rpm - 2800) / 10700));
    const speedNorm = Math.max(0, Math.min(1, Math.abs(gameRuntime.speed) / 330));

    // Heavy low-end lugging timbre when locked in 6th gear (Stage 5)
    const isSixthLocked = gameRuntime.gearLocked;
    const baseFreq = isSixthLocked ? 44 + rpmNorm * 115 : 58 + rpmNorm * 175;
    const harmonicMult = isSixthLocked ? 1.5 : 2.02;

    this.oscPrimary.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.oscHarmonic.frequency.setTargetAtTime(baseFreq * harmonicMult, now, 0.04);

    const filterCutoff = isSixthLocked
      ? 180 + rpmNorm * 480
      : 280 + rpmNorm * 1450 + gameRuntime.throttle * 380;
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);
    this.engineGain.gain.setTargetAtTime(0.14 + gameRuntime.throttle * 0.14, now, 0.05);

    if (this.noiseGain && this.noiseFilter) {
      const rainLayer = gameRuntime.rainIntensity * 0.16;
      const windLayer = speedNorm > 0.6 ? (speedNorm - 0.6) * 0.25 : 0;
      this.noiseGain.gain.setTargetAtTime(rainLayer + windLayer, now, 0.12);
      this.noiseFilter.frequency.setTargetAtTime(
        650 + gameRuntime.rainIntensity * 700 + speedNorm * 950,
        now,
        0.12
      );
    }
  }

  public playPortalEnter(): void {
    this.playToneSweep(220, 660, 0.45, 'triangle', 0.18);
  }

  public playOvertake(): void {
    this.playToneSweep(523.25, 783.99, 0.22, 'sine', 0.16);
  }

  public playGearFailure(): void {
    this.playToneSweep(165, 58, 0.38, 'sawtooth', 0.22);
  }

  public playChapterUnlock(): void {
    this.playChord([392.0, 493.88, 587.33], 0.7, 0.14);
  }

  public playCheckeredFlag(): void {
    this.playChord([440.0, 554.37, 659.25], 0.65, 0.16);
  }

  private playToneSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playChord(freqs: number[], duration: number, volume: number): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') {
      return;
    }
    const now = this.ctx.currentTime;
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + idx * 0.05 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
      osc.start(now + idx * 0.05);
      osc.stop(now + duration + 0.04);
    });
  }

  public dispose(): void {
    if (!this.initialized) {
      return;
    }
    try {
      this.oscPrimary?.stop();
      this.oscHarmonic?.stop();
      this.noiseSource?.stop();
      this.oscPrimary?.disconnect();
      this.oscHarmonic?.disconnect();
      this.noiseSource?.disconnect();
      this.engineFilter?.disconnect();
      this.engineGain?.disconnect();
      this.noiseFilter?.disconnect();
      this.noiseGain?.disconnect();
      this.masterGain?.disconnect();
      void this.ctx?.close();
    } catch {
      // Safe teardown
    }
    this.initialized = false;
    this.ctx = null;
  }
}

export const engineAudio = new EngineAudioController();
