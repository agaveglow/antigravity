import React, { useState } from 'react';
import { useAchievements } from '../context/AchievementsContext';
import { useBadges } from '../context/BadgeContext';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import PageTransition from '../components/common/PageTransition';
import BadgeAttachment from '../components/BadgeAttachment';
import RichTextViewer from '../components/common/RichTextViewer';
import RichTextEditor from '../components/common/RichTextEditor';
import { supabase } from '../lib/supabase';
import {
    Plus, Edit2, Edit3, Trash2, Award, Zap, Brain, Users, Sun,
    Footprints, Trophy, Star, Music, Sliders, X, Save
} from 'lucide-react';
import type { Achievement, AchievementCategory } from '../types/achievements';
import type { Badge } from '../types/badges';

const achievementIconOptions = [
    { name: 'Award', icon: Award },
    { name: 'Trophy', icon: Trophy },
    { name: 'Star', icon: Star },
    { name: 'Zap', icon: Zap },
    { name: 'Brain', icon: Brain },
    { name: 'Users', icon: Users },
    { name: 'Sun', icon: Sun },
    { name: 'Footprints', icon: Footprints },
    { name: 'Music', icon: Music },
    { name: 'Sliders', icon: Sliders },
];

const commonEmojis = ['🏆', '⭐', '🎖️', '🥇', '🥈', '🥉', '👑', '💎', '🔥', '⚡', '🎯', '🎨', '🎵', '🎭', '📚', '💪', '🚀', '✨'];
const commonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const AchievementsAndBadges: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Achievements' | 'Badges'>('Achievements');
    const { user } = useUser();

    // Achievements State & Logic
    const { achievements, addAchievement, updateAchievement, deleteAchievement } = useAchievements();
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);
    const [achievementFormData, setAchievementFormData] = useState<Partial<Achievement>>({
        title: '',
        description: '',
        category: 'Academic',
        xpValue: 0,
        icon: 'Award',
        criteria: ''
    });

    const categories: AchievementCategory[] = ['Academic', 'Participation', 'Creativity', 'Other'];

    const handleOpenAchievementModal = (achievement?: Achievement) => {
        if (achievement) {
            setEditingAchievementId(achievement.id);
            setAchievementFormData(achievement);
        } else {
            setEditingAchievementId(null);
            setAchievementFormData({
                title: '',
                description: '',
                category: 'Academic',
                xpValue: 0,
                icon: 'Award',
                criteria: ''
            });
        }
        setIsAchievementModalOpen(true);
    };

    const handleAchievementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAchievementId) {
            updateAchievement(editingAchievementId, achievementFormData);
        } else {
            addAchievement(achievementFormData as Omit<Achievement, 'id'>);
        }
        setIsAchievementModalOpen(false);
    };

    // Badges State & Logic
    const { badges, addBadge, updateBadge, deleteBadge, isLoading: isBadgesLoading } = useBadges();
    const [isCreatingBadge, setIsCreatingBadge] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);
    const [isBadgeUploading, setIsBadgeUploading] = useState(false);
    const [badgeFormData, setBadgeFormData] = useState({
        title: '',
        description: '',
        icon: '🏆',
        color: '#6366f1'
    });

    const handleCreateBadge = () => {
        setBadgeFormData({ title: '', description: '', icon: '🏆', color: '#6366f1' });
        setBadgeImageFile(null);
        setIsCreatingBadge(true);
        setEditingBadge(null);
    };

    const handleEditBadge = (badge: Badge) => {
        setBadgeFormData({
            title: badge.title,
            description: badge.description || '',
            icon: badge.icon || '🏆',
            color: badge.color || '#6366f1'
        });
        setBadgeImageFile(null);
        setEditingBadge(badge);
        setIsCreatingBadge(false);
    };

    const handleBadgeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setBadgeImageFile(e.target.files[0]);
        }
    };

    const handleBadgeSave = async () => {
        if (!badgeFormData.title.trim()) {
            alert('Badge title is required');
            return;
        }

        setIsBadgeUploading(true);
        try {
            let imageUrl = editingBadge?.imageUrl;

            if (badgeImageFile) {
                const fileExt = badgeImageFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('badges')
                    .upload(filePath, badgeImageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('badges')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            if (editingBadge) {
                await updateBadge(editingBadge.id, {
                    title: badgeFormData.title,
                    description: badgeFormData.description,
                    icon: badgeFormData.icon,
                    color: badgeFormData.color,
                    imageUrl: imageUrl
                });
            } else {
                const newBadge: Badge = {
                    id: crypto.randomUUID(),
                    title: badgeFormData.title,
                    description: badgeFormData.description,
                    icon: badgeFormData.icon,
                    color: badgeFormData.color,
                    imageUrl: imageUrl,
                    createdBy: user?.id || '',
                    createdAt: new Date().toISOString()
                };
                await addBadge(newBadge);
            }
            setIsCreatingBadge(false);
            setEditingBadge(null);
            setBadgeImageFile(null);
        } catch (error) {
            console.error('Error saving badge:', error);
            alert('Failed to save badge');
        } finally {
            setIsBadgeUploading(false);
        }
    };

    const handleDeleteBadge = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete the badge "${title}"? This will remove it from all students who have earned it.`)) {
            try {
                await deleteBadge(id);
            } catch (error) {
                console.error('Error deleting badge:', error);
                alert('Failed to delete badge');
            }
        }
    };

    return (
        <PageTransition>
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '2.5rem',
                        background: 'linear-gradient(45deg, var(--text-primary), var(--text-secondary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 800
                    }}>
                        Achievements & Badges Hub
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>
                        Manage student rewards, recognition, and visual honors.
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    padding: '4px',
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    width: 'fit-content'
                }}>
                    {(['Achievements', 'Badges'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
                                color: activeTab === tab ? 'var(--color-brand-blue)' : 'var(--text-secondary)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'Achievements' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Achievements</h2>
                            <Button onClick={() => handleOpenAchievementModal()}>
                                <Plus size={20} style={{ marginRight: '8px' }} />
                                New Achievement
                            </Button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {achievements.map(achievement => {
                                const IconComp = achievementIconOptions.find(opt => opt.name === achievement.icon)?.icon || Award;
                                return (
                                    <Card key={achievement.id} elevated style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleOpenAchievementModal(achievement)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this achievement?')) {
                                                        deleteAchievement(achievement.id);
                                                    }
                                                }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{
                                                padding: '12px',
                                                background: 'var(--bg-subtle)',
                                                borderRadius: '50%',
                                                color: 'var(--color-primary)'
                                            }}>
                                                <IconComp size={32} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{achievement.title}</h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                                                    {achievement.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '0.95rem', marginBottom: '1.5rem', minHeight: '60px', color: 'var(--text-secondary)' }}>
                                            <RichTextViewer content={achievement.description} />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--color-brand-gold)' }}>{achievement.xpValue} XP</span>
                                            <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{achievement.criteria}</span>
                                        </div>

                                        <div style={{ marginTop: '1rem' }}>
                                            <BadgeAttachment
                                                entityType="achievement"
                                                entityId={achievement.id}
                                                entityName={achievement.title}
                                            />
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        <Modal
                            isOpen={isAchievementModalOpen}
                            onClose={() => setIsAchievementModalOpen(false)}
                            title={editingAchievementId ? "Edit Achievement" : "Create Achievement"}
                        >
                            <form onSubmit={handleAchievementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Title</label>
                                    <input
                                        type="text"
                                        value={achievementFormData.title}
                                        onChange={e => setAchievementFormData({ ...achievementFormData, title: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                                    <textarea
                                        value={achievementFormData.description}
                                        onChange={e => setAchievementFormData({ ...achievementFormData, description: e.target.value })}
                                        required
                                        rows={3}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
                                        <select
                                            value={achievementFormData.category}
                                            onChange={e => setAchievementFormData({ ...achievementFormData, category: e.target.value as AchievementCategory })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>XP Value</label>
                                        <input
                                            type="number"
                                            value={achievementFormData.xpValue}
                                            onChange={e => setAchievementFormData({ ...achievementFormData, xpValue: parseInt(e.target.value) || 0 })}
                                            min="0"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Criteria</label>
                                    <input
                                        type="text"
                                        value={achievementFormData.criteria}
                                        onChange={e => setAchievementFormData({ ...achievementFormData, criteria: e.target.value })}
                                        placeholder="How to earn this..."
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Icon</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {achievementIconOptions.map(opt => (
                                            <div
                                                key={opt.name}
                                                onClick={() => setAchievementFormData({ ...achievementFormData, icon: opt.name })}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    background: achievementFormData.icon === opt.name ? 'var(--color-primary)' : 'var(--bg-subtle)',
                                                    color: achievementFormData.icon === opt.name ? 'white' : 'var(--text-primary)',
                                                    border: achievementFormData.icon === opt.name ? '2px solid var(--color-primary)' : '1px solid transparent',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <opt.icon size={24} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline" onClick={() => setIsAchievementModalOpen(false)} type="button">Cancel</Button>
                                    <Button type="submit">{editingAchievementId ? 'Update' : 'Create'}</Button>
                                </div>
                            </form>
                        </Modal>
                    </div>
                )}

                {activeTab === 'Badges' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Badges</h2>
                            <Button onClick={handleCreateBadge}>
                                <Plus size={20} style={{ marginRight: '8px' }} />
                                New Badge
                            </Button>
                        </div>

                        {isBadgesLoading ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <p>Loading badges...</p>
                            </div>
                        ) : (
                            <>
                                {(isCreatingBadge || editingBadge) && (
                                    <Card elevated style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                                                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
                                            </h3>
                                            <Button size="sm" variant="ghost" onClick={() => { setIsCreatingBadge(false); setEditingBadge(null); }}>
                                                <X size={18} />
                                            </Button>
                                        </div>

                                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Title *</label>
                                                <input
                                                    type="text"
                                                    value={badgeFormData.title}
                                                    onChange={(e) => setBadgeFormData({ ...badgeFormData, title: e.target.value })}
                                                    placeholder="e.g., Perfect Attendance, Top Performer"
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                                                <RichTextEditor
                                                    value={badgeFormData.description}
                                                    onChange={(value) => setBadgeFormData({ ...badgeFormData, description: value })}
                                                    height="150px"
                                                    placeholder="Describe how students can earn this badge..."
                                                />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Badge Image (Optional)</label>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <input type="file" accept="image/*" onChange={handleBadgeImageSelect} />
                                                        {(badgeImageFile || editingBadge?.imageUrl) && (
                                                            <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                                <img
                                                                    src={badgeImageFile ? URL.createObjectURL(badgeImageFile) : editingBadge?.imageUrl}
                                                                    alt="Preview"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Color</label>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {commonColors.map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => setBadgeFormData({ ...badgeFormData, color })}
                                                                style={{ width: '32px', height: '32px', border: badgeFormData.color === color ? '3px solid var(--text-primary)' : '1px solid var(--border-color)', borderRadius: '6px', background: color, cursor: 'pointer' }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Icon (Fallback)</label>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {commonEmojis.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => setBadgeFormData({ ...badgeFormData, icon: emoji })}
                                                            style={{ padding: '0.5rem', fontSize: '1.25rem', border: badgeFormData.icon === emoji ? '2px solid var(--color-brand-blue)' : '1px solid var(--border-color)', borderRadius: '8px', background: badgeFormData.icon === emoji ? 'var(--bg-subtle)' : 'var(--bg-surface)', cursor: 'pointer' }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                                <Button variant="outline" onClick={() => { setIsCreatingBadge(false); setEditingBadge(null); }}>Cancel</Button>
                                                <Button onClick={handleBadgeSave} disabled={isBadgeUploading}>
                                                    <Save size={18} style={{ marginRight: '8px' }} />
                                                    {isBadgeUploading ? 'Saving...' : (editingBadge ? 'Update Badge' : 'Create Badge')}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {badges.map(badge => (
                                        <Card key={badge.id} hover elevated style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ background: badge.color, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
                                                {badge.imageUrl ? (
                                                    <img src={badge.imageUrl} alt={badge.title} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '3px solid rgba(255,255,255,0.3)' }} />
                                                ) : (
                                                    <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{badge.icon}</div>
                                                )}
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{badge.title}</h3>
                                            </div>
                                            <div style={{ padding: '1.5rem' }}>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '40px' }}>
                                                    <RichTextViewer content={badge.description || ''} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button variant="outline" size="sm" onClick={() => handleEditBadge(badge)} style={{ flex: 1 }}>
                                                        <Edit3 size={14} style={{ marginRight: '6px' }} />
                                                        Edit
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteBadge(badge.id, badge.title)} style={{ color: 'var(--color-error)' }}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {badges.length === 0 && !isCreatingBadge && (
                                    <Card style={{ padding: '4rem', textAlign: 'center' }}>
                                        <Award size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                        <h3 style={{ color: 'var(--text-secondary)' }}>No badges created yet</h3>
                                        <Button onClick={handleCreateBadge} variant="outline" style={{ marginTop: '1rem' }}>Create Your First Badge</Button>
                                    </Card>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default AchievementsAndBadges;
