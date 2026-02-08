import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser, type UserRole } from '../../context/UserContext';

interface ProtectedRouteProps {
    allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { role, isAuthenticated } = useUser();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role && !allowedRoles.includes(role)) {
        // If student tries to access teacher area, or vice-versa
        return <Navigate to={role === 'student' ? '/student' : '/teacher'} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
