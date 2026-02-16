import React, { useState, useMemo } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ClipboardCheck, History, ExternalLink, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSubmissions, type Submission } from '../context/SubmissionContext';
import { useCurriculum } from '../context/CurriculumContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const QualityAssurance: React.FC = () => {
    const { submissions } = useSubmissions();
    const { projects } = useCurriculum();
    const navigate = useNavigate();
    const [sampleGenerated, setSampleGenerated] = useState<Submission[]>([]);

    // --- Derived Data ---

    // 1. Outstanding IVs (Verification Requested)
    const outstandingIVs = useMemo(() => {
        return submissions.filter(s => s.verificationRequested || s.status === 'Pending Mark');
    }, [submissions]);

    // 2. Completed IVs (Verified)
    const verifiedIVs = useMemo(() => {
        return submissions.filter(s => s.status === 'Verified');
    }, [submissions]);

    // 3. Compliance Rate
    const complianceRate = useMemo(() => {
        const total = outstandingIVs.length + verifiedIVs.length;
        if (total === 0) return 100;
        return Math.round((verifiedIVs.length / total) * 100);
    }, [outstandingIVs.length, verifiedIVs.length]);

    // 4. Sampling Target (Arbitrary goal: 20% of graded work)
    const gradedSubmissions = submissions.filter(s => s.status === 'Graded');
    const samplingTarget = Math.ceil(gradedSubmissions.length * 0.2);
    const sampledCount = verifiedIVs.length; // Assuming verified = sampled for this logic

    const complianceStats = [
        { label: 'Briefs IV-ed (Rate)', value: `${complianceRate}%`, color: complianceRate > 80 ? 'var(--color-success)' : 'var(--color-warning)' },
        { label: 'Sampling Target (20%)', value: `${sampledCount}/${samplingTarget}`, color: sampledCount >= samplingTarget ? 'var(--color-success)' : 'var(--color-info)' },
        { label: 'Outstanding IVs', value: outstandingIVs.length, color: outstandingIVs.length > 5 ? 'var(--color-warning)' : 'var(--text-primary)' },
    ];

    // Helper to get project info
    const getProjectInfo = (projectId: string) => {
        const proj = projects.find(p => p.id === projectId);
        return {
            title: proj?.title || 'Unknown Project',
            unit: proj?.unit || 'Unknown Unit'
        };
    };

    // --- Actions ---

    const handleGenerateSample = () => {
        // Select random graded submissions that haven't been verified yet
        const candidates = submissions.filter(s => s.status === 'Graded' && !s.verificationRequested);
        const sampleSize = Math.min(3, candidates.length); // Sample up to 3 at a time

        const shuffled = [...candidates].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, sampleSize);

        setSampleGenerated(selected);
    };

    const handleRequestIV = (submission: Submission) => {
        // In a real app, this might update the submission status to 'IV In Progress'
        // For now, we simulate by navigating or just alerting
        navigate(`/teacher/assessment/${submission.projectId}`);
    };

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quality Assurance & IV</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>UAL Compliance tracking and Internal Verification workflow</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/teacher/tracker')}>
                    <ClipboardCheck size={18} style={{ marginRight: '8px' }} /> Go to Tracker
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                {complianceStats.map(stat => (
                    <Card key={stat.label} elevated style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{stat.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 'var(--space-8)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>IV Schedule & Status (Outstanding)</h3>
                        <Button size="sm" variant="ghost">View All <History size={14} style={{ marginLeft: '4px' }} /></Button>
                    </div>

                    <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                        {outstandingIVs.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <CheckCircle size={48} style={{ marginBottom: '1rem', color: 'var(--color-success)', opacity: 0.5 }} />
                                <p>All caught up! No outstanding internal verifications.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    <tr>
                                        <th style={{ padding: '16px' }}>Student</th>
                                        <th style={{ padding: '16px' }}>Project/Task</th>
                                        <th style={{ padding: '16px' }}>Status</th>
                                        <th style={{ padding: '16px' }}>Requested</th>
                                        <th style={{ padding: '16px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outstandingIVs.slice(0, 5).map(item => {
                                        const projInfo = getProjectInfo(item.projectId);
                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '16px', fontWeight: 700 }}>{item.studentName}</td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: 600 }}>{projInfo.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.taskTitle}</div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px',
                                                        background: 'rgba(255, 171, 0, 0.1)',
                                                        color: 'var(--color-warning)',
                                                        fontWeight: 600
                                                    }}>
                                                        {item.status}
                                                    </span>
                                                    {item.verificationRequested && <div style={{ fontSize: '0.7rem', color: 'var(--color-brand-cyan)', marginTop: '4px' }}>IV Requested</div>}
                                                </td>
                                                <td style={{ padding: '16px', color: 'var(--text-tertiary)' }}>
                                                    {item.verificationRequestedAt ? format(new Date(item.verificationRequestedAt), 'MMM d') : '-'}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <Button variant="ghost" size="sm" onClick={() => handleRequestIV(item)} style={{ padding: '4px', minWidth: 'auto' }}>
                                                        <ExternalLink size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </Card>

                    <h3 style={{ marginTop: 'var(--space-4)' }}>Sampling Status (Internal Verification of Assessment)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                        <Card style={{ background: 'rgba(255, 255, 255, 0.05)', borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)' }}>
                            <Users size={32} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-2)' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                                {sampleGenerated.length > 0
                                    ? `Selected ${sampleGenerated.length} submissions for review`
                                    : "Select students for random sampling"}
                            </p>

                            {sampleGenerated.length > 0 ? (
                                <div style={{ width: '100%', marginTop: '1rem' }}>
                                    {sampleGenerated.map(s => (
                                        <div key={s.id} style={{ fontSize: '0.8rem', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{s.studentName}</span>
                                            <a href="#" style={{ color: 'var(--color-brand-purple)' }} onClick={(e) => { e.preventDefault(); handleRequestIV(s); }}>Inspect</a>
                                        </div>
                                    ))}
                                    <Button size="sm" variant="outline" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setSampleGenerated([])}>Clear</Button>
                                </div>
                            ) : (
                                <Button size="sm" variant="outline" onClick={handleGenerateSample}>Generate Sample</Button>
                            )}
                        </Card>
                        <Card elevated>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Standardisation Progress</div>
                            <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                <div style={{ width: `${Math.min(100, Math.round((sampledCount / samplingTarget) * 100)) || 0}%`, height: '100%', background: 'var(--color-brand-cyan)' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span>Target: {samplingTarget} samples</span>
                                <span style={{ fontWeight: 600 }}>{Math.min(100, Math.round((sampledCount / samplingTarget) * 100)) || 0}%</span>
                            </div>
                        </Card>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <h3 style={{ margin: 0 }}>Upcoming Events</h3>
                    <Card elevated style={{ border: '1px solid var(--color-brand-gold)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Standardisation</div>
                        <h4 style={{ margin: '0 0 8px' }}>Term 1 Portfolio Review</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Nov 5th • Room 402</p>
                    </Card>
                    <Card elevated>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-info)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Team Briefing</div>
                        <h4 style={{ margin: '0 0 8px' }}>Final Project Prep</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Dec 12th • MS Teams</p>
                    </Card>

                    {outstandingIVs.length > 2 && (
                        <Card style={{ marginTop: 'var(--space-8)', background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.2)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <AlertTriangle size={20} color="var(--color-warning)" />
                                <div>
                                    <h4 style={{ margin: '0 0 4px', color: 'var(--color-warning)' }}>Audit Warning</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        {outstandingIVs.length} assignments are pending IV.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QualityAssurance;
