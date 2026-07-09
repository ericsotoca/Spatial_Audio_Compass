/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Position3D } from './types';

// Let's define the interface for our custom presets.
interface SynthPreset {
  start(ctx: AudioContext, panner: PannerNode): void;
  stop(): void;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private panner: PannerNode | null = null;
  private mainGain: GainNode | null = null;
  private currentPresetId: string = 'battement-coeur';
  private activePreset: SynthPreset | null = null;
  private playing: boolean = false;
  private volume: number = 0.6; // 0.0 to 1.0
  private currentPosition: Position3D = { x: 0, y: 0, z: 1 };
  private stateChangeCallbacks: Array<(playing: boolean) => void> = [];

  constructor() {
    // Lazy initialize when user interacts to comply with browser autoplay policies.
  }

  private initAudio() {
    if (this.ctx) return;

    // Create audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Create a 3D Panner Node
    this.panner = this.ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 50;
    this.panner.rolloffFactor = 1.2;

    // Create Main Gain (Volume) Node
    this.mainGain = this.ctx.createGain();
    this.mainGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Connect graph: preset -> panner -> mainGain -> destination
    this.panner.connect(this.mainGain);
    this.mainGain.connect(this.ctx.destination);

    // Apply initial position
    this.updatePannerPosition();
  }

  public async start() {
    this.initAudio();
    if (!this.ctx || !this.panner) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.playing) return;

    this.playing = true;
    this.startPreset(this.currentPresetId);
    this.notifyStateChange();
  }

  public stop() {
    if (!this.playing) return;

    this.playing = false;
    if (this.activePreset) {
      this.activePreset.stop();
      this.activePreset = null;
    }
    this.notifyStateChange();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setPosition(pos: Position3D) {
    this.currentPosition = { ...pos };
    this.updatePannerPosition();
  }

  private updatePannerPosition() {
    if (!this.panner || !this.ctx) return;
    const { x, y, z } = this.currentPosition;
    
    // Web Audio default listener: (0,0,0) looking down -Z axis, up is +Y.
    // Map X to X (left/right)
    // Map Y to Y (up/down / height)
    // Map Z to -Z (front/back, so positive Z in our state is "front", which corresponds to -Z in Web Audio listener)
    const t = this.ctx.currentTime;
    
    if (this.panner.positionX) {
      this.panner.positionX.setTargetAtTime(x, t, 0.05);
      this.panner.positionY.setTargetAtTime(y, t, 0.05);
      this.panner.positionZ.setTargetAtTime(-z, t, 0.05);
    } else {
      // Fallback for older browsers
      this.panner.setPosition(x, y, -z);
    }
  }

  public setPreset(presetId: string) {
    if (this.currentPresetId === presetId) return;

    this.currentPresetId = presetId;
    if (this.playing) {
      // Crossfade or instantly switch
      if (this.activePreset) {
        this.activePreset.stop();
      }
      this.startPreset(presetId);
    }
  }

  private startPreset(presetId: string) {
    if (!this.ctx || !this.panner) return;

    const preset = this.createPresetSynth(presetId);
    this.activePreset = preset;
    preset.start(this.ctx, this.panner);
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public getVolume(): number {
    return this.volume;
  }

  public subscribe(cb: (playing: boolean) => void) {
    this.stateChangeCallbacks.push(cb);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(x => x !== cb);
    };
  }

  private notifyStateChange() {
    this.stateChangeCallbacks.forEach(cb => cb(this.playing));
  }

  // Synthesizer preset factory
  private createPresetSynth(presetId: string): SynthPreset {
    switch (presetId) {
      case 'averse-apaisante':
        return new SoothingRainSynth();
      case 'foret-carillons':
        return new ChimesAndBirdsSynth();
      case 'bol-tibethain-vibratoire':
        return new TibetanBowlContinuousSynth();
      case 'battement-coeur':
        return new HeartbeatSynth();
      case 'frequence-sacree':
        return new SacredFrequencySynth();
      case 'handpan-meditatif':
        return new MeditativeHandpanSynth();
      case 'hang-drum-profond':
        return new DeepHangDrumSynth();
      case 'tongue-drum-celeste':
        return new CelestialTongueDrumSynth();
      case 'bol-tibethain-martele':
        return new TibetanBowlStruckSynth();
      case 'kalimba-feerique':
        return new DreamyKalimbaSynth();
      default:
        return new HeartbeatSynth();
    }
  }
}

