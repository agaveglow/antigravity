import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ChevronLeft, FileText, Download, Music, Globe, CheckCircle2, Video } from 'lucide-react';
import { type Grade } from '../types/ual';
import { useSubmissions, type Submission } from '../context/SubmissionContext';
import PageTransition from '../components/common/PageTransition';

const AssessmentView: React.FC = () => {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();
    const { submissions, updateSubmission } = useSubmissions();

    // Find the submission (either real or mock)
    const submission = submissions.find(s => s.id === submissionId) || (submissionId?.startsWith('m') ? {
        id: submissionId,
        studentName: submissionId === 'm1' ? 'Alice Walker' : 'Bob Smith',
        taskTitle: 'Task 1.1: Performance',
        submittedAt: new Date().toISOString(),
        status: 'Pending Mark',
        evidence: [{ id: 'e1', type: 'media_file', fileName: 'Performance_Rec.mp3' }] as any,
        taskId: 't1',
        projectId: 'p1',
        studentId: submissionId,
        studentLevel: '3',
        studentYear: '1'
    } as Submission : null);

    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(submission?.status === 'Graded' ? submission.grade as Grade : null);
    const [feedback, setFeedback] = useState(submission?.feedback || '');

    if (!submission) return <div>Submission not found</div>;

    const grades: Grade[] = ['Fail', 'Pass', 'Merit', 'Distinction', 'Referred'];

    const handleSave = () => {
        if (submissionId && !submissionId.startsWith('m')) {
            updateSubmission(submissionId, {
                status: 'Graded',
                grade: selectedGrade || undefined,
                feedback
            });
        }
        navigate('/teacher/assessment');
    };

    return (
        <PageTransition>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', height: 'calc(100vh - 120px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Button variant="ghost" onClick={() => navigate('/teacher/assessment')} style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-4)', paddingLeft: 0 }}>
                        <ChevronLeft size={20} /> Back to Hub
                    </Button>

                    <Card elevated style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ borderBottom: '1px solid var(--border-color)', padding: 'var(--space-6)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{submission.studentName}</h3>
                                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Task: {submission.taskTitle}  • Submitted {new Date(submission.submittedAt).toLocaleString()}
                                    </p>
                                </div>
                                <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                                    {submission.status}
                                </span>
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto', background: 'var(--bg-body)' }}>
                            <h4 style={{ marginBottom: 'var(--space-4)' }}>Evidence Artifacts</h4>
                            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                                {submission.evidence.map((ev: any) => (
                                    <div key={ev.id} style={{
                                        padding: 'var(--space-4)', background: 'var(--bg-card)',
                                        borderRadius: '12px', border: '1px solid var(--border-color)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '8px',
                                                background: 'var(--color-brand-cyan)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {ev.type === 'video_file' ? <Video size={20} /> :
                                                    ev.type === 'media_file' ? <Music size={20} /> :
                                                        <FileText size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{ev.fileName || ev.url}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ev.type.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Button variant="outline" size="sm" onClick={() => ev.url && window.open(ev.url, '_blank')}>View</Button>
                                            <Button variant="ghost" size="sm"><Download size={16} /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-12)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', textAlign: 'center', border: '2px dashed var(--border-color)' }}>
                                <Globe size={48} style={{ opacity: 0.1, marginBottom: 'var(--space-4)' }} />
                                <p style={{ color: 'var(--text-tertiary)' }}>Preview not available for this artifact type.</p>
                                <Button variant="outline">Open in New Tab</Button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div style={{ height: '100%', overflowY: 'auto' }}>
                    <Card elevated style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h3>Feedback & Grade</h3>

                        <div style={{ marginTop: 'var(--space-6)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Final Grade</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {grades.map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setSelectedGrade(g)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: `1px solid ${selectedGrade === g ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                            background: selectedGrade === g ? 'var(--color-primary)' : 'var(--bg-input)',
                                            color: selectedGrade === g ? 'white' : 'var(--text-primary)',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--space-8)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Teacher Feedback</label>
                            <textarea
                                style={{
                                    flex: 1, minHeight: '200px', width: '100%', padding: '16px',
                                    borderRadius: '12px', border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                                    resize: 'none', lineHeight: 1.6
                                }}
                                placeholder="What did the student do well? What could be improved for higher marks?"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>

                        <div style={{ marginTop: 'var(--space-8)' }}>
                            <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-input)', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <CheckCircle2 size={16} color="var(--color-success)" /> Evidence Mapping
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {['1.1', '1.2', '2.1'].map(crit => (
                                        <div key={crit} style={{
                                            padding: '4px 10px',
                                            background: crit === '1.1' ? 'var(--color-success)' : 'transparent',
                                            color: crit === '1.1' ? 'white' : 'var(--text-tertiary)',
                                            border: `1px solid ${crit === '1.1' ? 'var(--color-success)' : 'var(--border-color)'}`,
                                            borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600
                                        }}>
                                            Criteria {crit}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                style={{ width: '100%' }}
                                disabled={!selectedGrade}
                                size="lg"
                            >
                                Finalize & Release Mark
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </PageTransition>
    );
};

export default AssessmentView;
