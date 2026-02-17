import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Badge, BadgeAttachment, StudentBadge } from '../types/badges';
import { useUser } from './UserContext';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationContext';

interface BadgeContextType {
    badges: Badge[];
    studentBadges: StudentBadge[];
    badgeAttachments: BadgeAttachment[];
    isLoading: boolean;
    addBadge: (badge: Badge) => Promise<void>;
    updateBadge: (id: string, updates: Partial<Badge>) => Promise<void>;
    deleteBadge: (id: string) => Promise<void>;
    attachBadge: (badgeId: string, entityType: string, entityId: string) => Promise<void>;
    detachBadge: (attachmentId: string) => Promise<void>;
    awardBadge: (studentId: string, badgeId: string) => Promise<void>;
    getBadgesForEntity: (entityType: string, entityId: string) => Badge[];
    getStudentBadges: (studentId?: string) => StudentBadge[];
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export function BadgeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { triggerCelebration, createNotification } = useNotifications();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [badgeAttachments, setBadgeAttachments] = useState<BadgeAttachment[]>([]);
    const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load all badges
            const { data: badgesData, error: badgesError } = await supabase
                .from('badges')
                .select('*')
                .order('created_at', { ascending: false });

            if (badgesError) throw badgesError;

            setBadges(badgesData?.map(b => ({
                id: b.id,
                title: b.title,
                description: b.description,
                icon: b.icon,
                imageUrl: b.image_url,
                color: b.color,
                createdBy: b.created_by,
                createdAt: b.created_at
            })) || []);

            // Load badge attachments
            const { data: attachmentsData, error: attachmentsError } = await supabase
                .from('badge_attachments')
                .select('*');

            if (attachmentsError) throw attachmentsError;

            setBadgeAttachments(attachmentsData?.map(a => ({
                id: a.id,
                badgeId: a.badge_id,
                entityType: a.entity_type,
                entityId: a.entity_id,
                createdAt: a.created_at
            })) || []);

            // Load student badges (for current user if student, or all if teacher)
            // Teachers have usernames starting with 'teacher' or 'admin'
            const isTeacher = user?.username?.startsWith('teacher') || user?.username?.startsWith('admin');

            let studentBadgesQuery = supabase
                .from('student_badges')
                .select(`
                    *,
                    badges (*)
                `);

            if (!isTeacher && user) {
                studentBadgesQuery = studentBadgesQuery.eq('student_id', user.id);
            }

            const { data: studentBadgesData, error: studentBadgesError } = await studentBadgesQuery;

            if (studentBadgesError) throw studentBadgesError;

