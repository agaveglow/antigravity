import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useCurriculum } from '../../context/CurriculumContext';
import { useSubmissions } from '../../context/SubmissionContext';
import { useUser } from '../../context/UserContext';

const DueDateChecker: React.FC = () => {
    const { createNotification, notifications } = useNotifications();
    const { projects } = useCurriculum();
    const { getSubmissionByTask } = useSubmissions();
    const { user } = useUser();

    useEffect(() => {
        if (!user) return;

        const checkDueDates = async () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);

            projects.forEach(project => {
                project.tasks.forEach(task => {
                    if (task.deadline) {
                        const deadline = new Date(task.deadline);

                        // Check if deadline is within the next 24 hours and hasn't passed more than an hour ago
                        // (Use a window to avoid spamming if the user logs in right after deadline)
                        const diffMs = deadline.getTime() - now.getTime();
                        const diffHours = diffMs / (1000 * 60 * 60);

                        if (diffHours > 0 && diffHours <= 24) {
                            // Check if already notified recently (or at all for this task)
                            // Ideally, we'd store "lastChecked" or "notifiedTasks" in local storage or DB
                            // For this MVP, we'll check if a similar notification exists in the current list

                            const alreadyNotified = notifications.some(n =>
                                n.title === 'Upcoming Deadline' &&
                                n.message.includes(task.title) &&
                                !n.isRead // If they read it, maybe remind again? No, let's assume one is enough for now logic-wise
                            );

                            const isSubmitted = getSubmissionByTask(task.id, user.id);

                            if (!alreadyNotified && !isSubmitted) {
                                createNotification(
                                    user.id,
                                    'Upcoming Deadline',
                                    `Task "${task.title}" is due in ${Math.ceil(diffHours)} hours.`,
                                    'deadline',
                                    `/student/task/${task.id}`
                                );
                            }
                        }
                    }
                });
            });
        };

        // Run check on mount and every hour
        checkDueDates();
        const interval = setInterval(checkDueDates, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user, projects, notifications]); // Dependencies might cause re-runs, but logic prevents dupes

    return null; // This component renders nothing
};

export default DueDateChecker;
