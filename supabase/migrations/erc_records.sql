-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS erc_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Song', 'EP', 'Album')),
    status TEXT NOT NULL DEFAULT 'Demo' CHECK (status IN ('Demo', 'Recording', 'Mixing', 'Mastering', 'Released')),
    genre TEXT,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Tracks Table (for EPs/Albums)
CREATE TABLE IF NOT EXISTS erc_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES erc_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Demo',
    duration INTEGER, -- duration in seconds
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Collaborations Table
CREATE TABLE IF NOT EXISTS erc_collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES erc_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- e.g. 'Producer', 'Vocalist'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 4. Create Resources Table (Studios, Booths)
CREATE TABLE IF NOT EXISTS erc_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Studio', 'Booth', 'Equipment', 'Room')),
    description TEXT,
    capacity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Bookings Table
CREATE TABLE IF NOT EXISTS erc_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES erc_resources(id) ON DELETE CASCADE,
    booker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT,
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent simple overlaps (though specialized logic usually handled in app/edge function for complex recurring)
    CONSTRAINT no_overlap EXCLUDE USING gist (
        resource_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);

-- RLS POLICIES
ALTER TABLE erc_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE erc_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE erc_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE erc_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE erc_bookings ENABLE ROW LEVEL SECURITY;

-- Projects: View own or collaborated
CREATE POLICY "Users can view their own or collaborated projects" ON erc_projects
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT user_id FROM erc_collaborations WHERE project_id = id)
    );

CREATE POLICY "Users can create projects" ON erc_projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update projects" ON erc_projects
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete projects" ON erc_projects
    FOR DELETE USING (auth.uid() = owner_id);

-- Tracks: inherit project permissions roughly
CREATE POLICY "View tracks if can view project" ON erc_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM erc_projects p 
            WHERE p.id = project_id 
            AND (p.owner_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM erc_collaborations WHERE project_id = p.id))
        )
    );
    
CREATE POLICY "Edit tracks if project owner or collaborator" ON erc_tracks
    FOR ALL USING (
         EXISTS (
            SELECT 1 FROM erc_projects p 
            WHERE p.id = project_id 
            AND (p.owner_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM erc_collaborations WHERE project_id = p.id))
        )
    );

-- Collaborations
CREATE POLICY "View collaborations" ON erc_collaborations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM erc_projects WHERE id = project_id AND owner_id = auth.uid())
    );

CREATE POLICY "Project owners can manage collaborators" ON erc_collaborations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM erc_projects WHERE id = project_id AND owner_id = auth.uid())
    );

-- Resources: Public read, Admin write (mocking admin as specific email or role for now, or just open for this demo context if requested, but sticking to plan: teachers/admin)
-- For this simplified app, we'll allow Authenticated Users to READ resources.
CREATE POLICY "Authenticated users can view resources" ON erc_resources
    FOR SELECT TO authenticated USING (true);

-- Bookings: 
CREATE POLICY "Users view all confirmed bookings (for availability)" ON erc_bookings
    FOR SELECT USING (true);

CREATE POLICY "Users can create own bookings" ON erc_bookings
    FOR INSERT WITH CHECK (auth.uid() = booker_id);

CREATE POLICY "Users can manage own bookings" ON erc_bookings
    FOR UPDATE USING (auth.uid() = booker_id);

CREATE POLICY "Users can cancel own bookings" ON erc_bookings
    FOR DELETE USING (auth.uid() = booker_id);
