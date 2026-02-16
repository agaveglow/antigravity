import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useERC } from '../../context/ERCContext';
import { useUser } from '../../context/UserContext';
import { Music, Mic2, Users, Disc, LayoutDashboard, Calendar, Settings, Plus, ArrowRight } from 'lucide-react';
import Card from '../../components/common/Card';

const ERCRecordsHub: React.FC = () => {
    const { role } = useUser();

    if (role === 'student') {
        return <StudentHub />;
    } else {
        return <TeacherHub />;
    }
};

const StudentHub: React.FC = () => {
    const navigate = useNavigate();
    const { projects, bookings } = useERC();
    const { user } = useUser();

    // Filter for "My" data
    const myProjects = projects.filter(p => p.owner_id === user?.id || p.collaborators?.some((c: any) => c.user_id === user?.id));
    const myBookings = bookings.filter(b => b.booker_id === user?.id);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-8 md:p-12 shadow-xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Disc className="w-6 h-6" />
                        <span className="text-sm font-medium tracking-wider uppercase">Artist Hub</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Sound, <br />Unleashed.</h1>
                    <p className="max-w-xl text-lg text-indigo-100 mb-8">
                        Manage your discography, book studio time, and collaborate with other artists at ERC.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => navigate('/erc/projects')}
                            className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2"
                        >
                            <Music size={20} />
                            My Projects
                        </button>
                        <button
                            onClick={() => navigate('/erc/bookings/new')}
                            className="bg-indigo-500/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <Mic2 size={20} />
                            Book Studio
                        </button>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="absolute bottom-0 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card
                    elevated
                    hover
                    className="cursor-pointer group relative overflow-hidden"
                    onClick={() => navigate('/erc/projects')}
                    style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)' }}
                >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-sm">
                            <Music size={24} />
                        </div>
                        <ArrowRight className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-indigo-500/10 inline-block px-2 py-1 rounded text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Active</div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{myProjects.length}</h3>
                        <p className="text-gray-500 dark:text-gray-400">Projects in progress</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                </Card>

                <Card
                    elevated
                    hover
                    className="cursor-pointer group relative overflow-hidden"
                    onClick={() => navigate('/erc/bookings')}
                    style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(244, 63, 94, 0.05) 100%)' }}
                >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform shadow-sm">
                            <Calendar size={24} />
                        </div>
                        <ArrowRight className="text-gray-300 dark:text-gray-600 group-hover:text-rose-500 transition-colors" />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-rose-500/10 inline-block px-2 py-1 rounded text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">Upcoming</div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{myBookings.length}</h3>
                        <p className="text-gray-500 dark:text-gray-400">Studio sessions booked</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
                </Card>

                <Card
                    elevated
                    hover
                    className="cursor-pointer group border-gray-700 bg-gray-900 text-white relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}
                >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-white/10 rounded-xl text-emerald-400 backdrop-blur-sm">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="bg-emerald-500/20 inline-block px-2 py-1 rounded text-xs font-semibold text-emerald-300 mb-2">Network</div>
                        <h3 className="text-xl font-bold mb-1 text-white">Find Collaborators</h3>
                        <p className="text-gray-400 text-sm">Connect with producers and vocalists</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </Card>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                    hover
                    className="cursor-pointer group border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10"
                    onClick={() => navigate('/erc/projects')}
                >
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">New Project</h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">Start a song, EP, or Album</p>
                        </div>
                    </div>
                </Card>

                <Card
                    hover
                    className="cursor-pointer group border-2 border-dashed border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10"
                    onClick={() => navigate('/erc/bookings/new')}
                >
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Mic2 size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-rose-900 dark:text-rose-100">Book Session</h4>
                            <p className="text-sm text-rose-700 dark:text-rose-300">Reserve studio or booth</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const TeacherHub: React.FC = () => {
    const navigate = useNavigate();
    const { projects, bookings, resources } = useERC();
    const { user } = useUser();

    // Stats for Teacher of today's bookings
    const todayBookings = bookings.filter(b => {
        const today = new Date().toDateString();
        return new Date(b.start_time).toDateString() === today;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                        ERC Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Overview of studio resources and student projects.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Settings size={18} />
                        Settings
                    </button>
                    <button onClick={() => navigate('/erc/bookings/new')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Plus size={18} />
                        New Booking
                    </button>
                </div>
            </header>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card elevated>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Bookings Today</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{todayBookings.length}</h3>
                        </div>
                    </div>
                </Card>

                <Card elevated>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Disc size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</h3>
                        </div>
                    </div>
                </Card>

                <Card elevated>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Mic2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Resources</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{resources.length}</h3>
                        </div>
                    </div>
                </Card>

                <Card elevated style={{ opacity: 0.7 }}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active Students</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">--</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity / Schedule */}
                <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Studio Schedule</h3>
                        <button onClick={() => navigate('/erc/bookings')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View Calendar</button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {bookings.slice(0, 5).map(booking => (
                            <div key={booking.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{booking.resource?.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(booking.start_time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                                    {booking.status}
                                </span>
                            </div>
                        ))}
                        {bookings.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No upcoming bookings found.</div>
                        )}
                    </div>
                </Card>

                {/* Quick Management Links */}
                <div className="space-y-4">
                    <Card
                        hover
                        className="cursor-pointer group relative overflow-hidden"
                        onClick={() => navigate('/erc/projects')}
                        style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)' }}
                    >
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">Manage Projects</h4>
                            <ArrowRight size={20} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm relative z-10">View and manage all student projects.</p>
                        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                    </Card>

                    <Card
                        hover
                        className="cursor-pointer group relative overflow-hidden"
                        onClick={() => navigate('/erc/bookings')}
                        style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(244, 63, 94, 0.05) 100%)' }}
                    >
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">Resource Calendar</h4>
                            <ArrowRight size={20} className="text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm relative z-10">Oversee studio usage and manage conflicts.</p>
                        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors"></div>
                    </Card>

                    <Card
                        className="border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800"
                        style={{ boxShadow: 'none' }}
                    >
                        <p className="text-sm text-gray-500 mb-2">More management tools coming soon...</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ERCRecordsHub;
