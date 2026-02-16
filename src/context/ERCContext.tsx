import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import { type ErcProject, type ErcBooking, type ErcResource, type ProjectType } from '../types/erc';

interface ERCContextType {
    projects: ErcProject[];
    bookings: ErcBooking[];
    resources: ErcResource[];
    loading: boolean;
    refreshProjects: () => Promise<void>;
    refreshBookings: () => Promise<void>;
    createProject: (title: string, type: ProjectType) => Promise<ErcProject | null>;
    createBooking: (resourceId: string, startTime: string, endTime: string, purpose: string) => Promise<ErcBooking | null>;
}

const ERCContext = createContext<ERCContextType | undefined>(undefined);

export const ERCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [projects, setProjects] = useState<ErcProject[]>([]);
    const [bookings, setBookings] = useState<ErcBooking[]>([]);
    const [resources, setResources] = useState<ErcResource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadInitialData();
        }
    }, [user]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchProjects(), fetchBookings(), fetchResources()]);
        setLoading(false);
    };

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('erc_projects')
            .select('*, collaborators:erc_collaborations(*)')
            .order('updated_at', { ascending: false });

        if (error) console.error('Error fetching projects:', error);
        else setProjects(data || []);
    };

    const fetchBookings = async () => {
        const { data, error } = await supabase
            .from('erc_bookings')
            .select('*, resource:erc_resources(*)')
            .gte('end_time', new Date().toISOString()) // Only future/recent bookings
            .order('start_time', { ascending: true });

        if (error) console.error('Error fetching bookings:', error);
        else setBookings(data || []);
    };

    const fetchResources = async () => {
        const { data, error } = await supabase
            .from('erc_resources')
            .select('*')
            .eq('is_active', true);

        if (error) console.error('Error fetching resources:', error);
        else setResources(data || []);
    };

    const createProject = async (title: string, type: ProjectType) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('erc_projects')
            .insert([
                {
                    title,
                    type,
                    owner_id: user.id,
                    status: 'Demo'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating project:', error);
            return null;
        }

        setProjects(prev => [data, ...prev]);
        return data;
    };

    const createBooking = async (resourceId: string, startTime: string, endTime: string, purpose: string) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('erc_bookings')
            .insert([
                {
                    resource_id: resourceId,
                    booker_id: user.id,
                    start_time: startTime,
                    end_time: endTime,
                    purpose
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            // alert('Booking Failed: Time slot might be taken.'); // Simple feedback
            throw error; // Let comp handle it
        }

        setBookings(prev => [...prev, data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
        return data;
    };

    return (
        <ERCContext.Provider value={{
            projects,
            bookings,
            resources,
            loading,
            refreshProjects: fetchProjects,
            refreshBookings: fetchBookings,
            createProject,
            createBooking
        }}>
            {children}
        </ERCContext.Provider>
    );
};

export const useERC = () => {
    const context = useContext(ERCContext);
    if (context === undefined) {
        throw new Error('useERC must be used within an ERCProvider');
    }
    return context;
};
