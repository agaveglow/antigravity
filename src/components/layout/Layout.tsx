import React from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
// framer-motion imports removed for stability troubleshooting
import {
    Menu, X, User as UserIcon, LogOut, Calendar,
    LayoutDashboard, BookOpen, GraduationCap, ShoppingBag, Package, Clock,
    CheckSquare, ShieldCheck, Heart, Users, FilePlus
} from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
    const { user, role, logout } = useUser();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    interface NavLinkItem {
        to: string;
        label: string;
        icon: React.ReactNode;
        end?: boolean;
    }

    const studentLinks: NavLinkItem[] = [
        { to: '/student', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { to: '/student/learning', label: 'Learning', icon: <GraduationCap size={20} /> },
        { to: '/student/projects', label: 'Projects', icon: <BookOpen size={20} /> },
        { to: '/student/grades', label: 'Grades', icon: <CheckSquare size={20} /> },
        { to: '/student/store', label: 'Store', icon: <ShoppingBag size={20} /> },
        { to: '/student/inventory', label: 'Inventory', icon: <Package size={20} /> },
        { to: '/student/resources', label: 'Studio & Equipment', icon: <Calendar size={20} /> },
    ];

    const teacherLinks: NavLinkItem[] = [
        { to: '/teacher', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { to: '/teacher/students', label: 'Students', icon: <Users size={20} /> },
        { to: '/teacher/projects', label: 'Projects', icon: <BookOpen size={20} /> },
        { to: '/teacher/quizzes', label: 'Courses', icon: <GraduationCap size={20} /> },
        { to: '/teacher/resources', label: 'Studio & Equipment', icon: <Calendar size={20} /> },
        { to: '/teacher/ingestion', label: 'Curriculum', icon: <FilePlus size={20} /> },
        { to: '/teacher/assessment', label: 'Assessment', icon: <CheckSquare size={20} /> },
        { to: '/teacher/qa', label: 'QA & IV', icon: <ShieldCheck size={20} /> },
    ];

    const sharedLinks: NavLinkItem[] = [
        { to: '/timetable', label: 'Timetable', icon: <Clock size={20} /> },
        { to: '/calendar', label: 'Calendar', icon: <Calendar size={20} /> },
        { to: '/profile', label: 'Profile', icon: <UserIcon size={20} /> },
        { to: '/support', label: 'Support', icon: <Heart size={20} /> },
    ];

    const roleLinks = role === 'student' ? studentLinks : teacherLinks;
    const currentLinks = [...roleLinks, ...sharedLinks];

    return (
        <div className={`layout-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Mobile Header */}{/* Previously added in TSX but CSS was missing */}
            <header className="mobile-header">
                <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="logo">ERC Learn</div>
                <div className="user-avatar-sm" onClick={() => navigate('/profile')} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user?.avatar ? (
                        user.avatar.startsWith('http') || user.avatar.startsWith('/') ? (
                            <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: user.avatar }} />
                        )
                    ) : (
                        <UserIcon size={16} />
                    )}
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
                    {currentLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)} // Close on mobile click
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="layout-main">
                <div className="top-bar">
                    <h2 className="page-title">
                        {/* Dynamic Title based on route could go here */}
                        {role === 'student' ? 'ERC Learn: Music' : 'Teacher Dashboard'}
                    </h2>
                    <div
                        className="avatar-placeholder"
                        onClick={() => navigate('/profile')}
                        style={{
                            cursor: 'pointer', overflow: 'hidden', padding: 0,
                            background: user?.avatar && !user.avatar.startsWith('http') && !user.avatar.startsWith('/') ? user.avatar : undefined
                        }}
                    >
                        {user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? (
                            <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : user?.avatar ? (
                            // Avatar is color string, handled by background style above
                            null
                        ) : (
                            user?.name?.charAt(0) || 'U'
                        )}
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
