import React from 'react';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { Award, BookOpen, Calendar, Sparkles } from 'lucide-react';

const PerformingArtsHub: React.FC = () => {
    const { user } = useUser();
    const { t } = useLanguage();

    const containerStyle = {
        padding: 'var(--space-6)',
        maxWidth: '1200px',
        margin: '0 auto',
        animation: 'fadeIn 0.5s ease-out'
    };

    const headerStyle = {
        marginBottom: 'var(--space-8)',
        textAlign: 'center' as const
    };

    const welcomeStyle = {
        fontSize: '2.5rem',
        fontWeight: '800',
        marginBottom: 'var(--space-2)',
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em'
    };

    const subtitleStyle = {
        color: 'var(--text-secondary)',
        fontSize: '1.25rem'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)'
    };

    const cardStyle = {
        background: 'var(--card-bg)',
        borderRadius: '24px',
        padding: 'var(--space-6)',
        border: '1px solid var(--border-color)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 'var(--space-4)',
        position: 'relative' as const,
        overflow: 'hidden'
    };

    const iconBoxStyle = {
        width: '48px',
        height: '48px',
        borderRadius: '16px',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary)',
        marginBottom: 'var(--space-2)'
    };

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <h1 style={welcomeStyle}>{t('dashboard.welcome')}, {user?.name?.split(' ')[0]}!</h1>
                <p style={subtitleStyle}>Performing Arts Department</p>
            </header>

            <div style={gridStyle}>
                {/* Current Unit */}
                <div style={cardStyle} className="hover-lift">
                    <div style={iconBoxStyle}><BookOpen size={24} /></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Current Unit</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Unit 1: Introduction to Performance</p>
                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: '35%', height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px' }}>35% Complete</p>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div style={cardStyle} className="hover-lift">
                    <div style={iconBoxStyle}><Calendar size={24} /></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Schedule</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52, 199, 89, 0.1)',
                                color: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
                            }}>
                                14
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>Acting Workshop</h4>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>10:00 AM - Studio 2</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Achievement */}
                <div style={cardStyle} className="hover-lift">
                    <div style={iconBoxStyle}><Award size={24} /></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Achievements</h3>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255,149,0,0.1), rgba(255,59,48,0.1))',
                        padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,149,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Sparkles size={16} color="#FF9500" />
                            <span style={{ fontWeight: '600', color: '#FF9500' }}>Rising Star</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Completed first monologue performance.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformingArtsHub;
