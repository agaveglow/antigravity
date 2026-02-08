import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import Button from '../common/Button';

const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const Tuner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [frequency, setFrequency] = useState(0);
    const [note, setNote] = useState('');
    const [cents, setCents] = useState(0);
    const [octave, setOctave] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const frequencyToNote = (freq: number) => {
        const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
        const roundedNoteNum = Math.round(noteNum) + 69;
        const noteName = noteStrings[roundedNoteNum % 12];
        const octaveNum = Math.floor(roundedNoteNum / 12) - 1;
        const centOffset = Math.floor((noteNum - Math.round(noteNum)) * 100);

        return { noteName, octaveNum, centOffset };
    };

    const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
        let SIZE = buffer.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        if (rms < 0.01) return -1;

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;

        const c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buffer[j] * buffer[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;

        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        let T0 = maxpos;

        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    };

    const updatePitch = () => {
        if (!analyserRef.current) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.fftSize;
        const buffer = new Float32Array(bufferLength);
        analyser.getFloatTimeDomainData(buffer);

        const detectedFreq = autoCorrelate(buffer, audioContextRef.current!.sampleRate);

        if (detectedFreq > 0 && detectedFreq < 4000) {
            setFrequency(detectedFreq);
            const { noteName, octaveNum, centOffset } = frequencyToNote(detectedFreq);
            setNote(noteName);
            setOctave(octaveNum);
            setCents(centOffset);
        }

        animationFrameRef.current = requestAnimationFrame(updatePitch);
    };

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);

            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            source.connect(analyserRef.current);

            setIsListening(true);
            updatePitch();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Unable to access microphone. Please grant permission.');
        }
    };

    const stopListening = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        setIsListening(false);
        setFrequency(0);
        setNote('');
        setCents(0);
    };

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, []);

    const getTuningColor = () => {
        if (!note) return 'rgba(255, 255, 255, 0.3)';
        if (Math.abs(cents) < 5) return '#34C759'; // Green - in tune
        if (Math.abs(cents) < 15) return '#FF9F0A'; // Orange - close
        return '#FF2D55'; // Red - out of tune
    };

    const getTuningMessage = () => {
        if (!note) return 'Play a note';
        if (Math.abs(cents) < 5) return 'In Tune!';
        if (cents > 0) return 'Too Sharp';
        return 'Too Flat';
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Chromatic Tuner</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, rgba(50, 50, 194, 0.1), rgba(50, 50, 194, 0.05))',
                padding: '3rem 2rem',
                borderRadius: '20px',
                border: `3px solid ${getTuningColor()}`,
                marginBottom: '2rem',
                textAlign: 'center',
                transition: 'border-color 0.2s'
            }}>
                {note ? (
                    <>
                        <div style={{ fontSize: '5rem', fontWeight: 700, color: getTuningColor(), marginBottom: '0.5rem' }}>
                            {note}
                            <span style={{ fontSize: '2rem', opacity: 0.7 }}>{octave}</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            {frequency.toFixed(1)} Hz
                        </div>
                        <div style={{ fontSize: '1.2rem', color: getTuningColor(), fontWeight: 600 }}>
                            {getTuningMessage()}
                        </div>
                    </>
                ) : (
                    <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>
                        {isListening ? 'Listening...' : 'Click Start to begin'}
                    </div>
                )}
            </div>

            {/* Cents Meter */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>-50¢</span>
                    <span>0¢</span>
                    <span>+50¢</span>
                </div>
                <div style={{
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translateX(-50%)'
                    }} />
                    {note && (
                        <div style={{
                            position: 'absolute',
                            left: `${50 + cents}%`,
                            top: '50%',
                            width: '20px',
                            height: '30px',
                            background: getTuningColor(),
                            borderRadius: '10px',
                            transform: 'translate(-50%, -50%)',
                            transition: 'all 0.1s',
                            boxShadow: `0 0 20px ${getTuningColor()}`
                        }} />
                    )}
                </div>
                {note && (
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '1rem', color: getTuningColor(), fontWeight: 600 }}>
                        {cents > 0 ? '+' : ''}{cents}¢
                    </div>
                )}
            </div>

            <Button
                variant={isListening ? 'secondary' : 'primary'}
                onClick={isListening ? stopListening : startListening}
                style={{
                    width: '100%',
                    padding: '1.5rem',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}
            >
                {isListening ? (
                    <><MicOff size={24} /> Stop Listening</>
                ) : (
                    <><Mic size={24} /> Start Tuner</>
                )}
            </Button>

            <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Make sure to allow microphone access when prompted
            </div>
        </div>
    );
};

export default Tuner;
