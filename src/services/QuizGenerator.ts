import type { Quiz, Question } from '../types/ual';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

/*
// This section appears to be a partial, malformed object definition that was not properly integrated.
// It is being commented out as per the instruction to clean up the code.

type: 'listening',
    options: [{ id: '1', text: 'Major 3rd' }, { id: '2', text: 'Perfect 5th' }, { id: '3', text: 'Octave' }],
        correctOptionId: '2',
            metadata: {
    interval: { note1: 'C', octave1: 4, note2: 'G', octave2: 4, label: 'Perfect 5th' }
}
    },
{
    text: 'Identify this chord quality (Major vs Minor).',
        type: 'listening',
            options: [{ id: '1', text: 'Major' }, { id: '2', text: 'Minor' }],
                correctOptionId: '1',
                    metadata: {
        interval: { note1: 'C', octave1: 4, note2: 'E', octave2: 4, label: 'Major 3rd' } // Simplified chord for now
    }
},
// New Instrument Question
{
    text: 'Identify the note at the marked position on the fretboard.',
        type: 'instrument',
            options: [{ id: '1', text: 'C' }, { id: '2', text: 'D' }, { id: '3', text: 'G' }],
                correctOptionId: '3',
                    metadata: {
        instrument: { type: 'guitar', correctNote: 'G', correctString: 6, correctFret: 3 }
    }
}
],
// ... (Keep other categories, maybe add a few specialized ones if time)
'technology': [
    // ... existing
],
    'history': [
        // ... existing
    ]
};
*/

// Re-export original questions to avoid losing them (I'll just patch the file to include these new ones)
// Actually, I'll rewrite the whole file to be safe and clean, merging the old questions back in.

