import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { useUser, type UserRole } from '../context/UserContext';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useUser();

    const handleLogin = (role: UserRole) => {
        if (role) {
            login(role);
            if (role === 'student') navigate('/student');
            else navigate('/teacher');
        }
    };

    return (
        <div className="login-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            <Card elevated style={{ width: '400px', padding: 'var(--space-8)', textAlign: 'center' }}>
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <img
                        src="/assets/logo.png"
                        alt="ERC Music"
                        style={{ height: '100px', marginBottom: 'var(--space-4)' }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <h1 style={{ color: 'var(--text-primary)' }}>ERC Learn</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Music Department</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <Button onClick={() => handleLogin('student')} size="lg">Student Login</Button>
                    <Button onClick={() => handleLogin('teacher')} variant="outline" size="lg">Teacher/Staff Login</Button>
                </div>
            </Card>
        </div>
    );
};

export default Login;
