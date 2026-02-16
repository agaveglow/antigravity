import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Search, Plus, User, Shield, Mail, X, Lock, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: 'teacher' | 'admin';
    created_at: string;
    department?: 'music' | 'performing_arts';
    reference_password?: string;
}

const AdminDashboard: React.FC = () => {
    const { user: currentUser, verifyMasterPassword, updateMasterPassword } = useUser();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

    // Reveal Mode state
    const [isRevealed, setIsRevealed] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');
    const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
    // Security Config state
    const [isChangingMasterPass, setIsChangingMasterPass] = useState(false);
    const [oldMasterPass, setOldMasterPass] = useState('');
    const [newMasterPass, setNewMasterPass] = useState('');
    const [isSavingMasterPass, setIsSavingMasterPass] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'teacher' as 'teacher' | 'admin',
        department: 'music' as 'music' | 'performing_arts'
    });

    const loadStaff = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, username, role, created_at, reference_password, department')
                .in('role', ['teacher', 'admin']);

            if (error) throw error;

            setStaff(data.map(s => ({
                id: s.id,
                name: s.name || 'Unknown',
                email: s.username || '',
                role: s.role as 'teacher' | 'admin',
                department: s.department as 'music' | 'performing_arts',
                created_at: s.created_at,
                reference_password: s.reference_password
            })));
        } catch (error: any) {
            console.error('Error loading staff:', error);
            alert('Failed to load staff members');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleOpenModal = (member?: StaffMember) => {
        if (member) {
            setEditingStaff(member);
            setFormData({
                name: member.name,
                email: member.email,
                password: '', // Don't show password
                role: member.role,
                department: member.department || 'music'
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'teacher',
                department: 'music'
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveStaff = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { error } = await supabase.rpc('manage_staff_auth', {
                p_user_id: editingStaff ? editingStaff.id : null,
                p_email: formData.email,
                p_password: formData.password || (editingStaff ? '' : null),
                p_name: formData.name,
                p_role: formData.role,
                p_department: formData.department
            });

            if (error) throw error;

            setIsModalOpen(false);
            loadStaff();
            alert(editingStaff ? 'Staff member updated' : 'Staff member created');
        } catch (error: any) {
            console.error('Error saving staff:', error);
            alert(`Failed to save staff: ${error.message}`);
        }
    };

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

    const handleUpdateMasterPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMasterPass || !oldMasterPass) return;

        // Verify old password first
        const isValid = await verifyMasterPassword(oldMasterPass);
        if (!isValid) {
            alert('Incorrect current master password.');
            return;
        }

        setIsSavingMasterPass(true);
        const success = await updateMasterPassword(newMasterPass);
        if (success) {
            alert('Master password updated successfully.');
            setNewMasterPass('');
            setOldMasterPass('');
            setIsChangingMasterPass(false);
        } else {
            alert('Failed to update master password.');
        }
        setIsSavingMasterPass(false);
    };



    const handleRecoverStaff = async () => {
        if (!confirm('This will attempt to restore missing staff profiles from the authentication system. Continue?')) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('recover_staff_profiles');
            if (error) throw error;

            const count = data[0]?.recovered_count || 0;
            alert(`Recovery complete. Restored ${count} staff profiles.`);
            loadStaff();
        } catch (error: any) {
            console.error('Error recovering staff:', error);
            alert(`Failed to recover staff: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStaff = async (staffId: string, staffName: string) => {
        if (staffId === currentUser?.id) {
            alert('You cannot delete your own account.');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone and will remove their access immediately.`)) {
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.rpc('delete_staff_auth', {
                p_user_id: staffId
            });

            if (error) throw error;

            alert('Staff member deleted successfully.');
            loadStaff();
        } catch (error: any) {
            console.error('Error deleting staff:', error);
            alert(`Failed to delete staff: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const maskEmail = (email: string) => {
        // Always mask in list view, regardless of reveal state
        const [user, domain] = email.split('@');
        return `${user.charAt(0)}***@${domain}`;
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageTransition>
            <div className="admin-dashboard-page" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield className="text-primary" /> Staff Management
                        </h1>
                        <p className="text-secondary text-sm">Create and manage teacher and administrator accounts</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {isRevealed && (
                            <Button variant="outline" onClick={handleRecoverStaff} style={{ color: 'var(--color-brand-blue)' }}>
                                <RefreshCw size={18} style={{ marginRight: '8px' }} /> Recover Staff
                            </Button>
                        )}
                        {!isRevealed ? (
                            <Button variant="outline" onClick={() => setShowUnlockPrompt(true)} style={{ borderColor: 'var(--color-brand-orange)', color: 'var(--color-brand-orange)' }}>
                                <Lock size={18} style={{ marginRight: '8px' }} /> Unlock Sensitive Data
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => setIsRevealed(false)} style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}>
                                <Shield size={18} style={{ marginRight: '8px' }} /> Lock Sensitive Data
                            </Button>
                        )}
                        <Button onClick={() => handleOpenModal()}>
                            <Plus size={20} style={{ marginRight: '8px' }} /> Add Staff Member
                        </Button>
                    </div>
                </div>

                {showUnlockPrompt && (
                    <Card style={{ marginBottom: '24px', border: '1px solid var(--color-brand-orange)', background: 'rgba(255, 159, 10, 0.05)' }}>
                        <form onSubmit={handleUnlock} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Lock size={20} className="text-orange" />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>Master Access Required</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enter the master password to view full emails and passwords.</p>
                            </div>
                            <input
                                autoFocus
                                type="password"
                                placeholder="Master Password"
                                value={unlockPassword}
                                onChange={(e) => setUnlockPassword(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '200px' }}
                            />
                            <Button size="sm" type="submit">Unlock</Button>
                            <Button size="sm" type="button" variant="ghost" onClick={() => setShowUnlockPrompt(false)}>Cancel</Button>
                        </form>
                    </Card>
                )}

                {/* Privacy Filter State - Always visible if not revealed */}
                {!isRevealed && (
                    <Card style={{
                        padding: '40px',
                        textAlign: 'center',
                        border: '1px dashed var(--border-color)',
                        background: 'var(--bg-input)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(255, 159, 10, 0.1)', color: 'var(--color-brand-orange)' }}>
                            <Lock size={32} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>Staff Information Protected</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                                For security reasons, teacher and administrator records are hidden until the master access is unlocked.
                            </p>
                        </div>
                        <Button onClick={() => setShowUnlockPrompt(true)} variant="outline" style={{ borderColor: 'var(--color-brand-orange)', color: 'var(--color-brand-orange)' }}>
                            Unlock Staff Directory
                        </Button>
                    </Card>
                )}

                {isRevealed && (
                    <Card style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search staff by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 10px 10px 40px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--card-bg)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Security Configuration */}
                {isRevealed && (
                    <Card style={{ marginBottom: '20px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--color-brand-blue)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(50, 50, 194, 0.1)', color: 'var(--color-brand-blue)' }}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600 }}>Security Configuration</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage departmental master access and security protocols.</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsChangingMasterPass(!isChangingMasterPass)}>
                                {isChangingMasterPass ? 'Cancel' : 'Change Master Password'}
                            </Button>
                        </div>

                        {isChangingMasterPass && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                                <form onSubmit={handleUpdateMasterPassword} style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Current Master Password</label>
                                        <input
                                            required
                                            type="password"
                                            placeholder="Enter current password"
                                            value={oldMasterPass}
                                            onChange={(e) => setOldMasterPass(e.target.value)}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>New Master Password</label>
                                        <input
                                            required
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newMasterPass}
                                            onChange={(e) => setNewMasterPass(e.target.value)}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isSavingMasterPass} size="sm">
                                        {isSavingMasterPass ? 'Saving...' : 'Update Password'}
                                    </Button>
                                </form>
                                <p style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--color-brand-orange)' }}>
                                    <AlertCircle size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                    High Priority: Changing this will immediately affect all teachers' ability to reveal student data.
                                </p>
                            </div>
                        )}
                    </Card>
                )}



                {isRevealed && (
                    isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading staff...</div>
                    ) : (
                        <div className="staff-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {filteredStaff.map((member) => (
                                <Card key={member.id} className="staff-card" style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            <User size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontWeight: 'bold' }}>{member.name}</h3>
                                            <span style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: member.role === 'admin' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
                                                color: member.role === 'admin' ? '#e74c3c' : '#3498db',
                                                fontWeight: '600',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {member.role === 'admin' && <Shield size={12} />} {member.role.toUpperCase()}
                                            </span>
                                            <span style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-secondary)',
                                                fontWeight: '600',
                                                marginLeft: '8px'
                                            }}>
                                                {member.department === 'performing_arts' ? 'Performing Arts' : 'Music'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <Mail size={14} /> {maskEmail(member.email)}
                                        </div>
                                        {/* Password hidden from list view as per user request */}
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            Joined: {new Date(member.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {isRevealed && (
                                            <>
                                                <Button variant="outline" size="sm" style={{ width: '100%' }} onClick={() => handleOpenModal(member)}>
                                                    Edit Credentials
                                                </Button>
                                                {member.id !== currentUser?.id && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteStaff(member.id, member.name)}
                                                        style={{ minWidth: '40px', padding: '6px', borderColor: 'var(--color-brand-red, #ff4444)', color: 'var(--color-brand-red, #ff4444)' }}
                                                        title="Delete Staff Account"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )
                )}

                {/* Staff Modal */}
                {isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        padding: '20px'
                    }}>
                        <Card style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                            </h2>

                            <form onSubmit={handleSaveStaff}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>
                                            {editingStaff ? 'New Password (Leave blank to keep current)' : 'Initial Password'}
                                        </label>
                                        {editingStaff && editingStaff.reference_password && (
                                            <div style={{
                                                marginBottom: '8px',
                                                padding: '8px',
                                                background: 'rgba(50, 50, 194, 0.1)',
                                                borderRadius: '6px',
                                                fontSize: '0.9rem',
                                                color: 'var(--color-brand-blue)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <Lock size={14} />
                                                <span>Current Reference Password: <strong>{editingStaff.reference_password}</strong></span>
                                            </div>
                                        )}
                                        <input
                                            required={!editingStaff}
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Super Admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Department</label>
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="music">Music</option>
                                            <option value="performing_arts">Performing Arts</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Button variant="outline" style={{ width: '100%' }} onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
                                    <Button style={{ width: '100%' }} type="submit">Save Staff Member</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default AdminDashboard;
