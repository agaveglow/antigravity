import React, { useState } from 'react';

const chords = {
    'Major': ['1', '3', '5'],
    'Minor': ['1', 'b3', '5'],
    'Dominant 7': ['1', '3', '5', 'b7'],
    'Major 7': ['1', '3', '5', '7'],
    'Minor 7': ['1', 'b3', '5', 'b7'],
    'Diminished': ['1', 'b3', 'b5'],
    'Augmented': ['1', '3', '#5'],
    'Sus2': ['1', '2', '5'],
    'Sus4': ['1', '4', '5'],
    'Add9': ['1', '3', '5', '9'],
    '6': ['1', '3', '5', '6'],
    'Minor 6': ['1', 'b3', '5', '6']
};

const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const guitarChords: Record<string, Record<string, string>> = {
    'C': { 'Major': 'x32010', 'Minor': 'x35543', 'Dominant 7': 'x32310' },
    'D': { 'Major': 'xx0232', 'Minor': 'xx0231', 'Dominant 7': 'xx0212' },
    'E': { 'Major': '022100', 'Minor': '022000', 'Dominant 7': '020100' },
    'F': { 'Major': '133211', 'Minor': '133111', 'Dominant 7': '131211' },
    'G': { 'Major': '320003', 'Minor': '355333', 'Dominant 7': '320001' },
    'A': { 'Major': 'x02220', 'Minor': 'x02210', 'Dominant 7': 'x02020' },
    'B': { 'Major': 'x24442', 'Minor': 'x24432', 'Dominant 7': 'x21202' }
};

const ChordLibrary: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedRoot, setSelectedRoot] = useState('C');
    const [selectedChord, setSelectedChord] = useState<keyof typeof chords>('Major');

    const chordDiagram = guitarChords[selectedRoot]?.[selectedChord] || 'xx0000';

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Chord Library</h2>
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
                        Chord Type
                    </label>
                    <select
                        value={selectedChord}
                        onChange={(e) => setSelectedChord(e.target.value as keyof typeof chords)}
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
                        {Object.keys(chords).map(chord => (
                            <option key={chord} value={chord} style={{ background: '#1a1a1a' }}>{chord}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, rgba(255, 214, 10, 0.1), rgba(255, 214, 10, 0.05))',
                padding: '2rem',
                borderRadius: '16px',
                border: '2px solid rgba(255, 214, 10, 0.3)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#FFD60A', textAlign: 'center' }}>
                    {selectedRoot} {selectedChord}
                </h3>

                <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Chord Formula:</h4>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {chords[selectedChord].map((note, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(255, 214, 10, 0.2)',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#FFD60A'
                                }}
                            >
                                {note}
                            </div>
                        ))}
                    </div>
                </div>

                {guitarChords[selectedRoot]?.[selectedChord] && (
                    <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Guitar Fingering:</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            {chordDiagram.split('').map((fret, index) => (
                                <div key={index} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '50px',
                                        background: fret === 'x' ? 'rgba(255, 45, 85, 0.2)' : 'rgba(255, 214, 10, 0.2)',
                                        border: '2px solid rgba(255, 214, 10, 0.4)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: fret === 'x' ? '#FF2D55' : '#FFD60A',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {fret}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                        {6 - index}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>
                            x = don't play, 0 = open string, numbers = fret position
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChordLibrary;