const EXTENDED_QUESTION_BANK: Record<string, Partial<Question>[]> = {
    'theory': [
        { text: 'What is the relative minor of C Major?', options: [{ id: '1', text: 'A Minor' }, { id: '2', text: 'E Minor' }, { id: '3', text: 'D Minor' }], correctOptionId: '1' },
        { text: 'Which interval is 7 semitones?', options: [{ id: '1', text: 'Perfect 4th' }, { id: '2', text: 'Perfect 5th' }, { id: '3', text: 'Major 6th' }], correctOptionId: '2' },
        { text: 'How many sharps are in D Major?', options: [{ id: '1', text: '1' }, { id: '2', text: '2' }, { id: '3', text: '3' }], correctOptionId: '2' },
        { text: 'What is the time signature for a waltz?', options: [{ id: '1', text: '4/4' }, { id: '2', text: '3/4' }, { id: '3', text: '6/8' }], correctOptionId: '2' },
        { text: 'Which chord is the subdominant in G Major?', options: [{ id: '1', text: 'C Major' }, { id: '2', text: 'D Major' }, { id: '3', text: 'E Minor' }], correctOptionId: '1' },
        {
            text: 'Listen to the interval. What type is it?',
            type: 'listening',
            options: [{ id: '1', text: 'Major 3rd' }, { id: '2', text: 'Perfect 5th' }, { id: '3', text: 'Perfect 4th' }],
            correctOptionId: '2',
            metadata: {
                interval: { note1: 'C', octave1: 4, note2: 'G', octave2: 4, label: 'Perfect 5th' }
            }
        },
        {
            text: 'Identify the note on the Low E string, 3rd fret.',
            type: 'instrument',
            options: [{ id: '1', text: 'F' }, { id: '2', text: 'G' }, { id: '3', text: 'A' }],
            correctOptionId: '2',
            metadata: {
                instrument: { type: 'guitar', correctNote: 'G', correctString: 6, correctFret: 3 }
            }
        },
        { text: 'Which scale degree is the Supertonic?', options: [{ id: '1', text: '1st' }, { id: '2', text: '2nd' }, { id: '3', text: '5th' }], correctOptionId: '2' },
        { text: 'How many flats are in Eb Major?', options: [{ id: '1', text: '2' }, { id: '2', text: '3' }, { id: '3', text: '4' }], correctOptionId: '2' },
        { text: 'What is the interval between C and E?', options: [{ id: '1', text: 'Minor 3rd' }, { id: '2', text: 'Major 3rd' }, { id: '3', text: 'Perfect 4th' }], correctOptionId: '2' },
        {
            text: 'Listen: Which interval is this?',
            type: 'listening',
            options: [{ id: '1', text: 'Major 3rd' }, { id: '2', text: 'Minor 3rd' }, { id: '3', text: 'Major 2nd' }],
            correctOptionId: '1',
            metadata: {
                interval: { note1: 'C', octave1: 4, note2: 'E', octave2: 4, label: 'Major 3rd' }
            }
        },
        { text: 'A triad consists of which root, 3rd, and...?', options: [{ id: '1', text: '4th' }, { id: '2', text: '5th' }, { id: '3', text: '7th' }], correctOptionId: '2' },
        { text: 'What is the V chord in A Minor?', options: [{ id: '1', text: 'E Major' }, { id: '2', text: 'E Minor' }, { id: '3', text: 'G Major' }], correctOptionId: '1' }
    ],
    'technology': [
        { text: 'What does MIDI stand for?', options: [{ id: '1', text: 'Musical Instrument Digital Interface' }, { id: '2', text: 'Music Input Direct Input' }, { id: '3', text: 'Many Instruments Digital Interface' }], correctOptionId: '1' },
        { text: 'Which of these is a DAW?', options: [{ id: '1', text: 'Photoshop' }, { id: '2', text: 'Logic Pro' }, { id: '3', text: 'Excel' }], correctOptionId: '2' },
        { text: 'What is the standard sample rate for CD audio?', options: [{ id: '1', text: '44.1 kHz' }, { id: '2', text: '48 kHz' }, { id: '3', text: '96 kHz' }], correctOptionId: '1' },
        { text: 'What is a compressor used for?', options: [{ id: '1', text: 'Increasing pitch' }, { id: '2', text: 'Reducing dynamic range' }, { id: '3', text: 'Adding reverb' }], correctOptionId: '2' },
        { text: 'Which cable carries balanced audio?', options: [{ id: '1', text: 'RCA' }, { id: '2', text: 'XLR' }, { id: '3', text: 'TS' }], correctOptionId: '2' },
        { text: 'What is phantom power voltage typically?', options: [{ id: '1', text: '12V' }, { id: '2', text: '24V' }, { id: '3', text: '48V' }], correctOptionId: '3' },
        { text: 'What does EQ stand for?', options: [{ id: '1', text: 'Equalization' }, { id: '2', text: 'Equipment Quality' }, { id: '3', text: 'Early Q' }], correctOptionId: '1' },
        { text: 'Which microphone type requires power?', options: [{ id: '1', text: 'Dynamic' }, { id: '2', text: 'Condenser' }, { id: '3', text: 'Ribbon' }], correctOptionId: '2' },
        { text: 'What is latency?', options: [{ id: '1', text: 'Volume level' }, { id: '2', text: 'Delay in audio processing' }, { id: '3', text: 'Frequency range' }], correctOptionId: '2' },
        { text: 'What file format is uncompressed?', options: [{ id: '1', text: 'MP3' }, { id: '2', text: 'WAV' }, { id: '3', text: 'AAC' }], correctOptionId: '2' },
        { text: 'What does a high-pass filter do?', options: [{ id: '1', text: 'Cuts high frequencies' }, { id: '2', text: 'Cuts low frequencies' }, { id: '3', text: 'Boosts all frequencies' }], correctOptionId: '2' }
    ],
    'history': [
        { text: 'Who composed the "Ode to Joy"?', options: [{ id: '1', text: 'Mozart' }, { id: '2', text: 'Beethoven' }, { id: '3', text: 'Bach' }], correctOptionId: '2' },
        { text: 'Which era came after Baroque?', options: [{ id: '1', text: 'Romantic' }, { id: '2', text: 'Classical' }, { id: '3', text: 'Renaissance' }], correctOptionId: '2' },
        { text: 'The Beatles are from which city?', options: [{ id: '1', text: 'London' }, { id: '2', text: 'Liverpool' }, { id: '3', text: 'Manchester' }], correctOptionId: '2' },
        { text: 'Who is known as the King of Pop?', options: [{ id: '1', text: 'Elvis Presley' }, { id: '2', text: 'Michael Jackson' }, { id: '3', text: 'Prince' }], correctOptionId: '2' },
        { text: 'In what year was Woodstock held?', options: [{ id: '1', text: '1969' }, { id: '2', text: '1975' }, { id: '3', text: '1960' }], correctOptionId: '1' },
        { text: 'Which instrument did Miles Davis play?', options: [{ id: '1', text: 'Saxophone' }, { id: '2', text: 'Trumpet' }, { id: '3', text: 'Piano' }], correctOptionId: '2' },
        { text: 'Who wrote "The Four Seasons"?', options: [{ id: '1', text: 'Vivaldi' }, { id: '2', text: 'Verdi' }, { id: '3', text: 'Wagner' }], correctOptionId: '1' },
        { text: 'Which genre originated in New Orleans?', options: [{ id: '1', text: 'Jazz' }, { id: '2', text: 'Rock' }, { id: '3', text: 'Country' }], correctOptionId: '1' },
        { text: 'Who was the lead singer of Queen?', options: [{ id: '1', text: 'Freddie Mercury' }, { id: '2', text: 'David Bowie' }, { id: '3', text: 'Elton John' }], correctOptionId: '1' },
        { text: 'What is the oldest surviving musical instrument?', options: [{ id: '1', text: 'Drum' }, { id: '2', text: 'Flute' }, { id: '3', text: 'Lyre' }], correctOptionId: '2' },
        { text: 'Which composer went deaf?', options: [{ id: '1', text: 'Beethoven' }, { id: '2', text: 'Mozart' }, { id: '3', text: 'Haydn' }], correctOptionId: '1' }
    ]
};

