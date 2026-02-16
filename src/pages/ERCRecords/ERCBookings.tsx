import React, { useState } from 'react';
import { useERC } from '../../context/ERCContext';
import { Calendar, Clock, MapPin, Plus, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../../components/common/Card';

const ERCBookings: React.FC = () => {
    const { bookings, resources, createBooking, loading } = useERC();
    const [isBooking, setIsBooking] = useState(false);
    const [newBooking, setNewBooking] = useState({
        resourceId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial resource selection
    React.useEffect(() => {
        if (resources.length > 0 && !newBooking.resourceId) {
            setNewBooking(prev => ({ ...prev, resourceId: resources[0].id }));
        }
    }, [resources, newBooking.resourceId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            // Construct ISO strings
            const startISO = new Date(`${newBooking.date}T${newBooking.startTime}`).toISOString();
            const endISO = new Date(`${newBooking.date}T${newBooking.endTime}`).toISOString();

            if (startISO >= endISO) {
                throw new Error('End time must be after start time.');
            }

            await createBooking(
                newBooking.resourceId,
                startISO,
                endISO,
                newBooking.purpose
            );
            setIsBooking(false);
            setNewBooking(prev => ({ ...prev, purpose: '', startTime: '', endTime: '' }));
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to book slot. It might be taken.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-rose-600" />
                        Studio Bookings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Reserve studio time and equipment</p>
                </div>
                <button
                    onClick={() => setIsBooking(!isBooking)}
                    className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    New Booking
                </button>
            </div>

            {isBooking && (
                <Card className="mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Book a Session</h3>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource</label>
                            <select
                                value={newBooking.resourceId}
                                onChange={e => setNewBooking({ ...newBooking, resourceId: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
                                value={newBooking.date}
                                onChange={e => setNewBooking({ ...newBooking, date: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start</label>
                                <input
                                    required
                                    type="time"
                                    value={newBooking.startTime}
                                    onChange={e => setNewBooking({ ...newBooking, startTime: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End</label>
                                <input
                                    required
                                    type="time"
                                    value={newBooking.endTime}
                                    onChange={e => setNewBooking({ ...newBooking, endTime: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                            <input
                                required
                                type="text"
                                value={newBooking.purpose}
                                onChange={e => setNewBooking({ ...newBooking, purpose: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                placeholder="e.g. Vocal recording for final project"
                            />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsBooking(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Schedule</h3>
                {bookings.length === 0 ? (
                    <Card className="text-center py-12 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" style={{ boxShadow: 'none' }}>
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Be the first to book a session!</p>
                    </Card>
                ) : (
                    <Card style={{ padding: 0, overflow: 'hidden' }} elevated>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Date & Time</th>
                                        <th className="px-6 py-3 font-medium">Resource</th>
                                        <th className="px-6 py-3 font-medium">Purpose</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {bookings.map(booking => (
                                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {format(new Date(booking.start_time), 'MMM d, yyyy')}
                                                </div>
                                                <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 text-xs mt-0.5">
                                                    <Clock size={12} />
                                                    {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {booking.resource?.name || 'Unknown resource'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                                                    {booking.resource?.type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                {booking.purpose}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ERCBookings;
