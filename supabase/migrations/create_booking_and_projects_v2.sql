-- 1. Create Availability Table (Teacher-defined slots)
CREATE TABLE IF NOT EXISTS erc_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES erc_resources(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_slots INTEGER DEFAULT 1,
    current_slots INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent overlaps for the same resource by the same teacher
    CONSTRAINT no_availability_overlap EXCLUDE USING gist (
        resource_id WITH =,
        teacher_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);

-- 2. Create Tasks Table (Project Tracker)
CREATE TABLE IF NOT EXISTS erc_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES erc_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Blocked', 'Completed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add booking_id to erc_bookings if we want to link bookings to availability
-- For simplicity in this demo, we'll just keep them separate but students will create bookings based on availability slots.
-- We'll add a link optionally if needed.

-- 3. RLS POLICIES
ALTER TABLE erc_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE erc_tasks ENABLE ROW LEVEL SECURITY;

-- Availability: Everyone can view (to book), Teachers can manage
CREATE POLICY "Anyone can view availability" ON erc_availability
    FOR SELECT USING (true);

CREATE POLICY "Teachers can manage availability" ON erc_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Teacher', 'Admin')
        )
    );

-- Tasks: View if can view project, edit if owner/collaborator
CREATE POLICY "View tasks if can view project" ON erc_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM erc_projects p 
            WHERE p.id = project_id 
            AND (p.owner_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM erc_collaborations WHERE project_id = p.id))
        )
    );

CREATE POLICY "Manage tasks if owner or collaborator" ON erc_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM erc_projects p 
            WHERE p.id = project_id 
            AND (p.owner_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM erc_collaborations WHERE project_id = p.id))
        )
    );

-- 4. Update erc_projects to allow teacher assignment
-- We'll add a 'target_student_id' if the teacher creates it for them.
ALTER TABLE erc_projects ADD COLUMN IF NOT EXISTS target_student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS for projects to allow target students to see them
DROP POLICY IF EXISTS "Users can view their own or collaborated projects" ON erc_projects;
CREATE POLICY "Users can view their own, collaborated or assigned projects" ON erc_projects
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() = target_student_id OR
        auth.uid() IN (SELECT user_id FROM erc_collaborations WHERE project_id = id)
    );
