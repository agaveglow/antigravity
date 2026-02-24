import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import { type ErcProject, type ErcBooking, type ErcResource, type ProjectType, type ErcAvailability, type ErcTask } from '../types/erc';

interface ERCContextType {
    projects: ErcProject[];
    bookings: ErcBooking[];
    resources: ErcResource[];
    availability: ErcAvailability[];
    loading: boolean;
    refreshProjects: () => Promise<void>;
    refreshBookings: () => Promise<void>;
    refreshAvailability: () => Promise<void>;
    createProject: (title: string, type: ProjectType, targetStudentId?: string) => Promise<ErcProject | null>;
    createBooking: (resourceId: string, startTime: string, endTime: string, purpose: string) => Promise<ErcBooking | null>;
    createAvailability: (resourceId: string, startTime: string, endTime: string, maxSlots: number) => Promise<ErcAvailability | null>;
    deleteAvailability: (id: string) => Promise<void>;
    createTask: (projectId: string, title: string, description?: string, dueDate?: string) => Promise<ErcTask | null>;
    updateTaskStatus: (taskId: string, status: ErcTask['status']) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
}

const ERCContext = createContext<ERCContextType | undefined>(undefined);

export const ERCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [projects, setProjects] = useState<ErcProject[]>([]);
    const [bookings, setBookings] = useState<ErcBooking[]>([]);
    const [resources, setResources] = useState<ErcResource[]>([]);
    const [availability, setAvailability] = useState<ErcAvailability[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadInitialData();
        } else {
            setProjects([]);
            setBookings([]);
            setResources([]);
            setAvailability([]);
            setLoading(false);
        }
    }, [user]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([
            fetchProjects(),
            fetchBookings(),
            fetchResources(),
            fetchAvailability()
        ]);
        setLoading(false);
    };

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('erc_projects')
            .select('*, collaborators:erc_collaborations(*), tasks:erc_tasks(*)')
            .order('updated_at', { ascending: false });

        if (error) console.error('Error fetching projects:', error);
        else setProjects(data || []);
    };

    const fetchBookings = async () => {
        const { data, error } = await supabase
            .from('erc_bookings')
            .select('*, resource:erc_resources(*), profile:profiles(name, avatar)')
            .gte('end_time', new Date().toISOString())
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

    const fetchAvailability = async () => {
        const { data, error } = await supabase
            .from('erc_availability')
            .select('*, resource:erc_resources(*)')
            .gte('end_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (error) console.error('Error fetching availability:', error);
        else setAvailability(data || []);
    };

    const createProject = async (title: string, type: ProjectType, targetStudentId?: string) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('erc_projects')
            .insert([
                {
                    title,
                    type,
                    owner_id: user.id,
                    target_student_id: targetStudentId,
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
            throw error;
        }

        setBookings(prev => [...prev, data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
        return data;
    };

    const createAvailability = async (resourceId: string, startTime: string, endTime: string, maxSlots: number) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('erc_availability')
            .insert([
                {
                    resource_id: resourceId,
                    teacher_id: user.id,
                    start_time: startTime,
                    end_time: endTime,
                    max_slots: maxSlots
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating availability:', error);
            return null;
        }

        setAvailability(prev => [...prev, data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
        return data;
    };

    const deleteAvailability = async (id: string) => {
        const { error } = await supabase.from('erc_availability').delete().eq('id', id);
        if (error) console.error('Error deleting availability:', error);
        else setAvailability(prev => prev.filter(a => a.id !== id));
    };

    const createTask = async (projectId: string, title: string, description?: string, dueDate?: string) => {
        const { data, error } = await supabase
            .from('erc_tasks')
            .insert([{ project_id: projectId, title, description, due_date: dueDate }])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            return null;
        }

        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, tasks: [...(p.tasks || []), data] } : p));
        return data;
    };

    const updateTaskStatus = async (taskId: string, status: ErcTask['status']) => {
        const { error } = await supabase.from('erc_tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId);
        if (error) console.error('Error updating task status:', error);
        else {
            setProjects(prev => prev.map(p => ({
                ...p,
                tasks: p.tasks?.map(t => t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t)
            })));
        }
    };

    const deleteTask = async (taskId: string) => {
        const { error } = await supabase.from('erc_tasks').delete().eq('id', taskId);
        if (error) console.error('Error deleting task:', error);
        else {
            setProjects(prev => prev.map(p => ({
                ...p,
                tasks: p.tasks?.filter(t => t.id !== taskId)
            })));
        }
    };

    return (
        <ERCContext.Provider value={{
            projects,
            bookings,
            resources,
            availability,
            loading,
            refreshProjects: fetchProjects,
            refreshBookings: fetchBookings,
            refreshAvailability: fetchAvailability,
            createProject,
            createBooking,
            createAvailability,
            deleteAvailability,
            createTask,
            updateTaskStatus,
            deleteTask
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
