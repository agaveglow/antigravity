import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuizzes } from './QuizContext';
import { useCurriculum } from './CurriculumContext';
import { useSubmissions } from './SubmissionContext';

export const useStudentProgressData = (studentId: string | undefined) => {
    const { courses, quizzes, lessons, walkthroughs } = useQuizzes();
    const { projects } = useCurriculum();
    const { submissions } = useSubmissions();

    const [progressData, setProgressData] = useState<{
        overallProgress: number;
        courseProgress: Record<string, number>;
        projectProgress: Record<string, number>;
        loading: boolean;
    }>({
        overallProgress: 0,
        courseProgress: {},
        projectProgress: {},
        loading: true
    });

    useEffect(() => {
        if (!studentId) {
            setProgressData(prev => ({ ...prev, loading: false }));
            return;
        }

        const calculateProgress = async () => {
            try {
                // Fetch progress for this specific student
                const { data: studentProgress, error } = await supabase
                    .from('student_progress')
                    .select('*')
                    .eq('student_id', studentId);

                if (error) throw error;

                const studentSubmissions = submissions.filter(s => s.studentId === studentId);

                // --- Calculate Course Progress ---
                let totalCourseItems = 0;
                let completedCourseItems = 0;
                const courseProgress: Record<string, number> = {};

                courses.forEach(course => {
                    const cQuizzes = quizzes.filter(q => q.courseId === course.id);
                    const cLessons = lessons.filter(l => l.courseId === course.id);
                    const cWalkthroughs = walkthroughs.filter(w => w.courseId === course.id);
                    const courseTotal = cQuizzes.length + cLessons.length + cWalkthroughs.length;

                    if (courseTotal === 0) {
                        courseProgress[course.id] = 0;
                        return;
                    }

                    const completedCount = (studentProgress || []).filter(p => {
                        if (!p.completed) return false;
                        const validIds = [...cQuizzes, ...cLessons, ...cWalkthroughs].map(i => i.id);
                        return validIds.includes(p.content_id);
                    }).length;

                    courseProgress[course.id] = Math.round((completedCount / courseTotal) * 100);

                    totalCourseItems += courseTotal;
                    completedCourseItems += completedCount;
                });

                // --- Calculate Project Progress ---
                let totalProjectTasks = 0;
                let completedProjectTasks = 0;
                const projectProgress: Record<string, number> = {};

                projects.forEach(project => {
                    const totalTasks = project.tasks.length;
                    if (totalTasks === 0) {
                        projectProgress[project.id] = 0;
                        return;
                    }

                    const verifiedTasks = studentSubmissions.filter(s =>
                        s.projectId === project.id &&
                        (s.status === 'Verified' || s.status === 'Graded')
                    ).length;

                    projectProgress[project.id] = Math.round((verifiedTasks / totalTasks) * 100);

                    totalProjectTasks += totalTasks;
                    completedProjectTasks += verifiedTasks;
                });

                // --- Calculate Overall Progress ---
                // We can weigh courses and projects equally, or by item count. 
                // Let's weight by total items (tasks + content items)
                const grandTotalItems = totalCourseItems + totalProjectTasks;
                const grandTotalCompleted = completedCourseItems + completedProjectTasks;

                const overallProgress = grandTotalItems > 0
                    ? Math.round((grandTotalCompleted / grandTotalItems) * 100)
                    : 0;

                setProgressData({
                    overallProgress,
                    courseProgress,
                    projectProgress,
                    loading: false
                });

            } catch (error) {
                console.error('Error calculating progress:', error);
                setProgressData(prev => ({ ...prev, loading: false }));
            }
        };

        calculateProgress();
    }, [studentId, courses, projects, submissions, quizzes, lessons, walkthroughs]);

    return progressData;
};
