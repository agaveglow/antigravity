import React, { useState } from 'react';
import { useAchievements } from '../context/AchievementsContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit2, Trash2, Award, Zap, Brain, Users, Sun, Footprints, Trophy, Star, Music, Sliders } from 'lucide-react';
import type { Achievement, AchievementCategory } from '../types/achievements';

const iconOptions = [
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

const TeacherAchievements: React.FC = () => {
    const { achievements, addAchievement, updateAchievement, deleteAchievement } = useAchievements();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Achievement>>({
        title: '',
        description: '',
        category: 'Academic',
        xpValue: 0,
        icon: 'Award',
        criteria: ''
    });

    const categories: AchievementCategory[] = ['Academic', 'Participation', 'Creativity', 'Other'];

    const handleOpenModal = (achievement?: Achievement) => {
        if (achievement) {
            setEditingId(achievement.id);
            setFormData(achievement);
        } else {
            setEditingId(null);
            setFormData({
                title: '',
                description: '',
                category: 'Academic',
                xpValue: 0,
                icon: 'Award',
                criteria: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateAchievement(editingId, formData);
        } else {
            addAchievement(formData as Omit<Achievement, 'id'>);
        }
        setIsModalOpen(false);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Manage Achievements</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create and edit student achievements.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={20} style={{ marginRight: '8px' }} />
                    New Achievement
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {achievements.map(achievement => {
                    const IconComp = iconOptions.find(opt => opt.name === achievement.icon)?.icon || Award;
                    return (
                        <Card key={achievement.id} elevated style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleOpenModal(achievement)}
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
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{achievement.title}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {achievement.category}
                                    </span>
                                </div>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                {achievement.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-brand-gold)' }}>{achievement.xpValue} XP</span>
                                <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{achievement.criteria}</span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Achievement" : "Create Achievement"}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as AchievementCategory })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>XP Value</label>
                            <input
                                type="number"
                                value={formData.xpValue}
                                onChange={e => setFormData({ ...formData, xpValue: parseInt(e.target.value) || 0 })}
                                min="0"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Criteria</label>
                        <input
                            type="text"
                            value={formData.criteria}
                            onChange={e => setFormData({ ...formData, criteria: e.target.value })}
                            placeholder="How to earn this..."
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Icon</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {iconOptions.map(opt => (
                                <div
                                    key={opt.name}
                                    onClick={() => setFormData({ ...formData, icon: opt.name })}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: formData.icon === opt.name ? 'var(--color-primary)' : 'var(--bg-subtle)',
                                        color: formData.icon === opt.name ? 'white' : 'var(--text-primary)',
                                        border: formData.icon === opt.name ? '2px solid var(--color-primary)' : '1px solid transparent'
                                    }}
                                >
                                    <opt.icon size={24} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
                        <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TeacherAchievements;
