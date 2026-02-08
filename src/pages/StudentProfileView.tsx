import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    User, Mail, Phone, Calendar, MapPin,
    BookOpen, Award, TrendingUp, AlertTriangle,
    MessageSquare, Clock, CheckCircle, XCircle, MoreHorizontal
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

// Mock Data (would ideally come from a context/API finding by ID)
const mockStudent = {
    id: '1',
    name: 'Alice Walker',
    email: 'alice.w@college.ac.uk',
    phone: '07700 900123',
    dob: '12/04/2006',
    address: '123 Music Lane, London',
    level: 'Level 3 Diploma',
    year: 'Year 1',
    avatar: 'A',
    status: 'Active',
    attendance: 92,
    punctuality: 95,
    xp: 2450,
    rank: 'Virtuoso',
    grades: [
        { unit: 'Unit 1', title: 'Music Performance', grade: 'Distinction' },
        { unit: 'Unit 2', title: 'Music Business', grade: 'Merit' },
        { unit: 'Unit 3', title: 'Listening Skills', grade: 'Pending' },
    ],
    notes: [
        { id: 1, date: '05/10/2025', author: 'Mr. Teacher', type: 'Positive', text: 'Excellent performance in the ensemble assessment.' },
        { id: 2, date: '20/09/2025', author: 'Mrs. Admin', type: 'Warning', text: 'Late to class twice this week.' },
    ]
};

const StudentProfileView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'notes'>('overview');

    // In a real app, fetch student by id here.
    // const student = getStudentById(id);
    const student = mockStudent; // Fallback for now

    if (!student) return <div>Student not found</div>;

    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                {/* Header Profile Card */}
                <Card elevated style={{ marginBottom: 'var(--space-8)', background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(50, 50, 194, 0.05) 100%)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Button variant="ghost" onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
                                ← Back to Students
                            </Button>
                            <Button variant="outline"><MoreHorizontal size={20} /> Actions</Button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'var(--color-brand-blue)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem', fontWeight: 700, boxShadow: 'var(--shadow-lg)'
                            }}>
                                {student.avatar}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <h1 style={{ margin: 0 }}>{student.name}</h1>
                                    <span style={{
                                        background: 'var(--color-success)', color: 'white',
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600
                                    }}>
                                        {student.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                                    {student.level} - {student.year}
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={16} /> {student.email}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IDBadge size={16} /> ID: {id}</span>
                                </div>
                            </div>

                            {/* Key Stats */}
                            <div style={{ display: 'flex', gap: 'var(--space-8)', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-blue)' }}>{student.attendance}%</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Attendance</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-purple)' }}>{student.xp}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>XP Earned</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-orange)' }}>{student.grades.filter(g => g.grade === 'Distinction').length}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distinctions</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
                    {['overview', 'progress', 'notes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            style={{
                                padding: '8px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab ? 600 : 400,
                                textTransform: 'capitalize',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
                        <Card elevated>
                            <h3>Personal Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Date of Birth</span>
                                    <span>{student.dob}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                                    <span>{student.phone}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Address</span>
                                    <span style={{ textAlign: 'right' }}>{student.address}</span>
                                </div>
                            </div>
                        </Card>

                        <Card elevated>
                            <h3>Recent Activity</h3>
                            <ul style={{ paddingLeft: '20px', marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                                <li style={{ marginBottom: '8px' }}>Submitted <strong>Unit 3 Task 1</strong> (Yesterday)</li>
                                <li style={{ marginBottom: '8px' }}>Earned <strong>"Crowd Pleaser"</strong> Badge (2 days ago)</li>
                                <li style={{ marginBottom: '8px' }}>Logged on from <strong>College Mac Suite</strong> (3 days ago)</li>
                            </ul>
                        </Card>
                    </div>
                )}

                {activeTab === 'progress' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {student.grades.map((grade, idx) => (
                            <Card key={idx} elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ color: 'var(--text-secondary)' }}>{grade.unit}</h4>
                                    <h3 style={{ margin: '4px 0' }}>{grade.title}</h3>
                                </div>
                                <span style={{
                                    padding: '8px 16px', borderRadius: '8px', fontWeight: 600,
                                    background: grade.grade === 'Distinction' ? 'var(--color-brand-purple)' :
                                        grade.grade === 'Merit' ? 'var(--color-brand-blue)' :
                                            grade.grade === 'Pass' ? 'var(--color-success)' : 'var(--bg-input)',
                                    color: grade.grade === 'Pending' ? 'var(--text-primary)' : 'white'
                                }}>
                                    {grade.grade}
                                </span>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="sm"><MessageSquare size={16} style={{ marginRight: '8px' }} /> Add Note</Button>
                        </div>
                        {student.notes.map(note => (
                            <Card key={note.id} elevated style={{ borderLeft: `4px solid ${note.type === 'Positive' ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{note.author}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{note.date}</span>
                                </div>
                                <p>{note.text}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

// Helper component for icon
const IDBadge = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7h.01" /><path d="M3.4 18H12a8 8 0 0 0 0-16h-1.6c-2.4 0-4.6.6-6.4 1.8" /><path d="M3.4 18c1.3-1.6 4.3-1.8 5.6-1.8H9a9 9 0 0 1 9 9v1" />
    </svg>
);

export default StudentProfileView;
