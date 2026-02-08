import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useUser } from '../context/UserContext';
import {
    User, Mail, Camera, Save, Settings,
    Shield, Palette, Music,
    Briefcase, MapPin, Moon, Sun
} from 'lucide-react';
import Modal from '../components/common/Modal';
import PageTransition from '../components/common/PageTransition';

const Profile: React.FC = () => {
    const { user, role, updateTheme, updateAvatar } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const avatars = [
        { id: 'cat', color: '#FF9F0A', image: '/avatars/cat.png', label: 'Cat' },
        { id: 'dog', color: '#32D74B', image: '/avatars/dog.png', label: 'Dog' },
        { id: 'duck', color: '#30B0C7', image: '/avatars/ducl.png', label: 'Duck' },
        { id: 'frog', color: '#FFD60A', image: '/avatars/frog.png', label: 'Frog' },
        { id: 'llama', color: '#FF2D55', image: '/avatars/llama.png', label: 'Llama' },
        { id: 'octopus', color: '#BF5AF2', image: '/avatars/octopus.png', label: 'Octopus' },
        { id: 'panda', color: '#5E5CE6', image: '/avatars/panda.png', label: 'Panda' },
        { id: 'parrot', color: '#FF375F', image: '/avatars/parrot.png', label: 'Parrot' },
        { id: 'penguin', color: '#64D2FF', image: '/avatars/penguin.png', label: 'Penguin' },
    ];

    // Mock editable state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: 'teacher.one@college.ac.uk',
        phone: '01234 567890',
        department: 'Performing Arts',
        room: 'Music Studio A'
    });

    const toggleTheme = () => {
        const nextTheme = user?.themePreference === 'light' ? 'dark' :
            user?.themePreference === 'dark' ? 'contrast' : 'light';
        updateTheme(nextTheme);
    };

    if (!user) return null;

    const handleSave = () => {
        // Mock save logic
        setIsEditing(false);
        // in a real app: updateUser(formData);
    };

    return (
        <PageTransition>
            <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>My Account</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage your profile settings and preferences</p>
                    </div>
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <Button variant="outline" onClick={toggleTheme} title="Toggle Theme" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {user.themePreference === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                                <span>Theme</span>
                            </Button>
                            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }} />
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave}><Save size={18} style={{ marginRight: '8px' }} /> Save Changes</Button>
                        </div>
                    ) : (
                        <Button variant="primary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
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
                                <button
                                    onClick={() => setShowAvatarModal(true)}
                                    style={{
                                        position: 'absolute', bottom: '0', right: '0',
                                        background: 'var(--color-brand-orange)', color: 'white',
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '3px solid var(--bg-surface)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                                    }}>
                                    <Camera size={18} />
                                </button>
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
                                <Palette size={20} color="var(--color-brand-purple)" /> Appearance
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
                                            alignItems: 'center'
                                        }}
                                    >
                                        {theme}
                                        {user.themePreference === theme && <Shield size={16} color="var(--color-brand-blue)" />}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <Card elevated>
                            <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={20} color="var(--color-brand-orange)" /> Personal Information
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: '8px',
                                            border: '1px solid var(--border-color)', background: isEditing ? 'var(--bg-input)' : 'transparent',
                                            color: isEditing ? 'var(--text-primary)' : 'var(--text-secondary)'
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px',
                                                border: '1px solid var(--border-color)', background: isEditing ? 'var(--bg-input)' : 'transparent',
                                                color: isEditing ? 'var(--text-primary)' : 'var(--text-secondary)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Department</label>
                                    <div style={{ position: 'relative' }}>
                                        <Briefcase size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                        <input
                                            type="text"
                                            value={formData.department}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px',
                                                border: '1px solid var(--border-color)', background: isEditing ? 'var(--bg-input)' : 'transparent',
                                                color: isEditing ? 'var(--text-primary)' : 'var(--text-secondary)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Office Room</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                        <input
                                            type="text"
                                            value={formData.room}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px',
                                                border: '1px solid var(--border-color)', background: isEditing ? 'var(--bg-input)' : 'transparent',
                                                color: isEditing ? 'var(--text-primary)' : 'var(--text-secondary)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card elevated>
                            <h3 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} color="var(--color-brand-blue)" /> Account Settings
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Password</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last changed 4 months ago</div>
                                    </div>
                                    <Button variant="outline" size="sm">Change</Button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Notifications</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email and In-app enabled</div>
                                    </div>
                                    <Button variant="outline" size="sm">Configure</Button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Security</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Two-factor authentication is OFF</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} title="Choose Your Avatar">
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
