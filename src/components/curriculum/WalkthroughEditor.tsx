import React, { useState } from 'react';
import type { Walkthrough, WalkthroughStep } from '../../types/ual';
import Button from '../common/Button';
import { Plus, Trash2, MoveUp, MoveDown, Image as ImageIcon, Video, Save, Upload } from 'lucide-react';

interface WalkthroughEditorProps {
    initialData?: Partial<Walkthrough>;
    onSave: (walkthrough: Walkthrough) => void;
    onCancel: () => void;
    courseId?: string;
}

const WalkthroughEditor: React.FC<WalkthroughEditorProps> = ({ initialData, onSave, onCancel, courseId }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [xpReward, setXpReward] = useState(initialData?.xpReward || 50);
    const [steps, setSteps] = useState<WalkthroughStep[]>(initialData?.steps || []);

    const handleAddStep = () => {
        const newStep: WalkthroughStep = {
            id: Math.random().toString(36).substr(2, 9),
            title: `Step ${steps.length + 1}`,
            content: '',
        };
        setSteps([...steps, newStep]);
    };

    const handleUpdateStep = (id: string, updates: Partial<WalkthroughStep>) => {
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleDeleteStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const handleMoveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            const newSteps = [...steps];
            [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
            setSteps(newSteps);
        } else if (direction === 'down' && index < steps.length - 1) {
            const newSteps = [...steps];
            [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
            setSteps(newSteps);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const walkthrough: Walkthrough = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            courseId: initialData?.courseId || courseId || '',
            title,
            description,
            steps,
            order: initialData?.order || 0,
            type: 'walkthrough',
            xpReward,
            createdAt: initialData?.createdAt || new Date().toISOString()
        };
        onSave(walkthrough);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>XP Reward</label>
                    <input
                        type="number"
                        value={xpReward}
                        onChange={e => setXpReward(parseInt(e.target.value) || 0)}
                        min="0"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                </div>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    rows={2}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 500 }}>Steps ({steps.length})</label>
                    <Button type="button" onClick={handleAddStep} variant="secondary" size="sm">
                        <Plus size={16} style={{ marginRight: '4px' }} />
                        Add Step
                    </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {steps.map((step, index) => (
                        <div key={step.id} style={{
                            padding: '1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-subtle)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        {index + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={step.title}
                                        onChange={e => handleUpdateStep(step.id, { title: e.target.value })}
                                        placeholder="Step Title"
                                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, padding: '4px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" onClick={() => handleMoveStep(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}>
                                        <MoveUp size={16} />
                                    </button>
                                    <button type="button" onClick={() => handleMoveStep(index, 'down')} disabled={index === steps.length - 1} style={{ background: 'none', border: 'none', cursor: index === steps.length - 1 ? 'default' : 'pointer', opacity: index === steps.length - 1 ? 0.3 : 1 }}>
                                        <MoveDown size={16} />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteStep(step.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <textarea
                                value={step.content}
                                onChange={e => handleUpdateStep(step.id, { content: e.target.value })}
                                placeholder="Step instructions (Markdown supported)..."
                                rows={3}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)', color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'monospace'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                        {step.mediaType === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Media URL</label>
                                    </div>
                                    <input
                                        type="url"
                                        value={step.mediaUrl || ''}
                                        onChange={e => handleUpdateStep(step.id, { mediaUrl: e.target.value })}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type</label>
                                    <select
                                        value={step.mediaType || 'image'}
                                        onChange={e => handleUpdateStep(step.id, { mediaType: e.target.value as 'image' | 'video' })}
                                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                    >
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                            </div>

                            {/* File Upload Section */}
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>or upload a file:</div>
                                <label style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'var(--bg-surface)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.85rem'
                                }}>
                                    <Upload size={14} style={{ marginRight: '4px' }} />
                                    <span>Upload {step.mediaType === 'video' ? 'Video' : 'Image'}</span>
                                    <input
                                        type="file"
                                        accept={step.mediaType === 'video' ? "video/*" : "image/*"}
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            // Size check (e.g. 5MB)
                                            if (file.size > 5 * 1024 * 1024) {
                                                alert("File is too large. Please use files under 5MB or use an external URL.");
                                                return;
                                            }

                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                handleUpdateStep(step.id, { mediaUrl: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                </label>
                                {step.mediaType === 'video' && <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>* Large videos may crash the app. Use external links for best results.</span>}
                            </div>

                            {step.mediaUrl && (
                                <div style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', background: '#000', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
                                    {step.mediaType === 'video' ? (
                                        <video src={step.mediaUrl} controls style={{ maxHeight: '200px', maxWidth: '100%' }} />
                                    ) : (
                                        <img src={step.mediaUrl} alt="Preview" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {steps.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontStyle: 'italic', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                        No steps yet. Click "Add Step" to begin.
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit">
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Save Walkthrough
                </Button>
            </div>
        </form>
    );
};

export default WalkthroughEditor;
