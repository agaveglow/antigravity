export interface Badge {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
    color?: string;
    createdBy: string;
    createdAt: string;
}

export interface BadgeAttachment {
    id: string;
    badgeId: string;
    entityType: 'achievement' | 'task' | 'project' | 'module' | 'stage' | 'course';
    entityId: string;
    createdAt: string;
}

export interface StudentBadge {
    id: string;
    studentId: string;
    badgeId: string;
    earnedAt: string;
    awardedBy?: string;
    badge?: Badge;  // Populated via join
}
