import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurriculum } from '../context/CurriculumContext';
import { useUser } from '../context/UserContext';
import { useSubmissions } from '../context/SubmissionContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ChevronLeft,
    CheckCircle,
    FileText,
    Bell,
    Clock
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

import { useLanguage } from '../context/LanguageContext';

const TaskSubmission: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const { projects } = useCurriculum();
    const { user } = useUser();
    const { getSubmissionByTask, requestVerification, cancelVerificationRequest } = useSubmissions();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isRequesting, setIsRequesting] = React.useState(false);

    const project = projects.find(p => p.tasks.some(t => t.id === taskId));
    const task = project?.tasks.find(t => t.id === taskId);

    const existingSubmission = user && taskId ? getSubmissionByTask(taskId, user.id) : undefined;

    const handleRequestVerification = async () => {
        if (!user || !taskId || !project) return;
        setIsRequesting(true);
        try {
            await requestVerification(
                taskId,
                project.id,
                user.id,
                user.name || 'Unknown',
                task?.title || 'Unknown Task',
                user.cohort || 'Unknown'
            );
        } catch (error) {
            console.error('Error requesting verification:', error);
        }
        setIsRequesting(false);
    };

    const handleCancelRequest = async () => {
        if (!existingSubmission) return;
        setIsRequesting(true);
        try {
            await cancelVerificationRequest(existingSubmission.id);
        } catch (error) {
            console.error('Error canceling verification request:', error);
        }
        setIsRequesting(false);
    };

    // Simplified view - no state needed for upload flow anymore

    if (!task || !project) return <div>{t('task.notFound')}</div>;

    return (
        <PageTransition>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}>
                    <ChevronLeft size={20} /> {t('task.back')}
                </Button>

                <header style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 style={{ marginBottom: 'var(--space-2)' }}>{task.title}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t('task.criteria')}: {task.criteriaReferences.join(', ')}
                    </p>
                </header>

                {/* Task Description Card */}
                <Card elevated style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.05), rgba(255, 159, 10, 0.02))' }}>
                    <h3 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} />
                        {t('task.description')}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-4)' }}>
                        {task.description}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{t('task.reward')}</div>
                            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{task.xpReward} XP</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{t('task.criteria')}</div>
                            <div style={{ fontWeight: 600 }}>{task.criteriaReferences.join(', ')}</div>
                        </div>
                        {task.deadline && (
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{t('task.deadline')}</div>
                                <div style={{ fontWeight: 600 }}>{new Date(task.deadline).toLocaleDateString()}</div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Verification Info Card */}
                <Card elevated style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    {/* STATE 1: VERIFIED / COMPLETED */}
                    {existingSubmission && (existingSubmission.verifiedAt || existingSubmission.status === 'Verified' || existingSubmission.status === 'Graded') ? (
                        <>
                            <CheckCircle size={64} color="var(--color-success)" style={{ marginBottom: 'var(--space-6)', opacity: 0.8 }} />
                            <h2 style={{ marginBottom: 'var(--space-4)' }}>{t('task.completed')}</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                                {t('task.verified')}
                            </p>
                            {existingSubmission.verifiedAt && (
                                <div style={{ marginTop: 'var(--space-4)', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                                    Verified on {new Date(existingSubmission.verifiedAt).toLocaleDateString()}
                                </div>
                            )}
                            {existingSubmission.grade && (
                                <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-input)', borderRadius: '8px', display: 'inline-block' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('task.gradeAwarded')}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-purple)' }}>{existingSubmission.grade}</div>
                                </div>
                            )}
                        </>
                    ) : existingSubmission && existingSubmission.verificationRequested ? (
                        /* STATE 2: VERIFICATION REQUESTED (PENDING) */
                        <>
                            <div style={{ marginBottom: 'var(--space-6)', background: 'rgba(255, 171, 0, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)' }}>
                                <Clock size={40} color="var(--color-warning)" />
                            </div>
                            <h2 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-warning)' }}>Verification Requested</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>
                                You have successfully requested verification for this task. It is now ready for your teacher to review.
                            </p>
                            <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px dashed var(--color-warning)', display: 'inline-block', marginBottom: 'var(--space-6)' }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Status: Pending Teacher Review</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Requested {existingSubmission.verificationRequestedAt ? new Date(existingSubmission.verificationRequestedAt).toLocaleTimeString() : 'Just now'}
                                </div>
                            </div>
                            <div>
                                <Button
                                    onClick={handleCancelRequest}
                                    variant="outline"
                                    disabled={isRequesting}
                                >
                                    Cancel Request
                                </Button>
                            </div>
                        </>
                    ) : (
                        /* STATE 3: NOT REQUESTED (INITIAL) */
                        <>
                            <div style={{ marginBottom: 'var(--space-6)', background: 'var(--bg-input)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)' }}>
                                <CheckCircle size={40} color="var(--text-tertiary)" />
                            </div>
                            <h2 style={{ marginBottom: 'var(--space-4)' }}>{t('task.submissionDisabled')}</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>
                                {t('task.manualVerificationOnly')}
                            </p>
                            <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'inline-block', textAlign: 'left', marginBottom: 'var(--space-6)' }}>
                                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('task.actionRequired')}</div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                                    <li>{t('task.action.prepare')}</li>
                                    <li>{t('task.action.show')}</li>
                                    <li>{t('task.action.ask')}</li>
                                </ul>
                            </div>
                            <Button
                                onClick={handleRequestVerification}
                                disabled={isRequesting}
                                size="lg"
                                style={{ minWidth: '200px' }}
                            >
                                <Bell size={20} style={{ marginRight: '8px' }} />
                                {isRequesting ? 'Requesting...' : 'Request Verification'}
                            </Button>
                        </>
                    )}
                </Card>
            </div>
        </PageTransition>
    );
};

export default TaskSubmission;
