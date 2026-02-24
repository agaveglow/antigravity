import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

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
    isLoading: boolean;
    refreshSlots: () => Promise<void>;
    addSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<void>;
    updateSlot: (id: string, updates: Partial<TimetableSlot>) => Promise<void>;
    deleteSlot: (id: string) => Promise<void>;
    getSlotsByLevel: (level: LevelType, year?: YearType) => TimetableSlot[];
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useUser();

    const loadSlots = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('timetable_slots')
                .select('*');

            if (error) {
                console.error('Error fetching timetable slots:', error);
                return;
            }

            if (data) {
                const mappedSlots: TimetableSlot[] = data.map(dbSlot => ({
                    id: dbSlot.id,
                    day: dbSlot.day as DayOfWeek,
                    startTime: dbSlot.start_time,
                    endTime: dbSlot.end_time,
                    subject: dbSlot.subject,
                    room: dbSlot.room,
                    teacher: dbSlot.teacher,
                    level: dbSlot.level as LevelType,
                    year: dbSlot.year as YearType | undefined,
                    color: dbSlot.color
                }));
                setSlots(mappedSlots);
            }
        } catch (err) {
            console.error('Failed to load slots:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setSlots([]);
            setIsLoading(false);
            return;
        }

        loadSlots();

        // Polling loop
        const interval = setInterval(() => {
            loadSlots();
        }, 30000);

        return () => clearInterval(interval);
    }, [user]);

    const addSlot = async (slot: Omit<TimetableSlot, 'id'>) => {
        try {
            const { error } = await supabase
                .from('timetable_slots')
                .insert({
                    day: slot.day,
                    start_time: slot.startTime,
                    end_time: slot.endTime,
                    subject: slot.subject,
                    room: slot.room,
                    teacher: slot.teacher,
                    level: slot.level,
                    year: slot.year,
                    color: slot.color
                });

            if (error) throw error;
            await loadSlots(); // Refresh the full list
        } catch (err) {
            console.error('Error adding slot:', err);
            throw err;
        }
    };

    const updateSlot = async (id: string, updates: Partial<TimetableSlot>) => {
        try {
            const dbUpdates: any = {};
            if (updates.day !== undefined) dbUpdates.day = updates.day;
            if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
            if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
            if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
            if (updates.room !== undefined) dbUpdates.room = updates.room;
            if (updates.teacher !== undefined) dbUpdates.teacher = updates.teacher;
            if (updates.level !== undefined) dbUpdates.level = updates.level;
            if (updates.year !== undefined) dbUpdates.year = updates.year;
            if (updates.color !== undefined) dbUpdates.color = updates.color;

            const { error } = await supabase
                .from('timetable_slots')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
            await loadSlots();
        } catch (err) {
            console.error('Error updating slot:', err);
            throw err;
        }
    };

    const deleteSlot = async (id: string) => {
        try {
            const { error } = await supabase
                .from('timetable_slots')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setSlots(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting slot:', err);
            throw err;
        }
    };

    const getSlotsByLevel = (level: LevelType, year?: YearType) => {
        return slots.filter(s => {
            if (s.level !== level) return false;
            // Provide resilience if year is not provided in context lookup
            if (level === 'Level 3' && year && s.year !== year) return false;
            return true;
        });
    };

    return (
        <TimetableContext.Provider value={{
            slots,
            isLoading,
            refreshSlots: loadSlots,
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
