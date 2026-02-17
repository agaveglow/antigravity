export type NotificationType =
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
    type: NotificationType;
    title: string;
    message: string;
    entityId?: string;
    entityType?: string;
    isRead: boolean;
    createdAt: string;
}

export interface CelebrationData {
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    color?: string;
    xpGained?: number;
    badgeEarned?: {
        id: string;
        title: string;
        icon: string;
        color: string;
    };
}
