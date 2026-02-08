import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useResources, type Studio, type Equipment } from '../context/ResourceContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Headphones } from 'lucide-react';
import Modal from '../components/common/Modal';

const BookingAndLoans: React.FC = () => {
    const { user, role } = useUser();
    const {
        studios, bookings, deleteStudio, bookStudio, updateBookingStatus,
        equipment, loans, requestLoan, updateLoanStatus, updateEquipment
    } = useResources();

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
                        <h1 style={{ margin: 0 }}>Studio & Equipment</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Manage studio time and equipment loans
                    </p>
                </div>
                {role === 'teacher' && (
                    <Button variant="primary" onClick={() => alert(activeTab === 'studio' ? 'Add Studio Modal' : 'Add Equipment Modal')}>
                        <Plus size={20} style={{ marginRight: '8px' }} /> Add {activeTab === 'studio' ? 'Studio' : 'Item'}
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
                    Studio Booking
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
                    Equipment Loans
                </button>
            </div>

            {/* --- Studio Content --- */}
            {activeTab === 'studio' && (
                <>
                    <h2 style={{ marginBottom: 'var(--space-4)' }}>Available Studios</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                        {studios.map(studio => (
                            <Card key={studio.id} elevated style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-4)' }}>
                                    <h3 style={{ margin: 0 }}>{studio.name}</h3>
                                    {role === 'teacher' && (
                                        <button
                                            onClick={() => { if (confirm('Delete studio?')) deleteStudio(studio.id); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-4)', flex: 1 }}>
                                    <p><strong>Capacity:</strong> {studio.capacity} people</p>
                                    <p><strong>Equipment:</strong> {studio.equipment.join(', ')}</p>
                                </div>
                                <Button
                                    variant="primary"
                                    style={{ width: '100%' }}
                                    onClick={() => {
                                        setSelectedStudio(studio);
                                        setIsBookingModalOpen(true);
                                    }}
                                >
                                    {role === 'teacher' ? 'Manage Schedule' : 'Book Now'}
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <h2 style={{ marginBottom: 'var(--space-4)' }}>{role === 'teacher' ? 'Booking Requests' : 'My Bookings'}</h2>
                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                        {bookings
                            .filter(b => role === 'teacher' || b.userId === user?.id)
                            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                            .map(booking => {
                                const studio = studios.find(s => s.id === booking.studioId);
                                const isPast = new Date(booking.endTime) < new Date();

                                return (
                                    <Card key={booking.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isPast ? 0.6 : 1 }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {studio?.name || 'Unknown Studio'}
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
                                                {role === 'teacher' && <span>• by {booking.userName}</span>}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                Purpose: {booking.purpose}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {role === 'teacher' && booking.status === 'Pending' && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => updateBookingStatus(booking.id, 'Rejected')} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>Reject</Button>
                                                    <Button variant="primary" size="sm" onClick={() => updateBookingStatus(booking.id, 'Approved')}>Approve</Button>
                                                </>
                                            )}
                                            {booking.status === 'Pending' && role === 'student' && (
                                                <Button variant="ghost" size="sm" onClick={() => updateBookingStatus(booking.id, 'Cancelled')} style={{ color: 'var(--text-tertiary)' }}>Cancel</Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        {bookings.filter(b => role === 'teacher' || b.userId === user?.id).length === 0 && (
                            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No bookings found.</p>
                        )}
                    </div>
                </>
            )}

            {/* --- Equipment Content --- */}
            {activeTab === 'equipment' && (
                <>
                    <h2 style={{ marginBottom: 'var(--space-4)' }}>Available Equipment</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                        {equipment.map(item => (
                            <Card key={item.id} elevated style={{ display: 'flex', flexDirection: 'column', opacity: item.availableQty === 0 ? 0.6 : 1 }}>
                                <div style={{
                                    height: '120px', background: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: 'var(--space-4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem'
                                }}>
                                    🎧
                                </div>
                                <h3 style={{ margin: '0 0 4px' }}>{item.name}</h3>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-4)', flex: 1 }}>
                                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-input)', fontSize: '0.75rem', marginRight: '8px' }}>
                                        {item.category}
                                    </span>
                                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Stock:</span>
                                        <span style={{ color: item.availableQty > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                            {item.availableQty} / {item.totalQty}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant={item.availableQty > 0 ? 'primary' : 'outline'}
                                    style={{ width: '100%' }}
                                    disabled={item.availableQty === 0 || role === 'teacher'}
                                    onClick={() => {
                                        if (role === 'teacher') {
                                            handleEditEquipment(item);
                                        } else {
                                            setSelectedItem(item);
                                            setIsLoanModalOpen(true);
                                        }
                                    }}
                                >
                                    {role === 'teacher' ? 'Edit Item' : item.availableQty > 0 ? 'Request Loan' : 'Out of Stock'}
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <h2 style={{ marginBottom: 'var(--space-4)' }}>{role === 'teacher' ? 'Loan Requests & Active Loans' : 'My Loans'}</h2>
                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                        {loans
                            .filter(l => role === 'teacher' || l.userId === user?.id)
                            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                            .map(loan => {
                                const item = equipment.find(e => e.id === loan.equipmentId);

                                return (
                                    <Card key={loan.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {loan.qty}x {item?.name || 'Unknown Item'}
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
                                                Due: {formatLoanDate(loan.returnDate)}
                                                {role === 'teacher' && <span> • Requested by {loan.userName}</span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {role === 'teacher' && loan.status === 'Pending' && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => updateLoanStatus(loan.id, 'Rejected')} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>Reject</Button>
                                                    <Button variant="primary" size="sm" onClick={() => updateLoanStatus(loan.id, 'Active')}>Approve</Button>
                                                </>
                                            )}
                                            {role === 'teacher' && loan.status === 'Active' && (
                                                <Button variant="outline" size="sm" onClick={() => updateLoanStatus(loan.id, 'Returned')}>Mark Returned</Button>
                                            )}
                                            {loan.status === 'Pending' && role === 'student' && (
                                                <Button variant="ghost" size="sm" onClick={() => updateLoanStatus(loan.id, 'Rejected')} style={{ color: 'var(--text-tertiary)' }}>Cancel</Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        {loans.filter(l => role === 'teacher' || l.userId === user?.id).length === 0 && (
                            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No loans found.</p>
                        )}
                    </div>
                </>
            )}

            {/* --- Modals --- */}
            <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title={`Book ${selectedStudio?.name} `}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Date</label>
                        <input
                            type="date"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={bookingDate}
                            onChange={e => setBookingDate(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Time</label>
                            <input
                                type="time"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                                value={bookingTime}
                                onChange={e => setBookingTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Duration (Hours)</label>
                            <input
                                type="number" min="1" max="8"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                                value={bookingDuration}
                                onChange={e => setBookingDuration(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Purpose</label>
                        <textarea
                            rows={3} placeholder="e.g. Recording vocals for Assessment 1"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                            value={bookingPurpose}
                            onChange={e => setBookingPurpose(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleBookStudio} disabled={!bookingDate || !bookingTime || !bookingPurpose}>Confirm Booking</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title={`Request ${selectedItem?.name} `}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Quantity</label>
                        <input
                            type="number" min="1" max={selectedItem?.availableQty || 1}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={loanQty}
                            onChange={e => setLoanQty(parseInt(e.target.value))}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Max available: {selectedItem?.availableQty}</p>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Return Date</label>
                        <input
                            type="date"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={returnDate}
                            onChange={e => setReturnDate(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsLoanModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleRequestLoan} disabled={!returnDate}>Submit Request</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEditEquipmentModalOpen} onClose={() => setIsEditEquipmentModalOpen(false)} title={`Edit ${selectedItem?.name}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Equipment Name</label>
                        <input
                            type="text"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Category</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value as any)}
                        >
                            <option value="Microphone">Microphone</option>
                            <option value="Instrument">Instrument</option>
                            <option value="Cable">Cable</option>
                            <option value="Interface">Interface</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Total Quantity</label>
                        <input
                            type="number" min="0"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white' }}
                            value={editTotalQty}
                            onChange={e => setEditTotalQty(parseInt(e.target.value) || 0)}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Currently Available: {selectedItem?.availableQty} (Will update based on change)
                        </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsEditEquipmentModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveEquipment}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BookingAndLoans;
