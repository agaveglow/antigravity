export type AchievementCategory = 'Academic' | 'Participation' | 'Creativity' | 'Other';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucide icon name or emoji
    xpValue?: number;
    category: AchievementCategory;
    criteria: string; // Description of how to earn it
    hidden?: boolean; // If true, only visible when earned (secret achievement)
    maxProgress?: number; // Total steps to complete (e.g., 5 posts)
}

export interface StudentAchievement extends Achievement {
    earnedAt: string; // ISO Date string
    progress?: number; // Current progress steps (e.g., 3 posts)
}
