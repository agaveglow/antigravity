import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Minus } from 'lucide-react';
import Button from '../common/Button';

const Metronome: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [beats, setBeats] = useState(4);
    const [currentBeat, setCurrentBeat] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            audioContextRef.current?.close();
        };
    }, []);

    const playClick = (isAccent: boolean) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = isAccent ? 1000 : 800;
        gainNode.gain.value = isAccent ? 0.3 : 0.2;

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    };

    const togglePlay = () => {
        if (isPlaying) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setCurrentBeat(0);
        } else {
            const interval = 60000 / bpm;
            let beat = 0;
            intervalRef.current = setInterval(() => {
                playClick(beat === 0);
                setCurrentBeat(beat);
                beat = (beat + 1) % beats;
            }, interval);
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Metronome</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1rem' }}>
                    {bpm}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>BPM</div>
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
                    Time Signature: {beats}/4
                </label>
                <input
                    type="range"
                    min="2"
                    max="12"
                    value={beats}
                    onChange={(e) => setBeats(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-color)' }}
                />
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
