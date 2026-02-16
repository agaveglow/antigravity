import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import Button from '../common/Button';

// Note frequency helper
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getFrequency = (note: string, octave: number): number => {
    const semitonesFromA4 = NOTES.indexOf(note) - NOTES.indexOf('A') + (octave - 4) * 12;
    return 440 * Math.pow(2, semitonesFromA4 / 12);
};

// Instrument Definitions
type InstrumentConfig = {
    name: string;
    tunings: Record<string, { name: string; strings: { note: string; octave: number }[] }>;
};

const INSTRUMENTS: Record<string, InstrumentConfig> = {
    guitar: {
        name: 'Guitar (6-String)',
        tunings: {
            standard: {
                name: 'Standard',
                strings: [
                    { note: 'E', octave: 2 },
                    { note: 'A', octave: 2 },
                    { note: 'D', octave: 3 },
                    { note: 'G', octave: 3 },
                    { note: 'B', octave: 3 },
                    { note: 'E', octave: 4 },
                ]
            },
            dropD: {
                name: 'Drop D',
                strings: [
                    { note: 'D', octave: 2 },
                    { note: 'A', octave: 2 },
                    { note: 'D', octave: 3 },
                    { note: 'G', octave: 3 },
                    { note: 'B', octave: 3 },
                    { note: 'E', octave: 4 },
                ]
            },
            halfStepDown: {
                name: 'Half Step Down',
                strings: [
                    { note: 'D#', octave: 2 },
                    { note: 'G#', octave: 2 },
                    { note: 'C#', octave: 3 },
                    { note: 'F#', octave: 3 },
                    { note: 'A#', octave: 3 },
                    { note: 'D#', octave: 4 },
                ]
            },
            openG: {
                name: 'Open G',
                strings: [
                    { note: 'D', octave: 2 },
                    { note: 'G', octave: 2 },
                    { note: 'D', octave: 3 },
                    { note: 'G', octave: 3 },
                    { note: 'B', octave: 3 },
                    { note: 'D', octave: 4 },
                ]
            },
            openD: {
                name: 'Open D',
                strings: [
                    { note: 'D', octave: 2 },
                    { note: 'A', octave: 2 },
                    { note: 'D', octave: 3 },
                    { note: 'F#', octave: 3 },
                    { note: 'A', octave: 3 },
                    { note: 'D', octave: 4 },
                ]
            },
            dadgad: {
                name: 'DADGAD',
                strings: [
                    { note: 'D', octave: 2 },
                    { note: 'A', octave: 2 },
                    { note: 'D', octave: 3 },
                    { note: 'G', octave: 3 },
                    { note: 'A', octave: 3 },
                    { note: 'D', octave: 4 },
                ]
            }
        }
    },
    bass: {
        name: 'Bass (4-String)',
        tunings: {
            standard: {
                name: 'Standard',
                strings: [
                    { note: 'E', octave: 1 },
                    { note: 'A', octave: 1 },
                    { note: 'D', octave: 2 },
                    { note: 'G', octave: 2 },
                ]
            },
            dropD: {
                name: 'Drop D',
                strings: [
                    { note: 'D', octave: 1 },
                    { note: 'A', octave: 1 },
                    { note: 'D', octave: 2 },
                    { note: 'G', octave: 2 },
                ]
            }
        }
    },
    violin: {
        name: 'Violin',
        tunings: {
            standard: {
                name: 'Standard',
                strings: [
                    { note: 'G', octave: 3 },
                    { note: 'D', octave: 4 },
                    { note: 'A', octave: 4 },
                    { note: 'E', octave: 5 },
                ]
            }
        }
    },
    ukulele: {
        name: 'Ukulele',
        tunings: {
            standard: {
                name: 'Standard (GCEA)',
                strings: [
                    { note: 'G', octave: 4 },
                    { note: 'C', octave: 4 },
                    { note: 'E', octave: 4 },
                    { note: 'A', octave: 4 },
                ]
            }
        }
    }
};

