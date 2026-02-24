import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Achievement, StudentAchievement } from '../types/achievements';
import { useUser } from './UserContext';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationContext';

interface AchievementsContextType {
    achievements: Achievement[];
    studentAchievements: Record<string, StudentAchievement[]>; // studentId -> StudentAchievement[]
    isLoading: boolean;
    addAchievement: (achievement: Omit<Achievement, 'id'>) => Promise<void>;
    updateAchievement: (id: string, updates: Partial<Achievement>) => Promise<void>;
    deleteAchievement: (id: string) => Promise<void>;
    awardAchievement: (studentId: string, achievementId: string) => Promise<void>;
    revokeAchievement: (studentId: string, achievementId: string) => Promise<void>;
    getStudentAchievements: (studentId: string) => StudentAchievement[];
    getAvailableAchievements: () => Achievement[];
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, addXp } = useUser();
    const { triggerCelebration, createNotification } = useNotifications();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [studentAchievements, setStudentAchievements] = useState<Record<string, StudentAchievement[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const loadAchievements = async () => {
            console.log('AchievementsContext: loadAchievements triggered');
            setIsLoading(true);

            // 1. Load Achievement Definitions
            const { data: achievementsData, error: achError } = await supabase.from('achievements').select('*');
            if (achError) {
                console.error('AchievementsContext: Error loading achievements:', achError.message, achError.details);
            } else if (achievementsData) {
                console.log(`AchievementsContext: Loaded ${achievementsData.length} achievement definitions`);
                setAchievements(achievementsData);
            }

            // 2. Load Global Student Achievements (or per current user)
            try {
                // This join query might fail if relationships aren't set up correctly in Supabase
                const { data: studentAchievementsData, error: saError } = await supabase
                    .from('student_achievements')
                    .select('*, achievements(*)');

                if (saError) {
                    console.error('AchievementsContext: Error loading student_achievements join:', saError.message, saError.details);

                    // Fallback: try fetching them separately if join fails
                    console.log('AchievementsContext: Retrying separate fetch for student_achievements');
                    const { data: saRaw } = await supabase.from('student_achievements').select('*');
                    if (saRaw) {
                        const grouped: Record<string, StudentAchievement[]> = {};
                        saRaw.forEach((sa: any) => {
                            if (!grouped[sa.student_id]) grouped[sa.student_id] = [];
                            const definition = (achievementsData || []).find(a => a.id === sa.achievement_id);
                            if (definition) {
                                grouped[sa.student_id].push({
                                    ...definition,
                                    earnedAt: sa.earned_at
                                });
                            }
                        });
                        setStudentAchievements(grouped);
                    }
                } else if (studentAchievementsData) {
                    console.log(`AchievementsContext: Loaded ${studentAchievementsData.length} student achievement records`);
                    const grouped: Record<string, StudentAchievement[]> = {};
                    studentAchievementsData.forEach((sa: any) => {
                        if (!grouped[sa.student_id]) grouped[sa.student_id] = [];
                        if (sa.achievements) {
                            grouped[sa.student_id].push({
                                ...sa.achievements,
                                earnedAt: sa.earned_at
                            });
                        }
                    });
                    setStudentAchievements(grouped);
                }
            } catch (e) {
                console.error('AchievementsContext: Exception in loadAchievements:', e);
            }

            setIsLoading(false);
        };

        if (user) {
            loadAchievements();
        } else {
            setAchievements([]);
            setStudentAchievements({});
            setIsLoading(false);
        }
    }, [user]);

    const addAchievement = async (achievementData: Omit<Achievement, 'id'>) => {
        const { data } = await supabase.from('achievements').insert([achievementData]).select();
        if (data) setAchievements(prev => [...prev, data[0]]);
    };

    const updateAchievement = async (id: string, updates: Partial<Achievement>) => {
        await supabase.from('achievements').update(updates).eq('id', id);
        setAchievements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const deleteAchievement = async (id: string) => {
        await supabase.from('achievements').delete().eq('id', id);
        setAchievements(prev => prev.filter(a => a.id !== id));
    };

    const awardAchievement = async (studentId: string, achievementId: string) => {
        const achievement = achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        const { error } = await supabase.from('student_achievements').insert({
            student_id: studentId,
            achievement_id: achievementId
        });

        if (!error) {
            const newSA: StudentAchievement = { ...achievement, earnedAt: new Date().toISOString() };
            setStudentAchievements(prev => ({
                ...prev,
                [studentId]: [...(prev[studentId] || []), newSA]
            }));

            if (studentId === user?.id) {
                await addXp(achievement.xpValue || 0);

                // Trigger celebration for current user
                triggerCelebration({
                    type: 'achievement_unlocked',
                    title: 'Achievement Unlocked! 🏆',
                    message: achievement.title,
                    icon: achievement.icon || '🏆',
                    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    xpGained: achievement.xpValue || 0
                });

                // Create persistent notification
                await createNotification(
                    studentId,
                    'Achievement Unlocked',
                    `You unlocked: ${achievement.title}`,
                    'achievement_unlocked',
                    '/student/achievements',
                    achievementId,
                    'achievement'
                );
            }
        }
    };

    const revokeAchievement = async (studentId: string, achievementId: string) => {
        await supabase.from('student_achievements')
            .delete()
            .eq('student_id', studentId)
            .eq('achievement_id', achievementId);

        setStudentAchievements(prev => ({
            ...prev,
            [studentId]: (prev[studentId] || []).filter(sa => sa.id !== achievementId)
        }));
    };

    const getStudentAchievements = (studentId: string) => {
        return studentAchievements[studentId] || [];
    };

    const getAvailableAchievements = () => {
        return achievements;
    };

    return (
        <AchievementsContext.Provider value={{
            achievements,
            studentAchievements,
            isLoading,
            addAchievement,
            updateAchievement,
            deleteAchievement,
            awardAchievement,
            revokeAchievement,
            getStudentAchievements,
            getAvailableAchievements
        }}>
            {children}
        </AchievementsContext.Provider>
    );
};

export const useAchievements = () => {
    const context = useContext(AchievementsContext);
    if (!context) {
        throw new Error('useAchievements must be used within an AchievementsProvider');
    }
    return context;
};
