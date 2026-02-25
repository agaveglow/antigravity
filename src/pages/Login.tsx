import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useUser } from '../context/UserContext';

const Login: React.FC = () => {
    const { login, user, role, isAuthenticated } = useUser();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && role && user) {
            if (user.isFirstLogin) {
                navigate('/set-password');
            } else {
                if (role === 'admin' || role === 'teacher') navigate('/teacher');
                else navigate('/student');
            }
        }
    }, [isAuthenticated, role, user, navigate]);

    // States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [authStatus, setAuthStatus] = useState<string | null>(null);

    const handleLoginSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            setAuthStatus('Authenticating...');

            // If it doesn't look like an email, assume it's a username and append our internal domain
            const loginIdentifier = (email.includes('@') ? email : `${email}@erc-learn.local`).toLowerCase();

            const result = await login(loginIdentifier, password);

            if (!result.success) {
                setError(result.error || 'Login failed');
                setAuthStatus(null);
            } else {
                setAuthStatus('Authenticated! Loading profile...');
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred');
            setAuthStatus(null);
        }
        setIsLoading(false);
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
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
                            placeholder="e.g. j.doe"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    {error && <div style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>{error}</div>}
                    {authStatus && !error && <div style={{ color: 'var(--color-brand-blue)', fontSize: '0.9rem' }}>{authStatus}</div>}

                    {isAuthenticated && !role && <div style={{
                        padding: '12px',
                        background: 'rgba(255, 107, 107, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid var(--color-error)',
                        fontSize: '0.85rem',
                        color: 'var(--color-error)',
                        marginTop: '10px'
                    }}>
                        <strong>Security Error:</strong> Profile not found.<br />
                        Ensure you have run the latest SQL in Supabase for this user.
                    </div>}

                    <Button onClick={handleLoginSubmit} size="lg" disabled={isLoading || (isAuthenticated && !role)}>
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </Button>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                        Forgot password? Contact your tutor.
                    </div>
                </div>

                {import.meta.env.DEV && (
                    <div style={{
                        marginTop: 'var(--space-6)',
                        padding: 'var(--space-4)',
                        background: 'rgba(50, 50, 194, 0.1)',
                        borderRadius: 'var(--border-radius-md)',
                        border: '1px dashed var(--color-brand-blue)',
                        textAlign: 'left'
                    }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-brand-blue)', marginBottom: '8px' }}>🛠️ Developer Quick Login</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setEmail('teacher@test.com');
                                    setPassword('password123');
                                }}
                                style={{ flex: 1, fontSize: '0.75rem' }}
                            >
                                Teacher
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setEmail('student@test.com');
                                    setPassword('password123');
                                }}
                                style={{ flex: 1, fontSize: '0.75rem' }}
                            >
                                Student
                            </Button>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>Login with your college credentials.</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
