const NOTE_FREQS: { [key: string]: number } = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98
};

// Cheerful pentatonic school BGM melody
const BGM_NOTES = [
  'C5', 'E5', 'G5', 'E5', 'A5', 'G5', 'E5', 'C5',
  'D5', 'F5', 'A5', 'F5', 'G5', 'F5', 'D5', 'B4',
  'C5', 'E5', 'G5', 'C6', 'B5', 'G5', 'A5', 'F5',
  'G5', 'E5', 'D5', 'G4', 'C5', 'E5', 'C5', 'C5'
];

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private bgmInterval: any = null;
  private bgmPlaying: boolean = false;
  private bgmVolume: number = 0.05; // soft volume
  private nextNoteTime: number = 0;
  private noteIndex: number = 0;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  startBGM() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || this.bgmPlaying) return;

    this.bgmPlaying = true;
    this.noteIndex = 0;
    this.nextNoteTime = this.ctx.currentTime;
    
    const scheduleAheadTime = 0.3;
    const noteLength = 0.35; // duration of a note in seconds
    
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || !this.bgmPlaying) return;
      
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
        this.playBGMNote(BGM_NOTES[this.noteIndex], this.nextNoteTime, noteLength);
        this.nextNoteTime += noteLength;
        this.noteIndex = (this.noteIndex + 1) % BGM_NOTES.length;
      }
    }, 100);
  }

  private playBGMNote(noteName: string, time: number, duration: number) {
    if (!this.ctx || this.isMuted) return;
    const freq = NOTE_FREQS[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // triangle is soft and musical
    osc.frequency.setValueAtTime(freq, time);

    // Subtle pitch fluctuation for toy music box aesthetic
    osc.detune.setValueAtTime(0, time);
    osc.detune.linearRampToValueAtTime(8, time + duration);

    // Gain Envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(this.bgmVolume, time + 0.03); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01); // Release

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  playPunch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // 1. White Noise burst for paper tearing sound
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(280, time);
    noiseFilter.Q.setValueAtTime(4, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    // 2. Sub-bass punch body
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.12); // fast drop

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(time);
    osc.start(time);

    noiseNode.stop(time + 0.12);
    osc.stop(time + 0.12);
  }

  playWin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // Bright ascending arpeggio
    const arpeggio = ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'];
    const noteDelay = 0.08;
    const noteLength = 0.35;

    arpeggio.forEach((note, index) => {
      if (!this.ctx) return;
      const freq = NOTE_FREQS[note];
      const noteTime = time + index * noteDelay;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator(); // sub-octave
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq / 2, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc2.start(noteTime);
      osc.stop(noteTime + noteLength);
      osc2.stop(noteTime + noteLength);
    });
  }

  playTryAgain() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // Soft two-note notification
    const melody = ['E5', 'A5'];
    const delays = [0, 0.12];
    const duration = 0.3;

    melody.forEach((note, index) => {
      if (!this.ctx) return;
      const freq = NOTE_FREQS[note];
      const noteTime = time + delays[index];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.1, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration);
    });
  }
}

export const audioSynth = new AudioSynthesizer();