// ----------------------------------------------------
// HELPER: Pink Noise Buffer Generator
// ----------------------------------------------------
function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 4 * ctx.sampleRate; // 4 seconds loop
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
    
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.12; // Normalization to prevent clipping
    
    b6 = white * 0.115926;
  }
  return buffer;
}

// ----------------------------------------------------
// 1. SOOTHING RAIN SYNTH
// Pink noise base + slow wind LFO + randomized crisp raindrops
// ----------------------------------------------------
class SoothingRainSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private intervalId: any = null;

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    // Create a filter for the pink noise (warm rain wash)
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(1000, ctx.currentTime);
    this.filter.Q.setValueAtTime(1.0, ctx.currentTime);

    // Create Pink Noise loop
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = createPinkNoiseBuffer(ctx);
    this.noiseSource.loop = true;

    // Create LFO to simulate wind gusts (modulating the lowpass filter)
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow: 12 seconds cycle

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(400, ctx.currentTime); // sweeps filter frequency +/- 400Hz

    // Connect LFO -> filter frequency
    this.lfo.connect(this.lfoGain);
    if (this.filter.frequency) {
      this.lfoGain.connect(this.filter.frequency);
    }

    // Connect Noise -> filter -> destination
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.5, ctx.currentTime);
    
    this.noiseSource.connect(this.filter);
    this.filter.connect(rainGain);
    rainGain.connect(destination);

    this.noiseSource.start(0);
    this.lfo.start(0);

    // Random raindrops scheduler
    this.intervalId = setInterval(() => {
      this.triggerRaindrop();
    }, 180);
  }

  private triggerRaindrop() {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    // A raindrop is a tiny high-passed click
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Random raindrop pitches
    const freq = 2000 + Math.random() * 2500;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.setValueAtTime(3.0, t);

    // Quick volume decay envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.01 + Math.random() * 0.015, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  stop() {
    clearInterval(this.intervalId);
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch (e) {}
    }
    if (this.lfo) {
      try { this.lfo.stop(); } catch (e) {}
    }
  }
}

// ----------------------------------------------------
// 2. CHIMES AND BIRDS SYNTH
// Warm ambient background + random wind chimes + bird chirps
// ----------------------------------------------------
class ChimesAndBirdsSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private backgroundNoise: AudioBufferSourceNode | null = null;
  private activeChimes: Array<{ oscs: OscillatorNode[]; gains: GainNode[] }> = [];
  private intervals: any[] = [];

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    // 1. Warm forest wind background
    const bgFilter = ctx.createBiquadFilter();
    bgFilter.type = 'lowpass';
    bgFilter.frequency.setValueAtTime(500, ctx.currentTime);

    const bgGain = ctx.createGain();
    bgGain.gain.setValueAtTime(0.12, ctx.currentTime);

    this.backgroundNoise = ctx.createBufferSource();
    this.backgroundNoise.buffer = createPinkNoiseBuffer(ctx);
    this.backgroundNoise.loop = true;

    this.backgroundNoise.connect(bgFilter);
    bgFilter.connect(bgGain);
    bgGain.connect(destination);
    this.backgroundNoise.start(0);

    // 2. Chimes scheduler (Pentatonic Scale in C)
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
    const chimeTrigger = () => {
      const freq = scale[Math.floor(Math.random() * scale.length)];
      this.triggerChime(freq);
    };

    chimeTrigger(); // Initial chime
    const chimeInterval = setInterval(chimeTrigger, 2000);
    this.intervals.push(chimeInterval);

    // 3. Birds scheduler
    const birdTrigger = () => {
      this.triggerBirdChirp();
    };
    const birdInterval = setInterval(birdTrigger, 4000);
    this.intervals.push(birdInterval);
  }

  private triggerChime(freq: number) {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    // Metal tube modeling: fundamental + 2.76x + 4.43x detuned high overtones
    const ratios = [1.0, 2.76, 4.43];
    const amplitudes = [0.2, 0.08, 0.04];
    const decays = [3.5, 1.8, 1.0]; // high harmonics decay much quicker

    const chimeNodes: OscillatorNode[] = [];
    const chimeGains: GainNode[] = [];

    ratios.forEach((ratio, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * ratio, t);

      // Exponential decay
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(amplitudes[index], t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decays[index]);

      osc.connect(gain);
      gain.connect(this.destination!);

      osc.start(t);
      osc.stop(t + decays[index] + 0.1);

      chimeNodes.push(osc);
      chimeGains.push(gain);
    });

    this.activeChimes.push({ oscs: chimeNodes, gains: chimeGains });
  }

  private triggerBirdChirp() {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    const notesCount = 2 + Math.floor(Math.random() * 3); // 2 to 4 rapid chirps
    let startTime = t;

    for (let i = 0; i < notesCount; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      
      const startFreq = 2800 + Math.random() * 800;
      const endFreq = startFreq + 1200;
      const duration = 0.06 + Math.random() * 0.05;

      // Fast upward bird chirp frequency sweep
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

      // Volume envelope: bell shape
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.015, startTime + duration * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);

      startTime += duration + 0.05; // Gap between chirps
    }
  }

  stop() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];

    if (this.backgroundNoise) {
      try { this.backgroundNoise.stop(); } catch (e) {}
    }

    this.activeChimes.forEach(chime => {
      chime.oscs.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
    });
    this.activeChimes = [];
  }
}

