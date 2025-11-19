
// Simple Web Audio API Synthesizer

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isPlayingMusic: boolean = false;
  private nextNoteTime: number = 0;
  private beatIndex: number = 0;
  private timerID: number | null = null;
  private tempo: number = 140; // Rock tempo

  // Melody frequencies
  private NOTES: { [key: string]: number } = {
    'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G#4': 415.30,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25
  };

  constructor() {
    // Initialize on user interaction
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.2;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SFX ---

  playJump() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playShoot() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCollect() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1800, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playDie() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.4);

    // Wobble
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 20;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
    lfo.stop(this.ctx.currentTime + 0.4);
  }

  playWin() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const freqs = [440, 554, 659, 880]; // A major
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.type = 'triangle';
      osc.frequency.value = f;
      
      const now = this.ctx!.currentTime;
      const delay = i * 0.05;
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.8);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.8);
    });
  }

  playAttack() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHit() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playEnemyShoot() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // --- MUSIC SEQUENCER ---

  startMusic() {
    this.init();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.beatIndex = 0;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.scheduleMusic();
    }
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.timerID) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduleMusic() {
    if (!this.isPlayingMusic || !this.ctx || !this.musicGain) return;

    // 16th notes
    const secondsPerBeat = 60.0 / this.tempo;
    const secondsPerStep = secondsPerBeat / 4; 
    const lookahead = 25.0; 

    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.playSequenceStep(this.beatIndex, this.nextNoteTime);
      this.nextNoteTime += secondsPerStep;
      // 8 bars * 16 steps = 128 steps loop
      this.beatIndex = (this.beatIndex + 1) % 128; 
    }

    this.timerID = window.setTimeout(() => {
      this.scheduleMusic();
    }, lookahead);
  }

  // Für Elise - Rock Version - Sequencer
  private playSequenceStep(step: number, time: number) {
    // --------------------
    // DRUMS (Every Bar)
    // --------------------
    const stepInBar = step % 16;
    
    // Kick: Beats 1, 3 (and some syncopation)
    if (stepInBar === 0 || stepInBar === 8 || stepInBar === 10) {
      this.playKick(time);
    }
    
    // Snare: Beats 2, 4
    if (stepInBar === 4 || stepInBar === 12) {
      this.playSnare(time);
    }

    // Hi-Hat: 8th notes (0, 2, 4, 6...)
    if (stepInBar % 2 === 0) {
       this.playHiHat(time, stepInBar % 4 === 0); // Accent on beat
    }

    // --------------------
    // BASS (A Minor / E Major)
    // --------------------
    // A Minor for bars 1, 2, 4, 5, 6, 8
    // E Major for bars 3, 7
    
    const barIndex = Math.floor(step / 16); // 0-7
    let bassNote = 55.0; // A1

    if (barIndex === 2 || barIndex === 6) { // Bars 3 and 7 (roughly E major part)
       bassNote = 41.20; // E1
    }

    // Driving 8th notes bass
    if (step % 2 === 0) {
       this.playBass(time, bassNote);
    }

    // --------------------
    // MELODY (Für Elise)
    // --------------------
    // Pattern A: E5 D#5 E5 D#5 E5 B4 D5 C5 A4...
    
    let melodyNote: number | null = null;

    // Helper to map melody steps easily
    // Each array entry corresponds to a 16th note step relative to the phrase start
    
    // Phrase 1 (Bars 0-1): The main riff
    // Steps: 0, 2, 4, 6, 8, 10, 12, 14, 16(Long A)
    if (step === 0) melodyNote = this.NOTES.E5;
    if (step === 2) melodyNote = this.NOTES['D#5'];
    if (step === 4) melodyNote = this.NOTES.E5;
    if (step === 6) melodyNote = this.NOTES['D#5'];
    if (step === 8) melodyNote = this.NOTES.E5;
    if (step === 10) melodyNote = this.NOTES.B4;
    if (step === 12) melodyNote = this.NOTES.D5;
    if (step === 14) melodyNote = this.NOTES.C5;
    if (step === 16) melodyNote = this.NOTES.A4; // Land on A
    
    // Bridge 1 (Bar 1 end): C E A B
    if (step === 20) melodyNote = this.NOTES.C4;
    if (step === 22) melodyNote = this.NOTES.E4;
    if (step === 24) melodyNote = this.NOTES.A4;
    if (step === 28) melodyNote = this.NOTES.B4; // Land on B

    // Bridge 2 (Bar 2 end): E G# B C
    if (step === 32) melodyNote = this.NOTES.E4;
    if (step === 34) melodyNote = this.NOTES['G#4'];
    if (step === 36) melodyNote = this.NOTES.B4;
    if (step === 40) melodyNote = this.NOTES.C5; // Land on C

    // Phrase 2 (Bars 3-4) - Repeat Main Riff
    if (step === 42) melodyNote = this.NOTES.E4; // Pickup
    
    const offset2 = 44;
    if (step === offset2 + 0) melodyNote = this.NOTES.E5;
    if (step === offset2 + 2) melodyNote = this.NOTES['D#5'];
    if (step === offset2 + 4) melodyNote = this.NOTES.E5;
    if (step === offset2 + 6) melodyNote = this.NOTES['D#5'];
    if (step === offset2 + 8) melodyNote = this.NOTES.E5;
    if (step === offset2 + 10) melodyNote = this.NOTES.B4;
    if (step === offset2 + 12) melodyNote = this.NOTES.D5;
    if (step === offset2 + 14) melodyNote = this.NOTES.C5;
    if (step === offset2 + 16) melodyNote = this.NOTES.A4;

    // Bridge 3: C E A B
    if (step === offset2 + 20) melodyNote = this.NOTES.C4;
    if (step === offset2 + 22) melodyNote = this.NOTES.E4;
    if (step === offset2 + 24) melodyNote = this.NOTES.A4;
    if (step === offset2 + 28) melodyNote = this.NOTES.B4;

    // Bridge 4: E C B A (Resolution)
    if (step === offset2 + 32) melodyNote = this.NOTES.E4;
    if (step === offset2 + 36) melodyNote = this.NOTES.C5;
    if (step === offset2 + 38) melodyNote = this.NOTES.B4;
    if (step === offset2 + 40) melodyNote = this.NOTES.A4; // Resolution

    // Loop repeats at 128, maybe silence for last bar
    
    if (melodyNote) {
       this.playLead(time, melodyNote);
    }
  }

  private playLead(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Distortion effect (Soft clipping via high gain + clamp or wave shaper)
    // Simple approach: Sawtooth is already gritty.
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    osc.connect(gain);
    gain.connect(this.musicGain);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playBass(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    
    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2); // Short pluck

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(this.musicGain);
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    noise.start(time);
  }

  private playHiHat(time: number, accent: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.type = 'square';
    // High pitch random-ish
    osc.frequency.setValueAtTime(accent ? 6000 : 8000, time);
    gain.gain.setValueAtTime(accent ? 0.15 : 0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    osc.start(time);
    osc.stop(time + 0.05);
  }
}

export const sfx = new SoundManager();
