import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Heart, Phone, LifeBuoy } from 'lucide-react';

const Support: React.FC = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                <Heart size={48} color="var(--color-error)" style={{ marginBottom: 'var(--space-4)' }} />
                <h1>Safeguarding & Support</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                    Your safety and wellbeing are our top priority.
                </p>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <Card elevated style={{ borderColor: 'var(--color-error)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div style={{ background: 'var(--color-error)', color: 'white', padding: '12px', borderRadius: '50%' }}>
                            <Phone size={24} />
                        </div>
                        <div>
                            <h3>Emergency Contact</h3>
                            <p>If you are in immediate danger, call <strong>999</strong>.</p>
                            <p>For college safeguarding team: <strong>020 1234 5678</strong></p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div style={{ background: 'var(--color-info)', color: 'white', padding: '12px', borderRadius: '50%' }}>
                            <LifeBuoy size={24} />
                        </div>
                        <div>
                            <h3>Student Services</h3>
                            <p>For financial support, counseling, and academic help.</p>
                            <Button variant="outline" size="sm" style={{ marginTop: 'var(--space-2)' }}>Request Appointment</Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ marginTop: 'var(--space-8)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                <p>ERC Learn: Music - UAL Approved Center</p>
            </div>
        </div>
    );
};

export default Support;
