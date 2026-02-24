import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

// --- Types ---
export interface EquipmentLog {
    id: string;
    userId: string;
    userName: string;
    date: string;
    note: string;
    type: 'Usage' | 'Damage' | 'Maintenance';
}

export interface Studio {
    id: string;
    name: string;
    capacity: number;
    equipment: string[];
    imageUrl?: string;
    logs?: EquipmentLog[];
}

export interface Equipment {
    id: string;
    name: string;
    label?: string;
    category: 'Microphone' | 'Instrument' | 'Cable' | 'Interface' | 'Other';
    totalQty: number;
    availableQty: number;
    imageUrl?: string;
    logs?: EquipmentLog[];
}

export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export interface StudioBooking {
    id: string;
    studioId: string;
    userId: string;
    userName: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    purpose: string;
    status: BookingStatus;
}

export type LoanStatus = 'Pending' | 'Active' | 'Returned' | 'Overdue' | 'Rejected';
export interface EquipmentLoan {
    id: string;
    equipmentId: string;
    userId: string;
    userName: string;
    requestDate: string; // ISO string
    returnDate: string;  // ISO string
    status: LoanStatus;
    qty: number;
}

interface ResourceContextType {
    studios: Studio[];
    equipment: Equipment[];
    bookings: StudioBooking[];
    loans: EquipmentLoan[];
    isLoading: boolean;

    refreshData: () => Promise<void>;

    // Actions
    addStudio: (studio: Omit<Studio, 'id'>) => Promise<void>;
    updateStudio: (id: string, updates: Partial<Studio>) => Promise<void>;
    deleteStudio: (id: string) => Promise<void>;
    addStudioLog: (studioId: string, log: Omit<EquipmentLog, 'id'>) => Promise<void>;

    addEquipment: (item: Omit<Equipment, 'id'>) => Promise<void>;
    updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
    deleteEquipment: (id: string) => Promise<void>;
    addEquipmentLog: (equipmentId: string, log: Omit<EquipmentLog, 'id'>) => Promise<void>;

    bookStudio: (booking: Omit<StudioBooking, 'id' | 'status' | 'userName'>) => Promise<void>;
    updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;