const Tuner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [instrument, setInstrument] = useState<string>('guitar');
    const [tuningKey, setTuningKey] = useState<string>('standard');
    const [activeStringIndex, setActiveStringIndex] = useState<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Current string configuration (allows for custom modifications)
    const [currentStrings, setCurrentStrings] = useState(INSTRUMENTS['guitar'].tunings['standard'].strings);

    // Initialize Audio Context
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            stopTone();
            audioContextRef.current?.close();
        };
    }, []);

    // Update strings when instrument/tuning changes
    useEffect(() => {
        if (INSTRUMENTS[instrument]?.tunings[tuningKey]) {
            setCurrentStrings(INSTRUMENTS[instrument].tunings[tuningKey].strings);
            stopTone();
        }
    }, [instrument, tuningKey]);

    const playTone = (note: string, octave: number, index: number) => {
        if (!audioContextRef.current) return;

        // If clicking the same string, toggle off
        if (activeStringIndex === index) {
            stopTone();
            return;
        }

        stopTone(); // Stop any previous tone

        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Richer than sine, good for tuning
        osc.frequency.value = getFrequency(note, octave);

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Soft attack
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);

        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        setActiveStringIndex(index);
    };

    const stopTone = () => {
        if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
            const ctx = audioContextRef.current;
            const gain = gainNodeRef.current;

            // Soft release
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

            const osc = oscillatorRef.current;
            setTimeout(() => {
                try { osc.stop(); } catch (e) { }
            }, 150);

            oscillatorRef.current = null;
            gainNodeRef.current = null;
        }
        setActiveStringIndex(null);
    };

    const adjustString = (index: number, semitones: number) => {
        const newStrings = [...currentStrings];
        const s = newStrings[index];

        let newNoteIndex = NOTES.indexOf(s.note) + semitones;
        let newOctave = s.octave;

        if (newNoteIndex >= NOTES.length) {
            newNoteIndex -= 12;
            newOctave += 1;
        } else if (newNoteIndex < 0) {
            newNoteIndex += 12;
            newOctave -= 1;
        }

        newStrings[index] = { note: NOTES[newNoteIndex], octave: newOctave };
        setCurrentStrings(newStrings);

        // If playing this string, update the tone immediately
        if (activeStringIndex === index && oscillatorRef.current && audioContextRef.current) {
            oscillatorRef.current.frequency.setValueAtTime(getFrequency(NOTES[newNoteIndex], newOctave), audioContextRef.current.currentTime);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={24} /> Reference Tuner</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Instrument</label>
                    <select
                        value={instrument}
                        onChange={(e) => {
                            setInstrument(e.target.value);
                            setTuningKey('standard'); // Reset to standard when changing instrument
                        }}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-primary)' }}
                    >
                        {Object.entries(INSTRUMENTS).map(([key, config]) => (
                            <option key={key} value={key}>{config.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tuning</label>
                    <select
                        value={tuningKey}
                        onChange={(e) => setTuningKey(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-primary)' }}
                    >
                        {Object.entries(INSTRUMENTS[instrument].tunings).map(([key, config]) => (
                            <option key={key} value={key}>{config.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Strings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                {currentStrings.map((str, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            justifyContent: 'space-between',
                            background: activeStringIndex === index ? 'var(--color-primary-alpha)' : 'var(--bg-input)',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: activeStringIndex === index ? '1px solid var(--color-primary)' : '1px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        {/* Note Display & Play Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer' }} onClick={() => playTone(str.note, str.octave, index)}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: activeStringIndex === index ? 'var(--color-primary)' : 'var(--bg-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: activeStringIndex === index ? 'white' : 'var(--text-primary)'
                            }}>
                                {str.note}
                            </div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{str.note}{str.octave}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{getFrequency(str.note, str.octave).toFixed(1)} Hz</div>
                            </div>
                        </div>

                        {/* Tuning Controls */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); adjustString(index, -1); }}
                                style={{ padding: '0.5rem' }}
                            >
                                ♭
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); adjustString(index, 1); }}
                                style={{ padding: '0.5rem' }}
                            >
                                ♯
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <p>Click a note to play reference tone.</p>
            </div>
        </div>
    );
};

export default Tuner;
