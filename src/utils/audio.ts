// Note frequency helper
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const getFrequency = (note: string, octave: number): number => {
    const semitonesFromA4 = NOTES.indexOf(note) - NOTES.indexOf('A') + (octave - 4) * 12;
    return 440 * Math.pow(2, semitonesFromA4 / 12);
};

class AudioService {
    private audioContext: AudioContext | null = null;
    private activeOscillators: OscillatorNode[] = [];
    private masterGain: GainNode | null = null;

    constructor() {
        // Lazy init
    }

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Default volume
        }
    }

    public playTone(frequency: number, duration: number = 0.5, type: OscillatorType = 'triangle', startTime: number = 0) {
        this.initAudioContext();
        if (!this.audioContext || !this.masterGain) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Envelope
        const now = this.audioContext.currentTime + startTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.05); // Attack
        gain.gain.setValueAtTime(1, now + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, now + duration); // Release

        osc.start(now);
        osc.stop(now + duration);

        this.activeOscillators.push(osc);
        osc.onended = () => {
            this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
        };
    }

    public playNote(note: string, octave: number, duration: number = 0.5) {
        const freq = getFrequency(note, octave);
        this.playTone(freq, duration);
    }

    public playInterval(note1: { note: string, octave: number }, note2: { note: string, octave: number }, duration: number = 1.0) {
        // Play melodic interval (one after another)
        this.playNote(note1.note, note1.octave, duration);
        setTimeout(() => {
            this.playNote(note2.note, note2.octave, duration);
        }, duration * 1000); // Wait for first note to finish
    }

    public playHarmonicInterval(note1: { note: string, octave: number }, note2: { note: string, octave: number }, duration: number = 1.0) {
        // Play simultaneously
        this.playNote(note1.note, note1.octave, duration);
        this.playNote(note2.note, note2.octave, duration);
    }

    public stopAll() {
        this.activeOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        this.activeOscillators = [];
    }

    // --- UX Sounds ---

    public playSuccess() {
        this.playTone(440, 0.1, 'sine'); // A4
        setTimeout(() => this.playTone(554.37, 0.2, 'sine'), 100); // C#5
    }

    public playError() {
        this.playTone(150, 0.3, 'sawtooth');
    }

    public playLevelUp() {
        this.playTone(523.25, 0.1, 'square', 0); // C5
        this.playTone(659.25, 0.1, 'square', 0.1); // E5
        this.playTone(783.99, 0.2, 'square', 0.2); // G5
        this.playTone(1046.50, 0.4, 'square', 0.3); // C6
    }
}

export const audioService = new AudioService();
