import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useQuizzes } from '../../context/QuizContext';
import { useCurriculum } from '../../context/CurriculumContext';
import { useSubmissions } from '../../context/SubmissionContext';
import ProgressBar from '../common/ProgressBar';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface DetailedStudentProgressProps {
    studentId: string;
}

const DetailedStudentProgress: React.FC<DetailedStudentProgressProps> = ({ studentId }) => {
    const { courses, quizzes, lessons, walkthroughs, stages, modules } = useQuizzes();
    const { projects } = useCurriculum();
    const { submissions } = useSubmissions();

    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState<{
        courseProgress: Record<string, number>;
        projectProgress: Record<string, number>;
        studentProgress: any[];
    } | null>(null);

    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [expandedStages, setExpandedStages] = useState<string[]>([]);

    useEffect(() => {
        calculateProgress();
    }, [studentId, courses, projects, submissions]);

    const calculateProgress = async () => {
        setLoading(true);
        try {
            // Fetch progress for this specific student
            const { data: studentProgress, error } = await supabase
                .from('student_progress')
                .select('*')
                .eq('student_id', studentId);

            if (error) throw error;

            const studentSubmissions = submissions.filter(s => s.studentId === studentId);

            // --- Calculate Course Progress ---
            const courseProgress: Record<string, number> = {};
            courses.forEach(course => {
                const cQuizzes = quizzes.filter(q => q.courseId === course.id);
                const cLessons = lessons.filter(l => l.courseId === course.id);
                const cWalkthroughs = walkthroughs.filter(w => w.courseId === course.id);
                const totalItems = cQuizzes.length + cLessons.length + cWalkthroughs.length;

                if (totalItems === 0) {
                    courseProgress[course.id] = 0;
                    return;
                }

                const completedCount = (studentProgress || []).filter(p => {
                    if (!p.completed) return false;
                    const validIds = [...cQuizzes, ...cLessons, ...cWalkthroughs].map(i => i.id);
                    return validIds.includes(p.content_id);
                }).length;

                courseProgress[course.id] = Math.round((completedCount / totalItems) * 100);
            });

            // --- Calculate Project Progress ---
            const projectProgress: Record<string, number> = {};
            projects.forEach(project => {
                const totalTasks = project.tasks.length;
                if (totalTasks === 0) {
                    projectProgress[project.id] = 0;
                    return;
                }

                // Count verified tasks
                const verifiedTasks = studentSubmissions.filter(s =>
                    s.projectId === project.id &&
                    (s.status === 'Verified' || s.status === 'Graded')
                ).length;

                projectProgress[project.id] = Math.round((verifiedTasks / totalTasks) * 100);
            });

            setProgressData({ courseProgress, projectProgress, studentProgress: studentProgress || [] });

        } catch (error) {
            console.error('Error calculating individual progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStage = (stageId: string) => {
        setExpandedStages(prev =>
            prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
        );
    };

    const renderCourseDetails = () => {
        if (!selectedCourse || !progressData) return null;
        const course = courses.find(c => c.id === selectedCourse);
        if (!course) return null;

        const courseStages = stages.filter(s => s.courseId === course.id).sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
            <div>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    {course.title} Breakdown
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {courseStages.map(stage => {
                        const stageModules = modules.filter(m => m.stageId === stage.id).sort((a, b) => (a.order || 0) - (b.order || 0));

                        // Calculate Stage Progress
                        const stageContent = [
                            ...quizzes.filter(q => q.courseId === course.id && stageModules.some(m => m.id === q.moduleId)),
                            ...lessons.filter(l => l.courseId === course.id && stageModules.some(m => m.id === l.moduleId)),
                            ...walkthroughs.filter(w => w.courseId === course.id && stageModules.some(m => m.id === w.moduleId))
                        ];

                        // Also include direct content if any (though usually in modules)

                        const completedStageContent = stageContent.filter(c =>
                            progressData.studentProgress.some(p => p.content_id === c.id && p.completed)
                        );

                        const stageProgress = stageContent.length > 0
                            ? Math.round((completedStageContent.length / stageContent.length) * 100)
                            : 0;

                        const isExpanded = expandedStages.includes(stage.id);

                        return (
                            <div key={stage.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                <div
                                    onClick={() => toggleStage(stage.id)}
                                    style={{
                                        padding: '12px 16px',
                                        background: 'var(--bg-surface)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        {stage.title}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '0.9rem', color: stageProgress === 100 ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                                            {stageProgress}%
                                        </span>
                                        <div style={{ width: '80px' }}>
                                            <ProgressBar current={stageProgress} total={100} showPercentage={false} height="6px" />
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={{ padding: '16px', background: 'var(--bg-base)' }}>
                                        {stageModules.length === 0 ? (
                                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No modules in this stage.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {stageModules.map(module => {
                                                    const moduleContent = [
                                                        ...quizzes.filter(q => q.moduleId === module.id),
                                                        ...lessons.filter(l => l.moduleId === module.id),
                                                        ...walkthroughs.filter(w => w.moduleId === module.id)
                                                    ];

                                                    const completedModuleContent = moduleContent.filter(c =>
                                                        progressData.studentProgress.some(p => p.content_id === c.id && p.completed)
                                                    );

                                                    const moduleProgress = moduleContent.length > 0
                                                        ? Math.round((completedModuleContent.length / moduleContent.length) * 100)
                                                        : 0;

                                                    return (
                                                        <div key={module.id}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                                                <span>{module.title}</span>
                                                                <span style={{ color: 'var(--text-secondary)' }}>{moduleProgress}%</span>
                                                            </div>
                                                            <ProgressBar
                                                                current={moduleProgress}
                                                                total={100}
                                                                showPercentage={false}
                                                                height="6px"
                                                                color="var(--color-brand-blue)"
                                                            />
                                                            {/* Optional: Show individual items if needed for super detail */}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {courseStages.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No stages found for this course.</div>
                    )}
                </div>
            </div>
        );
    };

    const renderProjectDetails = () => {
        if (!selectedProject || !progressData) return null;
        const project = projects.find(p => p.id === selectedProject);
        if (!project) return null;

        const studentSubmissions = submissions.filter(s => s.studentId === studentId && s.projectId === selectedProject);

        return (
            <div>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    {project.title} Tasks
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {project.tasks.map((task, index) => {
                        const submission = studentSubmissions.find(s => s.taskId === task.id || s.taskTitle === task.title); // Fallback to title if IDs drift, but ID preferred
                        const status = submission ? submission.status : 'Not Started';

                        return (
                            <div key={task.id || index} style={{
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'var(--bg-surface)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                                    {/* <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Type: {task.type}
                                    </div> */}
                                </div>
                                <span style={{
                                    fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px',
                                    fontWeight: 600,
                                    background: status === 'Verified' ? 'var(--color-success)' :
                                        status === 'Graded' ? 'var(--color-brand-purple)' :
                                            status === 'Pending Mark' ? 'var(--color-brand-orange)' :
                                                status === 'Resubmission Required' ? 'var(--color-error)' : 'var(--bg-input)',
                                    color: status === 'Pending Mark' || status === 'Not Started' ? 'var(--text-primary)' : 'white'
                                }}>
                                    {status}
                                </span>
                            </div>
                        );
                    })}
                    {project.tasks.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No tasks defined for this project.</div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div>Loading progress...</div>;
    if (!progressData) return <div>No progress data available</div>;

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Courses Column */}
                <div>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Courses</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {courses.map(course => (
                            <div
                                key={course.id}
                                onClick={() => setSelectedCourse(course.id)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    padding: '8px',
                                    borderRadius: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {course.title} <ChevronRight size={14} color="var(--text-tertiary)" />
                                    </span>
                                    <span>{progressData.courseProgress[course.id] || 0}%</span>
                                </div>
                                <ProgressBar
                                    current={progressData.courseProgress[course.id] || 0}
                                    total={100}
                                    showPercentage={false}
                                    color={course.color || 'var(--color-brand-cyan)'}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Projects Column */}
                <div>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Projects</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => setSelectedProject(project.id)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    padding: '8px',
                                    borderRadius: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {project.title} <ChevronRight size={14} color="var(--text-tertiary)" />
                                    </span>
                                    <span>{progressData.projectProgress[project.id] || 0}%</span>
                                </div>
                                <ProgressBar
                                    current={progressData.projectProgress[project.id] || 0}
                                    total={100}
                                    showPercentage={false}
                                    color="var(--color-brand-purple)"
                                />
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No projects assigned</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Drill-down Modals */}
            <Modal isOpen={!!selectedCourse} onClose={() => { setSelectedCourse(null); setExpandedStages([]); }}>
                <div style={{ padding: '20px', minWidth: '600px', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
                    {renderCourseDetails()}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button onClick={() => setSelectedCourse(null)}>Close</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!selectedProject} onClose={() => setSelectedProject(null)}>
                <div style={{ padding: '20px', minWidth: '500px', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                    {renderProjectDetails()}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button onClick={() => setSelectedProject(null)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DetailedStudentProgress;
