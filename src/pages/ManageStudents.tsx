import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    Search,
    Filter,
    Plus,
    RefreshCw,
    X,
    Lock
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { useStudents, type Student } from '../context/StudentsContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';


const ManageStudents: React.FC = () => {
    const navigate = useNavigate();
    const { students, inviteStudent, updateStudent: updateStudentInContext, deleteStudent } = useStudents();
    const { t } = useLanguage();
    const { verifyMasterPassword } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('All');

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

    // Reveal Logic
    const [isRevealed, setIsRevealed] = useState(false);
    const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentCohort, setNewStudentCohort] = useState<string>('Level 3A');
    const [newStudentDepartment, setNewStudentDepartment] = useState<string>('music');
    const [newStudentUsername, setNewStudentUsername] = useState('');
    const [newStudentPassword, setNewStudentPassword] = useState('');
    const [isManualCredentials, setIsManualCredentials] = useState(false);

    // Editing state
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

    // Auto-generate credentials when name changes, UNLESS user has manually edited them
    React.useEffect(() => {
        if (!isManualCredentials && newStudentName) {
            const autoUser = newStudentName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
            setNewStudentUsername(autoUser);
        }
    }, [newStudentName, isManualCredentials]);

    const updateStudent = (id: string, field: 'cohort', value: string) => {
        updateStudentInContext(id, { [field]: value as any });
    };

    const handleSaveStudent = async () => {
        if (!newStudentName || !newStudentUsername) {
            alert(t('teacher.students.alert.fillAll'));
            return;
        }

        if (editingStudentId) {
            // Update existing
            await updateStudentInContext(editingStudentId, {
                name: newStudentName,
                cohort: newStudentCohort as any,
                username: newStudentUsername,
                department: newStudentDepartment as any,
                password: newStudentPassword || undefined // Only update password if provided
            });
            alert(`${t('teacher.students.alert.updated')} ${newStudentName}`);
        } else {
            // Create new via direct credentials
            if (!newStudentPassword) {
                alert("Please provide a password for the student.");
                return;
            }
            await inviteStudent(newStudentName, newStudentUsername, newStudentCohort, newStudentDepartment, newStudentPassword);
            alert(`${t('teacher.students.alert.created')}\nStudent ${newStudentUsername} has been created.`);
        }

        resetModal();
    };

    const resetModal = () => {
        setIsModalOpen(false);
        setNewStudentName('');
        setNewStudentUsername('');
        setNewStudentPassword('');
        setNewStudentDepartment('music');
        setIsManualCredentials(false);
        setEditingStudentId(null);
    };

    const openEditModal = (student: Student) => {
        setNewStudentName(student.name);
        setNewStudentCohort(student.cohort);
        setNewStudentUsername(student.username);
        setNewStudentDepartment(student.department || 'music');
        setNewStudentPassword(''); // Clear password field for security
        setEditingStudentId(student.id);
        setIsManualCredentials(true);
        setIsModalOpen(true);
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCohort = selectedLevel === 'All' || student.cohort === selectedLevel;
        return matchesSearch && matchesCohort;
    });

    // Stats
    const totalStudents = students.length;

    // Debug logging
    React.useEffect(() => {
        console.log('ManageStudents: Total students:', totalStudents);
        console.log('ManageStudents: Filtered students:', filteredStudents.length);
        console.log('ManageStudents: Search term:', searchTerm);
        console.log('ManageStudents: Selected cohort:', selectedLevel);
    }, [students, filteredStudents, searchTerm, selectedLevel]);

    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <div>
                        <h1>{t('teacher.students.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('teacher.students.subtitle')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Button
                            variant={isRevealed ? "outline" : "primary"}
                            onClick={() => isRevealed ? setIsRevealed(false) : setShowUnlockPrompt(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: isRevealed ? 'transparent' : 'var(--color-brand-orange)',
                                borderColor: isRevealed ? 'var(--color-brand-blue)' : 'var(--color-brand-orange)'
                            }}
                        >
                            {isRevealed ? <RefreshCw size={18} /> : <Lock size={18} />}
                            {isRevealed ? 'Lock Sensitive Data' : 'Unlock Sensitive Data'}
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)} disabled={!isRevealed} title={!isRevealed ? "Reveal student details to add a new student" : ""}>
                            <Plus size={20} style={{ marginRight: '8px' }} /> {t('teacher.students.addStudent')}
                        </Button>
                    </div>
                </div>

                {/* Privacy Filter Placeholder */}
                {!isRevealed && (
                    <Card style={{
                        padding: '60px var(--space-6)',
                        textAlign: 'center',
                        border: '1px dashed var(--border-color)',
                        background: 'var(--bg-input)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(255, 159, 10, 0.1)',
                            color: 'var(--color-brand-orange)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Lock size={40} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Student Data Protected</h3>
                            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                                To protect student privacy and sensitive credentials, the student directory is currently locked. Please verify your master access to proceed.
                            </p>
                        </div>
                        <Button onClick={() => setShowUnlockPrompt(true)} variant="primary" style={{ background: 'var(--color-brand-orange)', borderColor: 'var(--color-brand-orange)' }}>
                            Unlock Student Directory
                        </Button>
                    </Card>
                )}

                {isRevealed && (
                    <>
                        {/* Stats Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                            <Card elevated>
                                <h4 style={{ color: 'var(--text-secondary)' }}>{t('teacher.students.totalStudents')}</h4>
                                <h2 style={{ fontSize: '2rem', margin: 'var(--space-2) 0' }}>{totalStudents}</h2>
                            </Card>
                        </div>

                        {/* Filters */}
                        <Card elevated style={{ marginBottom: 'var(--space-6)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text"
                                        placeholder={t('teacher.students.searchPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 10px 10px 40px',
                                            borderRadius: 'var(--border-radius-md)',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: 'var(--border-radius-md)',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="All">{t('teacher.students.allCohorts')}</option>
                                        <option value="Level 2">{t('teacher.students.level2')}</option>
                                        <option value="Level 3A">{t('teacher.students.level3a')}</option>
                                        <option value="Level 3B">{t('teacher.students.level3b')}</option>
                                    </select>

                                    <Button variant="outline"><Filter size={20} /></Button>
                                </div>
                            </div>
                        </Card>

                        {/* Students Table */}
                        <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                                        <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('teacher.students.table.name')}</th>
                                        <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('teacher.students.table.cohort')}</th>
                                        <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Department</th>
                                        <th style={{ textAlign: 'right', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('teacher.students.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr
                                            key={student.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }}
                                            onClick={() => navigate(`/teacher/students/${student.id}`)}
                                            className="hover-row"
                                        >
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '50%',
                                                        background: student.avatar && typeof student.avatar === 'string' && !student.avatar.startsWith('http') && !student.avatar.startsWith('/') ? student.avatar : 'var(--color-brand-blue)',
                                                        color: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 600,
                                                        overflow: 'hidden'
                                                    }}>
                                                        {student.avatar && typeof student.avatar === 'string' && (student.avatar.startsWith('http') || student.avatar.startsWith('/')) ? (
                                                            <img src={student.avatar} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            student.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{student.name}</div>
                                                        <div style={{ fontSize: '0.875rem', color: isRevealed ? 'var(--color-brand-blue)' : 'var(--text-secondary)', fontWeight: isRevealed ? 600 : 400 }}>
                                                            {maskUsername(student.username)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <select
                                                    value={student.cohort}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => updateStudent(student.id, 'cohort', e.target.value as any)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-input)',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <option value="Level 2">Level 2</option>
                                                    <option value="Level 3A">Level 3A</option>
                                                    <option value="Level 3B">Level 3B</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{
                                                    fontSize: '0.875rem',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    background: 'var(--bg-surface)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--text-secondary)',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {student.department === 'performing_arts' ? 'Performing Arts' : 'Music'}
                                                </span>
                                            </td>

                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <select
                                                        value=""
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={async (e) => {
                                                            e.stopPropagation();
                                                            const action = e.target.value;

                                                            if (action === 'edit_details') {
                                                                openEditModal(student);
                                                            } else if (action === 'reset_password') {
                                                                // Reset password will now just open the modal to set a new one
                                                                openEditModal(student);
                                                            } else if (action === 'delete') {
                                                                if (window.confirm(t('teacher.students.alert.deleteConfirm').replace('{name}', student.name))) {
                                                                    deleteStudent(student.id);
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-input)',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500,
                                                            cursor: 'pointer',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                    >
                                                        <option value="" disabled>{t('teacher.students.actions.placeholder')}</option>
                                                        <option value="edit_details" disabled={!isRevealed}>{t('teacher.students.actions.edit')} {!isRevealed ? '(Locked)' : ''}</option>
                                                        <option value="reset_password" disabled={!isRevealed}>{t('teacher.students.actions.resetPass')} {!isRevealed ? '(Locked)' : ''}</option>
                                                        <option value="delete" disabled={!isRevealed}>{t('teacher.students.actions.delete')} {!isRevealed ? '(Locked)' : ''}</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    {t('teacher.students.noStudents')}
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>

            {/* Add Student Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }} onClick={() => setIsModalOpen(false)}>
                    <Card
                        elevated
                        style={{ width: '400px', maxWidth: '90%', padding: 'var(--space-6)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                            <h2 style={{ margin: 0 }}>{editingStudentId ? t('teacher.students.modal.edit') : t('teacher.students.modal.add')}</h2>
                            <button
                                onClick={resetModal}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {/* ... inputs ... */}
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('teacher.students.modal.name')}</label>
                            <input
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder={t('teacher.students.modal.namePlaceholder')}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '6px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                {editingStudentId ? 'Change Password (leave blank to keep current)' : 'Student Password'}
                            </label>
                            <input
                                type="text"
                                value={newStudentPassword}
                                onChange={(e) => setNewStudentPassword(e.target.value)}
                                placeholder={editingStudentId ? "Keep current password" : "set123password"}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '6px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('teacher.students.modal.cohort')}</label>
                            <select
                                value={newStudentCohort}
                                onChange={(e) => setNewStudentCohort(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '6px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)'
                                }}
                            >
                                <option value="Level 2">Level 2</option>
                                <option value="Level 3A">Level 3A</option>
                                <option value="Level 3B">Level 3B</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Department</label>
                            <select
                                value={newStudentDepartment}
                                onChange={(e) => setNewStudentDepartment(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '6px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)'
                                }}
                            >
                                <option value="music">Music</option>
                                <option value="performing_arts">Performing Arts</option>
                            </select>
                        </div>

                        <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: 'var(--space-6)' }}>
                            <h4 style={{ margin: '0 0 var(--space-4) 0', color: 'var(--text-secondary)' }}>{t('teacher.students.modal.credentials')}</h4>
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>{t('teacher.students.modal.username')}</label>
                                <input
                                    type="text"
                                    value={newStudentUsername}
                                    onChange={(e) => {
                                        setNewStudentUsername(e.target.value);
                                        setIsManualCredentials(true);
                                    }}
                                    placeholder={t('teacher.students.modal.usernamePlaceholder')}
                                    style={{
                                        width: '100%', padding: '8px', borderRadius: '6px',
                                        border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)' }}>
                            <Button variant="outline" onClick={resetModal}>{t('teacher.students.modal.cancel')}</Button>
                            <Button onClick={handleSaveStudent}>{editingStudentId ? t('teacher.students.modal.update') : t('teacher.students.modal.create')}</Button>
                        </div>
                    </Card>
                </div>
            )}

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
                        <h2 style={{ marginBottom: 'var(--space-2)' }}>Unlock Student Data</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                            Enter the master password to view and manage student credentials.
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
        </PageTransition>
    );
};

export default ManageStudents;
