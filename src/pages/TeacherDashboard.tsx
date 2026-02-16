import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    AlertCircle,
    PlusCircle,
    LayoutGrid,
    CheckCircle
} from 'lucide-react';
import WeeklyCalendarWidget from '../components/WeeklyCalendarWidget';
import { useStudents } from '../context/StudentsContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useSubmissions } from '../context/SubmissionContext';
import { useLanguage } from '../context/LanguageContext';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { students } = useStudents();
    const { projects } = useCurriculum();
    const { submissions } = useSubmissions();
    const { t } = useLanguage();

    // Calculate Real Stats
    const totalStudents = students.filter((s: any) => s.status === 'Active').length;
    const activeProjects = projects.filter(p => p.published).length;
    const pendingAssessments = submissions.filter(s => s.status === 'Pending Mark').length;

    // Quick Actions
    const quickActions = [
        {
            name: t('teacher.dashboard.qa.manageStudents'),
            icon: <Users size={24} />,
            color: 'var(--color-brand-blue)',
            path: '/teacher/students',
            desc: t('teacher.dashboard.qa.viewProfiles')
        },
        {
            name: t('teacher.dashboard.qa.curriculum'),
            icon: <BookOpen size={24} />,
            color: 'var(--color-brand-purple)',
            path: '/teacher/projects',
            desc: t('teacher.dashboard.qa.manageProjects')
        },
        {
            name: t('teacher.dashboard.qa.assessmentHub'),
            icon: <CheckCircle size={24} />,
            color: 'var(--color-brand-orange)',
            path: '/teacher/assessment',
            desc: `${pendingAssessments} ${t('teacher.dashboard.qa.pending')}`
        },
        {
            name: t('teacher.dashboard.qa.courses'),
            icon: <BookOpen size={24} />,
            color: 'var(--color-brand-cyan)',
            path: '/teacher/quizzes',
            desc: t('teacher.dashboard.qa.manageContent')
        },
    ];

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(45deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('teacher.dashboard.title')}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{t('teacher.dashboard.subtitle')}</p>
                </div>
                <Button onClick={() => navigate('/teacher/projects')} variant="primary">
                    <PlusCircle size={18} style={{ marginRight: '8px' }} /> {t('teacher.dashboard.newProject')}
                </Button>
            </div>

            {/* Key Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
                <Card elevated style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-blue)', marginBottom: 'var(--space-2)' }}>
                            <Users size={20} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('teacher.dashboard.activeStudents')}</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{totalStudents}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('teacher.dashboard.enrolledCohorts')}</div>
                    </div>
                </Card>

                <Card elevated style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-purple)', marginBottom: 'var(--space-2)' }}>
                            <BookOpen size={20} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('teacher.dashboard.activeProjects')}</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{activeProjects}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('teacher.dashboard.publishedLive')}</div>
                    </div>
                </Card>


            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
                {/* Left Column: Quick Actions & Calendar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

                    {/* Quick Actions Grid */}
                    <div>
                        <h3 style={{ margin: '0 0 var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LayoutGrid size={20} /> {t('teacher.dashboard.quickActions')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                            {quickActions.map(action => (
                                <Card
                                    key={action.name}
                                    onClick={() => navigate(action.path)}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid transparent'
                                    }}
                                    className="hover-card"
                                    elevated
                                >
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: `${action.color}15`, color: action.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '12px'
                                    }}>
                                        {action.icon}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{action.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{action.desc}</div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Calendar */}
                    <div>
                        <WeeklyCalendarWidget />
                    </div>

                </div>

                {/* Right Column: Notifications / QA (Simplified) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>


                    {pendingAssessments > 5 && (
                        <Card elevated style={{ background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.2)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <AlertCircle size={20} color="var(--color-warning)" />
                                <div>
                                    <h4 style={{ margin: '0 0 4px', color: 'var(--color-warning)' }}>{t('teacher.dashboard.markingBacklog')}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        {t('teacher.dashboard.backlogMessage')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                style={{ marginTop: 'var(--space-4)', width: '100%', borderColor: 'rgba(255, 171, 0, 0.3)' }}
                                onClick={() => navigate('/teacher/assessment')}
                            >
                                {t('teacher.dashboard.goToGrading')}
                            </Button>
                        </Card>
                    )}
                </div>
            </div>

            <style>{`
                .hover-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--color-brand-blue) !important;
                }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;