            setStudentBadges(studentBadgesData?.map(sb => ({
                id: sb.id,
                studentId: sb.student_id,
                badgeId: sb.badge_id,
                earnedAt: sb.earned_at,
                awardedBy: sb.awarded_by,
                badge: sb.badges ? {
                    id: sb.badges.id,
                    title: sb.badges.title,
                    description: sb.badges.description,
                    icon: sb.badges.icon,
                    imageUrl: sb.badges.image_url,
                    color: sb.badges.color,
                    createdBy: sb.badges.created_by,
                    createdAt: sb.badges.created_at
                } : undefined
            })) || []);

        } catch (error) {
            console.error('Error loading badge data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addBadge = async (badge: Badge) => {
        // Optimistic update
        setBadges(prev => [badge, ...prev]);

        try {
            const { error } = await supabase.from('badges').insert({
                id: badge.id,
                title: badge.title,
                description: badge.description,
                icon: badge.icon,
                image_url: badge.imageUrl,
                color: badge.color,
                created_by: badge.createdBy,
                created_at: badge.createdAt
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error adding badge:', error);
            setBadges(prev => prev.filter(b => b.id !== badge.id));
            throw error;
        }
    };

    const updateBadge = async (id: string, updates: Partial<Badge>) => {
        const original = badges.find(b => b.id === id);

        // Optimistic update
        setBadges(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

        try {
            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
            if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
            if (updates.color !== undefined) dbUpdates.color = updates.color;

            const { error } = await supabase
                .from('badges')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating badge:', error);
            if (original) {
                setBadges(prev => prev.map(b => b.id === id ? original : b));
            }
            throw error;
        }
    };

    const deleteBadge = async (id: string) => {
        const original = badges.find(b => b.id === id);

        // Optimistic update
        setBadges(prev => prev.filter(b => b.id !== id));

        try {
            const { error } = await supabase
                .from('badges')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting badge:', error);
            if (original) {
                setBadges(prev => [...prev, original]);
            }
            throw error;
        }
    };

    const attachBadge = async (badgeId: string, entityType: string, entityId: string) => {
        const newAttachment: BadgeAttachment = {
            id: crypto.randomUUID(),
            badgeId,
            entityType: entityType as any,
            entityId,
            createdAt: new Date().toISOString()
        };

        // Optimistic update
        setBadgeAttachments(prev => [...prev, newAttachment]);

        try {
            const { error } = await supabase.from('badge_attachments').insert({
                id: newAttachment.id,
                badge_id: badgeId,
                entity_type: entityType,
                entity_id: entityId
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error attaching badge:', error);
            setBadgeAttachments(prev => prev.filter(a => a.id !== newAttachment.id));
            throw error;
        }
    };

    const detachBadge = async (attachmentId: string) => {
        const original = badgeAttachments.find(a => a.id === attachmentId);

        // Optimistic update
        setBadgeAttachments(prev => prev.filter(a => a.id !== attachmentId));

        try {
            const { error } = await supabase
                .from('badge_attachments')
                .delete()
                .eq('id', attachmentId);

            if (error) throw error;
        } catch (error) {
            console.error('Error detaching badge:', error);
            if (original) {
                setBadgeAttachments(prev => [...prev, original]);
            }
            throw error;
        }
    };

    const awardBadge = async (studentId: string, badgeId: string) => {
        // Check if already awarded
        const existing = studentBadges.find(sb => sb.studentId === studentId && sb.badgeId === badgeId);
        if (existing) return;

        const badge = badges.find(b => b.id === badgeId);
        const newStudentBadge: StudentBadge = {
            id: crypto.randomUUID(),
            studentId,
            badgeId,
            earnedAt: new Date().toISOString(),
            awardedBy: user?.id,
            badge: badge
        };

        // Optimistic update
        setStudentBadges(prev => [...prev, newStudentBadge]);

        try {
            const { error } = await supabase.from('student_badges').insert({
                id: newStudentBadge.id,
                student_id: studentId,
                badge_id: badgeId,
                awarded_by: user?.id
            });

            if (error) throw error;

            // Trigger celebration if badge has visual properties
            if (badge && studentId === user?.id) {
                triggerCelebration({
                    type: 'badge_earned',
                    title: 'Badge Earned! 🎖️',
                    message: badge.title,
                    badgeEarned: {
                        id: badge.id,
                        title: badge.title,
                        icon: badge.icon || '🎖️',
                        color: badge.color || '#6366f1'
                    }
                });

                // Create persistent notification
                await createNotification(
                    studentId,
                    'Badge Earned',
                    `You earned the badge: ${badge.title}`,
                    'badge_earned',
                    '/student/achievements',
                    badgeId,
                    'badge'
                );
            }
        } catch (error) {
            console.error('Error awarding badge:', error);
            setStudentBadges(prev => prev.filter(sb => sb.id !== newStudentBadge.id));
            throw error;
        }
    };

    const getBadgesForEntity = (entityType: string, entityId: string): Badge[] => {
        const attachments = badgeAttachments.filter(
            a => a.entityType === entityType && a.entityId === entityId
        );
        return attachments
            .map(a => badges.find(b => b.id === a.badgeId))
            .filter((b): b is Badge => b !== undefined);
    };

    const getStudentBadges = (studentId?: string): StudentBadge[] => {
        if (studentId) {
            return studentBadges.filter(sb => sb.studentId === studentId);
        }
        return studentBadges;
    };

    const value: BadgeContextType = {
        badges,
        studentBadges,
        badgeAttachments,
        isLoading,
        addBadge,
        updateBadge,
        deleteBadge,
        attachBadge,
        detachBadge,
        awardBadge,
        getBadgesForEntity,
        getStudentBadges
    };

    return <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>;
}

export function useBadges() {
    const context = useContext(BadgeContext);
    if (!context) {
        throw new Error('useBadges must be used within a BadgeProvider');
    }
    return context;
}
