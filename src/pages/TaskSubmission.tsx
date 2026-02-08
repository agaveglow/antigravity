import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurriculum } from '../context/CurriculumContext';
import { useUser } from '../context/UserContext';
import { useSubmissions, type Evidence } from '../context/SubmissionContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ChevronLeft, Upload, Link as LinkIcon,
    CheckCircle, Eye, Trash2, ArrowRight,
    Music, FileText, Video
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

const TaskSubmission: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const { projects } = useCurriculum();
    const { user } = useUser();
    const { addSubmission, getSubmissionByTask } = useSubmissions();
    const navigate = useNavigate();

    const project = projects.find(p => p.tasks.some(t => t.id === taskId));
    const task = project?.tasks.find(t => t.id === taskId);

    const existingSubmission = user && taskId ? getSubmissionByTask(taskId, user.id) : undefined;

    const [step, setStep] = useState<'select' | 'preview' | 'success'>(existingSubmission ? 'preview' : 'select');
    const [submissionType, setSubmissionType] = useState<'media' | 'video' | 'google' | 'link'>('media');
    const [inputValue, setInputValue] = useState('');
    const [fileName, setFileName] = useState('');

    // Auto-select based on teacher's requirements
    React.useEffect(() => {
        if (task?.evidenceRequirements && task.evidenceRequirements.length > 0) {
            const availableTypes: ('media' | 'video' | 'google' | 'link')[] = [];
            if (task.evidenceRequirements.includes('media_file')) availableTypes.push('media');
            if (task.evidenceRequirements.includes('video_file')) availableTypes.push('video');
            if (task.evidenceRequirements.includes('google_app')) availableTypes.push('google');
            if (task.evidenceRequirements.includes('external_url') || task.evidenceRequirements.includes('link')) availableTypes.push('link');

            if (availableTypes.length > 0 && !availableTypes.includes(submissionType)) {
                setSubmissionType(availableTypes[0]);
            }
        }
    }, [task?.evidenceRequirements, submissionType]);

    if (!task || !project) return <div>Task or Project not found</div>;

    const handleFileSelect = (type: 'media' | 'video') => () => {
        // Mock file selection for demonstration
        setFileName(type === 'media' ? 'Music_Performance_Recording.mp3' : 'Final_Performance_Video.mp4');
        setStep('preview');
        setSubmissionType(type);
    };

    const handleLinkSubmit = (type: 'google' | 'link') => (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue) return;
        setSubmissionType(type);
        setStep('preview');
    };

    const handleSubmit = () => {
        if (!user || !project || !task) return;

        const evidence: Evidence = {
            id: crypto.randomUUID(),
            type: submissionType === 'media' ? 'media_file' : submissionType === 'video' ? 'video_file' : submissionType === 'google' ? 'google_app' : 'link',
            url: (submissionType !== 'media' && submissionType !== 'video') ? inputValue : undefined,
            fileName: (submissionType === 'media' || submissionType === 'video') ? fileName : undefined,
            submittedAt: new Date().toISOString()
        };

        addSubmission({
            id: existingSubmission?.id || crypto.randomUUID(),
            taskId: task.id,
            projectId: project.id,
            studentId: user.id,
            studentName: user.name,
            studentLevel: user.level || 'Level 3',
            studentYear: user.year || 'Year 1',
            evidence: [evidence],
            status: 'Pending Mark',
            submittedAt: new Date().toISOString()
        });

        setStep('success');
    };

    const getEvidenceIcon = (type: typeof submissionType) => {
        switch (type) {
            case 'media': return <Music size={24} />;
            case 'video': return <Video size={24} />;
            case 'google': return <FileText size={24} />;
            default: return <LinkIcon size={24} />;
        }
    };

    if (step === 'success') {
        return (
            <PageTransition>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-12)' }}>
                    <CheckCircle size={80} color="var(--color-success)" style={{ marginBottom: 'var(--space-6)' }} />
                    <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>Great Work!</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                        Your evidence for <strong>{task.title}</strong> has been received.
                        Your teacher will receive a notification to mark your work.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
                        <Button variant="outline" onClick={() => navigate(-1)}>Back to Project</Button>
                        <Button onClick={() => navigate('/student')}>Go to Dashboard</Button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}>
                    <ChevronLeft size={20} /> Back to Project
                </Button>

                <header style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 style={{ marginBottom: 'var(--space-2)' }}>{task.title}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Submit your evidence for {task.criteriaReferences.join(', ')}
                    </p>
                </header>

                <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-8)' }}>
                    {['select', 'preview', 'success'].map((s, idx) => (
                        <div key={s} style={{
                            flex: 1, height: '4px', borderRadius: '2px',
                            background: (s === step || (step === 'preview' && idx === 0)) ? 'var(--color-primary)' : 'var(--bg-input)'
                        }} />
                    ))}
                </div>

                <Card elevated>
                    {step === 'select' ? (
                        <>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
                                <Button
                                    variant={submissionType === 'media' ? 'primary' : 'outline'}
                                    onClick={() => setSubmissionType('media')}
                                    style={{ flex: '1 1 150px', height: 'auto', padding: '16px', flexDirection: 'column', gap: '8px' }}
                                >
                                    <Music size={24} />
                                    <span>Audio Upload</span>
                                </Button>
                                <Button
                                    variant={submissionType === 'video' ? 'primary' : 'outline'}
                                    onClick={() => setSubmissionType('video')}
                                    style={{ flex: '1 1 150px', height: 'auto', padding: '16px', flexDirection: 'column', gap: '8px' }}
                                >
                                    <Video size={24} />
                                    <span>Video Upload</span>
                                </Button>
                                <Button
                                    variant={submissionType === 'google' ? 'primary' : 'outline'}
                                    onClick={() => setSubmissionType('google')}
                                    style={{ flex: '1 1 150px', height: 'auto', padding: '16px', flexDirection: 'column', gap: '8px' }}
                                >
                                    <FileText size={24} />
                                    <span>Google App Link</span>
                                </Button>
                                <Button
                                    variant={submissionType === 'link' ? 'primary' : 'outline'}
                                    onClick={() => setSubmissionType('link')}
                                    style={{ flex: '1 1 150px', height: 'auto', padding: '16px', flexDirection: 'column', gap: '8px' }}
                                >
                                    <LinkIcon size={24} />
                                    <span>Other Link</span>
                                </Button>
                            </div>

                            {(submissionType === 'media' || submissionType === 'video') && (
                                <div
                                    onClick={handleFileSelect(submissionType)}
                                    style={{
                                        border: '2px dashed var(--border-color)',
                                        padding: 'var(--space-12)',
                                        textAlign: 'center',
                                        borderRadius: 'var(--border-radius-lg)',
                                        marginBottom: 'var(--space-6)',
                                        cursor: 'pointer',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <Upload size={48} color="var(--color-brand-cyan)" style={{ marginBottom: 'var(--space-4)' }} />
                                    <h3>Upload {submissionType === 'media' ? 'Audio' : 'Video'} File</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {submissionType === 'media' ? 'MP3, WAV, AAC up to 50MB' : 'MP4, MOV, WEBM up to 200MB'}
                                    </p>
                                </div>
                            )}

                            {(submissionType === 'google' || submissionType === 'link') && (
                                <form onSubmit={handleLinkSubmit(submissionType)} style={{ marginBottom: 'var(--space-8)' }}>
                                    <label style={{ display: 'block', marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                                        {submissionType === 'google' ? 'Google Doc/Slides/Sheet URL' : 'Evidence URL'}
                                    </label>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <input
                                            type="url"
                                            required
                                            placeholder="https://docs.google.com/..."
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: '8px',
                                                border: '1px solid var(--border-color)', background: 'var(--bg-input)'
                                            }}
                                        />
                                        <Button type="submit" disabled={!inputValue}>
                                            Add <ArrowRight size={18} style={{ marginLeft: '4px' }} />
                                        </Button>
                                    </div>
                                    <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                        Ensure your sharing permissions are set to "Anyone with the link can view" or specific to your teacher.
                                    </p>
                                </form>
                            )}

                            <div style={{ background: 'rgba(57, 181, 224, 0.05)', padding: 'var(--space-6)', borderRadius: '12px', border: '1px solid rgba(57, 181, 224, 0.15)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                                <div style={{ background: 'var(--color-brand-cyan)', color: 'white', padding: '8px', borderRadius: '8px' }}>
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-brand-cyan)' }}>Required Artifact</h4>
                                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                        {task.evidenceRequirements[0]?.replace('_', ' ').toUpperCase() || task.evidenceRequirements.join(', ')}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h2 style={{ marginBottom: 'var(--space-4)' }}>Review Submission</h2>
                                <div style={{
                                    background: 'var(--bg-input)', padding: 'var(--space-6)',
                                    borderRadius: '12px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '10px',
                                            background: 'var(--color-brand-purple)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', color: 'white'
                                        }}>
                                            {getEvidenceIcon(submissionType)}
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: 600, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {submissionType === 'media' || submissionType === 'video' ? fileName : inputValue}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {submissionType === 'media' ? 'Audio Artifact' : submissionType === 'video' ? 'Video Artifact' : submissionType === 'google' ? 'Google Workspace' : 'External Link'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button variant="ghost" size="sm" onClick={() => setStep('select')}><Trash2 size={18} /></Button>
                                        <Button variant="outline" size="sm" onClick={() => window.open(submissionType !== 'media' && submissionType !== 'video' ? inputValue : '#', '_blank')}>
                                            <Eye size={18} /> Preview
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-8)' }}>
                                <Button variant="ghost" onClick={() => setStep('select')}>Change Artifact</Button>
                                <Button size="lg" onClick={handleSubmit}>Confirm & Submit Task</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </PageTransition>
    );
};

export default TaskSubmission;
