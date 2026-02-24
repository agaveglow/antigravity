import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import type { CelebrationData } from '../types/notifications';

export type NotificationType =
    | 'info'
    | 'warning'
    | 'success'
    | 'deadline'
    | 'verification'
    | 'task_verified'
    | 'project_completed'
    | 'achievement_unlocked'
    | 'badge_earned'
    | 'course_completed'
    | 'module_completed'
    | 'stage_completed';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    entityId?: string;
    entityType?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    celebrationQueue: CelebrationData[];
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    createNotification: (userId: string, title: string, message: string, type: NotificationType, link?: string, entityId?: string, entityType?: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    triggerCelebration: (data: CelebrationData) => void;
    dismissCelebration: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [celebrationQueue, setCelebrationQueue] = useState<CelebrationData[]>([]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        fetchNotifications();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('notifications_channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const newNotif = mapNotification(payload.new);
                setNotifications(prev => [newNotif, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    const mapNotification = (data: any): Notification => ({
        id: data.id,
        userId: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        entityId: data.entity_id,
        entityType: data.entity_type,
        isRead: data.is_read,
        createdAt: data.created_at
    });

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data.map(mapNotification));
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert on error if needed, but for read status often ignorable
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user?.id)
                .eq('is_read', false);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const createNotification = async (userId: string, title: string, message: string, type: NotificationType, link?: string, entityId?: string, entityType?: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title,
                    message,
                    type,
                    link,
                    entity_id: entityId,
                    entity_type: entityType
                });

            if (error) {
                console.error('Supabase error creating notification:', error.message, error.details, error.hint);
                throw error;
            }
        } catch (error) {
            console.error('Error in createNotification:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting notification:', error);
            // Revert on error if needed (fetch to restore?)
            fetchNotifications();
        }
    };

    const triggerCelebration = (data: CelebrationData) => {
        setCelebrationQueue(prev => [...prev, data]);
    };

    const dismissCelebration = () => {
        setCelebrationQueue(prev => prev.slice(1));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            celebrationQueue,
            markAsRead,
            markAllAsRead,
            createNotification,
            deleteNotification,
            triggerCelebration,
            dismissCelebration
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
