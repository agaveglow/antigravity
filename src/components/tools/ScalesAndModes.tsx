import React, { useState } from 'react';

const scales = {
    'Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'Natural Minor': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    'Harmonic Minor': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
    'Melodic Minor': ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
    'Dorian': ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
    'Phrygian': ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    'Lydian': ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
    'Mixolydian': ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
    'Locrian': ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
    'Pentatonic Major': ['C', 'D', 'E', 'G', 'A'],
    'Pentatonic Minor': ['C', 'Eb', 'F', 'G', 'Bb'],
    'Blues': ['C', 'Eb', 'F', 'F#', 'G', 'Bb']
};

const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ScalesAndModes: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedRoot, setSelectedRoot] = useState('C');
    const [selectedScale, setSelectedScale] = useState<keyof typeof scales>('Major');

    const transposeNote = (note: string, semitones: number): string => {
        const noteIndex = roots.indexOf(note);
        const newIndex = (noteIndex + semitones + 12) % 12;
        return roots[newIndex];
    };

    const rootIndex = roots.indexOf(selectedRoot);
    const scaleNotes = scales[selectedScale].map(note => transposeNote(note, rootIndex));

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Scales & Modes</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Root Note
                    </label>
                    <select
                        value={selectedRoot}
                        onChange={(e) => setSelectedRoot(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    >
                        {roots.map(root => (
                            <option key={root} value={root} style={{ background: '#1a1a1a' }}>{root}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Scale/Mode
                    </label>
                    <select
                        value={selectedScale}
                        onChange={(e) => setSelectedScale(e.target.value as keyof typeof scales)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    >
                        {Object.keys(scales).map(scale => (
                            <option key={scale} value={scale} style={{ background: '#1a1a1a' }}>{scale}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, rgba(200, 96, 245, 0.1), rgba(200, 96, 245, 0.05))',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid rgba(200, 96, 245, 0.3)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary-color)' }}>
                    {selectedRoot} {selectedScale}
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {scaleNotes.map((note, index) => (
                        <div
                            key={index}
                            style={{
                                width: '60px',
                                height: '60px',
                                background: 'linear-gradient(135deg, var(--primary-color), #ff8c42)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(255, 159, 10, 0.3)'
                            }}
                        >
                            {note}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Practice these notes in order to master the {selectedScale} scale in {selectedRoot}
            </div>
        </div>
    );
};

export default ScalesAndModes;
