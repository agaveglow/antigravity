import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    User, MoreHorizontal, MessageSquare, Coins, IdCard, Lock, RefreshCw
} from 'lucide-react';
import Modal from '../components/common/Modal';
import PageTransition from '../components/common/PageTransition';

import { useStudents } from '../context/StudentsContext';
import { useUser } from '../context/UserContext';
import { useSubmissions } from '../context/SubmissionContext'; // Added import

const StudentProfileView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getStudentById, deleteStudent, updateStudent } = useStudents();
    const { getStudentSubmissions, updateSubmission } = useSubmissions(); // Added hook usage
    const { verifyMasterPassword } = useUser();
    const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'notes'>('overview');
    const [showActions, setShowActions] = useState(false);
    const [isEconomyModalOpen, setIsEconomyModalOpen] = useState(false);
    const [economyAction, setEconomyAction] = useState<'award' | 'deduct' | 'set'>('award');
    const [economyType, setEconomyType] = useState<'xp' | 'balance'>('xp');
    const [economyAmount, setEconomyAmount] = useState<number>(0);

    const student = id ? getStudentById(id) : undefined;
    const studentSubmissions = id ? getStudentSubmissions(id) : []; // Fetch submissions

    // Reveal Logic
    const [isRevealed, setIsRevealed] = useState(false);
    const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValid = await verifyMasterPassword(unlockPassword);
        if (isValid) {
            setIsRevealed(true);
            setShowUnlockPrompt(false);
            setUnlockPassword('');
        } else {
            alert('Incorrect master password');
        }
    };

    const maskUsername = (username: string) => {
        if (isRevealed) return username;
        if (!username) return '';
        const parts = username.split('.');
        if (parts.length > 1) {
            return `${parts[0].charAt(0)}***.${parts[1].charAt(0)}***`;
        }
        return `${username.charAt(0)}***`;
    };

    if (!student) return (
        <PageTransition>
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <h2>Student not found</h2>
                <Button onClick={() => navigate('/teacher/students')}>Back to Students</Button>
            </div>
        </PageTransition>
    );

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
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <Button
                                    variant={isRevealed ? "outline" : "primary"}
                                    onClick={() => isRevealed ? setIsRevealed(false) : setShowUnlockPrompt(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: isRevealed ? 'transparent' : 'var(--color-brand-blue)',
                                        borderColor: 'var(--color-brand-blue)'
                                    }}
                                >
                                    {isRevealed ? <RefreshCw size={18} /> : <Lock size={18} />}
                                    {isRevealed ? 'Lock Sensitive Data' : 'Reveal Student Details'}
                                </Button>
                                <div style={{ position: 'relative' }}>
                                    <Button variant="outline" onClick={() => setShowActions(!showActions)}>
                                        <MoreHorizontal size={20} /> Actions
                                    </Button>
                                    {showActions && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '4px',
                                            background: 'var(--bg-surface)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            boxShadow: 'var(--shadow-lg)',
                                            zIndex: 10,
                                            minWidth: '160px',
                                            overflow: 'hidden'
                                        }}>
                                            <button
                                                onClick={() => {
                                                    setShowActions(false);
                                                    setIsEconomyModalOpen(true);
                                                }}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '8px 16px',
                                                    background: 'none',
                                                    border: 'none',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    color: 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >
                                                Manage Economy
                                            </button>
                                            <button
                                                disabled={!isRevealed}
                                                onClick={async () => {
                                                    setShowActions(false);
                                                    const newPassword = prompt(`Enter new password for ${student.name}:`, 'ChangeMe123!');
                                                    if (newPassword) {
                                                        await updateStudent(student.id, { password: newPassword });
                                                        alert(`Password for ${student.name} has been updated.`);
                                                    }
                                                }}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '8px 16px',
                                                    background: 'none',
                                                    border: 'none',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    color: isRevealed ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                                    cursor: isRevealed ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.9rem',
                                                    opacity: isRevealed ? 1 : 0.5
                                                }}
                                                onMouseEnter={(e) => isRevealed && (e.currentTarget.style.background = 'var(--bg-hover)')}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >
                                                Change Password {!isRevealed && '(Locked)'}
                                            </button>
                                            <button
                                                disabled={!isRevealed}
                                                onClick={() => {
                                                    setShowActions(false);
                                                    if (window.confirm(`Are you sure you want to delete ${student.name}? This cannot be undone.`)) {
                                                        deleteStudent(student.id);
                                                        navigate('/teacher/students');
                                                    }
                                                }}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '8px 16px',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: isRevealed ? 'var(--color-error)' : 'var(--text-tertiary)',
                                                    cursor: isRevealed ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.9rem',
                                                    opacity: isRevealed ? 1 : 0.5
                                                }}
                                                onMouseEnter={(e) => isRevealed && (e.currentTarget.style.background = 'var(--bg-hover)')}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >
                                                Delete Student {!isRevealed && '(Locked)'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: student.avatar && typeof student.avatar === 'string' && !student.avatar.startsWith('http') && !student.avatar.startsWith('/') ? student.avatar : 'var(--color-brand-blue)',
                                color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem', fontWeight: 700, boxShadow: 'var(--shadow-lg)',
                                overflow: 'hidden'
                            }}>
                                {student.avatar && typeof student.avatar === 'string' && (student.avatar.startsWith('http') || student.avatar.startsWith('/')) ? (
                                    <img src={student.avatar} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    student.name.charAt(0)
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <h1 style={{ margin: 0 }}>{student.name}</h1>
                                    <span style={{
                                        background: student.status === 'Active' ? 'var(--color-success)' :
                                            student.status === 'At Risk' ? 'var(--color-warning)' : 'var(--bg-input)',
                                        color: student.status === 'Inactive' ? 'var(--text-primary)' : 'white',
                                        border: student.status === 'Inactive' ? '1px solid var(--border-color)' : 'none',
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600
                                    }}>
                                        {student.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                                    {student.cohort}
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} /> {maskUsername(student.username)}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IdCard size={16} /> ID: {id}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Predicted Grade</div>
                                        <select
                                            value={student.predicted_grade || ''}
                                            onChange={(e) => updateStudent(student.id, { predicted_grade: e.target.value })}
                                            style={{
                                                background: 'var(--bg-input)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                fontSize: '0.9rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            <option value="">Not Set</option>
                                            <option value="Distinction">Distinction</option>
                                            <option value="Merit">Merit</option>
                                            <option value="Pass">Pass</option>
                                            <option value="Fail">Fail</option>
                                            <option value="Referred">Referred</option>
                                        </select>
                                    </div>
                                    <div style={{ paddingLeft: 'var(--space-6)', borderLeft: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Overall Progress</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand-cyan)' }}>68%</span>
                                            <div style={{ width: '100px', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, var(--color-brand-blue), var(--color-brand-cyan))' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Key Stats */}
                            <div style={{ display: 'flex', gap: 'var(--space-8)', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-purple)' }}>{student.xp || 0}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>XP Earned</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-orange)' }}>
                                        {student.grades?.filter(g => g.grade === 'Distinction').length || 0}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distinctions</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>{student.balance || 0}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DowdBucks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                {/* ... no changes here ... */}
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
                                    <span>{student.dob || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                                    <span>{student.phone || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Address</span>
                                    <span style={{ textAlign: 'right' }}>{student.address || 'N/A'}</span>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Task Progress</h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {studentSubmissions.length} Tasks Submitted
                            </div>
                        </div>

                        {studentSubmissions.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>No tasks submitted yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                                {studentSubmissions.map((sub) => (
                                    <Card key={sub.id} elevated style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h4 style={{ margin: 0 }}>{sub.taskTitle || 'Unknown Task'}</h4>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                    background: sub.status === 'Verified' ? 'var(--color-success)' :
                                                        sub.status === 'Graded' ? 'var(--color-brand-purple)' :
                                                            sub.status === 'Pending Mark' ? 'var(--color-brand-orange)' : 'var(--bg-input)',
                                                    color: sub.status === 'Pending Mark' ? 'var(--text-primary)' : 'white'
                                                }}>
                                                    {sub.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                                                {sub.grade && ` • Grade: ${sub.grade}`}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/teacher/assessment/${sub.id}`)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (window.confirm(`Are you sure you want to RESET "${sub.taskTitle}"? This will clear the grade and verification status, allowing the student to resubmit.`)) {
                                                        // Reset logic: Update status to 'Pending Mark' (or delete if prefer strict reset)
                                                        // Request asked to "reset tasks for student to re-verify again"
                                                        // This implies clearing the "Verified" / "Graded" status.
                                                        await updateSubmission(sub.id, {
                                                            status: 'Resubmission Required', // Set to Resubmission so they know they need to act, or just delete?
                                                            grade: undefined,
                                                            feedback: undefined,
                                                            verifiedAt: undefined,
                                                            verifiedBy: undefined,
                                                            verificationRequested: false
                                                        });
                                                        alert('Task reset successfully.');
                                                    }
                                                }}
                                                style={{ color: 'var(--color-error)' }}
                                            >
                                                Reset
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="sm"><MessageSquare size={16} style={{ marginRight: '8px' }} /> Add Note</Button>
                        </div>
                        {student.notes?.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No notes available.</p> :
                            student.notes?.map(note => (
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

            <Modal isOpen={isEconomyModalOpen} onClose={() => setIsEconomyModalOpen(false)}>
                <div style={{ padding: '20px', minWidth: '350px' }}>
                    <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Coins size={24} /> Manage Economy
                    </h2>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Currency Type</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                variant={economyType === 'xp' ? 'primary' : 'outline'}
                                onClick={() => setEconomyType('xp')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                XP
                            </Button>
                            <Button
                                variant={economyType === 'balance' ? 'primary' : 'outline'}
                                onClick={() => setEconomyType('balance')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                DowdBucks
                            </Button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Action</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                variant={economyAction === 'award' ? 'primary' : 'outline'}
                                onClick={() => setEconomyAction('award')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Award
                            </Button>
                            <Button
                                variant={economyAction === 'deduct' ? 'primary' : 'outline'}
                                onClick={() => setEconomyAction('deduct')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Deduct
                            </Button>
                            <Button
                                variant={economyAction === 'set' ? 'primary' : 'outline'}
                                onClick={() => setEconomyAction('set')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Set/Reset
                            </Button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Amount</label>
                        <input
                            type="number"
                            value={economyAmount}
                            onChange={(e) => setEconomyAmount(parseInt(e.target.value) || 0)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                fontSize: '1.2rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button variant="ghost" onClick={() => setIsEconomyModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={async () => {
                                if (student) {
                                    const currentVal = economyType === 'xp' ? (student.xp || 0) : (student.balance || 0);
                                    let newVal = currentVal;

                                    if (economyAction === 'award') newVal += economyAmount;
                                    if (economyAction === 'deduct') newVal = Math.max(0, newVal - economyAmount);
                                    if (economyAction === 'set') newVal = economyAmount;

                                    await updateStudent(student.id, { [economyType]: newVal });
                                    setIsEconomyModalOpen(false);
                                }
                            }}
                        >
                            Confirm Update
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Unlock Prompt Modal */}
            {showUnlockPrompt && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, backdropFilter: 'blur(8px)'
                }}>
                    <Card elevated style={{ width: '400px', textAlign: 'center', padding: 'var(--space-8)' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6) auto', color: 'var(--color-brand-blue)' }}>
                            <Lock size={30} />
                        </div>
                        <h2 style={{ marginBottom: 'var(--space-2)' }}>Unlock Student Details</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                            Enter the master password to view sensitive credentials and perform administrative actions.
                        </p>
                        <form onSubmit={handleUnlock}>
                            <input
                                autoFocus
                                type="password"
                                value={unlockPassword}
                                onChange={(e) => setUnlockPassword(e.target.value)}
                                placeholder="Master Password"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                                    color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.2rem',
                                    letterSpacing: '4px', marginBottom: 'var(--space-6)'
                                }}
                            />
                            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                <Button type="button" variant="outline" style={{ flex: 1 }} onClick={() => setShowUnlockPrompt(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" style={{ flex: 1 }}>
                                    Unlock
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </PageTransition >
    );
};



export default StudentProfileView;
