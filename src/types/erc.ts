export type ProjectType = 'Song' | 'EP' | 'Album';
export type ProjectStatus = 'Demo' | 'Recording' | 'Mixing' | 'Mastering' | 'Released';
export type ResourceType = 'Studio' | 'Booth' | 'Equipment' | 'Room';
export type BookingStatus = 'Confirmed' | 'Cancelled' | 'Completed';

export interface ErcProject {
    id: string;
    title: string;
    type: ProjectType;
    status: ProjectStatus;
    genre?: string;
    description?: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
    // Joins
    tracks?: ErcTrack[];
    collaborators?: ErcCollaboration[];
}

export interface ErcTrack {
    id: string;
    project_id: string;
    title: string;
    status: string;
    duration?: number;
    order_index: number;
    created_at: string;
}

export interface ErcCollaboration {
    id: string;
    project_id: string;
    user_id: string;
    role: string;
    joined_at: string;
}

export interface ErcResource {
    id: string;
    name: string;
    type: ResourceType;
    description?: string;
    capacity: number;
    is_active: boolean;
    created_at: string;
}

export interface ErcBooking {
    id: string;
    resource_id: string;
    booker_id: string;
    start_time: string;
    end_time: string;
    purpose?: string;
    status: BookingStatus;
    created_at: string;
    // Joins
    resource?: ErcResource;
}