// ----------------------------------------------------
// 3. TIBETAN BOWL VIBRATING SYNTH (CONTINUOUS DRONE)
// Multi-harmonic oscillator banks with multi-LFO amplitude modulations
// ----------------------------------------------------
class TibetanBowlContinuousSynth implements SynthPreset {
  private oscs: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private lfos: OscillatorNode[] = [];

  start(ctx: AudioContext, destination: AudioNode) {
    const t = ctx.currentTime;

    // Harmonic profile of a warm, deep Tibetan Singing Bowl
    // Fundamental frequency = 135Hz (C3#)
    const baseFreq = 135.0;
    
    // We synthesize the fundamental and several non-integer organic overtones
    const harmonics = [
      { ratio: 1.0, vol: 0.4, beatFreq: 0.4 },
      { ratio: 2.01, vol: 0.18, beatFreq: 0.55 },
      { ratio: 3.02, vol: 0.12, beatFreq: 0.72 },
      { ratio: 4.03, vol: 0.08, beatFreq: 0.9 },
      { ratio: 5.06, vol: 0.05, beatFreq: 0.3 },
      { ratio: 6.09, vol: 0.03, beatFreq: 1.15 }
    ];

    harmonics.forEach(h => {
      // Primary Oscillator
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h.ratio, t);

      // Dual detuned oscillator to enrich and naturally phase-beat
      const oscDetuned = ctx.createOscillator();
      oscDetuned.type = 'sine';
      oscDetuned.frequency.setValueAtTime(baseFreq * h.ratio + (Math.random() * 0.4 - 0.2), t);

      // Warm triangle undertone for the fundamental
      if (h.ratio === 1.0) {
        const subOsc = ctx.createOscillator();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(baseFreq * 0.5, t); // Sub-harmonic 67.5Hz
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.08, t);
        subOsc.connect(subGain);
        subGain.connect(destination);
        subOsc.start(t);
        this.oscs.push(subOsc);
      }

      // Gain Node with LFO modulation to create the bowl's vibrating pulse (tremolo)
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, t);
      // Soft fade-in to prevent sharp click
      gainNode.gain.linearRampToValueAtTime(h.vol, t + 2.0);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(h.beatFreq, t);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(h.vol * 0.35, t); // 35% modulation depth

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      osc.connect(gainNode);
      oscDetuned.connect(gainNode);
      gainNode.connect(destination);

      osc.start(t);
      oscDetuned.start(t);
      lfo.start(t);

      this.oscs.push(osc, oscDetuned);
      this.lfos.push(lfo);
      this.gains.push(gainNode);
    });
  }

  stop() {
    this.oscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.lfos.forEach(lfo => {
      try { lfo.stop(); } catch (e) {}
    });
    this.oscs = [];
    this.lfos = [];
    this.gains = [];
  }
}