    requestLoan: (loan: Omit<EquipmentLoan, 'id' | 'status' | 'userName'>) => Promise<boolean>;
    updateLoanStatus: (id: string, status: LoanStatus) => Promise<void>;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [studios, setStudios] = useState<Studio[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [bookings, setBookings] = useState<StudioBooking[]>([]);
    const [loans, setLoans] = useState<EquipmentLoan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useUser(); // Added useUser

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [
                { data: sData },
                { data: eData },
                { data: bData },
                { data: lData },
                { data: logsData }
            ] = await Promise.all([
                supabase.from('studios').select('*'),
                supabase.from('equipment').select('*'),
                supabase.from('studio_bookings').select('*'),
                supabase.from('equipment_loans').select('*'),
                supabase.from('equipment_logs').select('*')
            ]);

            const mappedLogs = (logsData || []).map(log => ({
                id: log.id,
                equipmentId: log.equipment_id,
                studioId: log.studio_id,
                userId: log.user_id,
                userName: log.user_name,
                date: log.date,
                note: log.note,
                type: log.type as 'Usage' | 'Damage' | 'Maintenance'
            }));

            if (sData) {
                setStudios(sData.map(s => ({
                    id: s.id,
                    name: s.name,
                    capacity: s.capacity,
                    equipment: s.equipment, // JSONB text array
                    imageUrl: s.image_url,
                    logs: mappedLogs.filter(l => l.studioId === s.id)
                })));
            }

            if (eData) {
                setEquipment(eData.map(e => ({
                    id: e.id,
                    name: e.name,
                    label: e.label,
                    category: e.category as any,
                    totalQty: e.total_qty,
                    availableQty: e.available_qty,
                    imageUrl: e.image_url,
                    logs: mappedLogs.filter(l => l.equipmentId === e.id)
                })));
            }

            if (bData) {
                setBookings(bData.map(b => ({
                    id: b.id,
                    studioId: b.studio_id,
                    userId: b.user_id,
                    userName: b.user_name,
                    startTime: b.start_time,
                    endTime: b.end_time,
                    purpose: b.purpose,
                    status: b.status as BookingStatus
                })));
            }

            if (lData) {
                setLoans(lData.map(l => ({
                    id: l.id,
                    equipmentId: l.equipment_id,
                    userId: l.user_id,
                    userName: l.user_name,
                    requestDate: l.request_date,
                    returnDate: l.return_date,
                    status: l.status as LoanStatus,
                    qty: l.qty
                })));
            }
        } catch (e) {
            console.error("Error loading resources:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            setStudios([]);
            setEquipment([]);
            setBookings([]);
            setLoans([]);
            setIsLoading(false);
        }
    }, [user]);

    // Helper inside Context for fetching current logged-in user session
    const getCurrentUser = async () => {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return { userId: '', userName: 'Unknown User' };

        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, id')
            .eq('id', data.user.id)
            .single();

        return {
            userId: profile?.id || data.user.id,
            userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User'
        };
    };

    // --- Actions ---

    const addStudio = async (studio: Omit<Studio, 'id'>) => {
        const id = Date.now().toString(); // Fallback if using local generation for ID text primary key
        await supabase.from('studios').insert({
            id,
            name: studio.name,
            capacity: studio.capacity,
            equipment: studio.equipment,
            image_url: studio.imageUrl
        });
        await loadData();
    };

    const updateStudio = async (id: string, updates: Partial<Studio>) => {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.capacity !== undefined) payload.capacity = updates.capacity;
        if (updates.equipment !== undefined) payload.equipment = updates.equipment;
        if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;

        await supabase.from('studios').update(payload).eq('id', id);
        await loadData();
    };

    const deleteStudio = async (id: string) => {
        await supabase.from('studios').delete().eq('id', id);
        await loadData();
    };

    const addStudioLog = async (studioId: string, log: Omit<EquipmentLog, 'id'>) => {
        await supabase.from('equipment_logs').insert({
            studio_id: studioId,
            user_id: log.userId,
            user_name: log.userName,
            date: log.date,
            note: log.note,
            type: log.type
        });
        await loadData();
    };

    const addEquipment = async (item: Omit<Equipment, 'id'>) => {
        const id = Date.now().toString();
        await supabase.from('equipment').insert({
            id,
            name: item.name,
            label: item.label,
            category: item.category,
            total_qty: item.totalQty,
            available_qty: item.availableQty,
            image_url: item.imageUrl
        });
        await loadData();
    };

    const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.label !== undefined) payload.label = updates.label;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.totalQty !== undefined) payload.totalQty = updates.totalQty;
        if (updates.availableQty !== undefined) payload.available_qty = updates.availableQty;
        if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;

        await supabase.from('equipment').update(payload).eq('id', id);
        await loadData();
    };

    const deleteEquipment = async (id: string) => {
        await supabase.from('equipment').delete().eq('id', id);
        await loadData();
    };

    const addEquipmentLog = async (equipmentId: string, log: Omit<EquipmentLog, 'id'>) => {
        await supabase.from('equipment_logs').insert({
            equipment_id: equipmentId,
            user_id: log.userId,
            user_name: log.userName,
            date: log.date,
            note: log.note,
            type: log.type
        });
        await loadData();
    };

    const bookStudio = async (booking: Omit<StudioBooking, 'id' | 'status' | 'userName'>) => {
        const user = await getCurrentUser();
        await supabase.from('studio_bookings').insert({
            studio_id: booking.studioId,
            user_id: booking.userId || user.userId,
            user_name: user.userName,
            start_time: booking.startTime,
            end_time: booking.endTime,
            purpose: booking.purpose,
            status: 'Pending'
        });
        await loadData();
    };

    const updateBookingStatus = async (id: string, status: BookingStatus) => {
        const booking = bookings.find(b => b.id === id);
        if (!booking) return;

        await supabase.from('studio_bookings').update({ status }).eq('id', id);

        if (status !== booking.status) {
            let note = '';
            if (status === 'Approved') note = `Booking approved for ${booking.purpose}`;
            else if (status === 'Rejected') note = `Booking rejected`;
            else if (status === 'Cancelled') note = `Booking cancelled`;

            if (note) {
                await addStudioLog(booking.studioId, {
                    userId: booking.userId,
                    userName: booking.userName,
                    date: new Date().toISOString(),
                    note,
                    type: 'Usage'
                });
            }
        }
        await loadData();
    };

    const requestLoan = async (loan: Omit<EquipmentLoan, 'id' | 'status' | 'userName'>) => {
        const item = equipment.find(e => e.id === loan.equipmentId);
        if (!item || item.availableQty < loan.qty) return false;

        // Deduct optimistically
        await updateEquipment(item.id, { availableQty: item.availableQty - loan.qty });

        const user = await getCurrentUser();
        const { error } = await supabase.from('equipment_loans').insert({
            equipment_id: loan.equipmentId,
            user_id: loan.userId || user.userId,
            user_name: user.userName,
            request_date: loan.requestDate,
            return_date: loan.returnDate,
            status: 'Pending',
            qty: loan.qty
        });

        if (error) {
            // Revert deduction
            await updateEquipment(item.id, { availableQty: item.availableQty });
            return false;
        }

        await loadData();
        return true;
    };

    const updateLoanStatus = async (id: string, status: LoanStatus) => {
        const loan = loans.find(l => l.id === id);
        if (!loan) return;

        await supabase.from('equipment_loans').update({ status }).eq('id', id);

        if ((status === 'Rejected' || status === 'Returned') && (loan.status === 'Pending' || loan.status === 'Active' || loan.status === 'Overdue')) {
            const item = equipment.find(e => e.id === loan.equipmentId);
            if (item) {
                await updateEquipment(item.id, { availableQty: item.availableQty + loan.qty });

                if (status === 'Returned') {
                    await addEquipmentLog(item.id, {
                        userId: loan.userId,
                        userName: loan.userName,
                        date: new Date().toISOString(),
                        note: `Returned ${loan.qty}x by ${loan.userName}`,
                        type: 'Usage'
                    });
                }
            }
        }
        await loadData();
    };

    return (
        <ResourceContext.Provider value={{
            studios, equipment, bookings, loans, isLoading,
            refreshData: loadData,
            addStudio, updateStudio, deleteStudio, addStudioLog,
            addEquipment, updateEquipment, deleteEquipment, addEquipmentLog,
            bookStudio, updateBookingStatus,
            requestLoan, updateLoanStatus
        }}>
            {children}
        </ResourceContext.Provider>
    );
};

export const useResources = () => {
    const context = useContext(ResourceContext);
    if (context === undefined) {
        throw new Error('useResources must be used within a ResourceProvider');
    }
    return context;
};
