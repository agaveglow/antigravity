-- Fix infinite recursion for ERC Projects and Collaborations

-- 1. Helper function to check access safely (Bypasses RLS recursion using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_project_access(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM erc_projects
    WHERE id = target_project_id
    AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM erc_collaborations
    WHERE project_id = target_project_id
    AND user_id = auth.uid()
  );
$$;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own or collaborated projects" ON erc_projects;
DROP POLICY IF EXISTS "View projects" ON erc_projects;
DROP POLICY IF EXISTS "View collaborations" ON erc_collaborations;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON erc_collaborations;
DROP POLICY IF EXISTS "Manage collaborators" ON erc_collaborations;

-- 3. Apply new non-recursive policies

-- PROJECTS
CREATE POLICY "Users can view their own or collaborated projects" ON erc_projects
    FOR SELECT USING (
        has_project_access(id)
    );

-- COLLABORATIONS
CREATE POLICY "View collaborations" ON erc_collaborations
    FOR SELECT USING (
        user_id = auth.uid() OR has_project_access(project_id)
    );

CREATE POLICY "Project owners can manage collaborators" ON erc_collaborations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM erc_projects
            WHERE id = erc_collaborations.project_id
            AND owner_id = auth.uid()
        )
    );