// ----------------------------------------------------
// 4. GROUNDING HEARTBEAT SYNTH
// Double thumping heart rhythm (60 BPM, "lub-dub")
// ----------------------------------------------------
class HeartbeatSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private intervalId: any = null;

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    const playHeartbeat = () => {
      this.triggerThump(true); // First thump: Lub
      setTimeout(() => {
        this.triggerThump(false); // Second thump: Dub
      }, 250); // 250ms delay between lub and dub
    };

    playHeartbeat();
    this.intervalId = setInterval(playHeartbeat, 1000); // 60 BPM (exactly 1.0 second intervals)
  }

  private triggerThump(isLub: boolean) {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    // A heartbeat thump is a rapid pitch sweep on a sine wave at very low frequencies
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lowpass = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    
    // Lub is slightly deeper (65Hz down to 10Hz), Dub is slightly higher (75Hz down to 10Hz)
    const startFreq = isLub ? 68 : 76;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(15, t + 0.12);

    // Warm, low sound filtering
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(100, t);

    // Exponential volume decay envelope
    const peakGain = isLub ? 0.9 : 0.65; // Dub is softer
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    osc.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  stop() {
    clearInterval(this.intervalId);
  }
}

// ----------------------------------------------------
// 5. SACRED SOLFEGGIO FREQUENCY 528 Hz SYNTH
// Crystal-clear healing tone + sub-octaves + breathing swells
// ----------------------------------------------------
class SacredFrequencySynth implements SynthPreset {
  private oscs: OscillatorNode[] = [];
  private breathingLfo: OscillatorNode | null = null;

  start(ctx: AudioContext, destination: AudioNode) {
    const t = ctx.currentTime;

    // Healing Frequency 528Hz (Solfeggio Transformation)
    const f528 = 528.0;

    // Master breathing envelope for 528Hz
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, t);

    this.breathingLfo = ctx.createOscillator();
    this.breathingLfo.type = 'sine';
    this.breathingLfo.frequency.setValueAtTime(0.1, t); // Slow 10-second breath swell (0.1Hz)

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.07, t); // 40% amplitude sweep depth

    this.breathingLfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    // 1. Core 528Hz Sine
    const oscMain = ctx.createOscillator();
    oscMain.type = 'sine';
    oscMain.frequency.setValueAtTime(f528, t);

    // 2. Beautiful detuned chorus (528.2Hz) to add lush shimmering quality
    const oscDetune = ctx.createOscillator();
    oscDetune.type = 'sine';
    oscDetune.frequency.setValueAtTime(f528 + 0.25, t);

    // 3. Grounding sub-octave at 264Hz (Triangle wave for warmth)
    const oscSub = ctx.createOscillator();
    oscSub.type = 'triangle';
    oscSub.frequency.setValueAtTime(f528 * 0.5, t); // 264Hz
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.12, t);
    oscSub.connect(subGain);
    subGain.connect(masterGain);

    // 4. Glassy high overtone at 1056Hz
    const oscHigh = ctx.createOscillator();
    oscHigh.type = 'sine';
    oscHigh.frequency.setValueAtTime(f528 * 2.0, t); // 1056Hz
    const highGain = ctx.createGain();
    highGain.gain.setValueAtTime(0.015, t);
    oscHigh.connect(highGain);
    highGain.connect(masterGain);

    oscMain.connect(masterGain);
    oscDetune.connect(masterGain);
    
    masterGain.connect(destination);

    oscMain.start(t);
    oscDetune.start(t);
    oscSub.start(t);
    oscHigh.start(t);
    this.breathingLfo.start(t);

    this.oscs.push(oscMain, oscDetune, oscSub, oscHigh);
  }

  stop() {
    this.oscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    if (this.breathingLfo) {
      try { this.breathingLfo.stop(); } catch (e) {}
    }
    this.oscs = [];
    this.breathingLfo = null;
  }
}

