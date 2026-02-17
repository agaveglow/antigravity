import React from 'react';
import { useBadges } from '../context/BadgeContext';
import { Award, Plus, X } from 'lucide-react';
import Button from './common/Button';

interface BadgeAttachmentProps {
    entityType: 'achievement' | 'task' | 'project' | 'module' | 'stage' | 'course';
    entityId: string;
    entityName?: string;
}

const BadgeAttachment: React.FC<BadgeAttachmentProps> = ({ entityType, entityId, entityName }) => {
    const { badges, getBadgesForEntity, attachBadge, detachBadge, badgeAttachments } = useBadges();
    const [isAttaching, setIsAttaching] = React.useState(false);
    const [selectedBadgeId, setSelectedBadgeId] = React.useState('');

    const attachedBadges = getBadgesForEntity(entityType, entityId);
    const availableBadges = badges.filter(
        badge => !attachedBadges.some(ab => ab.id === badge.id)
    );

    const handleAttach = async () => {
        if (!selectedBadgeId) return;

        try {
            await attachBadge(selectedBadgeId, entityType, entityId);
            setSelectedBadgeId('');
            setIsAttaching(false);
        } catch (error) {
            console.error('Error attaching badge:', error);
            alert('Failed to attach badge');
        }
    };

    const handleDetach = async (badgeId: string) => {
        const attachment = badgeAttachments.find(
            a => a.badgeId === badgeId && a.entityType === entityType && a.entityId === entityId
        );

        if (!attachment) return;

        if (confirm('Remove this badge? Students who earned it will keep it, but new completions won\'t award it.')) {
            try {
                await detachBadge(attachment.id);
            } catch (error) {
                console.error('Error detaching badge:', error);
                alert('Failed to remove badge');
            }
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Award size={18} style={{ color: 'var(--text-secondary)' }} />
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Badges</h4>
                {!isAttaching && availableBadges.length > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAttaching(true)}
                        style={{ marginLeft: 'auto', padding: '4px 8px' }}
                    >
                        <Plus size={14} style={{ marginRight: '4px' }} />
                        Attach Badge
                    </Button>
                )}
            </div>

            {/* Attached Badges */}
            {attachedBadges.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {attachedBadges.map(badge => (
                        <div
                            key={badge.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: badge.color || 'var(--bg-subtle)',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: 600
                            }}
                        >
                            {badge.imageUrl ? (
                                <img
                                    src={badge.imageUrl}
                                    alt={badge.title}
                                    style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                            ) : (
                                <span>{badge.icon}</span>
                            )}
                            <span>{badge.title}</span>
                            <button
                                onClick={() => handleDetach(badge.id)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: 'white'
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Attach Badge Form */}
            {isAttaching && (
                <div style={{
                    padding: '0.75rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    marginBottom: '0.75rem'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                            value={selectedBadgeId}
                            onChange={(e) => setSelectedBadgeId(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem'
                            }}
                        >
                            <option value="">Select a badge...</option>
                            {availableBadges.map(badge => (
                                <option key={badge.id} value={badge.id}>
                                    {badge.imageUrl ? '🖼️' : badge.icon} {badge.title}
                                </option>
                            ))}
                        </select>
                        <Button size="sm" variant="primary" onClick={handleAttach} disabled={!selectedBadgeId}>
                            Attach
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                            setIsAttaching(false);
                            setSelectedBadgeId('');
                        }}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {attachedBadges.length === 0 && !isAttaching && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                    No badges attached. Students won't earn badges for completing this.
                </p>
            )}

            {availableBadges.length === 0 && !isAttaching && attachedBadges.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                    Create badges first to attach them here.
                </p>
            )}
        </div>
    );
};

export default BadgeAttachment;
