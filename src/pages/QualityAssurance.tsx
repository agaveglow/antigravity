import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ShieldCheck, FileText, CheckCircle, AlertTriangle, Users, ClipboardCheck, History, ExternalLink } from 'lucide-react';

const QualityAssurance: React.FC = () => {
    const complianceStats = [
        { label: 'Briefs IV-ed', value: '85%', color: 'var(--color-success)' },
        { label: 'Sampling Target', value: '12/15', color: 'var(--color-info)' },
        { label: 'Outstanding IVs', value: '3', color: 'var(--color-warning)' },
    ];

    const ivItems = [
        { id: '1', units: 'Unit 1 & 8', project: 'Ensemble Performance', status: 'Approved', auditor: 'J. Dowd', date: 'Oct 12' },
        { id: '2', units: 'Unit 2', project: 'Composition Portfolio', status: 'Pending', auditor: 'T. Smith', date: 'Oct 20' },
        { id: '3', units: 'Unit 4', project: 'Music Business', status: 'In Review', auditor: 'L. Green', date: 'Oct 25' },
    ];

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quality Assurance & IV</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>UAL Compliance tracking and Internal Verification workflow</p>
                </div>
                <Button variant="primary">
                    <ClipboardCheck size={18} style={{ marginRight: '8px' }} /> Start New IV
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                {complianceStats.map(stat => (
                    <Card key={stat.label} elevated style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{stat.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 'var(--space-8)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>IV Schedule & Status</h3>
                        <Button size="sm" variant="ghost">View All <History size={14} style={{ marginLeft: '4px' }} /></Button>
                    </div>

                    <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <tr>
                                    <th style={{ padding: '16px' }}>Units</th>
                                    <th style={{ padding: '16px' }}>Project Brief</th>
                                    <th style={{ padding: '16px' }}>Status</th>
                                    <th style={{ padding: '16px' }}>Lead IV</th>
                                    <th style={{ padding: '16px' }}>Deadline</th>
                                    <th style={{ padding: '16px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ivItems.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '16px', fontWeight: 700 }}>{item.units}</td>
                                        <td style={{ padding: '16px' }}>{item.project}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px',
                                                background: item.status === 'Approved' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 171, 0, 0.1)',
                                                color: item.status === 'Approved' ? 'var(--color-success)' : 'var(--color-warning)',
                                                fontWeight: 600
                                            }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.auditor}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-tertiary)' }}>{item.date}</td>
                                        <td style={{ padding: '16px' }}>
                                            <Button variant="ghost" size="sm" style={{ padding: '4px', minWidth: 'auto' }}><ExternalLink size={16} /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    <h3 style={{ marginTop: 'var(--space-4)' }}>Sampling Status (Internal Verification of Assessment)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                        <Card style={{ background: 'rgba(255, 255, 255, 0.05)', borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)' }}>
                            <Users size={32} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-2)' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select students for random sampling</p>
                            <Button size="sm" variant="outline">Generate Sample</Button>
                        </Card>
                        <Card elevated>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Standardisation Progress</div>
                            <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                <div style={{ width: '65%', height: '100%', background: 'var(--color-brand-cyan)' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span>LO 2.1 Complete</span>
                                <span style={{ fontWeight: 600 }}>65%</span>
                            </div>
                        </Card>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    <h3 style={{ margin: 0 }}>Upcoming Events</h3>
                    <Card elevated style={{ border: '1px solid var(--color-brand-gold)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Standardisation</div>
                        <h4 style={{ margin: '0 0 8px' }}>Term 1 Portfolio Review</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Nov 5th • Room 402</p>
                    </Card>
                    <Card elevated>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-info)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Team Briefing</div>
                        <h4 style={{ margin: '0 0 8px' }}>Final Project Prep</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Dec 12th • MS Teams</p>
                    </Card>

                    <Card style={{ marginTop: 'var(--space-8)', background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.2)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <AlertTriangle size={20} color="var(--color-warning)" />
                            <div>
                                <h4 style={{ margin: '0 0 4px', color: 'var(--color-warning)' }}>Audit Warning</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    2 assignments briefs are pending IV for more than 14 days.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QualityAssurance;