// ----------------------------------------------------
// 6. MEDITATIVE HANDPAN SYNTH
// Pentatonic notes played in a gentle random patterns
// ----------------------------------------------------
class MeditativeHandpanSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private intervalId: any = null;
  private activeOscs: OscillatorNode[] = [];

  // Re-creating a warm D-minor / Integral Handpan scale (D3, A3, Bb3, C4, D4, F4, G4, A4)
  private scale = [146.83, 220.00, 233.08, 261.63, 293.66, 349.23, 392.00, 440.00];

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    const playHandpanNote = () => {
      // Select random note from scale
      const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
      this.triggerHandpan(freq);
    };

    playHandpanNote();
    this.intervalId = setInterval(playHandpanNote, 1600); // Relaxed rhythm
  }

  private triggerHandpan(freq: number) {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    const oscFund = this.ctx.createOscillator();
    const oscOctave = this.ctx.createOscillator();
    const oscFifth = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    // Fundamental - triangle wave for hollow organic feel
    oscFund.type = 'triangle';
    oscFund.frequency.setValueAtTime(freq, t);

    // Overtones (Handpans ring intensely at the octave and compound fifth)
    oscOctave.type = 'sine';
    oscOctave.frequency.setValueAtTime(freq * 2.0, t);
    const octaveGain = this.ctx.createGain();
    octaveGain.gain.setValueAtTime(0.18, t);
    oscOctave.connect(octaveGain);
    octaveGain.connect(gainNode);

    oscFifth.type = 'sine';
    oscFifth.frequency.setValueAtTime(freq * 3.0, t);
    const fifthGain = this.ctx.createGain();
    fifthGain.gain.setValueAtTime(0.06, t);
    oscFifth.connect(fifthGain);
    fifthGain.connect(gainNode);

    // Very short striking noise click
    const strikeFilter = this.ctx.createBiquadFilter();
    strikeFilter.type = 'highpass';
    strikeFilter.frequency.setValueAtTime(1500, t);

    const strikeNoise = this.ctx.createBufferSource();
    strikeNoise.buffer = createPinkNoiseBuffer(this.ctx);
    const strikeGain = this.ctx.createGain();
    strikeGain.gain.setValueAtTime(0, t);
    strikeGain.gain.linearRampToValueAtTime(0.12, t + 0.001);
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.008);

    strikeNoise.connect(strikeFilter);
    strikeFilter.connect(strikeGain);
    strikeGain.connect(gainNode);

    // Master volume envelope for this handpan pluck
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.4, t + 0.005); // immediate strike
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); // elegant decay

    // Low pass filter to make the tone soft and warm
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(900, t);

    oscFund.connect(gainNode);
    gainNode.connect(lowpass);
    lowpass.connect(this.destination);

    oscFund.start(t);
    oscOctave.start(t);
    oscFifth.start(t);
    strikeNoise.start(t);

    const stopTime = t + 2.0;
    oscFund.stop(stopTime);
    oscOctave.stop(stopTime);
    oscFifth.stop(stopTime);
    strikeNoise.stop(stopTime);

    this.activeOscs.push(oscFund, oscOctave, oscFifth);
  }

  stop() {
    clearInterval(this.intervalId);
    this.activeOscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.activeOscs = [];
  }
}

// ----------------------------------------------------
// 7. DEEP HANG DRUM SYNTH
// Deeper, darker metal dome scale with longer resonant base swells
// ----------------------------------------------------
class DeepHangDrumSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private intervalId: any = null;
  private activeOscs: OscillatorNode[] = [];

  // Deep scale in F-major / Pygmy (F2, C3, F3, G3, Ab3, C4, Eb4, F4)
  private scale = [87.31, 130.81, 174.61, 196.00, 207.65, 261.63, 311.13, 349.23];

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    const playHangDrum = () => {
      const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
      this.triggerDeepHang(freq);
    };

    playHangDrum();
    this.intervalId = setInterval(playHangDrum, 2400); // slow atmospheric beat
  }

  private triggerDeepHang(freq: number) {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    const oscFund = this.ctx.createOscillator();
    const oscOctave = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    // Triangle for warm, round, hollow fundamental
    oscFund.type = 'triangle';
    oscFund.frequency.setValueAtTime(freq, t);

    oscOctave.type = 'sine';
    oscOctave.frequency.setValueAtTime(freq * 2.0, t);
    const octaveGain = this.ctx.createGain();
    octaveGain.gain.setValueAtTime(0.12, t);
    oscOctave.connect(octaveGain);
    octaveGain.connect(gainNode);

    // Warm base lowpass
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(550, t);

    // Strike transient
    const transientGain = this.ctx.createGain();
    transientGain.gain.setValueAtTime(0, t);
    transientGain.gain.linearRampToValueAtTime(0.08, t + 0.001);
    transientGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(freq * 4.0, t);
    clickOsc.connect(transientGain);

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.55, t + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); // Deep lingering decay

    oscFund.connect(gainNode);
    transientGain.connect(gainNode);

    gainNode.connect(lp);
    lp.connect(this.destination);

    oscFund.start(t);
    oscOctave.start(t);
    clickOsc.start(t);

    const stopTime = t + 2.6;
    oscFund.stop(stopTime);
    oscOctave.stop(stopTime);
    clickOsc.stop(stopTime);

    this.activeOscs.push(oscFund, oscOctave, clickOsc);
  }

  stop() {
    clearInterval(this.intervalId);
    this.activeOscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.activeOscs = [];
  }
}

