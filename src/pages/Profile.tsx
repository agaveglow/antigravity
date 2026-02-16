import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useUser } from '../context/UserContext';
import {
    User, Camera, Settings,
    Shield, Palette, Music,
    Briefcase, Moon, Sun, Lock
} from 'lucide-react';
import Modal from '../components/common/Modal';
import PageTransition from '../components/common/PageTransition';
import { useLanguage } from '../context/LanguageContext';

const Profile: React.FC = () => {
    const { user, role, updateTheme, updateAvatar, updateProfile } = useUser();
    const { t } = useLanguage();
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const avatars = [
        { id: 'cat', color: '#FF9F0A', image: '/avatars/cat.png', label: t('profile.avatar.cat') },
        { id: 'dog', color: '#32D74B', image: '/avatars/dog.png', label: t('profile.avatar.dog') },
        { id: 'duck', color: '#30B0C7', image: '/avatars/duck.png', label: t('profile.avatar.duck') },
        { id: 'frog', color: '#FFD60A', image: '/avatars/frog.png', label: t('profile.avatar.frog') },
        { id: 'llama', color: '#FF2D55', image: '/avatars/llama.png', label: t('profile.avatar.llama') },
        { id: 'octopus', color: '#BF5AF2', image: '/avatars/octopus.png', label: t('profile.avatar.octopus') },
        { id: 'panda', color: '#5E5CE6', image: '/avatars/panda.png', label: t('profile.avatar.panda') },
        { id: 'parrot', color: '#FF375F', image: '/avatars/parrot.png', label: t('profile.avatar.parrot') },
        { id: 'penguin', color: '#64D2FF', image: '/avatars/penguin.png', label: t('profile.avatar.penguin') },
    ];

    // Mock editable state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        phone: '01234 567890'
    });

    // Update form when user data changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                username: user.username || '',
                phone: '01234 567890'
            });
        }
    }, [user]);

    const toggleTheme = () => {
        const nextTheme = user?.themePreference === 'light' ? 'dark' :
            user?.themePreference === 'dark' ? 'contrast' : 'light';
        updateTheme(nextTheme);
    };

    if (!user) return null;

    return (
        <PageTransition>
            <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{t('profile.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('profile.subtitle')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <Button variant="outline" onClick={toggleTheme} title={t('profile.toggleTheme')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {user.themePreference === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                            <span>{t('profile.theme')}</span>
                        </Button>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />
                        <Button variant="primary" onClick={() => setShowAvatarModal(true)}>
                            <Camera size={18} style={{ marginRight: '8px' }} /> {t('profile.changeAvatar')}
                        </Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-8)', alignItems: 'start' }}>
                    {/* Left Column: Avatar & Quick Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <Card elevated style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto var(--space-4)' }}>
                                {user.avatar ? (
                                    <div style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        background: user.avatar, // Using color as placeholder for now
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '3rem', fontWeight: 700, boxShadow: 'var(--shadow-lg)',
                                        color: 'white', border: '4px solid white'
                                    }}>
                                        {/* If it's an image URL, use img tag, else just color block */}
                                        {user.avatar.startsWith('http') || user.avatar.startsWith('/') ? (
                                            <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <Music size={48} />
                                        )}
                                    </div>
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        background: 'var(--color-brand-blue)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '3rem', fontWeight: 700, boxShadow: 'var(--shadow-lg)'
                                    }}>
                                        {user.name.charAt(0)}
                                    </div>
                                )}

                            </div>
                            <h2 style={{ margin: '0 0 var(--space-1)' }}>{formData.name}</h2>
                            <span style={{
                                background: 'rgba(50, 50, 194, 0.1)', color: 'var(--color-brand-blue)',
                                padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600
                            }}>
                                {role?.toUpperCase()}
                            </span>
                        </Card>

                        <Card elevated>
                            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Palette size={20} color="var(--color-brand-purple)" /> {t('profile.appearance')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {['light', 'dark', 'contrast'].map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => updateTheme(theme as any)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: 'var(--border-radius-md)',
                                            border: user.themePreference === theme ? '2px solid var(--color-brand-blue)' : '1px solid var(--border-color)',
                                            background: user.themePreference === theme ? 'rgba(50, 50, 194, 0.05)' : 'var(--bg-surface)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontWeight: user.themePreference === theme ? 600 : 400,
                                            textTransform: 'capitalize',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        {theme === 'light' ? t('profile.theme.light') : theme === 'dark' ? t('profile.theme.dark') : t('profile.theme.contrast')}
                                        {user.themePreference === theme && <Shield size={16} color="var(--color-brand-blue)" />}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card elevated>
                            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={20} color="var(--color-success)" /> {t('profile.accessibility')}
                            </h3>

                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t('profile.fontSize')}</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { id: 'normal', label: 'Aa' },
                                        { id: 'large', label: 'Aa (L)' },
                                        { id: 'xl', label: 'Aa (XL)' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => updateProfile({ fontSizePreference: opt.id as any })}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '6px',
                                                border: (user.fontSizePreference || 'normal') === opt.id ? '2px solid var(--color-brand-blue)' : '1px solid var(--border-color)',
                                                background: (user.fontSizePreference || 'normal') === opt.id ? 'rgba(50, 50, 194, 0.05)' : 'var(--bg-surface)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t('profile.colorProfile')}</label>
                                <select
                                    value={user.colorProfile || 'standard'}
                                    onChange={(e) => updateProfile({ colorProfile: e.target.value as any })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="standard">{t('profile.cp.standard')}</option>
                                    <option value="protanopia">{t('profile.cp.protanopia')}</option>
                                    <option value="deuteranopia">{t('profile.cp.deuteranopia')}</option>
                                    <option value="tritanopia">{t('profile.cp.tritanopia')}</option>
                                </select>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <Card elevated>
                            <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={20} color="var(--color-brand-orange)" /> {t('profile.personalInfo')}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('profile.fullName')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            disabled={true}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: 'not-allowed',
                                                opacity: 0.8
                                            }}
                                        />
                                        <Lock size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('profile.username')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                        <input
                                            type="text"
                                            value={formData.username}
                                            disabled={true}
                                            style={{
                                                width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px',
                                                border: '1px solid var(--border-color)', background: 'transparent',
                                                color: 'var(--text-secondary)'
                                            }}
                                        />
                                    </div>
                                </div>
                                {role === 'student' && (
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('profile.cohort')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <Briefcase size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                            <input
                                                type="text"
                                                value={user.cohort || ''}
                                                disabled={true}
                                                style={{
                                                    width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px',
                                                    border: '1px solid var(--border-color)', background: 'transparent',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card elevated>
                            <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} color="var(--color-brand-blue)" /> {t('profile.accountSettings')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{t('profile.notifications')}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('profile.inAppEnabled')}</div>
                                    </div>
                                    <Button variant="outline" size="sm">{t('profile.configure')}</Button>
                                </div>

                                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>{t('profile.language')}</div>
                                    <select
                                        value={user.language || 'en'}
                                        onChange={(e) => updateProfile({ language: e.target.value as any })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="en">English (US)</option>
                                        <option value="en-gb">English (UK)</option>
                                        <option value="es">Español (Spanish)</option>
                                        <option value="fr">Français (French)</option>
                                        <option value="de">Deutsch (German)</option>
                                        <option value="zh">中文 (Chinese)</option>
                                        <option value="ja">日本語 (Japanese)</option>
                                        <option value="ar">العربية (Arabic)</option>
                                        <option value="pt">Português (Portuguese)</option>
                                        <option value="ru">Русский (Russian)</option>
                                    </select>
                                </div>

                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} title={t('profile.chooseAvatar')}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
                    {avatars.map(avatar => (
                        <div
                            key={avatar.id}
                            onClick={() => {
                                updateAvatar(avatar.image);
                                setShowAvatarModal(false);
                            }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', padding: '16px', borderRadius: '12px',
                                background: 'var(--bg-input)', border: user.avatar === avatar.image ? `2px solid ${avatar.color}` : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = avatar.color}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = user.avatar === avatar.image ? avatar.color : 'transparent'}
                        >
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', border: `3px solid ${avatar.color}`
                            }}>
                                <img src={avatar.image} alt={avatar.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{avatar.label}</span>
                        </div>
                    ))}
                </div>
            </Modal>
        </PageTransition >
    );
};

export default Profile;
