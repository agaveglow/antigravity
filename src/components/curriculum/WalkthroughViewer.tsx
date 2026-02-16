import React, { useState, useEffect } from 'react';
import type { Walkthrough } from '../../types/ual';
import Button from '../common/Button';
import Card from '../common/Card';
import { ChevronLeft, ChevronRight, CheckCircle, RotateCcw } from 'lucide-react';
import Markdown from 'react-markdown';

interface WalkthroughViewerProps {
    walkthrough: Walkthrough;
    onComplete: () => void;
    onBack?: () => void;
}

const WalkthroughViewer: React.FC<WalkthroughViewerProps> = ({ walkthrough, onComplete, onBack }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [hasCompleted, setHasCompleted] = useState(false);

    const steps = walkthrough.steps || [];
    const currentStep = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;

    // Reset state when walkthrough changes
    useEffect(() => {
        setCurrentStepIndex(0);
        setHasCompleted(false);
    }, [walkthrough.id]);

    const handleNext = () => {
        if (isLastStep) {
            setHasCompleted(true);
            onComplete();
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    if (steps.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>This walkthrough has no steps.</p>
                <Button onClick={onBack}>Back</Button>
            </div>
        );
    }

    if (hasCompleted) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
                <Card elevated>
                    <div style={{ marginBottom: '1rem', color: 'var(--color-success)' }}>
                        <CheckCircle size={64} className="animate-bounce" />
                    </div>
                    <h2>Walkthrough Completed!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        You've finished "{walkthrough.title}".
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Button variant="outline" onClick={() => { setCurrentStepIndex(0); setHasCompleted(false); }}>
                            <RotateCcw size={18} style={{ marginRight: '8px' }} />
                            Restart
                        </Button>
                        <Button onClick={onBack}>
                            Back to Course
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
            {/* Header / Progress */}
            <div style={{ marginBottom: '1rem' }}>
                <Button variant="ghost" onClick={onBack} style={{ marginBottom: '1rem', paddingLeft: 0 }}>
                    <ChevronLeft size={16} style={{ marginRight: '4px' }} />
                    Back
                </Button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>{walkthrough.title}</h2>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Step {currentStepIndex + 1} of {steps.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                        height: '100%',
                        background: 'var(--color-primary)',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            {/* Step Content */}
            <Card elevated style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{currentStep.title}</h3>
                </div>

                <div style={{ flex: 1 }}>
                    {currentStep.mediaUrl && (
                        <div style={{
                            marginBottom: '1.5rem',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#000',
                            display: 'flex',
                            justifyContent: 'center',
                            maxHeight: '400px'
                        }}>
                            {currentStep.mediaType === 'video' ? (
                                <video
                                    src={currentStep.mediaUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                                />
                            ) : (
                                <img
                                    src={currentStep.mediaUrl}
                                    alt={currentStep.title}
                                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                                />
                            )}
                        </div>
                    )}

                    <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                        <Markdown>{currentStep.content}</Markdown>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                    >
                        <ChevronLeft size={18} style={{ marginRight: '8px' }} />
                        Previous
                    </Button>

                    <Button onClick={handleNext}>
                        {isLastStep ? 'Finish' : 'Next Step'}
                        {!isLastStep && <ChevronRight size={18} style={{ marginLeft: '8px' }} />}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default WalkthroughViewer;