// ----------------------------------------------------
// 8. CELESTIAL TONGUE DRUM SYNTH
// Crystalline bell-like metal clinks with beautiful double octave ringing
// ----------------------------------------------------
class CelestialTongueDrumSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private intervalId: any = null;
  private activeOscs: OscillatorNode[] = [];
  private step: number = 0;

  // Pentatonic scale in A (A4, B4, C#5, E5, F#5, A5, B5, C#6)
  private scale = [440.00, 493.88, 554.37, 659.25, 739.99, 880.00, 987.77, 1108.73];

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    const playCelestialTone = () => {
      // Arpeggio and random mix sequence
      let idx = 0;
      if (this.step % 8 === 0) idx = 0;
      else if (this.step % 8 === 2) idx = 2;
      else if (this.step % 8 === 4) idx = 4;
      else if (this.step % 8 === 6) idx = 5;
      else idx = Math.floor(Math.random() * this.scale.length);

      const freq = this.scale[idx];
      this.triggerCelestial(freq);
      this.step++;
    };

    playCelestialTone();
    this.intervalId = setInterval(playCelestialTone, 1100);
  }

  private triggerCelestial(freq: number) {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    const oscFund = this.ctx.createOscillator();
    const oscHigh = this.ctx.createOscillator(); // 4x frequency (double octave)
    const gainNode = this.ctx.createGain();

    oscFund.type = 'sine';
    oscFund.frequency.setValueAtTime(freq, t);

    oscHigh.type = 'sine';
    oscHigh.frequency.setValueAtTime(freq * 4.0, t);
    
    const highGain = this.ctx.createGain();
    highGain.gain.setValueAtTime(0, t);
    highGain.gain.linearRampToValueAtTime(0.15, t + 0.002);
    highGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); // high ring fades fast

    oscHigh.connect(highGain);
    highGain.connect(gainNode);

    // Core pluck gain envelope
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.25, t + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freq, t);
    bp.Q.setValueAtTime(1.5, t);

    oscFund.connect(gainNode);
    gainNode.connect(bp);
    bp.connect(this.destination);

    oscFund.start(t);
    oscHigh.start(t);

    const stopTime = t + 1.4;
    oscFund.stop(stopTime);
    oscHigh.stop(stopTime);

    this.activeOscs.push(oscFund, oscHigh);
  }

  stop() {
    clearInterval(this.intervalId);
    this.activeOscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.activeOscs = [];
  }
}

// ----------------------------------------------------
// 9. STRUCK TIBETAN SINGING BOWL SYNTH
// Triggered slow wood-on-metal strike with rich decaying drone
// ----------------------------------------------------
class TibetanBowlStruckSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private intervalId: any = null;
  private activeOscs: OscillatorNode[] = [];

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    const strikeBowl = () => {
      this.triggerStrike();
    };

    strikeBowl();
    this.intervalId = setInterval(strikeBowl, 6500); // Long decay spacing
  }

  private triggerStrike() {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    const baseFreq = 180.0; // F3# fundamental
    const harmonics = [
      { ratio: 1.0, vol: 0.5, decay: 6.0, tremoloFreq: 0.6 },
      { ratio: 2.01, vol: 0.25, decay: 4.5, tremoloFreq: 0.8 },
      { ratio: 2.99, vol: 0.15, decay: 3.5, tremoloFreq: 1.1 },
      { ratio: 4.02, vol: 0.08, decay: 2.5, tremoloFreq: 1.5 },
      { ratio: 5.05, vol: 0.04, decay: 1.5, tremoloFreq: 0.4 }
    ];

    // Strike hammer transient: dull click
    const strikeOsc = this.ctx.createOscillator();
    const strikeGain = this.ctx.createGain();
    const strikeFilter = this.ctx.createBiquadFilter();

    strikeOsc.type = 'triangle';
    strikeOsc.frequency.setValueAtTime(120, t);
    strikeFilter.type = 'lowpass';
    strikeFilter.frequency.setValueAtTime(300, t);

    strikeGain.gain.setValueAtTime(0, t);
    strikeGain.gain.linearRampToValueAtTime(0.3, t + 0.001);
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    strikeOsc.connect(strikeFilter);
    strikeFilter.connect(strikeGain);
    strikeGain.connect(this.destination);

    strikeOsc.start(t);
    strikeOsc.stop(t + 0.1);

    // Vibrating bowl harmonics
    harmonics.forEach(h => {
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h.ratio, t);

      // Fast strike attack + long slow exponential decay
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(h.vol, t + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + h.decay);

      // Create a subtle LFO tremolo unique to each harmonic to model the metal bowl vibration
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(h.tremoloFreq, t);
      lfoGain.gain.setValueAtTime(h.vol * 0.25, t); // 25% vibration ripple depth

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      osc.connect(gainNode);
      gainNode.connect(this.destination!);

      osc.start(t);
      lfo.start(t);

      const stopTime = t + h.decay + 0.5;
      osc.stop(stopTime);
      lfo.stop(stopTime);

      this.activeOscs.push(osc, lfo);
    });
  }

  stop() {
    clearInterval(this.intervalId);
    this.activeOscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.activeOscs = [];
  }
}

