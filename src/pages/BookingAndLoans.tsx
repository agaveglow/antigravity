import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useResources, type Studio, type Equipment } from '../context/ResourceContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Headphones } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useLanguage } from '../context/LanguageContext';

const BookingAndLoans: React.FC = () => {
    const { user, role } = useUser();
    const {
        studios, bookings, deleteStudio, bookStudio, updateBookingStatus, addStudio,
        equipment, loans, requestLoan, updateLoanStatus, updateEquipment, addEquipment, deleteEquipment
    } = useResources();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState<'studio' | 'equipment'>('studio');

    // Studio State
    const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingDuration, setBookingDuration] = useState(1);
    const [bookingPurpose, setBookingPurpose] = useState('');

    // Equipment State
    const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [loanQty, setLoanQty] = useState(1);
    const [returnDate, setReturnDate] = useState('');

    // Edit Equipment State
    const [isEditEquipmentModalOpen, setIsEditEquipmentModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState<Equipment['category']>('Other');
    const [editTotalQty, setEditTotalQty] = useState(1);

    // Add Equipment State
    const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<Equipment['category']>('Other');
    const [newItemQty, setNewItemQty] = useState(1);

    // Add Studio State
    const [isAddStudioModalOpen, setIsAddStudioModalOpen] = useState(false);
    const [newStudioName, setNewStudioName] = useState('');
    const [newStudioCapacity, setNewStudioCapacity] = useState(1);
    const [newStudioEquipment, setNewStudioEquipment] = useState('');

    // --- Studio Handlers ---
    const handleAddStudio = () => {
        addStudio({
            name: newStudioName,
            capacity: newStudioCapacity,
            equipment: newStudioEquipment.split(',').map(s => s.trim()).filter(Boolean)
        });
        setIsAddStudioModalOpen(false);
        setNewStudioName('');
        setNewStudioCapacity(1);
        setNewStudioEquipment('');
    };

    const handleAddEquipment = () => {
        addEquipment({
            name: newItemName,
            category: newItemCategory,
            totalQty: newItemQty,
            availableQty: newItemQty
        });
        setIsAddEquipmentModalOpen(false);
        setNewItemName('');
        setNewItemQty(1);
    };

    // --- Studio Handlers ---
    const handleBookStudio = () => {
        if (!selectedStudio || !user) return;
        const start = new Date(`${bookingDate}T${bookingTime} `);
        const end = new Date(start.getTime() + bookingDuration * 60 * 60 * 1000);
        bookStudio({
            studioId: selectedStudio.id,
            userId: user.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            purpose: bookingPurpose
        });
        setIsBookingModalOpen(false);
        setBookingPurpose('');
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    // --- Equipment Handlers ---
    const handleRequestLoan = () => {
        if (!selectedItem || !user) return;
        const success = requestLoan({
            equipmentId: selectedItem.id,
            userId: user.id,
            requestDate: new Date().toISOString(),
            returnDate: new Date(returnDate).toISOString(),
            qty: loanQty
        });
        if (success) {
            setIsLoanModalOpen(false);
            setLoanQty(1);
            setReturnDate('');
        } else {
            alert('Not enough stock available!');
        }
    };

    const handleEditEquipment = (item: Equipment) => {
        setSelectedItem(item);
        setEditName(item.name);
        setEditCategory(item.category);
        setEditTotalQty(item.totalQty);
        setIsEditEquipmentModalOpen(true);
    };

    const handleSaveEquipment = () => {
        if (!selectedItem) return;

        // Calculate the difference in quantity to update availability
        const qtyDiff = editTotalQty - selectedItem.totalQty;
        const newAvailable = selectedItem.availableQty + qtyDiff;

        if (newAvailable < 0) {
            alert("Cannot reduce total quantity below currently loaned amount.");
            return;
        }

        updateEquipment(selectedItem.id, {
            name: editName,
            category: editCategory,
            totalQty: editTotalQty,
            availableQty: newAvailable
        });
        setIsEditEquipmentModalOpen(false);
    };

    const formatLoanDate = (isoString: string) => new Date(isoString).toLocaleDateString();

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        {activeTab === 'studio' ? <CalendarIcon size={32} className="text-primary" /> : <Headphones size={32} className="text-primary" />}
                        <h1 style={{ margin: 0 }}>{t('booking.title')}</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t('booking.subtitle')}
                    </p>
                </div>
                {(role === 'teacher' || role === 'admin') && (
                    <Button variant="primary" onClick={() => activeTab === 'studio' ? setIsAddStudioModalOpen(true) : setIsAddEquipmentModalOpen(true)}>
                        <Plus size={20} style={{ marginRight: '8px' }} /> {activeTab === 'studio' ? t('booking.addStudio') : t('booking.addItem')}
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('studio')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '1rem',
                        cursor: 'pointer',
                        color: activeTab === 'studio' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'studio' ? '2px solid var(--primary-color)' : 'none',
                        fontWeight: activeTab === 'studio' ? 600 : 400
                    }}
                >
                    {t('booking.tab.studio')}
                </button>
                <button
                    onClick={() => setActiveTab('equipment')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '1rem',
                        cursor: 'pointer',
                        color: activeTab === 'equipment' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'equipment' ? '2px solid var(--primary-color)' : 'none',
                        fontWeight: activeTab === 'equipment' ? 600 : 400
                    }}
                >
                    {t('booking.tab.equipment')}
                </button>
            </div>

            {/* --- Studio Content --- */}
            {activeTab === 'studio' && (
                <>
                    <h2 style={{ marginBottom: 'var(--space-4)' }}>{t('booking.availableStudios')}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                        {studios.map(studio => (
                            <Card key={studio.id} elevated style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-4)' }}>
                                    <h3 style={{ margin: 0 }}>{studio.name}</h3>
                                    {(role === 'teacher' || role === 'admin') && (
                                        <button
                                            onClick={() => { if (confirm('Delete studio?')) deleteStudio(studio.id); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-4)', flex: 1 }}>
                                    <p><strong>{t('booking.booking.capacity')}:</strong> {studio.capacity} {t('booking.people')}</p>
                                    <p><strong>{t('booking.equipment')}:</strong> {studio.equipment.join(', ')}</p>
                                </div>
                                <Button
                                    variant="primary"
                                    style={{ width: '100%' }}
                                    onClick={() => {
                                        setSelectedStudio(studio);
                                        setIsBookingModalOpen(true);
                                    }}
                                >
                                    {(role === 'teacher' || role === 'admin') ? t('booking.manageSchedule') : t('booking.bookNow')}
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <h2 style={{ marginBottom: 'var(--space-4)' }}>{(role === 'teacher' || role === 'admin') ? t('booking.requests') : t('booking.myBookings')}</h2>
                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                        {bookings
                            .filter(b => (role === 'teacher' || role === 'admin') || b.userId === user?.id)
                            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                            .map(booking => {
                                const studio = studios.find(s => s.id === booking.studioId);
                                const isPast = new Date(booking.endTime) < new Date();

                                return (
                                    <Card key={booking.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isPast ? 0.6 : 1 }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {studio?.name || t('booking.unknownStudio')}
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                    background: booking.status === 'Approved' ? 'var(--color-success-alpha)' :
                                                        booking.status === 'Pending' ? 'var(--color-warning-alpha)' : 'rgba(255,255,255,0.1)',
                                                    color: booking.status === 'Approved' ? 'var(--color-success)' :
                                                        booking.status === 'Pending' ? 'var(--color-warning)' : 'inherit'
                                                }}>
                                                    {booking.status}
                                                </span>
                                            </h4>
                                            <div style={{ color: 'var(--text-dd)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarIcon size={14} /> {formatDate(booking.startTime)}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 3600000)}h</span>
                                                {(role === 'teacher' || role === 'admin') && <span>• {t('booking.by')} {booking.userName}</span>}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                {t('booking.purpose')}: {booking.purpose}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {(role === 'teacher' || role === 'admin') && booking.status === 'Pending' && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => updateBookingStatus(booking.id, 'Rejected')} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>{t('booking.reject')}</Button>
                                                    <Button variant="primary" size="sm" onClick={() => updateBookingStatus(booking.id, 'Approved')}>{t('booking.approve')}</Button>
                                                </>
                                            )}
                                            {booking.status === 'Pending' && role === 'student' && (
                                                <Button variant="ghost" size="sm" onClick={() => updateBookingStatus(booking.id, 'Cancelled')} style={{ color: 'var(--text-tertiary)' }}>{t('booking.cancel')}</Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        {bookings.filter(b => (role === 'teacher' || role === 'admin') || b.userId === user?.id).length === 0 && (
                            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{t('booking.noBookings')}</p>
                        )}
                    </div>
                </>
            )}

            {/* --- Equipment Content --- */}
            {activeTab === 'equipment' && (
                <>
                    <h2 style={{ marginBottom: 'var(--space-4)' }}>{t('booking.availableEquipment')}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                        {equipment.map(item => (
                            <Card key={item.id} elevated style={{ display: 'flex', flexDirection: 'column', opacity: item.availableQty === 0 ? 0.6 : 1 }}>
                                <div style={{
                                    height: '120px', background: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: 'var(--space-4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem'
                                }}>
                                    🎧
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', width: '100%' }}>
                                    <h3 style={{ margin: '0 0 4px', flex: 1 }}>{item.name}</h3>
                                    {(role === 'teacher' || role === 'admin') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete ${item.name}?`)) deleteEquipment(item.id);
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0 0 0 8px' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-4)', flex: 1 }}>
                                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-input)', fontSize: '0.75rem', marginRight: '8px' }}>
                                        {item.category}
                                    </span>
                                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{t('booking.stock')}:</span>
                                        <span style={{ color: item.availableQty > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                            {item.availableQty} / {item.totalQty}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant={item.availableQty > 0 ? 'primary' : 'outline'}
                                    style={{ width: '100%' }}
                                    disabled={item.availableQty === 0 || (role === 'teacher' || role === 'admin')}
                                    onClick={() => {
                                        if (role === 'teacher' || role === 'admin') {
                                            handleEditEquipment(item);
                                        } else {
                                            setSelectedItem(item);
                                            setIsLoanModalOpen(true);
                                        }
                                    }}
                                >
                                    {(role === 'teacher' || role === 'admin') ? t('booking.editItem') : item.availableQty > 0 ? t('booking.requestLoan') : t('booking.outOfStock')}
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <h2 style={{ marginBottom: 'var(--space-4)' }}>{(role === 'teacher' || role === 'admin') ? t('booking.booking.loanRequests') : t('booking.myLoans')}</h2>
                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                        {loans
                            .filter(l => (role === 'teacher' || role === 'admin') || l.userId === user?.id)
                            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                            .map(loan => {
                                const item = equipment.find(e => e.id === loan.equipmentId);

                                return (
                                    <Card key={loan.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {loan.qty}x {item?.name || t('booking.unknownItem')}
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                    background: loan.status === 'Active' ? 'var(--color-success-alpha)' :
                                                        loan.status === 'Pending' ? 'var(--color-warning-alpha)' :
                                                            loan.status === 'Returned' ? 'var(--bg-subtle)' : 'rgba(255,255,255,0.1)',
                                                    color: loan.status === 'Active' ? 'var(--color-success)' :
                                                        loan.status === 'Pending' ? 'var(--color-warning)' :
                                                            loan.status === 'Returned' ? 'var(--text-tertiary)' : 'inherit'
                                                }}>
                                                    {loan.status}
                                                </span>
                                            </h4>
                                            <div style={{ color: 'var(--text-dd)', fontSize: '0.9rem' }}>
                                                {t('booking.due')}: {formatLoanDate(loan.returnDate)}
                                                {(role === 'teacher' || role === 'admin') && <span> • {t('booking.requestedBy')} {loan.userName}</span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {(role === 'teacher' || role === 'admin') && loan.status === 'Pending' && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => updateLoanStatus(loan.id, 'Rejected')} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>{t('booking.reject')}</Button>
                                                    <Button variant="primary" size="sm" onClick={() => updateLoanStatus(loan.id, 'Active')}>{t('booking.approve')}</Button>
                                                </>
                                            )}
                                            {(role === 'teacher' || role === 'admin') && loan.status === 'Active' && (
                                                <Button variant="outline" size="sm" onClick={() => updateLoanStatus(loan.id, 'Returned')}>{t('booking.markReturned')}</Button>
                                            )}
                                            {loan.status === 'Pending' && role === 'student' && (
                                                <Button variant="ghost" size="sm" onClick={() => updateLoanStatus(loan.id, 'Rejected')} style={{ color: 'var(--text-tertiary)' }}>{t('booking.cancel')}</Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        {loans.filter(l => (role === 'teacher' || role === 'admin') || l.userId === user?.id).length === 0 && (
                            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{t('booking.noLoans')}</p>
                        )}
                    </div>
                </>
            )}

            {/* --- Modals --- */}
            {/* Add Studio Modal */}
            <Modal isOpen={isAddStudioModalOpen} onClose={() => setIsAddStudioModalOpen(false)} title={t('booking.modal.addStudio')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.name')}</label>
                        <input
                            type="text"
                            placeholder="e.g. Studio C"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={newStudioName}
                            onChange={e => setNewStudioName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.capacity')}</label>
                        <input
                            type="number" min="1"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={newStudioCapacity}
                            onChange={e => setNewStudioCapacity(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.list')}</label>
                        <input
                            type="text"
                            placeholder="e.g. Piano, Drum Kit, Amps"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={newStudioEquipment}
                            onChange={e => setNewStudioEquipment(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsAddStudioModalOpen(false)}>{t('booking.cancel')}</Button>
                        <Button variant="primary" onClick={handleAddStudio} disabled={!newStudioName}>{t('booking.addStudio')}</Button>
                    </div>
                </div>
            </Modal>

            {/* Add Equipment Modal */}
            <Modal isOpen={isAddEquipmentModalOpen} onClose={() => setIsAddEquipmentModalOpen(false)} title={t('booking.modal.addEquipment')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.name')}</label>
                        <input
                            type="text"
                            placeholder="e.g. AKG C414"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.category')}</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={newItemCategory}
                            onChange={e => setNewItemCategory(e.target.value as any)}
                        >
                            <option value="Microphone">{t('booking.cat.mic')}</option>
                            <option value="Instrument">{t('booking.cat.inst')}</option>
                            <option value="Cable">{t('booking.cat.cable')}</option>
                            <option value="Interface">{t('booking.cat.interface')}</option>
                            <option value="Other">{t('booking.cat.other')}</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.quantity')}</label>
                        <input
                            type="number" min="1"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={newItemQty}
                            onChange={e => setNewItemQty(parseInt(e.target.value) || 1)}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsAddEquipmentModalOpen(false)}>{t('booking.cancel')}</Button>
                        <Button variant="primary" onClick={handleAddEquipment} disabled={!newItemName}>{t('booking.addItem')}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title={`${t('booking.modal.book')} ${selectedStudio?.name} `}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.date')}</label>
                        <input
                            type="date"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={bookingDate}
                            onChange={e => setBookingDate(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.time')}</label>
                            <input
                                type="time"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                                value={bookingTime}
                                onChange={e => setBookingTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.duration')}</label>
                            <input
                                type="number" min="1" max="8"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                                value={bookingDuration}
                                onChange={e => setBookingDuration(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.purpose')}</label>
                        <textarea
                            rows={3} placeholder="e.g. Recording vocals for Assessment 1"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                            value={bookingPurpose}
                            onChange={e => setBookingPurpose(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsBookingModalOpen(false)}>{t('booking.cancel')}</Button>
                        <Button variant="primary" onClick={handleBookStudio} disabled={!bookingDate || !bookingTime || !bookingPurpose}>{t('booking.modal.book')}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title={`${t('booking.modal.request')} ${selectedItem?.name} `}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.loanQty')}</label>
                        <input
                            type="number" min="1" max={selectedItem?.availableQty || 1}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={loanQty}
                            onChange={e => setLoanQty(parseInt(e.target.value))}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{t('booking.info.max')}: {selectedItem?.availableQty}</p>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.returnDate')}</label>
                        <input
                            type="date"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={returnDate}
                            onChange={e => setReturnDate(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsLoanModalOpen(false)}>{t('booking.cancel')}</Button>
                        <Button variant="primary" onClick={handleRequestLoan} disabled={!returnDate}>{t('booking.requestLoan')}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEditEquipmentModalOpen} onClose={() => setIsEditEquipmentModalOpen(false)} title={`${t('booking.modal.edit')} ${selectedItem?.name}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.name')}</label>
                        <input
                            type="text"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.category')}</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value as any)}
                        >
                            <option value="Microphone">{t('booking.cat.mic')}</option>
                            <option value="Instrument">{t('booking.cat.inst')}</option>
                            <option value="Cable">{t('booking.cat.cable')}</option>
                            <option value="Interface">{t('booking.cat.interface')}</option>
                            <option value="Other">{t('booking.cat.other')}</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('booking.label.quantity')}</label>
                        <input
                            type="number" min="0"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={editTotalQty}
                            onChange={e => setEditTotalQty(parseInt(e.target.value) || 0)}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            {t('booking.info.current')}: {selectedItem?.availableQty}
                        </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsEditEquipmentModalOpen(false)}>{t('booking.cancel')}</Button>
                        <Button variant="primary" onClick={handleSaveEquipment}>{t('booking.modal.edit')}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BookingAndLoans;
