import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types ---
export interface Studio {
    id: string;
    name: string;
    capacity: number;
    equipment: string[];
    imageUrl?: string;
}

export interface Equipment {
    id: string;
    name: string;
    category: 'Microphone' | 'Instrument' | 'Cable' | 'Interface' | 'Other';
    totalQty: number;
    availableQty: number;
    imageUrl?: string;
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

    // Actions
    addStudio: (studio: Omit<Studio, 'id'>) => void;
    updateStudio: (id: string, updates: Partial<Studio>) => void;
    deleteStudio: (id: string) => void;

    addEquipment: (item: Omit<Equipment, 'id'>) => void;
    updateEquipment: (id: string, updates: Partial<Equipment>) => void;

    bookStudio: (booking: Omit<StudioBooking, 'id' | 'status' | 'userName'>) => void;
    updateBookingStatus: (id: string, status: BookingStatus) => void;

    requestLoan: (loan: Omit<EquipmentLoan, 'id' | 'status' | 'userName'>) => boolean;
    updateLoanStatus: (id: string, status: LoanStatus) => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

// --- Mock Data ---
const INITIAL_STUDIOS: Studio[] = [
    { id: 'studio-a', name: 'Studio A (Main Live Room)', capacity: 10, equipment: ['Drum Kit', 'Piano', 'Amps'] },
    { id: 'studio-b', name: 'Studio B (Vocal Booth)', capacity: 2, equipment: ['Neumann U87', 'Pro Tools HD'] },
    { id: 'suite-1', name: 'Production Suite 1', capacity: 3, equipment: ['Mac Studio', 'Logic Pro', 'Ableton'] },
];

const INITIAL_EQUIPMENT: Equipment[] = [
    { id: 'sm58', name: 'Shure SM58', category: 'Microphone', totalQty: 10, availableQty: 8 },
    { id: 'sm57', name: 'Shure SM57', category: 'Microphone', totalQty: 8, availableQty: 6 },
    { id: 'focusrite', name: 'Scarlett 2i2', category: 'Interface', totalQty: 15, availableQty: 12 },
    { id: 'ts-cable', name: 'Instrument Cable (10ft)', category: 'Cable', totalQty: 50, availableQty: 40 },
    { id: 'strat', name: 'Fender Stratocaster', category: 'Instrument', totalQty: 3, availableQty: 2 },
];

export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // In a real app, these would come from an API/Database
    const [studios, setStudios] = useState<Studio[]>(() => {
        const saved = localStorage.getItem('erc-studios');
        return saved ? JSON.parse(saved) : INITIAL_STUDIOS;
    });

    const [equipment, setEquipment] = useState<Equipment[]>(() => {
        const saved = localStorage.getItem('erc-equipment');
        return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
    });

    const [bookings, setBookings] = useState<StudioBooking[]>(() => {
        const saved = localStorage.getItem('erc-bookings');
        return saved ? JSON.parse(saved) : [];
    });

    const [loans, setLoans] = useState<EquipmentLoan[]>(() => {
        const saved = localStorage.getItem('erc-loans');
        return saved ? JSON.parse(saved) : [];
    });

    // Persistence
    useEffect(() => localStorage.setItem('erc-studios', JSON.stringify(studios)), [studios]);
    useEffect(() => localStorage.setItem('erc-equipment', JSON.stringify(equipment)), [equipment]);
    useEffect(() => localStorage.setItem('erc-bookings', JSON.stringify(bookings)), [bookings]);
    useEffect(() => localStorage.setItem('erc-loans', JSON.stringify(loans)), [loans]);

    // --- Actions ---

    const addStudio = (studio: Omit<Studio, 'id'>) => {
        const newStudio = { ...studio, id: Date.now().toString() };
        setStudios(prev => [...prev, newStudio]);
    };

    const updateStudio = (id: string, updates: Partial<Studio>) => {
        setStudios(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteStudio = (id: string) => {
        setStudios(prev => prev.filter(s => s.id !== id));
    };

    const addEquipment = (item: Omit<Equipment, 'id'>) => {
        const newItem = { ...item, id: Date.now().toString() };
        setEquipment(prev => [...prev, newItem]);
    };

    const updateEquipment = (id: string, updates: Partial<Equipment>) => {
        setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const bookStudio = (booking: Omit<StudioBooking, 'id' | 'status' | 'userName'>) => {
        // Mock user name retrieval (would be handled by backend/auth usually)
        // For now, we assume the UI passes the ID, and we just placeholders or local lookup if needed
        // But the interface asks for userName to be omitted. We'll grab it from localStorage or Context if possible?
        // Actually, to keep context decoupled, let's look it up or accept it. 
        // Simplification: We'll retrieve it from localStorage 'erc-user-student' or just use 'Student'

        // Simulating fetching current user name (hacky but works for demo)
        let userName = 'Student';
        try {
            const role = localStorage.getItem('erc-role');
            if (role) {
                const userStr = localStorage.getItem(`erc-user-${role}`);
                if (userStr) userName = JSON.parse(userStr).name;
            }
        } catch (e) { }

        const newBooking: StudioBooking = {
            ...booking,
            id: Date.now().toString(),
            status: 'Pending',
            userName
        };
        setBookings(prev => [...prev, newBooking]);
    };

    const updateBookingStatus = (id: string, status: BookingStatus) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    };

    const requestLoan = (loan: Omit<EquipmentLoan, 'id' | 'status' | 'userName'>) => {
        const item = equipment.find(e => e.id === loan.equipmentId);
        if (!item || item.availableQty < loan.qty) return false;

        // Deduct stock immediately (pessimistic) or wait for approval?
        // Let's deduct immediately to prevent overbooking, release if rejected.
        updateEquipment(loan.equipmentId, { availableQty: item.availableQty - loan.qty });

        let userName = 'Student';
        try {
            const role = localStorage.getItem('erc-role');
            if (role) {
                const userStr = localStorage.getItem(`erc-user-${role}`);
                if (userStr) userName = JSON.parse(userStr).name;
            }
        } catch (e) { }

        const newLoan: EquipmentLoan = {
            ...loan,
            id: Date.now().toString(),
            status: 'Pending',
            userName
        };
        setLoans(prev => [...prev, newLoan]);
        return true;
    };

    const updateLoanStatus = (id: string, status: LoanStatus) => {
        setLoans(prev => prev.map(l => {
            if (l.id === id) {
                // If rejected or returned, return stock
                if ((status === 'Rejected' || status === 'Returned') && (l.status === 'Pending' || l.status === 'Active' || l.status === 'Overdue')) {
                    const item = equipment.find(e => e.id === l.equipmentId);
                    if (item) {
                        updateEquipment(item.id, { availableQty: item.availableQty + l.qty });
                    }
                }
                return { ...l, status };
            }
            return l;
        }));
    };

    return (
        <ResourceContext.Provider value={{
            studios, equipment, bookings, loans,
            addStudio, updateStudio, deleteStudio,
            addEquipment, updateEquipment,
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