export const generateQuizAI = async (topic: string): Promise<Quiz> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const normalizedTopic = topic.toLowerCase();
    let selectedQuestions: Partial<Question>[] = [];

    // Simple keyword matching
    if (normalizedTopic.includes('theory') || normalizedTopic.includes('scale') || normalizedTopic.includes('chord')) {
        selectedQuestions = EXTENDED_QUESTION_BANK['theory'];
    } else if (normalizedTopic.includes('tech') || normalizedTopic.includes('production') || normalizedTopic.includes('midi')) {
        selectedQuestions = EXTENDED_QUESTION_BANK['technology'];
    } else if (normalizedTopic.includes('history') || normalizedTopic.includes('classical') || normalizedTopic.includes('pop')) {
        selectedQuestions = EXTENDED_QUESTION_BANK['history'];
    } else {
        // Fallback: mix of everything if topic not found
        // Ensure we have enough for 10
        selectedQuestions = [
            ...EXTENDED_QUESTION_BANK['theory'].slice(0, 4),
            ...EXTENDED_QUESTION_BANK['technology'].slice(0, 3),
            ...EXTENDED_QUESTION_BANK['history'].slice(0, 3)
        ];
    }

    // Shuffle and take 10
    const finalQuestions = selectedQuestions
        .sort(() => 0.5 - Math.random()) // Simple shuffle
        .slice(0, 10)
        .map(q => {
            // Need to deep copy options to give them new IDs
            const newOptions = q.options!.map(o => ({ ...o, id: generateId() }));

            // Find which option index was correct in the template
            const correctIndex = q.options!.findIndex(o => o.id === q.correctOptionId);

            // Map to the new ID at that index
            const newCorrectId = newOptions[correctIndex]?.id || newOptions[0].id;

            return {
                id: generateId(),
                text: q.text!,
                type: q.type || 'multiple-choice', // Preserve type
                options: newOptions,
                correctOptionId: newCorrectId,
                metadata: q.metadata // Preserve metadata
            } as Question;
        });

    return {
        id: generateId(),
        title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Quiz`,
        description: `An automatically generated quiz about ${topic}.`,
        questions: finalQuestions,
        xpReward: 200, // Increased reward for longer quiz
        dowdBucksReward: 100,
        status: 'draft',
        createdAt: new Date().toISOString()
    };
};
