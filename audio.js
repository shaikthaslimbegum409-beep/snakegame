/**
 * Nokia 3310 Retro Audio Synthesizer (Web Audio API)
 * Emulates the iconic piezoelectric buzzer sound of vintage Nokia phones.
 */

class NokiaAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isMuted = false;
  }

  // Lazy-initialize audio context upon user gesture
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound(state) {
    if (typeof state === 'boolean') {
      this.isMuted = !state;
    } else {
      this.isMuted = !this.isMuted;
    }
    return !this.isMuted;
  }

  playTone(frequency, type = 'square', duration = 0.08, startTimeOffset = 0, volume = 0.12) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime + startTimeOffset);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime + startTimeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTimeOffset + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startTimeOffset);
      osc.stop(this.ctx.currentTime + startTimeOffset + duration + 0.02);
    } catch (e) {
      // Audio playback fails gracefully if blocked
    }
  }

  // Short click when pressing phone buttons
  playKeyClick() {
    this.playTone(1800, 'square', 0.02, 0, 0.05);
  }

  // Eating standard food pellet
  playEat() {
    this.playTone(850, 'square', 0.04, 0, 0.15);
    this.playTone(1280, 'square', 0.06, 0.04, 0.15);
  }

  // Eating the special bonus bug
  playBonusEat() {
    const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'square', 0.06, idx * 0.05, 0.15);
    });
  }

  // When bonus insect appears on screen
  playBonusSpawn() {
    this.playTone(1400, 'square', 0.03, 0, 0.08);
    this.playTone(1800, 'square', 0.04, 0.05, 0.08);
  }

  // Crash / Game Over
  playDie() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const crashFreqs = [440, 310, 220, 150, 90];
    crashFreqs.forEach((freq, i) => {
      this.playTone(freq, 'sawtooth', 0.09, i * 0.07, 0.2);
    });
  }

  // Pause / Unpause
  playPause() {
    this.playTone(600, 'square', 0.05, 0, 0.1);
    this.playTone(800, 'square', 0.06, 0.06, 0.1);
  }

  // Classic Nokia Ringtone Theme snippet (Gran Vals)
  playNokiaTune() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Iconic melody notes & durations
    // E5, D5, F#4, G#4, C#5, B4, D4, E4, B4, A4, C#4, E4, A4
    const melody = [
      { f: 659.25, d: 0.12 }, // E5
      { f: 587.33, d: 0.12 }, // D5
      { f: 369.99, d: 0.24 }, // F#4
      { f: 415.30, d: 0.24 }, // G#4
      { f: 554.37, d: 0.12 }, // C#5
      { f: 493.88, d: 0.12 }, // B4
      { f: 293.66, d: 0.24 }, // D4
      { f: 329.63, d: 0.24 }, // E4
      { f: 493.88, d: 0.12 }, // B4
      { f: 440.00, d: 0.12 }, // A4
      { f: 277.18, d: 0.24 }, // C#4
      { f: 329.63, d: 0.24 }, // E4
      { f: 440.00, d: 0.45 }  // A4
    ];

    let timeAcc = 0;
    melody.forEach(item => {
      this.playTone(item.f, 'square', item.d * 0.9, timeAcc, 0.12);
      timeAcc += item.d;
    });
  }
}

// Global audio singleton
window.nokiaAudio = new NokiaAudio();
