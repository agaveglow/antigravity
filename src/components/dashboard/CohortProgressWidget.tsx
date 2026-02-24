import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import { useStudents } from '../../context/StudentsContext';
import { useQuizzes } from '../../context/QuizContext';
import { useCurriculum } from '../../context/CurriculumContext';
import { useSubmissions } from '../../context/SubmissionContext';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CohortStats {
    cohort: string;
    studentCount: number;
    averageProgress: number;
    color: string;
}

const CohortProgressWidget: React.FC = () => {
    const { students } = useStudents();
    const { courses, quizzes, lessons, walkthroughs } = useQuizzes();
    const { projects } = useCurriculum();
    const { submissions } = useSubmissions();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<CohortStats[]>([]);
    const [overallAvg, setOverallAvg] = useState(0);

    useEffect(() => {
        calculateCohortProgress();
    }, [students, courses, projects, submissions]);

    const calculateCohortProgress = async () => {
        setLoading(true);
        try {
            // Fetch all progress records once
            const { data: allProgress, error } = await supabase
                .from('student_progress')
                .select('student_id, content_id, completed');

            if (error) throw error;

            // Define Cohorts
            const cohorts = [
                { name: 'Level 2', color: 'var(--color-brand-blue)' },
                { name: 'Level 3A', color: 'var(--color-brand-purple)' },
                { name: 'Level 3B', color: 'var(--color-brand-orange)' }
            ];

            // --- Pre-process data for speed ---

            // 1. Map progress by student_id
            const progressByStudent = (allProgress || []).reduce((acc: Record<string, any[]>, p) => {
                if (!acc[p.student_id]) acc[p.student_id] = [];
                acc[p.student_id].push(p);
                return acc;
            }, {});

            // 2. Map submissions by studentId
            const submissionsByStudent = submissions.reduce((acc: Record<string, any[]>, s) => {
                if (!acc[s.studentId]) acc[s.studentId] = [];
                acc[s.studentId].push(s);
                return acc;
            }, {});

            // 3. Pre-calculate course item counts and IDs
            const courseItemsMap = courses.map(course => {
                const items = [...quizzes, ...lessons, ...walkthroughs].filter(i => i.courseId === course.id);
                return { courseId: course.id, itemIds: items.map(i => i.id) };
            }).filter(c => c.itemIds.length > 0);

            // 4. Pre-calculate project task counts
            const projectTaskCounts = projects.map(p => ({ id: p.id, total: p.tasks.length || 4 }));

            // --- Compute Stats ---

            const cohortStats: CohortStats[] = [];
            let totalProgressSum = 0;
            let totalActiveStudentsCount = 0;

            cohorts.forEach(c => {
                const cohortStudents = students.filter(s => s.cohort === c.name && s.status === 'Active');

                if (cohortStudents.length === 0) {
                    cohortStats.push({ cohort: c.name, studentCount: 0, averageProgress: 0, color: c.color });
                    return;
                }

                let cohortTotalPercent = 0;

                cohortStudents.forEach(student => {
                    const studentProgress = progressByStudent[student.id] || [];
                    const studentSubmissions = submissionsByStudent[student.id] || [];

                    // 1. Course Progress
                    let coursePercentSum = 0;
                    courseItemsMap.forEach(cm => {
                        const completedCount = studentProgress.filter(p => cm.itemIds.includes(p.content_id) && p.completed).length;
                        coursePercentSum += (completedCount / cm.itemIds.length);
                    });
                    const avgCourseProgress = courseItemsMap.length > 0 ? (coursePercentSum / courseItemsMap.length) * 100 : 0;

                    // 2. Project Progress
                    let projectPercentSum = 0;
                    projectTaskCounts.forEach(pm => {
                        const verifiedCount = studentSubmissions.filter(s => s.projectId === pm.id && (s.status === 'Verified' || s.status === 'Graded' || s.ivStatus === 'Verified')).length;
                        projectPercentSum += (verifiedCount / pm.total);
                    });
                    const avgProjectProgress = projectTaskCounts.length > 0 ? (projectPercentSum / projectTaskCounts.length) * 100 : 0;

                    // Combined Average (50/50 weight for now)
                    const studentOverall = (avgCourseProgress + avgProjectProgress) / 2;
                    cohortTotalPercent += studentOverall;
                });

                const avg = Math.round(cohortTotalPercent / cohortStudents.length);

                cohortStats.push({
                    cohort: c.name,
                    studentCount: cohortStudents.length,
                    averageProgress: avg,
                    color: c.color
                });

                totalProgressSum += cohortTotalPercent;
                totalActiveStudentsCount += cohortStudents.length;
            });

            setStats(cohortStats);
            setOverallAvg(totalActiveStudentsCount > 0 ? Math.round(totalProgressSum / totalActiveStudentsCount) : 0);

        } catch (err) {
            console.error('Error calculating cohort progress:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            elevated
            hover
            onClick={() => navigate('/teacher/progress')} // Or make dynamic based on role
            style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        padding: '10px', borderRadius: '12px',
                        background: 'rgba(0, 188, 212, 0.1)', color: 'var(--color-brand-cyan)'
                    }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Cohort Progression</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Real-time completion tracking</p>
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-subtle)', padding: '4px 12px', borderRadius: '20px',
                    fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    <Users size={14} /> All Students
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {loading ? '...' : `${overallAvg}%`}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Average Completion</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {stats.map(s => (
                    <div key={s.cohort}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.cohort}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{loading ? '-' : `${s.averageProgress}%`}</span>
                        </div>
                        <ProgressBar
                            current={s.averageProgress}
                            total={100}
                            showPercentage={false}
                            color={s.color}
                            height="6px"
                        />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-brand-blue)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    View Full Report <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                </span>
            </div>
        </Card>
    );
};

export default CohortProgressWidget;
