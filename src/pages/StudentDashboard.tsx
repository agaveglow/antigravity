import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { useCurriculum } from '../context/CurriculumContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Music, Mic, Headphones, Calendar, Clock, Sliders, Guitar, Star, Trophy, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useSubmissions } from '../context/SubmissionContext';
import WeeklyCalendarWidget from '../components/WeeklyCalendarWidget';
import Modal from '../components/common/Modal';
import Metronome from '../components/tools/Metronome';
import Tuner from '../components/tools/Tuner';
import ScalesAndModes from '../components/tools/ScalesAndModes';
import ChordLibrary from '../components/tools/ChordLibrary';

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
        const totalPossible = projectId ? 4 : 10;
        return Math.min(Math.round((gradedCount / totalPossible) * 100), 100);
    };

    const activeProjects = getProjectsByLevel(
        user?.level || 'Level 3',
        user?.year || 'Year 1'
    );

    const tools = [
        { id: 'metronome', label: 'Metronome', icon: <Clock size={24} />, color: '#FF9F0A', component: Metronome, shape: 'leaf-1' },
        { id: 'tuner', label: 'Tuner', icon: <Sliders size={24} />, color: '#3232C2', component: Tuner, shape: 'leaf-2' },
        { id: 'scales', label: 'Scales & Modes', icon: <Music size={24} />, color: '#C860F5', component: ScalesAndModes, shape: 'leaf-1' },
        { id: 'booking', label: 'Studio Booking', icon: <Calendar size={24} />, color: '#30B0C7', component: null, shape: 'leaf-2' },
        { id: 'equipment', label: 'Equip. Loan', icon: <Headphones size={24} />, color: '#34C759', component: null, shape: 'leaf-1' },
        { id: 'chords', label: 'Chord Library', icon: <Guitar size={24} />, color: '#FFD60A', component: ChordLibrary, shape: 'leaf-2' },
        { id: 'collab', label: 'Find Collab', icon: <Mic size={24} />, color: '#FF2D55', component: null, shape: 'leaf-1' },
    ];

    const [activeTool, setActiveTool] = useState<string | null>(null);

    return (
        <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Top Section: Avatar Surrounded by Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 1fr) auto minmax(200px, 1fr)',
                gap: 'var(--space-6)',
                alignItems: 'center',
                marginBottom: 'var(--space-16)'
            }}>

                {/* Left Stat: Level */}
                <Card shape="leaf-1" elevated style={{ background: 'linear-gradient(135deg, var(--color-brand-blue) 0%, #4a4ae2 100%)', color: 'white', border: 'none', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%' }}>
                            <Trophy size={24} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Current Level</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{user?.levelNumber || 1}</div>
                        </div>
                    </div>
                </Card>

                {/* Center: Avatar & Welcome */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    zIndex: 10
                }}>
                    <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
                        <Avatar
                            src={user?.avatar}
                            alt={user?.name}
                            size={140}
                            elevated
                            style={{
                                border: '6px solid var(--bg-surface)',
                                boxShadow: '0 0 0 4px var(--color-brand-purple-alpha), var(--shadow-xl)'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: 5,
                            right: 5,
                            background: 'var(--color-brand-gold)',
                            borderRadius: '50%',
                            padding: '10px',
                            border: '4px solid var(--bg-surface)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}>
                            <Star size={24} fill="white" color="white" />
                        </div>
                    </div>

                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', whiteSpace: 'nowrap' }}>
                        Hello, <span style={{ background: 'linear-gradient(to right, #FF2D55, #C860F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'Student'}</span>!
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
                        Ready to make some noise? You're doing great.
                    </p>

                    {/* DowdBucks - Centered below text */}
                    <Card shape="pill" elevated style={{ background: 'var(--bg-surface)', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '1rem', minWidth: 'auto' }}>
                        <div style={{ background: 'rgba(50, 215, 75, 0.1)', padding: '8px', borderRadius: '50%' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#32D74B' }}>Ⓓ</div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DowdBucks</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#32D74B', lineHeight: 1 }}>{user?.balance || 0}</div>
                        </div>
                    </Card>
                </div>

                {/* Right Stat: XP */}
                <Card shape="leaf-2" elevated style={{ background: 'var(--bg-surface)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255, 159, 10, 0.1)', padding: '12px', borderRadius: '50%' }}>
                            <Sparkles size={24} color="#FF9F0A" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total XP</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.xp || 0}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

                    {/* Active Projects */}
                    <section>
                        <h2 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Star size={24} fill="var(--color-brand-gold)" color="var(--color-brand-gold)" />
                            Active Projects
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            {activeProjects.map((project, i) => (
                                <Card key={project.id} elevated shape={i % 2 === 0 ? 'leaf-1' : 'leaf-2'}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <span className="badge" style={{ background: 'var(--color-secondary)', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                                                {project.unit}
                                            </span>
                                            <h3 style={{ margin: 0 }}>{project.title}</h3>
                                        </div>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{calculateProgress(project.id)}%</span>
                                        </div>
                                    </div>

                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                        {project.scenario?.substring(0, 120)}...
                                    </p>

                                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', marginBottom: '1.5rem' }}>
                                        <div style={{ width: `${calculateProgress(project.id)}%`, height: '100%', background: 'var(--color-brand-cyan)', borderRadius: '3px' }}></div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        onClick={() => navigate(`/student/project/${project.id}`)}
                                    >
                                        Continue Project <ChevronRight size={16} style={{ marginLeft: '8px' }} />
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', marginTop: 'var(--space-8)' }}>

                    {/* Weekly Calendar */}
                    <WeeklyCalendarWidget />

                    {/* Quick Tools */}
                    <section>
                        <h2 style={{ marginBottom: 'var(--space-6)' }}>Studio Tools</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                            {tools.map((tool) => (
                                <Card
                                    key={tool.id}
                                    elevated
                                    hover
                                    shape={tool.shape as any}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        padding: 'var(--space-4)',
                                        cursor: tool.component ? 'pointer' : 'default',
                                        opacity: tool.component ? 1 : 0.6,
                                        minHeight: '130px'
                                    }}
                                    onClick={() => tool.component && setActiveTool(tool.id)}
                                >
                                    <div style={{
                                        color: tool.color,
                                        background: `${tool.color}15`,
                                        padding: '12px',
                                        borderRadius: '50%',
                                        marginBottom: 'var(--space-2)'
                                    }}>
                                        {tool.icon}
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tool.label}</span>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>
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
