import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Clock, AlertCircle, Search, Filter, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useSubmissions } from '../context/SubmissionContext';
import PageTransition from '../components/common/PageTransition';

const AssessmentHub: React.FC = () => {
    const navigate = useNavigate();
    const { submissions } = useSubmissions();
    const [filter, setFilter] = useState<'All' | 'Pending Mark' | 'Late' | 'Graded'>('All');

    // Combine real submissions with some mock ones for robustness
    const allSubmissions = [
        ...submissions,
        { id: 'm1', studentName: 'Alice Walker', taskTitle: 'Task 1.1: Performance', submittedAt: new Date().toISOString(), status: 'Pending Mark', studentLevel: 'Level 3' },
        { id: 'm2', studentName: 'Bob Smith', taskTitle: 'Task 1.1: Performance', submittedAt: new Date().toISOString(), status: 'Pending Mark', studentLevel: 'Level 3' },
    ];

    const displaySubmissions = filter === 'All'
        ? allSubmissions
        : allSubmissions.filter(s => s.status === filter);

    const stats = [
        { label: 'Pending', value: 12, color: 'var(--color-info)' },
        { label: 'Late', value: 3, color: 'var(--color-warning)' },
        { label: 'Completed Today', value: 24, color: 'var(--color-success)' },
    ];

    return (
        <PageTransition>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Assessment Hub</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage and grade student submissions</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        {stats.map(stat => (
                            <Card key={stat.label} style={{ padding: 'var(--space-2) var(--space-6)', minWidth: '140px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card elevated style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-2) var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)', paddingRight: 'var(--space-6)' }}>
                            <Filter size={18} />
                            <span style={{ fontWeight: 600 }}>Filter:</span>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            {['All', 'Pending Mark', 'Late', 'Graded'].map(f => (
                                <Button
                                    key={f}
                                    size="sm"
                                    variant={filter === f ? 'primary' : 'ghost'}
                                    onClick={() => setFilter(f as any)}
                                >
                                    {f}
                                </Button>
                            ))}
                        </div>
                        <div style={{ flex: 1 }}></div>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search students or tasks..."
                                style={{
                                    width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-input)'
                                }}
                            />
                        </div>
                    </div>
                </Card>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
                    {displaySubmissions.map(sub => (
                        <Card key={sub.id} elevated style={{
                            borderLeft: `4px solid ${sub.status === 'Late' ? 'var(--color-warning)' :
                                sub.status === 'Graded' ? 'var(--color-success)' : 'var(--color-info)'
                                }`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: 'var(--bg-input)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {sub.studentName?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{sub.studentName}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.studentLevel}</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" style={{ padding: 0 }}><MoreHorizontal size={20} /></Button>
                            </div>

                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>{(sub as any).taskTitle || (sub as any).task}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {sub.status === 'Late' ? <AlertCircle size={14} color="var(--color-warning)" /> : <Clock size={14} />}
                                    {new Date(sub.submittedAt || '').toLocaleString()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <Button
                                    size="sm"
                                    variant={sub.status === 'Graded' ? 'outline' : 'primary'}
                                    style={{ flex: 1 }}
                                    onClick={() => navigate(`/teacher/assessment/${sub.id}`)}
                                >
                                    {sub.status === 'Graded' ? 'View Grade' : 'Grade Submission'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {displaySubmissions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
                        <CheckCircle2 size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                        <p>No submissions found for the selected filter.</p>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default AssessmentHub;
