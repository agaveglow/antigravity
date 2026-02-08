import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ShoppingBag, CheckCircle, Smartphone, Palette, ShieldCheck, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';

const DowdBucksStore: React.FC = () => {
    const { user, spendDowdBucks } = useUser();
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const items = [
        { id: 'dark-mode-pro', name: 'Dark Mode Pro', price: 200, description: 'Exclusive high-contrast theme variant', icon: <Smartphone size={32} color="#00A8C6" />, color: '#00A8C6' },
        { id: 'gold-border', name: 'Gold Avatar Border', price: 500, description: 'Shine in the leaderboards', icon: <ShieldCheck size={32} color="gold" />, color: 'gold' },
        { id: 'custom-accent', name: 'Custom Accent Pack', price: 300, description: 'Change UI accent to your choice', icon: <Palette size={32} color="#C860F5" />, color: '#C860F5' },
        { id: 'badge-flare', name: 'Badge Flare', price: 150, description: 'Add sparkle to your status badges', icon: <Sparkles size={32} color="#FF9F0A" />, color: '#FF9F0A' },
    ];

    const handleBuy = (itemId: string, price: number) => {
        setPurchasing(itemId);
        // Add a slight delay for flair
        setTimeout(() => {
            const success = spendDowdBucks(price, itemId);
            if (!success) {
                alert('Insufficient DowdBucks!');
            }
            setPurchasing(null);
        }, 800);
    };

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0 }}>DowdBucks Store</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Spend your hard-earned rewards on exclusive flair</p>
                </div>
                <Card elevated style={{ padding: 'var(--space-3) var(--space-6)', display: 'flex', alignItems: 'center', gap: '12px', border: '2px solid var(--color-brand-gold)' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-brand-gold)' }}>Ⓓ</span>
                    <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>{user?.balance || 0}</span>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
                {items.map(item => {
                    const isOwned = user?.inventory.includes(item.id);
                    const canAfford = (user?.balance || 0) >= item.price;

                    return (
                        <Card key={item.id} elevated style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', opacity: isOwned ? 0.8 : 1 }}>
                            <div style={{
                                height: '140px', background: `${item.color}10`, borderRadius: '12px',
                                marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', border: `1px solid ${item.color}30`
                            }}>
                                {item.icon}
                            </div>
                            <h3 style={{ margin: '0 0 8px' }}>{item.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, marginBottom: 'var(--space-6)' }}>
                                {item.description}
                            </p>

                            {isOwned ? (
                                <Button variant="outline" disabled style={{ width: '100%', borderColor: 'transparent', color: 'var(--color-success)' }}>
                                    <CheckCircle size={18} style={{ marginRight: '8px' }} /> Owned
                                </Button>
                            ) : (
                                <Button
                                    variant={canAfford ? 'primary' : 'outline'}
                                    style={{ width: '100%' }}
                                    onClick={() => handleBuy(item.id, item.price)}
                                    disabled={!canAfford || purchasing === item.id}
                                >
                                    {purchasing === item.id ? 'Processing...' : `Buy (Ⓓ${item.price})`}
                                </Button>
                            )}
                        </Card>
                    );
                })}

                <Card elevated style={{ background: 'rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)' }}>
                    <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
                        <ShoppingBag size={48} />
                    </div>
                    <h3 style={{ color: 'var(--text-secondary)' }}>More coming soon</h3>
                </Card>
            </div>
        </div>
    );
};

export default DowdBucksStore;
