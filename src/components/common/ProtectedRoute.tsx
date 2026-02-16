import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser, type UserRole } from '../../context/UserContext';

interface ProtectedRouteProps {
    allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, role, isAuthenticated, isLoading } = useUser();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ marginBottom: '1rem' }}>Loading session...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !isLoading) {
        return <Navigate to="/login" replace />;
    }

    if (user?.isFirstLogin) {
        if (window.location.pathname !== '/set-password') {
            return <Navigate to="/set-password" replace />;
        }
    } else {
        if (window.location.pathname === '/set-password') {
            // Redirect to home if they try to access setup page when already secured
            const homePath = role === 'admin' ? '/admin' : (role === 'teacher' ? '/teacher' : '/student');
            return <Navigate to={homePath} replace />;
        }
    }

    if (role && !allowedRoles.includes(role)) {
        // Redirect to user's home dashboard based on role
        const homePath = role === 'admin' ? '/admin' : (role === 'teacher' ? '/teacher' : '/student');

        // If they are ALREADY on their home path but still denied, something is wrong, go back to login
        const currentPath = window.location.pathname;
        if (currentPath.startsWith(homePath)) {
            console.error(`Circular redirect detected for role ${role} on ${currentPath}`);
            return <Navigate to="/login" replace />;
        }

        return <Navigate to={homePath} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
