import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

const SetSecurePassword: React.FC = () => {
    const { role, completeFirstLogin, changePassword, logout } = useUser();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const success = await changePassword(newPassword);
            if (success) {
                console.log('SetSecurePassword: Password updated, completing first login flags');
                await completeFirstLogin();

                // Redirect based on role in context
                if (role === 'admin') navigate('/admin');
                else if (role === 'teacher') navigate('/teacher');
                else navigate('/student');
            } else {
                setError('Failed to update password. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition>
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-main)',
                padding: 'var(--space-4)'
            }}>
                <Card elevated style={{ maxWidth: '450px', width: '100%', padding: 'var(--space-8)', textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(50, 50, 194, 0.1)',
                        color: 'var(--color-brand-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-6) auto'
                    }}>
                        <Lock size={32} />
                    </div>

                    <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>Secure Your Account</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                        Welcome to ERC Learn! For your security, please update your temporary password to a permanent one.
                    </p>

                    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Confirm Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--color-error)',
                                fontSize: '0.85rem',
                                marginBottom: 'var(--space-6)',
                                padding: '12px',
                                background: 'rgba(255, 107, 107, 0.1)',
                                borderRadius: '8px'
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <Button type="submit" disabled={isLoading} style={{ width: '100%' }} size="lg">
                            {isLoading ? 'Updating...' : 'Set Secure Password'}
                        </Button>

                        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={() => logout()}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-tertiary)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Cancel and Log Out
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </PageTransition>
    );
};

export default SetSecurePassword;