// ----------------------------------------------------
// 10. DREAMY KALIMBA SYNTH
// Whimsical metal-box tiny plucks with a sweet ambient lullaby loop
// ----------------------------------------------------
class DreamyKalimbaSynth implements SynthPreset {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private intervalId: any = null;
  private activeOscs: OscillatorNode[] = [];

  // Healing pentatonic scale (C5, D5, E5, G5, A5, C6, D6, E6)
  private scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
  private currentStep: number = 0;

  start(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;

    const playKalimbaPattern = () => {
      // 15% chance of silent resting beat for expressive breathing room
      if (Math.random() < 0.15) return;

      // Follow a sweet melody or random octave jump
      let index = this.currentStep % this.scale.length;
      if (Math.random() < 0.3) {
        index = Math.floor(Math.random() * this.scale.length);
      }
      const freq = this.scale[index];
      this.triggerKalimba(freq);
      this.currentStep++;
    };

    playKalimbaPattern();
    this.intervalId = setInterval(playKalimbaPattern, 550); // Sweet rapid pace
  }

  private triggerKalimba(freq: number) {
    if (!this.ctx || !this.destination) return;
    const t = this.ctx.currentTime;

    const oscFund = this.ctx.createOscillator();
    const oscChime1 = this.ctx.createOscillator(); // glassy metal ring at 3x freq
    const oscChime2 = this.ctx.createOscillator(); // glassy metal ring at 6x freq
    const gainNode = this.ctx.createGain();

    oscFund.type = 'sine';
    oscFund.frequency.setValueAtTime(freq, t);

    // Kalimbas have brief sharp wooden pluck + extremely high-pitched bell chime ring
    oscChime1.type = 'sine';
    oscChime1.frequency.setValueAtTime(freq * 3.01, t);
    const gainChime1 = this.ctx.createGain();
    gainChime1.gain.setValueAtTime(0, t);
    gainChime1.gain.linearRampToValueAtTime(0.08, t + 0.001);
    gainChime1.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

    oscChime2.type = 'sine';
    oscChime2.frequency.setValueAtTime(freq * 6.03, t);
    const gainChime2 = this.ctx.createGain();
    gainChime2.gain.setValueAtTime(0, t);
    gainChime2.gain.linearRampToValueAtTime(0.03, t + 0.001);
    gainChime2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    oscChime1.connect(gainChime1);
    gainChime1.connect(gainNode);

    oscChime2.connect(gainChime2);
    gainChime2.connect(gainNode);

    // Master pluck gain
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.28, t + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); // sweet short ring

    // Bandpass to focus the sweet plucky warmth
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2000, t);

    oscFund.connect(gainNode);
    gainNode.connect(lp);
    lp.connect(this.destination);

    oscFund.start(t);
    oscChime1.start(t);
    oscChime2.start(t);

    const stopTime = t + 0.95;
    oscFund.stop(stopTime);
    oscChime1.stop(stopTime);
    oscChime2.stop(stopTime);

    this.activeOscs.push(oscFund, oscChime1, oscChime2);
  }

  stop() {
    clearInterval(this.intervalId);
    this.activeOscs.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.activeOscs = [];
  }
}

// Create and export singleton audio engine
export const audioEngine = new AudioEngine();
