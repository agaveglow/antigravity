-- Backfill notifications for pending verification requests
-- Run this script to generate notifications for any verification requests that were missed.

DO $$
DECLARE
    teacher_record RECORD;
    sub_record RECORD;
    notif_count INT := 0;
BEGIN
    -- Loop through all teachers
    FOR teacher_record IN SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
    LOOP
        -- Loop through all pending verification requests
        FOR sub_record IN 
            SELECT s.id, s.student_id, s.student_name, s.task_title, s.verification_requested_at
            FROM submissions s
            WHERE s.verification_requested = TRUE 
            AND (s.verified_at IS NULL)
        LOOP
            -- Check if a similar notification already exists for this teacher/student/task (simple de-duplication)
            -- We check if a notification exists with the same link created in the last 24 hours (or ever, depending on preference)
            IF NOT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.user_id = teacher_record.id
                AND n.type = 'verification'
                AND n.link = '/teacher/assessment?student=' || sub_record.student_id
                AND n.title = 'Verification Request'
                AND n.message LIKE sub_record.student_name || '%'
            ) THEN
                -- Insert Notification
                INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                VALUES (
                    teacher_record.id,
                    'Verification Request',
                    sub_record.student_name || ' requested verification for ' || COALESCE(sub_record.task_title, 'a task'),
                    'verification',
                    '/teacher/assessment?student=' || sub_record.student_id,
                    FALSE,
                    COALESCE(sub_record.verification_requested_at, NOW()) -- Use original request time if available
                );
                notif_count := notif_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Generated % notifications for pending verifications.', notif_count;
END $$;
