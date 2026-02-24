-- Database Performance Optimization Indexes

-- Improve speed of checking completed content for a user
CREATE INDEX IF NOT EXISTS idx_content_completion_user_id ON content_completion(user_id);

-- Improve speed of fetching student submissions
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);

-- Improve speed of fetching project-specific submissions
CREATE INDEX IF NOT EXISTS idx_submissions_project_id ON submissions(project_id);

-- Improve speed of fetching tasks for a specific project
CREATE INDEX IF NOT EXISTS idx_curriculum_tasks_project_id ON curriculum_tasks(project_id);

-- Improve speed of fetching notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Optimize profile lookups by common filters
CREATE INDEX IF NOT EXISTS idx_profiles_role_department ON profiles(role, department);
