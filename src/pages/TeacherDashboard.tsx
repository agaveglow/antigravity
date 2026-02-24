import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    AlertCircle,
    CheckCircle,
    Heart
} from 'lucide-react';
import WeeklyCalendarWidget from '../components/WeeklyCalendarWidget';
import CohortProgressWidget from '../components/dashboard/CohortProgressWidget';
import { useSubmissions } from '../context/SubmissionContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { submissions } = useSubmissions();
    const { t } = useLanguage();

    // Calculate Real Stats
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
        {
            name: 'Support & Wellbeing',
            icon: <Heart size={24} />,
            color: 'var(--color-error)',
            path: '/support',
            desc: 'Access staff resources'
        }
    ];

    const renderActionCard = (action: any) => (
        <Card
            key={action.name}
            onClick={() => navigate(action.path)}
            style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                height: '100%'
            }}
            className="hover-card"
            elevated
        >
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${action.color}15`, color: action.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                {action.icon}
            </div>
            <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>{action.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{action.desc}</div>
            </div>
        </Card>
    );

    const { user } = useUser();
    const firstName = user?.name?.split(' ')[0] || '';

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(45deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('teacher.dashboard.title')}{firstName ? `, ${firstName}` : ''}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{t('teacher.dashboard.subtitle')}</p>
                </div>
            </div>

            {/* Top Section: Quick Actions - Progress Widget - Quick Actions */}
            <div className="dashboard-top-grid">
                {/* Left Actions */}
                <div className="quick-actions-col">
                    {quickActions.slice(0, 2).map(renderActionCard)}
                </div>

                {/* Center Widget */}
                {/* Using a wrapper to ensure height matches */}
                <div style={{ height: '100%' }}>
                    <CohortProgressWidget />
                </div>

                {/* Right Actions */}
                <div className="quick-actions-col">
                    {quickActions.slice(2, 5).map(renderActionCard)}
                </div>
            </div>

            {/* Key Stats Row (Moved Below) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>

                {/* Conditional Marking Backlog Card as 3rd Stat Card */}
                {pendingAssessments > 0 && (
                    <Card elevated style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255, 171, 0, 0.3)', background: 'rgba(255, 171, 0, 0.05)' }}>
                        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', marginBottom: 'var(--space-2)' }}>
                                    <AlertCircle size={20} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('teacher.dashboard.markingBacklog')}</span>
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--color-warning)' }}>{pendingAssessments}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('teacher.dashboard.qa.pending')}</div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/teacher/assessment')}
                                style={{ marginTop: 'auto', alignSelf: 'flex-start', paddingLeft: 0, color: 'var(--color-warning)' }}
                            >
                                {t('teacher.dashboard.goToGrading')} <CheckCircle size={14} style={{ marginLeft: '6px' }} />
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            <div className="dashboard-bottom-grid" style={{ marginTop: 'var(--space-12)' }}>
                {/* Weekly Calendar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <WeeklyCalendarWidget />
                </div>
            </div>



            <style>{`
                .hover-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--color-brand-blue) !important;
                }

                .dashboard-top-grid {
                    display: grid;
                    grid-template-columns: minmax(280px, 1fr) 1.2fr minmax(280px, 1fr);
                    gap: var(--space-6);
                    margin-bottom: var(--space-8);
                    align-items: stretch;
                }

                .quick-actions-col {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-6);
                }

                @media (max-width: 1100px) {
                    .dashboard-top-grid {
                        grid-template-columns: 1fr;
                        gap: var(--space-4);
                    }
                    /* Move widget to top */
                    .dashboard-top-grid > :nth-child(2) { order: -1; }
                    
                    /* Grid for Action Columns on Mobile */
                    .quick-actions-col {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: var(--space-4);
                    }
                    
                    .dashboard-bottom-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                
                .dashboard-bottom-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--space-8);
                    align-items: stretch;
                }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;
