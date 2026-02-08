import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { Calendar, Upload, CheckCircle } from 'lucide-react';

const AcademicYearSetup: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [level, setLevel] = useState('');

    const handleNext = () => setStep(prev => prev + 1);

    const renderStep1 = () => (
        <div>
            <h3>Step 1: Select Qualification Level</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <Button
                    variant={level === 'Level 2' ? 'primary' : 'outline'}
                    onClick={() => setLevel('Level 2')}
                    style={{ height: '100px', fontSize: '1.25rem' }}
                >
                    UAL Level 2
                </Button>
                <Button
                    variant={level === 'Level 3' ? 'primary' : 'outline'}
                    onClick={() => setLevel('Level 3')}
                    style={{ height: '100px', fontSize: '1.25rem' }}
                >
                    UAL Level 3 (Music)
                </Button>
            </div>
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button disabled={!level} onClick={handleNext}>Next: Upload Docs</Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div>
            <h3>Step 2: Upload UAL Specification</h3>
            <div style={{
                border: '2px dashed var(--border-color)',
                padding: 'var(--space-12)',
                textAlign: 'center',
                borderRadius: 'var(--border-radius-md)',
                marginTop: 'var(--space-4)',
                marginBottom: 'var(--space-6)'
            }}>
                <Upload size={32} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-2)' }} />
                <p>Upload the official UAL Specification PDF here to extract Units.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleNext}>Next: Create Timeline</Button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div>
            <h3>Step 3: Generate Timeline</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Based on the UK academic calendar {new Date().getFullYear()}-{new Date().getFullYear() + 1}</p>

            <Card style={{ margin: 'var(--space-6) 0', background: 'var(--bg-body)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <Calendar size={20} /> <strong>Term 1</strong> (Sep - Dec)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <Calendar size={20} /> <strong>Term 2</strong> (Jan - Mar)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <Calendar size={20} /> <strong>Term 3</strong> (Apr - Jun)
                </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleNext}>Next: Review</Button>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <CheckCircle size={64} color="var(--color-success)" style={{ marginBottom: 'var(--space-4)' }} />
            <h3>Year Setup Complete!</h3>
            <p style={{ marginBottom: 'var(--space-6)' }}>Class "Level 3 Music 24/25" has been created.</p>
            <Button onClick={() => navigate('/teacher')}>Return to Dashboard</Button>
        </div>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>Academic Year Setup</h1>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
                {[1, 2, 3, 4].map(s => (
                    <div
                        key={s}
                        style={{
                            flex: 1,
                            height: '4px',
                            background: s <= step ? 'var(--color-primary)' : 'var(--border-color)',
                            borderRadius: '2px'
                        }}
                    />
                ))}
            </div>

            <Card elevated>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </Card>
        </div>
    );
};

export default AcademicYearSetup;
