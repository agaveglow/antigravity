import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useCurriculum } from '../context/CurriculumContext';
import { useUser } from '../context/UserContext';
import { useSubmissions } from '../context/SubmissionContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LayoutDashboard, Clock, CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { useLanguage } from '../context/LanguageContext';

const Projects: React.FC = () => {
    const { getProjectsByCohort } = useCurriculum();
    const { user } = useUser();
    const { submissions } = useSubmissions();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const activeProjects = getProjectsByCohort(
        user?.cohort || 'Level 3A',
        user?.department as any
    ).filter(p => p.published !== false);

    return (
        <PageTransition>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{t('projects.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('projects.subtitle')} {user?.cohort}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-6)' }}>
                    {activeProjects.map(project => {
                        const projectSubmissions = submissions.filter(s => s.projectId === project.id && s.studentId === user?.id);
                        const completedTasks = projectSubmissions.filter(s => s.status === 'Graded' || s.status === 'Verified').length;
                        const totalTasks = project.tasks.length;
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                        return (
                            <Card key={project.id} elevated style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                                    <span className="badge" style={{ background: 'var(--color-brand-purple)', color: 'white' }}>
                                        {project.unit}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <Clock size={14} /> {project.deadline ? new Date(project.deadline).toLocaleDateString() : t('projects.noDeadline')}
                                    </div>
                                </div>

                                <h3 style={{ margin: '0 0 var(--space-4)' }}>{project.title}</h3>

                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '0.85rem' }}>
                                        <span>{t('projects.completion')}</span>
                                        <span style={{ fontWeight: 600 }}>{Math.round(progress)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px' }}>
                                        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-success)', borderRadius: '3px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle2 size={16} color="var(--color-success)" />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{completedTasks}/{totalTasks} {t('projects.tasksDone')}</span>
                                    </div>
                                    <Button size="sm" onClick={() => navigate(`/student/project/${project.id}`)}>
                                        {t('projects.viewDetails')} <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}

                    {activeProjects.length === 0 && (
                        <Card elevated style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)' }}>
                            <LayoutDashboard size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-4)' }} />
                            <h3>{t('projects.noProjects')}</h3>
                            <p>{t('projects.contactTeacher')}</p>
                        </Card>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default Projects;
