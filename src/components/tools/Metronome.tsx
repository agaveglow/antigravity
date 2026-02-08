import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Minus } from 'lucide-react';
import Button from '../common/Button';

const Metronome: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [beats, setBeats] = useState(4);
    const [noteValue, setNoteValue] = useState(4);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [tone, setTone] = useState<'digital' | 'analog' | 'percussion'>('digital');
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize Audio Context
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    // Handle Metronome Timer
    useEffect(() => {
        let intervalId: number | null = null;

        if (isPlaying) {
            // Calculate interval based on note value relative to a quarter note (4)
            // e.g., if noteValue is 8, interval is half of a quarter note (4/8 = 0.5)
            const interval = (60000 / bpm) * (4 / noteValue);

            intervalId = window.setInterval(() => {
                setCurrentBeat(prev => {
                    const nextBeat = (prev + 1) % beats;

                    // Determine accent
                    // Standard: Accent on 1 (index 0)
                    // Compound meter (e.g. 6/8, 9/8, 12/8): Accent on 1, 4, 7, 10...
                    let isAccent = nextBeat === 0;
                    if (noteValue === 8 && beats % 3 === 0) {
                        isAccent = nextBeat % 3 === 0;
                    }

                    playClick(isAccent);
                    return nextBeat;
                });
            }, interval);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, bpm, beats, tone, noteValue]); // Re-run when BPM, playing state, beats, tone, or noteValue changes

    const playClick = (isAccent: boolean) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        if (tone === 'digital') {
            oscillator.type = 'sine';
            oscillator.frequency.value = isAccent ? 1000 : 800;
            gainNode.gain.setValueAtTime(isAccent ? 0.3 : 0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
        } else if (tone === 'analog') {
            oscillator.type = 'triangle';
            oscillator.frequency.value = isAccent ? 800 : 600;
            gainNode.gain.setValueAtTime(isAccent ? 0.25 : 0.15, now);
            gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15); // Softer decay
            oscillator.start(now);
            oscillator.stop(now + 0.15);
        } else if (tone === 'percussion') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(isAccent ? 300 : 200, now);
            oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.1); // Pitch drop for "click" effect
            gainNode.gain.setValueAtTime(isAccent ? 0.2 : 0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05); // Very short
            oscillator.start(now);
            oscillator.stop(now + 0.05);
        }
    };

    const togglePlay = () => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (!isPlaying) {
            setCurrentBeat(0);
            playClick(true); // Play the first beat immediately
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Metronome</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                    {bpm}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>BPM</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                {(['digital', 'analog', 'percussion'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTone(t)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid var(--primary-color)',
                            background: tone === t ? 'var(--primary-color)' : 'transparent',
                            color: tone === t ? 'black' : 'var(--primary-color)',
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                <Button variant="secondary" onClick={() => setBpm(Math.max(40, bpm - 5))} style={{ padding: '1rem' }}>
                    <Minus size={20} />
                </Button>
                <input
                    type="range"
                    min="40"
                    max="240"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--primary-color)' }}
                />
                <Button variant="secondary" onClick={() => setBpm(Math.min(240, bpm + 5))} style={{ padding: '1rem' }}>
                    <Plus size={20} />
                </Button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Time Signature: {beats}/{noteValue}
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="2"
                        max="12"
                        value={beats}
                        onChange={(e) => setBeats(parseInt(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--primary-color)' }}
                    />
                    <select
                        value={noteValue}
                        onChange={(e) => setNoteValue(parseInt(e.target.value))}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid var(--border-color)',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        {[2, 4, 8, 16].map(val => (
                            <option key={val} value={val} style={{ background: '#333' }}>/{val}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
                {Array.from({ length: beats }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isPlaying && currentBeat === i ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.1s'
                        }}
                    />
                ))}
            </div>

            <Button
                variant="primary"
                onClick={togglePlay}
                style={{ width: '100%', padding: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
                {isPlaying ? <><Pause size={24} /> Stop</> : <><Play size={24} /> Start</>}
            </Button>
        </div>
    );
};

export default Metronome;
