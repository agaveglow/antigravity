import React, { useState } from 'react';
import { useERC } from '../../context/ERCContext';
import { useUser } from '../../context/UserContext';
import { Calendar, Clock, Plus, Loader2, AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Card from '../../components/common/Card';

const ERCBookings: React.FC = () => {
    const { bookings, resources, availability, createBooking, createAvailability, deleteAvailability, loading } = useERC();
    const { role, user } = useUser();

    // UI State
    const [isAddingAvailability, setIsAddingAvailability] = useState(false);
    const [isBookingSlot, setIsBookingSlot] = useState(false);
    const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | null>(null);

    // Form States
    const [newAvailability, setNewAvailability] = useState({
        resourceId: '',
        date: '',
        startTime: '',
        endTime: '',
        maxSlots: 1
    });
    const [bookingPurpose, setBookingPurpose] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial resource selection
    React.useEffect(() => {
        if (resources.length > 0 && !newAvailability.resourceId) {
            setNewAvailability(prev => ({ ...prev, resourceId: resources[0].id }));
        }
    }, [resources, newAvailability.resourceId]);

    const handleCreateAvailability = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const startISO = new Date(`${newAvailability.date}T${newAvailability.startTime}`).toISOString();
            const endISO = new Date(`${newAvailability.date}T${newAvailability.endTime}`).toISOString();

            if (startISO >= endISO) throw new Error('End time must be after start time.');

            await createAvailability(newAvailability.resourceId, startISO, endISO, newAvailability.maxSlots);
            setIsAddingAvailability(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create availability.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAvailabilityId) return;

        const slot = availability.find(a => a.id === selectedAvailabilityId);
        if (!slot) return;

        setError(null);
        setSubmitting(true);
        try {
            await createBooking(
                slot.resource_id,
                slot.start_time,
                slot.end_time,
                bookingPurpose
            );
            setIsBookingSlot(false);
            setBookingPurpose('');
            setSelectedAvailabilityId(null);
        } catch (err: any) {
            setError(err.message || 'Failed to book slot.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const isTeacher = role !== 'student';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-rose-600" />
                        {isTeacher ? 'Manage Availability' : 'Book a Session'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isTeacher ? 'Create time slots for students to book' : 'Choose an available time slot for your session'}
                    </p>
                </div>
                {isTeacher && (
                    <button
                        onClick={() => setIsAddingAvailability(!isAddingAvailability)}
                        className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Add Time Slot
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {isAddingAvailability && (
                <Card className="mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">New Availability Slot</h3>
                    <form onSubmit={handleCreateAvailability} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource</label>
                            <select
                                value={newAvailability.resourceId}
                                onChange={e => setNewAvailability({ ...newAvailability, resourceId: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                {resources.map(res => (
                                    <option key={res.id} value={res.id}>{res.name} ({res.type})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input
                                required
                                type="date"
                                value={newAvailability.date}
                                onChange={e => setNewAvailability({ ...newAvailability, date: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                min={format(new Date(), 'yyyy-MM-dd')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                            <input
                                required
                                type="time"
                                value={newAvailability.startTime}
                                onChange={e => setNewAvailability({ ...newAvailability, startTime: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                            <input
                                required
                                type="time"
                                value={newAvailability.endTime}
                                onChange={e => setNewAvailability({ ...newAvailability, endTime: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="lg:col-span-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAddingAvailability(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-4 py-2 bg-rose-600 text-white rounded-md">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Slot'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {isBookingSlot && (
                <Card className="mb-8 border-2 border-rose-500 animate-in zoom-in-95">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Booking</h3>
                    <p className="text-sm text-gray-500 mb-4">You are booking a session for: <strong>{availability.find(a => a.id === selectedAvailabilityId)?.resource?.name}</strong></p>
                    <form onSubmit={handleConfirmBooking}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose of session</label>
                            <textarea
                                required
                                value={bookingPurpose}
                                onChange={e => setBookingPurpose(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="e.g. Mixing vocals for my new single"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsBookingSlot(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-4 py-2 bg-rose-600 text-white rounded-md flex items-center gap-2">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Slots */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Slots</h3>
                    <div className="space-y-3">
                        {availability.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <Clock className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-gray-500">No available slots found.</p>
                            </div>
                        ) : (
                            availability.map(slot => (
                                <Card key={slot.id} className="relative group overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg text-rose-600">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{format(parseISO(slot.start_time), 'EEEE, MMMM do')}</p>
                                                <p className="text-sm text-gray-500">{format(parseISO(slot.start_time), 'HH:mm')} - {format(parseISO(slot.end_time), 'HH:mm')} • {slot.resource?.name}</p>
                                            </div>
                                        </div>
                                        {isTeacher ? (
                                            <button
                                                onClick={() => deleteAvailability(slot.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedAvailabilityId(slot.id);
                                                    setIsBookingSlot(true);
                                                }}
                                                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-sm font-semibold"
                                            >
                                                Book Now
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* My Bookings / Recent Bookings */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {isTeacher ? 'Recent Bookings' : 'My Bookings'}
                    </h3>
                    <div className="space-y-3">
                        {(isTeacher ? bookings : bookings.filter(b => b.booker_id === user?.id)).length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <CheckCircle className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-gray-500">No bookings yet.</p>
                            </div>
                        ) : (
                            (isTeacher ? bookings : bookings.filter(b => b.booker_id === user?.id)).slice(0, 10).map(booking => (
                                <Card key={booking.id} elevated className="border-l-4 border-l-rose-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{format(parseISO(booking.start_time), 'MMM d, HH:mm')}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{booking.resource?.name}</p>
                                            <p className="text-xs text-gray-500 mt-1 italic">"{booking.purpose}"</p>
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded">
                                            {booking.status}
                                        </span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ERCBookings;
