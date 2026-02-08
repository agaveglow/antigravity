import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    ClipboardCheck,
    BookOpen,
    Calendar,
    MessageSquare,
    TrendingUp,
    AlertCircle,
    PlusCircle,
    LayoutGrid
} from 'lucide-react';
import WeeklyCalendarWidget from '../components/WeeklyCalendarWidget';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();

    const educatorTools = [
        { name: 'Attendance', icon: <ClipboardCheck size={24} />, color: 'var(--color-info)', count: 'Today: 92%' },
        { name: 'Resource Vault', icon: <BookOpen size={24} />, color: 'var(--color-brand-purple)', count: '15 New' },
        { name: 'Timetable', icon: <Calendar size={24} />, color: 'var(--color-brand-gold)', count: 'Next: 14:00' },
        { name: 'Staff Room', icon: <MessageSquare size={24} />, color: 'var(--color-brand-cyan)', count: '2 Messages' },
    ];

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Teacher Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Here is your school overview for today.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <Button variant="outline" onClick={() => navigate('/teacher/setup')}>
                        Academic Year Setup
                    </Button>
                    <Button onClick={() => navigate('/teacher/curriculum/new')}>
                        <PlusCircle size={18} style={{ marginRight: '8px' }} /> New Project Brief
                    </Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
                <Card elevated>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-cyan)', marginBottom: 'var(--space-2)' }}>
                        <TrendingUp size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Submission Rate</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>88%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>↑ 4% from last week</div>
                </Card>
                <Card elevated>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', marginBottom: 'var(--space-2)' }}>
                        <AlertCircle size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Marking Backlog</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>12</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Across 3 active units</div>
                </Card>
                <Card elevated>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
                        <Users size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Class Health</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>94%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>Optimal engagement</div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayoutGrid size={20} color="var(--color-primary)" />
                        <h3 style={{ margin: 0 }}>Educator Tools</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        {educatorTools.map(tool => (
                            <Card key={tool.name} style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }} elevated>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px', background: `${tool.color}15`,
                                    color: tool.color, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', margin: '0 auto 12px'
                                }}>
                                    {tool.icon}
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{tool.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{tool.count}</div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <h3 style={{ margin: 0 }}>Active Units</h3>
                    <Card elevated>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>Level 3 Music - Year 1</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>24 Students • Unit 1 & 8</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--color-info)20', color: 'var(--color-info)', fontWeight: 700 }}>LIVE</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{ width: '75%', height: '100%', background: 'var(--color-brand-cyan)' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            <span>Project Completion</span>
                            <span>75%</span>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            style={{ marginTop: 'var(--space-6)', width: '100%' }}
                            onClick={() => navigate('/teacher/assessment')}
                        >
                            Open Assessment Hub
                        </Button>
                    </Card>

                    <Card elevated style={{ background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.2)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <AlertCircle size={20} color="var(--color-warning)" />
                            <div>
                                <h4 style={{ margin: '0 0 4px', color: 'var(--color-warning)' }}>Quality Alert</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Next IV sampling for Composition portfolio is due in 3 days.
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" style={{ marginTop: 'var(--space-4)', width: '100%', borderColor: 'rgba(255, 171, 0, 0.3)' }} onClick={() => navigate('/teacher/qa')}>
                            Go to QA Dashboard
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Weekly Calendar Widget */}
            <WeeklyCalendarWidget />
        </div>
    );
};

export default TeacherDashboard;
