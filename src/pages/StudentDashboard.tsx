
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useStudentProgressData } from '../context/useStudentProgressData'; // Added import
import { useStudents } from '../context/StudentsContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useSubmissions } from '../context/SubmissionContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, ChevronRight, Music, Sliders, Headphones, Calendar, Guitar, BookOpen, FolderOpen, ChevronDown, ChevronUp, ShoppingBag, Heart } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import WeeklyCalendarWidget from '../components/WeeklyCalendarWidget';
import EventsWidget from '../components/dashboard/EventsWidget';
import Modal from '../components/common/Modal';
import Metronome from '../components/tools/Metronome';
import Tuner from '../components/tools/Tuner';
import ScalesAndModes from '../components/tools/ScalesAndModes';
import ChordLibrary from '../components/tools/ChordLibrary';

const StudentDashboard: React.FC = () => {
    const { user } = useUser();
    const { students } = useStudents();
    const { t } = useLanguage();
    const { getProjectsByCohort } = useCurriculum();
    const { submissions } = useSubmissions();
    const navigate = useNavigate();
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [showAllProjects, setShowAllProjects] = useState(false);

    // Find the live student data based on the logged-in user
    const liveStudent = students.find(s => s.id === user?.id || s.username === user?.username);
    const { overallProgress, loading: loadingProgress } = useStudentProgressData(liveStudent?.id);

    const calculateProgress = (projectId: string) => {
        if (!user) return 0;
        const projectSubmissions = submissions.filter(s =>
            s.studentId === user.id &&
            s.projectId === projectId
        );
        const completedCount = projectSubmissions.filter(s => s.status === 'Graded' || s.status === 'Verified').length;
        const totalPossible = 4; // Assuming 4 tasks per project for now
        return Math.min(Math.round((completedCount / totalPossible) * 100), 100);
    };

    const activeProjects = getProjectsByCohort(user?.cohort || 'Level 3A').filter(p => p.published !== false);

    const tools = [
        { id: 'metronome', label: 'Metronome', icon: <Clock size={24} />, color: '#FF9F0A', component: Metronome, shape: 'leaf-1' },
        { id: 'tuner', label: 'Tuner', icon: <Sliders size={24} />, color: '#32D74B', component: Tuner, shape: 'leaf-2' },
        { id: 'scales', label: 'Scales & Modes', icon: <Music size={24} />, color: '#30B0C7', component: ScalesAndModes, shape: 'leaf-1' },
        { id: 'chords', label: 'Chord Library', icon: <Guitar size={24} />, color: '#FFD60A', component: ChordLibrary, shape: 'leaf-2' },
        { id: 'booking', label: 'Book Studio', icon: <Calendar size={24} />, color: '#BF5AF2', component: null, shape: 'leaf-1' },
        { id: 'equipment', label: 'Loan Equipment', icon: <Headphones size={24} />, color: '#FF2D55', component: null, shape: 'leaf-2' },
    ];

    return (
        <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Top Section: Avatar & Stats - Centered Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr', // Left Card | Avatar | Right Card
                gap: 'var(--space-8)',
                alignItems: 'center',
                marginBottom: 'var(--space-12)',
            }} className="dashboard-header-grid">

                {/* Left: DowdBucks Card */}
                <Card elevated hover style={{
                    background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(243, 208, 96, 0.1) 100%)',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    height: '100%',
                    border: '1px solid rgba(243, 208, 96, 0.3)',
                    boxShadow: '0 4px 20px rgba(243, 208, 96, 0.15)',
                    borderRadius: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: '100px',
                        height: '100px',
                        background: 'var(--color-brand-gold)',
                        filter: 'blur(60px)',
                        opacity: 0.2,
                        borderRadius: '50%'
                    }} />

                    <div style={{
                        background: 'linear-gradient(135deg, #FFF9E5 0%, #FFF0C2 100%)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(243, 208, 96, 0.2)',
                        transform: 'rotate(-5deg)'
                    }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-brand-gold)', lineHeight: 1 }}>Ⓓ</div>
                    </div>
                    <div style={{ textAlign: 'right', flex: 1, zIndex: 1 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginBottom: '4px' }}>{t('dashboard.dowdBucks')}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-brand-gold)', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{user?.balance || 0}</div>
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
                            size={160} // Slightly larger
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
                            padding: '12px',
                            border: '4px solid var(--bg-surface)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}>
                            <Star size={28} fill="white" color="white" />
                        </div>
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', whiteSpace: 'nowrap' }}>
                        {t('dashboard.hello')}, <span style={{ background: 'linear-gradient(to right, #FF2D55, #C860F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'Student'}</span>!
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '300px' }}>
                        {t('dashboard.ready')}
                    </p>
                </div>

                {/* Right: XP Card - Matching Style */}
                <Card elevated hover style={{
                    background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(120, 120, 255, 0.1) 100%)', // Blue/Purple tint
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    height: '100%',
                    border: '1px solid rgba(120, 120, 255, 0.3)',
                    boxShadow: '0 4px 20px rgba(120, 120, 255, 0.15)',
                    borderRadius: '24px', // Matching radius
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: '100px',
                        height: '100px',
                        background: 'var(--color-brand-purple)',
                        filter: 'blur(60px)',
                        opacity: 0.2,
                        borderRadius: '50%'
                    }} />

                    <div style={{
                        background: `conic-gradient(var(--color-brand-purple) ${((liveStudent?.xp || 0) % 250) / 250 * 360}deg, var(--bg-subtle) 0deg)`,
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%', // Circular progress
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(120, 120, 255, 0.2)',
                        transform: 'rotate(-5deg)',
                        padding: '4px' // Ring thickness
                    }}>
                        <div style={{
                            background: 'var(--bg-surface)',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: 'var(--color-brand-purple)',
                            fontSize: '0.9rem'
                        }}>
                            {/* Display Overall Progress instead of generic Start */}
                            {loadingProgress ? '...' : `${overallProgress}%`}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', flex: 1, zIndex: 1 }}>
                        <>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginBottom: '4px' }}>{t('dashboard.level')} {Math.floor((liveStudent?.xp || 0) / 250) + 1}</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-brand-purple)', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{liveStudent?.xp || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>{t('dashboard.xp')}</span></div>
                        </>
                    </div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid student-dashboard-layout">

                {/* Quick Navigation Cards */}
                <div className="nav-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-6)' }}>
                    <Card
                        elevated
                        hover
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            minHeight: '160px',
                            background: 'linear-gradient(135deg, var(--bg-surface), rgba(0, 168, 198, 0.05))'
                        }}
                        onClick={() => navigate('/student/learning')}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'rgba(0, 168, 198, 0.1)',
                            color: 'var(--color-brand-cyan)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <BookOpen size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Learning Hub</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Access your learning materials</p>
                    </Card>

                    <Card
                        elevated
                        hover
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            minHeight: '160px',
                            background: 'linear-gradient(135deg, var(--bg-surface), rgba(138, 43, 226, 0.05))'
                        }}
                        onClick={() => navigate('/student/store')}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'rgba(138, 43, 226, 0.1)',
                            color: 'var(--color-brand-purple)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <ShoppingBag size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Rewards Shop</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Spend your DowdBucks</p>
                    </Card>

                    <Card
                        elevated
                        hover
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            minHeight: '160px',
                            background: 'linear-gradient(135deg, var(--bg-surface), rgba(160, 216, 179, 0.05))'
                        }}
                        onClick={() => navigate('/student/projects')}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'rgba(160, 216, 179, 0.1)',
                            color: 'var(--color-brand-teal)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <FolderOpen size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Active Projects</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>View and manage projects</p>
                    </Card>

                    <Card
                        elevated
                        hover
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            minHeight: '160px',
                            background: 'linear-gradient(135deg, var(--bg-surface), rgba(255, 99, 71, 0.05))' // Tomato red hint
                        }}
                        onClick={() => navigate('/student/progress')}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'rgba(255, 99, 71, 0.1)',
                            color: 'tomato', // Distinct color
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>%</div>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>My Progress</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Track your performance</p>
                    </Card>

                    <Card
                        elevated
                        hover
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            minHeight: '160px',
                            background: 'linear-gradient(135deg, var(--bg-surface), rgba(255, 59, 48, 0.05))'
                        }}
                        onClick={() => navigate('/support')}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'rgba(255, 59, 48, 0.1)',
                            color: 'var(--color-error)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <Heart size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Safeguarding</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Help & Support</p>
                    </Card>
                </div>

                {/* Active Projects */}
                <div className="projects-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                    <section>
                        <h2 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Star size={24} fill="var(--color-brand-gold)" color="var(--color-brand-gold)" />
                            {t('dashboard.activeProjects')}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            {activeProjects.slice(0, showAllProjects ? undefined : 2).map((project, i) => (
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
                                        {project.scenario?.replace(/<[^>]*>?/gm, '').substring(0, 120)}...
                                    </p>

                                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', marginBottom: '1.5rem' }}>
                                        <div style={{ width: `${calculateProgress(project.id)}%`, height: '100%', background: 'var(--color-brand-cyan)', borderRadius: '3px' }}></div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        onClick={() => navigate(`/student/project/${project.id}`)}
                                    >
                                        {t('dashboard.continue')} <ChevronRight size={16} style={{ marginLeft: '8px' }} />
                                    </Button>
                                </Card>
                            ))}

                            {activeProjects.length > 2 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAllProjects(!showAllProjects)}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {showAllProjects ? (
                                        <>Show Less <ChevronUp size={16} style={{ marginLeft: '8px' }} /></>
                                    ) : (
                                        <>Show All ({activeProjects.length}) <ChevronDown size={16} style={{ marginLeft: '8px' }} /></>
                                    )}
                                </Button>
                            )}
                        </div>
                    </section>
                </div>

                {/* Studio Tools */}
                <div className="tools-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                    <section>
                        <h2 style={{ marginBottom: 'var(--space-6)' }}>{t('dashboard.studioTools')}</h2>
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
                                        cursor: (tool.component || tool.id === 'booking' || tool.id === 'equipment') ? 'pointer' : 'default',
                                        opacity: (tool.component || tool.id === 'booking' || tool.id === 'equipment') ? 1 : 0.6,
                                        minHeight: '130px'
                                    }}
                                    onClick={() => {
                                        if (tool.id === 'booking' || tool.id === 'equipment') {
                                            navigate('/student/resources');
                                        } else if (tool.component) {
                                            setActiveTool(tool.id);
                                        }
                                    }}
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



            {/* Bottom Section: Weekly Calendar & Events */}
            <div className="dashboard-bottom-grid" style={{ marginTop: 'var(--space-8)' }}>
                {/* Events Widget */}
                <div>
                    <EventsWidget />
                </div>
                {/* Weekly Calendar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <WeeklyCalendarWidget />
                </div>
            </div>

            <style>{`
                @media (max-width: 1100px) {
                    .dashboard-header-grid {
                        grid-template-columns: 1fr !important;
                        text-align: center;
                    }
                    .dashboard-header-grid > :nth-child(2) {
                        order: -1;
                    }
                    .dashboard-bottom-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                .dashboard-bottom-grid {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: var(--space-8);
                    align-items: stretch;
                }
            `}</style>

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
