import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../context/StudentsContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useSubmissions } from '../context/SubmissionContext';
import { useUser } from '../context/UserContext';
import { useAchievements } from '../context/AchievementsContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ChevronLeft, CheckCircle, Filter } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

const TeacherVerification: React.FC = () => {
    const navigate = useNavigate();
    const { students } = useStudents();
    const { projects } = useCurriculum();
    const { addSubmission, getSubmissionByTask } = useSubmissions();
    const { user } = useUser(); // Teacher user
    const { awardAchievement, achievements } = useAchievements();

    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [filterTaskStatus, setFilterTaskStatus] = useState<'All' | 'Unverified' | 'Verified'>('Unverified');

    // Derived state
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    // Filter projects by student cohort
    const studentProjects = selectedStudent
        ? projects.filter(p => p.cohort === selectedStudent.cohort)
        : [];

    const selectedProject = studentProjects.find(p => p.id === selectedProjectId);

    const handleVerify = (taskId: string) => {
        if (!selectedStudent || !selectedProject || !user) return;

        const task = selectedProject.tasks.find(t => t.id === taskId);
        if (!task) return;

        const now = new Date();

        addSubmission({
            id: crypto.randomUUID(),
            taskId: taskId,
            projectId: selectedProject.id,
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            studentCohort: selectedStudent.cohort,
            status: 'Verified',
            submittedAt: now.toISOString(),
            verifiedBy: user.name,
            verifiedAt: now.toISOString(),
            evidence: [], // No evidence needed for manual verification
            ivStatus: 'Verified' // Manually verified by teacher counts as IV-ed
        });

        // Award 'First Steps' (Complete first project task)
        // We can just try to award it; context prevents duplicates.
        // Assuming ID '1' or title 'First Steps'
        const firstSteps = achievements.find(a => a.title === 'First Steps' || a.id === '1');
        if (firstSteps) {
            awardAchievement(selectedStudent.id, firstSteps.id);
        }

        // Award 'Early Bird' (Submit before deadline)
        if (task.deadline) {
            const deadlineDate = new Date(task.deadline);
            // Check if submitted at least 24 hours before? Or just before?
            // Description says "Submit a task before the deadline."
            // Criteria says "Submit work at least 24 hours before the due date."
            // Let's go with just "before" for simplicity, or check 24h if strictly following criteria.
            // Let's use strict 24h as per criteria.
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (deadlineDate.getTime() - now.getTime() > twentyFourHours) {
                const earlyBird = achievements.find(a => a.title === 'Early Bird' || a.id === '5');
                if (earlyBird) {
                    awardAchievement(selectedStudent.id, earlyBird.id);
                }
            }
        }
    };

    return (
        <PageTransition>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Button variant="ghost" onClick={() => navigate('/teacher/assessment')} style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}>
                    <ChevronLeft size={20} /> Back to Assessment Hub
                </Button>

                <header style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 style={{ marginBottom: 'var(--space-2)' }}>Verify Student Work</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manually verify task completion for students.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
                    {/* Selection Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <Card elevated>
                            <h3 style={{ marginBottom: 'var(--space-4)' }}>1. Select Student</h3>
                            <select
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                                value={selectedStudentId}
                                onChange={(e) => {
                                    setSelectedStudentId(e.target.value);
                                    setSelectedProjectId(''); // Reset project on student change
                                }}
                            >
                                <option value="">-- Choose Student --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.cohort})</option>
                                ))}
                            </select>
                        </Card>

                        {selectedStudent && (
                            <Card elevated>
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>2. Select Project</h3>
                                <select
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                >
                                    <option value="">-- Choose Project --</option>
                                    {studentProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </Card>
                        )}
                    </div>

                    {/* Task List Panel */}
                    <div>
                        {selectedStudent && selectedProject ? (
                            <Card elevated>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                                    <h3 style={{ margin: 0 }}>Tasks for {selectedProject.title}</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['All', 'Unverified', 'Verified'].map(status => (
                                            <Button
                                                key={status}
                                                size="sm"
                                                variant={filterTaskStatus === status ? 'primary' : 'ghost'}
                                                onClick={() => setFilterTaskStatus(status as any)}
                                            >
                                                {status}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                    {selectedProject.tasks.map(task => {
                                        const submission = getSubmissionByTask(task.id, selectedStudent.id);
                                        const isVerified = submission?.status === 'Verified' || submission?.status === 'Graded';

                                        if (filterTaskStatus === 'Unverified' && isVerified) return null;
                                        if (filterTaskStatus === 'Verified' && !isVerified) return null;

                                        return (
                                            <div key={task.id} style={{
                                                padding: 'var(--space-4)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '12px',
                                                background: isVerified ? 'rgba(46, 204, 113, 0.05)' : 'var(--bg-surface)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{task.title}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {task.criteriaReferences.join(', ')} • {task.xpReward} XP
                                                    </div>
                                                </div>

                                                {isVerified ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.9rem' }}>
                                                        <CheckCircle size={18} />
                                                        Verified
                                                    </div>
                                                ) : (
                                                    <Button onClick={() => handleVerify(task.id)}>
                                                        Mark Complete
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-tertiary)', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <Filter size={48} style={{ opacity: 0.2 }} />
                                <p>Select a student and project to view tasks.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default TeacherVerification;
