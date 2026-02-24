import React from 'react';
import { useERC } from '../../context/ERCContext';
import { useUser } from '../../context/UserContext';
import {
    Disc,
    Calendar,
    Music,
    Clock,
    Layers,
    Mic2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import { format, isToday, parseISO } from 'date-fns';

const ERCRecordsHub: React.FC = () => {
    const { projects, bookings, availability, loading } = useERC();
    const { user, role } = useUser();
    const navigate = useNavigate();

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
    );

    const isTeacher = role !== 'student';
    const firstName = user?.name?.split(' ')[0] || user?.username || 'Artist';

    // Student specific data
    const myProjects = projects.filter(p => p.owner_id === user?.id || p.target_student_id === user?.id);
    const upcomingBookings = bookings
        .filter(b => b.booker_id === user?.id && new Date(b.start_time) >= new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Teacher specific data
    const activeStudentProjects = projects.filter(p => p.target_student_id);
    const todayAvailability = availability.filter(a => isToday(parseISO(a.start_time)));
    const todayBookings = bookings.filter(b => isToday(parseISO(b.start_time)));

    const renderActionCard = (action: { name: string, icon: React.ReactNode, color: string, path: string, desc: string }) => (
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

    const quickActions = isTeacher ? [
        {
            name: 'Manage Projects',
            icon: <Disc size={24} />,
            color: 'var(--color-brand-blue)',
            path: '/erc/projects',
            desc: 'View & assign student projects'
        },
        {
            name: 'Studio Bookings',
            icon: <Calendar size={24} />,
            color: 'var(--color-brand-purple)',
            path: '/erc/bookings',
            desc: 'Manage studio availability'
        },
        {
            name: 'Active Resources',
            icon: <Layers size={24} />,
            color: 'var(--color-brand-cyan)',
            path: '/erc/bookings',
            desc: '4 resources active'
        }
    ] : [
        {
            name: 'My Projects',
            icon: <Music size={24} />,
            color: 'var(--color-brand-blue)',
            path: '/erc/projects',
            desc: `${myProjects.length} active projects`
        },
        {
            name: 'Book Studio',
            icon: <Mic2 size={24} />,
            color: 'var(--color-brand-red)',
            path: '/erc/bookings',
            desc: 'Reserve recording time'
        },
        {
            name: 'My Bookings',
            icon: <Clock size={24} />,
            color: 'var(--color-brand-orange)',
            path: '/erc/bookings',
            desc: `${upcomingBookings.length} upcoming sessions`
        }
    ];

    const HubStats = () => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-6)',
            marginTop: 'var(--space-10)',
            marginBottom: 'var(--space-12)'
        }}>
            <Card elevated style={{ borderLeft: `4px solid ${isTeacher ? 'var(--color-brand-blue)' : 'var(--color-brand-red)'}` }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isTeacher ? "Today's Bookings" : "Upcoming Sessions"}
                </p>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>
                    {isTeacher ? todayBookings.length : upcomingBookings.length}
                </h3>
            </Card>
            <Card elevated style={{ borderLeft: '4px solid var(--color-brand-purple)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isTeacher ? "Active Projects" : "Pending Tasks"}
                </p>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>
                    {isTeacher ? activeStudentProjects.length : myProjects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status !== 'Completed').length || 0), 0)}
                </h3>
            </Card>
            <Card elevated style={{ borderLeft: '4px solid var(--color-brand-cyan)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isTeacher ? "My Availability" : "Studio Resources"}
                </p>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>
                    {isTeacher ? `${todayAvailability.length} Slots` : "4 Active"}
                </h3>
            </Card>
        </div>
    );

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(45deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {isTeacher ? 'ERC Management' : `Artist Hub, ${firstName}`}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {isTeacher ? 'Oversee studio usage and student music projects.' : 'Manage your recordings, tasks, and studio time.'}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                {renderActionCard(quickActions[0])}
                <div className="erc-secondary-grid">
                    {quickActions.slice(1).map(renderActionCard)}
                </div>
            </div>

            <HubStats />

            <div className="dashboard-bottom-grid" style={{ marginTop: 'var(--space-6)' }}>
                <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Studio Schedule</h3>
                        <button onClick={() => navigate('/erc/bookings')} style={{ background: 'none', border: 'none', color: 'var(--color-brand-blue)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                            Full Calendar
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {(isTeacher ? todayBookings : upcomingBookings).slice(0, 5).map(booking => (
                            <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-xs font-bold text-gray-400 w-12 text-center">
                                        {format(parseISO(booking.start_time), 'HH:mm')}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{booking.resource?.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {isTeacher ? (booking.profile?.name || 'Student') : format(parseISO(booking.start_time), 'EEEE, MMMM do')}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isToday(parseISO(booking.start_time)) ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {isToday(parseISO(booking.start_time)) ? 'Today' : 'Upcoming'}
                                </span>
                            </div>
                        ))}
                        {(isTeacher ? todayBookings : upcomingBookings).length === 0 && (
                            <div className="p-12 text-center">
                                <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No scheduled sessions</p>
                                <button onClick={() => navigate('/erc/bookings')} className="mt-4 text-sm font-bold text-indigo-600">
                                    {isTeacher ? 'Manage Availability' : 'Book a Session'}
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <style>{`
                .hover-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--color-brand-blue) !important;
                }

                .erc-secondary-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--space-6);
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

export default ERCRecordsHub;
