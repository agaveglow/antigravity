import React, { createContext, useContext, useState, useEffect } from 'react';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export type LevelType = 'Level 2' | 'Level 3';
export type YearType = 'Year 1' | 'Year 2';

export interface TimetableSlot {
    id: string;
    day: DayOfWeek;
    startTime: string; // e.g., "09:00"
    endTime: string; // e.g., "10:00"
    subject: string;
    room: string;
    teacher: string;
    level: LevelType;
    year?: YearType; // Only for Level 3
    color?: string; // Hex color for the lesson card
}

interface TimetableContextType {
    slots: TimetableSlot[];
    addSlot: (slot: TimetableSlot) => void;
    updateSlot: (id: string, updates: Partial<TimetableSlot>) => void;
    deleteSlot: (id: string) => void;
    getSlotsByLevel: (level: LevelType, year?: YearType) => TimetableSlot[];
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Save to localStorage whenever slots change (after initial load)
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('erc-timetable', JSON.stringify(slots));
        }
    }, [slots, isInitialized]);

    // Load from localStorage on mount
    useEffect(() => {
        const storedSlots = localStorage.getItem('erc-timetable');

        if (storedSlots) {
            setSlots(JSON.parse(storedSlots));
        }

        setIsInitialized(true);
    }, []);

    const addSlot = (slot: TimetableSlot) => {
        setSlots(prev => [...prev, slot]);
    };

    const updateSlot = (id: string, updates: Partial<TimetableSlot>) => {
        setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteSlot = (id: string) => {
        setSlots(prev => prev.filter(s => s.id !== id));
    };

    const getSlotsByLevel = (level: LevelType, year?: YearType) => {
        return slots.filter(s => {
            if (s.level !== level) return false;
            if (level === 'Level 3' && s.year !== year) return false;
            return true;
        });
    };

    return (
        <TimetableContext.Provider value={{
            slots,
            addSlot,
            updateSlot,
            deleteSlot,
            getSlotsByLevel
        }}>
            {children}
        </TimetableContext.Provider>
    );
};

export const useTimetable = () => {
    const context = useContext(TimetableContext);
    if (context === undefined) {
        throw new Error('useTimetable must be used within a TimetableProvider');
    }
    return context;
};
