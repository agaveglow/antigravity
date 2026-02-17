import React from 'react';
import Card from '../components/common/Card';
import { useUser } from '../context/UserContext';
import { useStudents } from '../context/StudentsContext';
import { useStudentProgressData } from '../context/useStudentProgressData';
import DetailedStudentProgress from '../components/curriculum/DetailedStudentProgress';
import PageTransition from '../components/common/PageTransition';

const StudentOverallProgress: React.FC = () => {
    const { user } = useUser();
    const { students } = useStudents();

    // Find the live student data based on the logged-in user
    const liveStudent = students.find(s => s.id === user?.id || s.username === user?.username);
    const { overallProgress, loading } = useStudentProgressData(liveStudent?.id);

    if (!liveStudent) return <div>Loading student data...</div>;

    return (
        <PageTransition>
            <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                <h1 style={{ marginBottom: 'var(--space-6)' }}>My Progress</h1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                    {/* Predicted Grade Card */}
                    <Card elevated style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(138, 43, 226, 0.05) 100%)', border: '1px solid rgba(138, 43, 226, 0.2)' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Predicted Grade</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-brand-purple)' }}>
                            {liveStudent.predicted_grade || 'Not Yet Set'}
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                            Based on current performance trajectory
                        </p>
                    </Card>

                    {/* Overall Progress Card */}
                    <Card elevated style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(0, 168, 198, 0.05) 100%)', border: '1px solid rgba(0, 168, 198, 0.2)' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Overall Completion</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-brand-cyan)' }}>
                                {loading ? '...' : `${overallProgress}%`}
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>of total course content</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', marginTop: 'var(--space-4)', overflow: 'hidden' }}>
                            <div style={{
                                width: `${loading ? 0 : overallProgress}%`,
                                height: '100%',
                                background: 'var(--color-brand-cyan)',
                                borderRadius: '4px',
                                transition: 'width 1s ease-out'
                            }} />
                        </div>
                    </Card>
                </div>

                {/* Detailed Breakdown */}
                <h2 style={{ marginBottom: 'var(--space-4)' }}>Detailed Breakdown</h2>
                <Card elevated>
                    <DetailedStudentProgress studentId={liveStudent.id} />
                </Card>
            </div>
        </PageTransition>
    );
};

export default StudentOverallProgress;
