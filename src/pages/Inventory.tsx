import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Package, Sparkles, ShieldCheck, Palette, Smartphone, Check } from 'lucide-react';

const Inventory: React.FC = () => {
    const { user } = useUser();
    const [equippedItems, setEquippedItems] = useState<string[]>([]);
    const [activeBoosts, setActiveBoosts] = useState<string[]>([]);

    // Same items as in DowdBucksStore - MUST match exactly
    const allItems = [
        { id: 'dark-mode-pro', name: 'Dark Mode Pro', price: 200, description: 'Exclusive high-contrast theme variant', icon: <Smartphone size={32} color="#00A8C6" />, color: '#00A8C6' },
        { id: 'gold-border', name: 'Gold Avatar Border', price: 500, description: 'Shine in the leaderboards', icon: <ShieldCheck size={32} color="gold" />, color: 'gold' },
        { id: 'custom-accent', name: 'Custom Accent Pack', price: 300, description: 'Change UI accent to your choice', icon: <Palette size={32} color="#C860F5" />, color: '#C860F5' },
        { id: 'badge-flare', name: 'Badge Flare', price: 150, description: 'Add sparkle to your status badges', icon: <Sparkles size={32} color="#FF9F0A" />, color: '#FF9F0A' },
    ];

    const ownedItems = allItems.filter(item => user?.inventory.includes(item.id));

    const handleEquip = (itemId: string) => {
        if (equippedItems.includes(itemId)) {
            setEquippedItems(prev => prev.filter(id => id !== itemId));
        } else {
            setEquippedItems(prev => [...prev, itemId]);
        }
    };

    const handleActivate = (itemId: string) => {
        if (!activeBoosts.includes(itemId)) {
            setActiveBoosts(prev => [...prev, itemId]);
            // Show activation message
            alert('Boost activated! You now have 2x XP for 7 days!');
        }
    };

    const getItemAction = (itemId: string) => {
        // Dark Mode Pro and Custom Accent can be equipped
        if (itemId === 'dark-mode-pro' || itemId === 'custom-accent') {
            return {
                label: equippedItems.includes(itemId) ? 'Unequip' : 'Equip',
                action: () => handleEquip(itemId),
                variant: equippedItems.includes(itemId) ? 'outline' : 'primary'
            };
        }
        // Badge Flare and Gold Border are always active once owned
        if (itemId === 'badge-flare' || itemId === 'gold-border') {
            return {
                label: 'Active',
                action: () => { },
                variant: 'outline',
                disabled: true
            };
        }
        return null;
    };

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Package size={32} className="text-primary" />
                    <h1 style={{ margin: 0 }}>My Inventory</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Your purchased items and rewards
                </p>
            </div>

            {ownedItems.length === 0 ? (
                <Card elevated style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Package size={64} style={{ margin: '0 auto var(--space-6)', opacity: 0.3 }} />
                    <h3 style={{ marginBottom: 'var(--space-3)' }}>No items yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        Visit the DowdBucks Store to purchase exclusive items!
                    </p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
                    {ownedItems.map(item => (
                        <Card key={item.id} elevated style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto var(--space-4)',
                                background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.1), rgba(255, 159, 10, 0.05))',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid var(--primary-color)'
                            }}>
                                {item.icon}
                            </div>
                            <h3 style={{ margin: '0 0 8px' }}>{item.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, marginBottom: 'var(--space-4)' }}>
                                {item.description}
                            </p>
                            {(() => {
                                const action = getItemAction(item.id);
                                if (action) {
                                    return (
                                        <Button
                                            variant={action.variant as any}
                                            onClick={action.action}
                                            disabled={action.disabled}
                                            style={{ width: '100%' }}
                                        >
                                            {equippedItems.includes(item.id) && <Check size={16} style={{ marginRight: '0.5rem' }} />}
                                            {action.label}
                                        </Button>
                                    );
                                }
                                return (
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(52, 199, 89, 0.15)',
                                        borderRadius: '8px',
                                        color: '#34C759',
                                        fontSize: '0.85rem',
                                        fontWeight: 600
                                    }}>
                                        Active
                                    </div>
                                );
                            })()}
                        </Card>
                    ))}
                </div>
            )}

            <Card elevated style={{ marginTop: 'var(--space-8)', background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.1), rgba(255, 159, 10, 0.05))', border: '1px solid var(--primary-color)' }}>
                <h3 style={{ marginBottom: 'var(--space-3)' }}>Collection Stats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                            {ownedItems.length}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Items Owned</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                            {Math.round((ownedItems.length / allItems.length) * 100)}%
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Collection Complete</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                            Ⓓ{user?.balance || 0}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Balance</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Inventory;
