import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useCurriculum } from '../context/CurriculumContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Music, Mic, Headphones, Calendar, Clock, Sliders, Guitar, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useSubmissions } from '../context/SubmissionContext';
import WeeklyCalendarWidget from '../components/WeeklyCalendarWidget';
import Modal from '../components/common/Modal';
import Metronome from '../components/tools/Metronome';
import ScalesAndModes from '../components/tools/ScalesAndModes';
import ChordLibrary from '../components/tools/ChordLibrary';
import Tuner from '../components/tools/Tuner';

const StudentDashboard: React.FC = () => {
    const { getProjectsByLevel } = useCurriculum();
    const { user } = useUser();
    const { submissions } = useSubmissions();
    const navigate = useNavigate();

    const calculateProgress = (projectId?: string) => {
        if (!user) return 0;
        const projectSubmissions = submissions.filter(s =>
            s.studentId === user.id &&
            (projectId ? s.projectId === projectId : true)
        );
        const gradedCount = projectSubmissions.filter(s => s.status === 'Graded').length;
        // Mock divisor or use real task count
        const totalPossible = projectId ? 4 : 10; // Simplified for dashboard
        return Math.min(Math.round((gradedCount / totalPossible) * 100), 100);
    };

    // Filter based on student's specific level and year
    const activeProjects = getProjectsByLevel(
        user?.level || 'Level 3',
        user?.year || 'Year 1'
    );

    const tools = [
        { id: 'metronome', label: 'Metronome', icon: <Clock size={24} />, color: '#FF9F0A', component: Metronome },
        { id: 'tuner', label: 'Tuner', icon: <Sliders size={24} />, color: '#3232C2', component: Tuner },
        { id: 'scales', label: 'Scales & Modes', icon: <Music size={24} />, color: '#C860F5', component: ScalesAndModes },
        { id: 'booking', label: 'Studio Booking', icon: <Calendar size={24} />, color: '#30B0C7', component: null },
        { id: 'equipment', label: 'Equip. Loan', icon: <Headphones size={24} />, color: '#34C759', component: null },
        { id: 'collab', label: 'Find Collab', icon: <Mic size={24} />, color: '#FF2D55', component: null },
        { id: 'chords', label: 'Chord Library', icon: <Guitar size={24} />, color: '#FFD60A', component: ChordLibrary },
    ];

    const [activeTool, setActiveTool] = React.useState<string | null>(null);

    return (
        <div className="dashboard-container">
            {/* Dashboard Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)' }}>
                {/* Progress Card */}
                <Card elevated>
                    <h3>My Progress</h3>
                    <div style={{ marginTop: 'var(--space-4)', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <span>Level 3 Diploma</span>
                            <span>{calculateProgress()}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px' }}>
                            <div style={{ width: `${calculateProgress()}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }}></div>
                        </div>
                        <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                            You're on track for a <strong>Merit</strong>! Keep it up.
                        </p>
                    </div>
                </Card>

                {/* Stats Grid - Nested Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                    <Card elevated style={{ background: 'linear-gradient(135deg, var(--color-brand-blue) 0%, #4a4ae2 100%)', color: 'white' }}>
                        <h4 style={{ opacity: 0.9 }}>XP Earned</h4>
                        <h2 style={{ fontSize: '2.5rem', margin: 'var(--space-2) 0' }}>1,250</h2>
                        <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Rank: Producer</span>
                    </Card>

                    <Card elevated style={{ background: 'linear-gradient(135deg, var(--color-brand-orange) 0%, #ffb74d 100%)', color: 'white' }}>
                        <h4 style={{ opacity: 0.9 }}>Streak</h4>
                        <h2 style={{ fontSize: '2.5rem', margin: 'var(--space-2) 0' }}>5 Days</h2>
                        <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Keep it flowing!</span>
                    </Card>

                    <Card elevated style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h4>DowdBucks</h4>
                                <p style={{ color: 'var(--text-secondary)' }}>Spend in store</p>
                            </div>
                            <h2 style={{ color: 'var(--color-success)' }}>$450</h2>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Apps & Tools Section */}
            <h2 style={{ margin: 'var(--space-8) 0 var(--space-6)' }}>Apps & Tools</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
                {tools.map(tool => (
                    <Card key={tool.id} elevated style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: 'var(--space-6)',
                        cursor: tool.component ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        opacity: tool.component ? 1 : 0.5
                    }}
                        onClick={() => tool.component && setActiveTool(tool.id)}
                        onMouseEnter={(e) => tool.component && (e.currentTarget.style.transform = 'translateY(-4px)')}
                        onMouseLeave={(e) => tool.component && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        <div style={{
                            color: tool.color,
                            background: `${tool.color}15`, // 10% opacity 
                            padding: '12px',
                            borderRadius: '12px',
                            marginBottom: 'var(--space-3)'
                        }}>
                            {tool.icon}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{tool.label}</span>
                    </Card>
                ))}
            </div>

            <h2 style={{ margin: 'var(--space-8) 0 var(--space-6)' }}>Active Projects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
                {activeProjects.map(project => (
                    <Card key={project.id} elevated>
                        <span className="badge" style={{ background: 'var(--color-secondary)', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem' }}>
                            {project.unit}
                        </span>
                        <h3 style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>{project.title}</h3>
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span>Progress</span>
                                <span>{calculateProgress(project.id)}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'var(--bg-input)', borderRadius: '2px' }}>
                                <div style={{ width: `${calculateProgress(project.id)}%`, height: '100%', background: 'var(--color-brand-cyan)', borderRadius: '2px' }}></div>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', flex: 1 }}>
                            {project.scenario?.substring(0, 100)}...
                        </p>
                        <Button
                            variant="primary"
                            style={{ width: '100%' }}
                            onClick={() => navigate(`/student/project/${project.id}`)}
                        >
                            Continue Project <ChevronRight size={16} style={{ marginLeft: '8px' }} />
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Weekly Calendar Widget */}
            <div style={{ gridColumn: '1 / -1' }}>
                <WeeklyCalendarWidget />
            </div>

            {/* Tool Modals */}
            {tools.map(tool => tool.component && (
                <Modal key={tool.id} isOpen={activeTool === tool.id} onClose={() => setActiveTool(null)}>
                    {React.createElement(tool.component, { onClose: () => setActiveTool(null) })}
                </Modal>
            ))}
        </div>
    );
};

export default StudentDashboard;
