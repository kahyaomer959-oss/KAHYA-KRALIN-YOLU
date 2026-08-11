/**
 * Web Audio API synthesizer for UI sound effects (hover, click, modal open, ambiance, success)
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public masterVolume: number = 80;
  public sfxVolume: number = 85;
  public musicVolume: number = 60;

  private musicOsc1: OscillatorNode | null = null;
  private musicOsc2: OscillatorNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;

  private customMusicAudio: HTMLAudioElement | null = null;
  public customMusicUrl: string | null = 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=medieval-fantasy-9377.mp3';
  public customClickUrl: string | null = null;

  public musicPresets = [
    { name: 'Atmosfer', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=medieval-fantasy-9377.mp3' }
  ];

  public addCustomMusic(file: File) {
    const url = URL.createObjectURL(file);
    const newTrack = { name: `🎵 ${file.name.replace(/\.[^/.]+$/, '')}`, url };
    this.musicPresets.push(newTrack);
    this.setCustomMusic(url);
  }

  private getSfxMultiplier(): number {
    if (!this.soundEnabled || this.masterVolume <= 0 || this.sfxVolume <= 0) return 0;
    return (this.masterVolume / 100) * (this.sfxVolume / 100);
  }

  private getMusicMultiplier(): number {
    if (!this.soundEnabled || this.masterVolume <= 0 || this.musicVolume <= 0) return 0;
    return (this.masterVolume / 100) * (this.musicVolume / 100);
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setCustomMusic(url: string | null) {
    this.customMusicUrl = url;
    if (this.customMusicAudio) {
      this.customMusicAudio.pause();
      this.customMusicAudio = null;
    }
    if (url) {
      this.isMusicPlaying = false;
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  public updateVolumes(soundEnabled: boolean, master: number, sfx: number, music: number) {
    this.soundEnabled = soundEnabled;
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.musicVolume = music;

    if (this.customMusicAudio) {
      const mult = this.getMusicMultiplier();
      this.customMusicAudio.volume = mult > 0 ? mult : (soundEnabled ? 0.5 : 0);
    }

    if (!soundEnabled || master <= 0 || music <= 0) {
      this.stopAmbientMusic();
    } else {
      if (!this.isMusicPlaying) {
        this.startAmbientMusic();
      } else if (this.musicGain && this.ctx) {
        const mult = this.getMusicMultiplier();
        this.musicGain.gain.setValueAtTime(0.04 * mult, this.ctx.currentTime);
      }
    }
  }

  public startAmbientMusic() {
    if (this.isMusicPlaying && !this.customMusicUrl) return;
    if (!this.soundEnabled || this.masterVolume <= 0 || this.musicVolume <= 0) return;

    if (this.customMusicUrl) {
      try {
        if (!this.customMusicAudio) {
          this.customMusicAudio = new Audio(this.customMusicUrl);
          this.customMusicAudio.loop = true;
          this.customMusicAudio.load();
        }
        let mult = this.getMusicMultiplier();
        if (mult <= 0) mult = 0.6;
        this.customMusicAudio.volume = mult;
        this.customMusicAudio.play().then(() => {
          this.isMusicPlaying = true;
        }).catch(() => {
          this.isMusicPlaying = false;
        });
        this.isMusicPlaying = true;
        return;
      } catch {
        this.isMusicPlaying = false;
      }
    }

    // No synthetic background drone unless custom music is provided
    return;
  }

  public stopAmbientMusic() {
    if (this.customMusicAudio) {
      try {
        this.customMusicAudio.pause();
        this.customMusicAudio.currentTime = 0;
      } catch {}
    }
    if (!this.isMusicPlaying) return;
    try {
      if (this.musicOsc1) {
        this.musicOsc1.stop();
        this.musicOsc1.disconnect();
        this.musicOsc1 = null;
      }
      if (this.musicOsc2) {
        this.musicOsc2.stop();
        this.musicOsc2.disconnect();
        this.musicOsc2 = null;
      }
      if (this.musicFilter) {
        this.musicFilter.disconnect();
        this.musicFilter = null;
      }
      if (this.musicGain) {
        this.musicGain.disconnect();
        this.musicGain = null;
      }
    } catch {
      // Ignore
    }
    this.isMusicPlaying = false;
  }

  playHover() {
    const mult = this.getSfxMultiplier();
    if (mult <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.04);

      gain.gain.setValueAtTime(0.04 * mult, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  playClick() {
    const mult = this.getSfxMultiplier();
    if (mult <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Soft pleasant wooden/lute click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.06);

      gain.gain.setValueAtTime(0.08 * mult, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  playStartGame() {
    const mult = this.getSfxMultiplier();
    if (mult <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Majestic medieval fanfare chord (C4, G4, C5)
      [261.63, 392.00, 523.25].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i === 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0.08 * mult, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + 0.5);
      });
    } catch {
      // Ignore
    }
  }

  playSuccess() {
    const mult = this.getSfxMultiplier();
    if (mult <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Joyful magical harp arpeggio (C5, E5, G5, C6)
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        if (!this.ctx) return;
        const timeOffset = i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + timeOffset);

        gain.gain.setValueAtTime(0.1 * mult, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.3);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundEffectsManager();
