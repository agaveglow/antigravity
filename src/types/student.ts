export type StudentStatus = 'Active' | 'At Risk' | 'Inactive' | 'Invite Pending';

export interface Student {
    id: string;
    name: string;
    cohort: 'Level 2' | 'Level 3A' | 'Level 3B';
    status: StudentStatus;
    username: string;
    password?: string;
    email?: string;
    phone?: string;
    dob?: string;
    address?: string;
    avatar?: string;
    xp?: number;
    balance?: number;
    department?: 'music' | 'performing_arts';
    predicted_grade?: string;
    grades?: any[];
    notes?: any[];
}
