import React, { useState } from 'react';
import { useBadges } from '../context/BadgeContext';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import PageTransition from '../components/common/PageTransition';
import { Plus, Edit3, Trash2, X, Save, Award } from 'lucide-react';
import type { Badge } from '../types/badges';
import RichTextEditor from '../components/common/RichTextEditor';
import RichTextViewer from '../components/common/RichTextViewer';
import { supabase } from '../lib/supabase';

const BadgeManagement: React.FC = () => {
    const { badges, addBadge, updateBadge, deleteBadge, isLoading } = useBadges();
    const { user } = useUser();
    const [isCreating, setIsCreating] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: '🏆',
        color: '#6366f1'
    });

    const handleCreate = () => {
        setFormData({ title: '', description: '', icon: '🏆', color: '#6366f1' });
        setImageFile(null);
        setIsCreating(true);
        setEditingBadge(null);
    };

    const handleEdit = (badge: Badge) => {
        setFormData({
            title: badge.title,
            description: badge.description || '',
            icon: badge.icon || '🏆',
            color: badge.color || '#6366f1'
        });
        setImageFile(null);
        setEditingBadge(badge);
        setIsCreating(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            alert('Badge title is required');
            return;
        }

        setUploading(true);
        try {
            let imageUrl = editingBadge?.imageUrl;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('badges')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('badges')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            if (editingBadge) {
                await updateBadge(editingBadge.id, {
                    title: formData.title,
                    description: formData.description,
                    icon: formData.icon,
                    color: formData.color,
                    imageUrl: imageUrl
                });
            } else {
                const newBadge: Badge = {
                    id: crypto.randomUUID(),
                    title: formData.title,
                    description: formData.description,
                    icon: formData.icon,
                    color: formData.color,
                    imageUrl: imageUrl,
                    createdBy: user?.id || '',
                    createdAt: new Date().toISOString()
                };
                await addBadge(newBadge);
            }
            setIsCreating(false);
            setEditingBadge(null);
            setImageFile(null);
        } catch (error) {
            console.error('Error saving badge:', error);
            alert('Failed to save badge');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete the badge "${title}"? This will remove it from all students who have earned it.`)) {
            try {
                await deleteBadge(id);
            } catch (error) {
                console.error('Error deleting badge:', error);
                alert('Failed to delete badge');
            }
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingBadge(null);
        setImageFile(null);
    };

    const commonEmojis = ['🏆', '⭐', '🎖️', '🥇', '🥈', '🥉', '👑', '💎', '🔥', '⚡', '🎯', '🎨', '🎵', '🎭', '📚', '💪', '🚀', '✨'];
    const commonColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

    if (isLoading) {
        return (
            <PageTransition>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading badges...</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Badge Management</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
                            Create and manage badges that students can earn
                        </p>
                    </div>
                    <Button onClick={handleCreate} variant="primary">
                        <Plus size={20} style={{ marginRight: '8px' }} />
                        Create Badge
                    </Button>
                </div>

                {/* Badge Form */}
                {(isCreating || editingBadge) && (
                    <Card elevated style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
                            </h2>
                            <Button size="sm" variant="ghost" onClick={handleCancel}>
                                <X size={18} />
                            </Button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Title */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Perfect Attendance, Top Performer"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Description
                                </label>
                                <RichTextEditor
                                    value={formData.description}
                                    onChange={(value) => setFormData({ ...formData, description: value })}
                                    height="150px"
                                    placeholder="Describe how students can earn this badge..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Badge Image (Optional)
                                </label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                    {(imageFile || editingBadge?.imageUrl) && (
                                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : editingBadge?.imageUrl}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                    If uploaded, this image will replace the icon.
                                </p>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Icon (Fallback)
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {commonEmojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setFormData({ ...formData, icon: emoji })}
                                            style={{
                                                padding: '0.5rem',
                                                fontSize: '1.5rem',
                                                border: formData.icon === emoji ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: formData.icon === emoji ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Color
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {commonColors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setFormData({ ...formData, color })}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                border: formData.color === color ? '3px solid var(--text-primary)' : '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: color,
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Preview
                                </label>
                                <div style={{
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: formData.color,
                                    color: 'white',
                                    minWidth: '120px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {imageFile || editingBadge?.imageUrl ? (
                                        <img
                                            src={imageFile ? URL.createObjectURL(imageFile) : editingBadge?.imageUrl}
                                            alt="Badge"
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{formData.icon}</div>
                                    )}
                                    <div style={{ fontWeight: 600, textAlign: 'center', zIndex: 1 }}>{formData.title || 'Badge Title'}</div>
                                    {formData.description && (
                                        <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.25rem', textAlign: 'center' }}>
                                            <RichTextViewer content={formData.description} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <Button variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleSave} disabled={uploading}>
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    {uploading ? 'Uploading...' : (editingBadge ? 'Update Badge' : 'Create Badge')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Badge List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {badges.map(badge => (
                        <Card key={badge.id} hover elevated>
                            <div style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '100%',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    background: badge.color,
                                    color: 'white',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {badge.imageUrl ? (
                                        <img
                                            src={badge.imageUrl}
                                            alt={badge.title}
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)' }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{badge.icon}</div>
                                    )}
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', zIndex: 1 }}>{badge.title}</div>
                                    {badge.description && (
                                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem', zIndex: 1 }}>
                                            <RichTextViewer content={badge.description} />
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(badge)}
                                        style={{ flex: 1 }}
                                    >
                                        <Edit3 size={14} style={{ marginRight: '4px' }} />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(badge.id, badge.title)}
                                        style={{ color: 'var(--color-danger)' }}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {badges.length === 0 && !isCreating && (
                    <Card style={{ padding: '3rem', textAlign: 'center' }}>
                        <Award size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)' }}>No badges yet</h3>
                        <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
                            Create your first badge to get started
                        </p>
                    </Card>
                )}
            </div>
        </PageTransition>
    );
};

export default BadgeManagement;
