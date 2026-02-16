import React from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSubmissions } from '../../context/SubmissionContext'; // Import Added
// framer-motion imports removed for stability troubleshooting
import {
    Menu, X, User as UserIcon, LogOut, Calendar, BookOpen, ShoppingBag, Package, Clock, LayoutDashboard,
    Heart, Users, Home, FolderOpen, BarChart2, Award, Box, ClipboardList, CheckCircle,
    FileCheck, Shield, Disc, Star
} from 'lucide-react';
import './Layout.css';
import NotificationBell from './NotificationBell';

const Layout: React.FC = () => {
    const { user, role, logout } = useUser();
    const { submissions } = useSubmissions(); // Hook added
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const { t } = useLanguage();

    interface NavLinkItem {
        to: string;
        label: string;
        icon: React.ReactNode;
        end?: boolean;
    }

    const studentLinks: NavLinkItem[] = [
        { to: '/student', label: t('sidebar.dashboard'), icon: <Home size={20} />, end: true },
        { to: '/student/learning', label: t('sidebar.learning'), icon: <BookOpen size={20} /> },
        { to: '/student/projects', label: t('sidebar.projects'), icon: <FolderOpen size={20} /> },
        { to: '/student/grades', label: t('sidebar.grades'), icon: <BarChart2 size={20} /> },
        { to: '/student/achievements', label: 'Achievements', icon: <Award size={20} /> },
        { to: '/student/store', label: t('sidebar.store'), icon: <ShoppingBag size={20} /> },
        { to: '/student/inventory', label: t('sidebar.inventory'), icon: <Package size={20} /> },
        { to: '/student/resources', label: t('sidebar.resources'), icon: <Box size={20} /> },
    ];

    const teacherLinks: NavLinkItem[] = [
        { to: '/teacher', label: t('sidebar.dashboard'), icon: <LayoutDashboard size={20} />, end: true },
        { to: '/teacher/students', label: 'Students', icon: <Users size={20} /> }, // No translation key yet
        { to: '/teacher/projects', label: t('sidebar.projects'), icon: <FolderOpen size={20} /> },
        { to: '/teacher/quizzes', label: 'Courses', icon: <ClipboardList size={20} /> }, // No translation key yet
        { to: '/teacher/assessment', label: 'Assessment', icon: <CheckCircle size={20} /> }, // No translation key yet
        { to: '/teacher/achievements', label: 'Achievements', icon: <Award size={20} /> },
        { to: '/teacher/qa', label: 'QA & IV', icon: <FileCheck size={20} /> }, // No translation key yet
        { to: '/teacher/resources', label: t('sidebar.resources'), icon: <Box size={20} /> },
    ];

    const sharedLinks: NavLinkItem[] = [
        { to: '/timetable', label: 'Timetable', icon: <Clock size={20} /> }, // No translation key yet
        { to: '/calendar', label: t('sidebar.calendar'), icon: <Calendar size={20} /> },
        { to: '/profile', label: t('sidebar.profile'), icon: <UserIcon size={20} /> },
        { to: '/erc', label: 'ERC Records', icon: <Disc size={20} /> },
        { to: '/support', label: t('sidebar.support'), icon: <Heart size={20} /> },
    ];

    let roleLinks = role === 'student' ? studentLinks : teacherLinks;

    // Filter links based on department
    if (user?.department === 'performing_arts') {
        // Remove Music-specific links for PA students/teachers
        // "ERC Records" paths: /erc, /student/store, /student/resources (maybe keep resources?)
        // Let's hide specific ones as requested: ERC Records, Studio Booking, Equipment

        // Filter shared links
        const hiddenSharedPaths = ['/erc'];

        // Filter role links
        const hiddenRolePaths = ['/student/store', '/student/resources', '/teacher/resources'];

        // Add Performing Arts Hub for students
        if (role === 'student') {
            roleLinks = [
                { to: '/student/performing-arts', label: 'PA Hub', icon: <Star size={20} />, end: true },
                ...roleLinks.filter(link => !hiddenRolePaths.includes(link.to))
            ];
        } else {
            roleLinks = roleLinks.filter(link => !hiddenRolePaths.includes(link.to));
        }
    }

    // Add admin link if user is admin
    if (role === 'admin') {
        roleLinks = [
            ...teacherLinks,
            { to: '/admin', label: 'Staff Admin', icon: <Shield size={20} />, end: true }
        ];
        // Admin sees everything, no filtering
    }

    const currentLinks = [...roleLinks, ...sharedLinks].filter(link => {
        if (user?.department === 'performing_arts' && ['/erc'].includes(link.to)) return false;
        return true;
    });

    return (
        <div className={`layout-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Mobile Header */}{/* Previously added in TSX but CSS was missing */}
            <header className="mobile-header">
                <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="logo">ERC Learn</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <NotificationBell />
                    <div className="user-avatar-sm" onClick={() => navigate('/profile')} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {user?.avatar && typeof user.avatar === 'string' ? (
                            (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: user.avatar }} />
                            )
                        ) : (
                            <UserIcon size={16} />
                        )}
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header" style={{ padding: '0', display: 'flex', justifyContent: 'center', minHeight: '60px' }}>
                    <img
                        src="/assets/logo.png"
                        alt="ERC Music Logo"
                        style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
                <div className="role-badge" style={{ alignSelf: 'center', marginBottom: '20px' }}>{role?.toUpperCase()}</div>

                <nav className="sidebar-nav">
                    {currentLinks.map((link) => {
                        // Logic for showing dots
                        let showDot = false;
                        const dotColor = '#FF453A'; // Hardcoded bright red to ensure visibility

                        // Debugging logs (can be removed later)
                        // console.log('Checking dot for:', link.label, 'Role:', role, 'Submissions:', submissions.length);

                        if ((role === 'teacher' || role === 'admin') && link.to === '/teacher/assessment') {
                            const pendingVerifications = submissions.filter(s => s.verificationRequested && !s.verifiedAt).length;
                            // console.log('Pending Verifications:', pendingVerifications);
                            if (pendingVerifications > 0) showDot = true;
                        }

                        if (role === 'student' && link.to === '/student/projects') {
                            const resubmissions = submissions.filter(s => s.studentId === user?.id && s.status === 'Resubmission Required').length;
                            if (resubmissions > 0) showDot = true;
                        }

                        // Force override for Teacher Assessment if context fails (Direct check)
                        // This is a verification step to ensure the red dot appears.
                        if ((role === 'teacher' || role === 'admin') && link.to === '/teacher/assessment') {
                            // Use the context count first
                            const pendingVerifications = submissions.filter(s => s.verificationRequested && !s.verifiedAt).length;
                            if (pendingVerifications > 0) showDot = true;
                        }

                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)} // Close on mobile click
                            >
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    {link.icon}
                                    {showDot && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -2,
                                            right: -2,
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: dotColor,
                                            boxShadow: '0 0 0 2px rgba(28, 28, 30, 1)'
                                        }} />
                                    )}
                                </div>
                                <span>{link.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        title={t('sidebar.logout')}
                    >
                        <LogOut size={20} />
                        <span>{t('sidebar.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="layout-main">
                <div className="top-bar">
                    <h2 className="page-title">
                        {role === 'student' ? 'ERC Learn: Music' :
                            window.location.pathname.includes('/admin') ? 'Staff Management' : 'Teacher Dashboard'}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <NotificationBell />

                        <div
                            className="avatar-placeholder"
                            onClick={() => navigate('/profile')}
                            style={{
                                cursor: 'pointer', overflow: 'hidden', padding: 0,
                                background: user?.avatar && typeof user.avatar === 'string' && !user.avatar.startsWith('http') && !user.avatar.startsWith('/') ? user.avatar : undefined
                            }}
                        >
                            {user?.avatar && typeof user.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : user?.avatar && typeof user.avatar === 'string' ? (
                                // Avatar is color string, handled by background style above
                                null
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                    </div>
                </div>
                <div className="content-scroll">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
