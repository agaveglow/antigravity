import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurriculum } from '../context/CurriculumContext';
import { useUser } from '../context/UserContext';
import { useSubmissions } from '../context/SubmissionContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    ChevronLeft, Circle, FileText, CheckCircle2,
    Clock, PlayCircle
} from 'lucide-react';

const ProjectBriefView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getProjectById } = useCurriculum();
    const { user } = useUser();
    const { getSubmissionByTask } = useSubmissions();
    const navigate = useNavigate();

    const project = id ? getProjectById(id) : undefined;

    if (!project) return <div>Project not found</div>;

    const getTaskStatus = (taskId: string) => {
        if (!user) return 'Not Started';
        const submission = getSubmissionByTask(taskId, user.id);
        if (!submission) return 'Not Started';
        return submission.status;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Graded': return <CheckCircle2 size={24} color="var(--color-success)" />;
            case 'Pending Mark': return <Clock size={24} color="var(--color-info)" />;
            case 'In Progress': return <PlayCircle size={24} color="var(--color-brand-cyan)" />;
            default: return <Circle size={24} color="var(--text-tertiary)" />;
        }
    };

    return (
        <div>
            <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}>
                <ChevronLeft size={20} /> Back to Dashboard
            </Button>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
                <div>
                    <Card elevated style={{ marginBottom: 'var(--space-8)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="badge" style={{
                                background: 'var(--color-secondary)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                {project.unit}
                            </span>
                        </div>
                        <h1 style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>{project.title}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            {project.level} - {project.year}
                        </p>

                        <div style={{ marginTop: 'var(--space-8)' }}>
                            <h3 style={{ marginBottom: 'var(--space-3)' }}>Project Scenario</h3>
                            <p style={{ lineHeight: 1.7, color: 'var(--text-primary)' }}>
                                {project.scenario}
                            </p>
                        </div>
                    </Card>

                    <h2 style={{ marginBottom: 'var(--space-6)' }}>Submission Tasks</h2>
                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                        {project.tasks.map(task => (
                            <Card key={task.id} style={{
                                borderLeft: `4px solid ${task.status === 'Graded' ? 'var(--color-success)' :
                                    task.status === 'Submitted' ? 'var(--color-info)' :
                                        task.status === 'In Progress' ? 'var(--color-brand-cyan)' : 'transparent'
                                    }`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                        {getStatusIcon(getTaskStatus(task.id))}
                                        <div>
                                            <h4 style={{ margin: 0 }}>{task.title}</h4>
                                            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: '4px' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {task.xpReward} XP
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                                    Criteria: {task.criteriaReferences.join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {getTaskStatus(task.id)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant={getTaskStatus(task.id) === 'Graded' ? 'outline' : 'primary'}
                                            onClick={() => navigate(`/student/task/${task.id}`)}
                                        >
                                            {getTaskStatus(task.id) === 'Not Started' ? 'Start' : 'View'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <Card elevated>
                        <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} color="var(--color-brand-purple)" /> Learning Outcomes
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {project.learningOutcomes.map(lo => (
                                <div key={lo.id} style={{ fontSize: '0.9rem' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lo.id}</div>
                                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{lo.description}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card elevated style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Essential Resources</h3>
                        <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {[
                                'UAL Level 3 Specification',
                                'Cubase Production Guide',
                                'College Health & Safety Handbook'
                            ].map(res => (
                                <li key={res} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '0.9rem',
                                    color: 'var(--color-brand-blue)',
                                    cursor: 'pointer'
                                }}>
                                    <FileText size={16} /> {res}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectBriefView;
