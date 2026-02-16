-- FIX INFINITE RECURSION IN ERC POLICIES

-- The issue:
-- 1. "View projects" policy on erc_projects checks erc_collaborations.
-- 2. "View collaborations" policy on erc_collaborations checks erc_projects (to see if you're the owner).
-- This creates a loop.

-- The solution:
-- Use a SECURITY DEFINER function to check project access without triggering RLS.

-- 1. CREATE HELPER FUNCTION
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to avoid recursion
SET search_path = public
AS $$
BEGIN
    -- Check if user is owner OR collaborator
    RETURN EXISTS (
        SELECT 1 
        FROM erc_projects 
        WHERE id = p_project_id AND owner_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 
        FROM erc_collaborations 
        WHERE project_id = p_project_id AND user_id = auth.uid()
    );
END;
$$;

-- 2. DROP EXISTING POLICIES (To be safe)
DROP POLICY IF EXISTS "View projects" ON erc_projects;
DROP POLICY IF EXISTS "Create projects" ON erc_projects;
DROP POLICY IF EXISTS "Update own projects" ON erc_projects;
DROP POLICY IF EXISTS "Update collaborated projects" ON erc_projects;
DROP POLICY IF EXISTS "Delete own projects" ON erc_projects;

DROP POLICY IF EXISTS "View collaborations" ON erc_collaborations;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON erc_collaborations;


-- 3. RECREATE POLICIES FOR ERC_PROJECTS

-- Everyone can view published projects OR projects they are a member of
CREATE POLICY "View projects" ON erc_projects
FOR SELECT TO authenticated
USING (
    status = 'Published' 
    OR owner_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM erc_collaborations 
        WHERE project_id = id AND user_id = auth.uid()
    )
);

CREATE POLICY "Create projects" ON erc_projects
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Update own projects" ON erc_projects
FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Update collaborated projects" ON erc_projects
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM erc_collaborations 
        WHERE project_id = id AND user_id = auth.uid() AND role = 'editor'
    )
);

CREATE POLICY "Delete own projects" ON erc_projects
FOR DELETE TO authenticated
USING (owner_id = auth.uid());


-- 4. RECREATE POLICIES FOR ERC_COLLABORATIONS

-- Members can see collaborators
CREATE POLICY "View collaborations" ON erc_collaborations
FOR SELECT TO authenticated
USING (
    is_project_member(project_id)
);

-- Only owners can manage collaborators
-- We need another helper or just a direct check against projects TABLE (not policy)
-- But standard policies can query other tables. The key is strict ordering.
-- "is_project_member" breaks the recursion for SELECT.

CREATE POLICY "Manage collaborators" ON erc_collaborations
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM erc_projects 
        WHERE id = erc_collaborations.project_id AND owner_id = auth.uid()
    )
);
