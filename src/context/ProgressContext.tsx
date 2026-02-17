import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import type { StudentContentProgress, ContentType, ProgressStats } from '../types/ual';

interface ProgressContextType {
    progress: StudentContentProgress[];
    loading: boolean;
    markComplete: (contentType: ContentType, contentId: string, xpReward: number, dowdBucksReward: number) => Promise<boolean>;
    isCompleted: (contentType: ContentType, contentId: string) => boolean;
    getProgressStats: (contentType: ContentType, contentId: string) => ProgressStats;
    refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [progress, setProgress] = useState<StudentContentProgress[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProgress = async () => {
        if (!user?.id) {
            setProgress([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('student_progress')
                .select('*')
                .eq('student_id', user.id);

            if (error) throw error;

            setProgress(data || []);
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, [user?.id]);

    const markComplete = async (
        contentType: ContentType,
        contentId: string,
        xpReward: number = 0,
        dowdBucksReward: number = 0
    ): Promise<boolean> => {
        if (!user?.id) return false;

        // Check if already completed to prevent duplicate rewards
        const existing = progress.find(
            p => p.contentType === contentType && p.contentId === contentId
        );

        if (existing?.completed) {
            console.log('Content already completed, no duplicate rewards');
            return true;
        }

        try {
            const progressData = {
                student_id: user.id,
                content_type: contentType,
                content_id: contentId,
                completed: true,
                completed_at: new Date().toISOString(),
                xp_awarded: xpReward,
                dowdbucks_awarded: dowdBucksReward,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('student_progress')
                .upsert(progressData, {
                    onConflict: 'student_id,content_type,content_id'
                })
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setProgress(prev => {
                const filtered = prev.filter(
                    p => !(p.contentType === contentType && p.contentId === contentId)
                );
                return [...filtered, data];
            });

            // Award XP and DowdBucks to student
            if (xpReward > 0 || dowdBucksReward > 0) {
                // Fetch current values first
                const { data: studentData, error: fetchError } = await supabase
                    .from('students')
                    .select('xp, dowd_bucks')
                    .eq('id', user.id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching student data:', fetchError);
                } else {
                    const { error: updateError } = await supabase
                        .from('students')
                        .update({
                            xp: (studentData.xp || 0) + xpReward,
                            dowd_bucks: (studentData.dowd_bucks || 0) + dowdBucksReward
                        })
                        .eq('id', user.id);

                    if (updateError) {
                        console.error('Error awarding rewards:', updateError);
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Error marking content complete:', error);
            return false;
        }
    };

    const isCompleted = (contentType: ContentType, contentId: string): boolean => {
        return progress.some(
            p => p.contentType === contentType && p.contentId === contentId && p.completed
        );
    };

    const getProgressStats = (contentType: ContentType): ProgressStats => {
        // This would need to be enhanced based on the specific content type
        // For now, return basic stats
        const relatedProgress = progress.filter(p => p.contentType === contentType);

        return {
            totalItems: relatedProgress.length,
            completedItems: relatedProgress.filter(p => p.completed).length,
            percentageComplete: relatedProgress.length > 0
                ? (relatedProgress.filter(p => p.completed).length / relatedProgress.length) * 100
                : 0,
            totalXpEarned: relatedProgress.reduce((sum, p) => sum + (p.xpAwarded || 0), 0),
            totalDowdBucksEarned: relatedProgress.reduce((sum, p) => sum + (p.dowdBucksAwarded || 0), 0)
        };
    };

    const refreshProgress = async () => {
        await fetchProgress();
    };

    return (
        <ProgressContext.Provider
            value={{
                progress,
                loading,
                markComplete,
                isCompleted,
                getProgressStats,
                refreshProgress
            }}
        >
            {children}
        </ProgressContext.Provider>
    );
};

export const useProgress = () => {
    const context = useContext(ProgressContext);
    if (!context) {
        throw new Error('useProgress must be used within a ProgressProvider');
    }
    return context;
};
