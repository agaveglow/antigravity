import React, { useState, useEffect } from 'react';
import DetailedStudentProgress from '../components/curriculum/DetailedStudentProgress';
import { supabase } from '../lib/supabase';
import { useStudents } from '../context/StudentsContext';
import { useQuizzes } from '../context/QuizContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useSubmissions } from '../context/SubmissionContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import PageTransition from '../components/common/PageTransition';
import { Search, Filter, Download, Trophy, Coins } from 'lucide-react';

interface StudentProgressFull {
    studentId: string;
    studentName: string;
    totalXp: number;
    totalDowdBucks: number;
    courseProgress: Record<string, number>; // courseId -> percentage
    projectProgress: Record<string, number>; // projectId -> percentage
    overallProgress: number; // Combined average
    lastActive?: string;
}

const StudentProgressDashboard: React.FC = () => {
    const { students } = useStudents();
    const { courses, quizzes, lessons, walkthroughs } = useQuizzes();
    const { projects } = useCurriculum();
    const { submissions } = useSubmissions();

    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState<StudentProgressFull[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentProgressFull | null>(null);

    useEffect(() => {
        fetchAllProgress();
    }, [students, courses, projects, submissions]);

    const fetchAllProgress = async () => {
        setLoading(true);
        try {
            // Fetch all progress records
            const { data: allProgress, error } = await supabase
                .from('student_progress')
                .select('*');

            if (error) throw error;

            // Process data per student
            const stats = students.map((student: any) => {
                const studentProgress = allProgress?.filter(p => p.student_id === student.id) || [];
                const studentSubmissions = submissions.filter(s => s.studentId === student.id);

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

                    const completedCount = studentProgress.filter(p => {
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
                        (s.status === 'Verified' || s.status === 'Graded') // Assuming Graded counts as done too
                    ).length;

                    projectProgress[project.id] = Math.round((verifiedTasks / totalTasks) * 100);
                });

                // --- Overall Progress ---
                // Average of all course percentages and all project percentages
                const coursePercentages = Object.values(courseProgress);
                const projectPercentages = Object.values(projectProgress);
                const allPercentages = [...coursePercentages, ...projectPercentages];

                const overallProgress = allPercentages.length > 0
                    ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
                    : 0;

                // Find last active date
                const lastActive = studentProgress.length > 0
                    ? studentProgress.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
                    : undefined;

                // Get name from profile, fallback to 'Unknown'
                const displayName = student.name || student.username || 'Unknown Student';

                return {
                    studentId: student.id,
                    studentName: displayName,
                    totalXp: student.xp || 0,
                    totalDowdBucks: student.balance || 0,
                    courseProgress,
                    projectProgress,
                    overallProgress,
                    lastActive
                };
            });

            setProgressData(stats);

        } catch (error) {
            console.error('Error calculating progress stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = progressData.filter(student => {
        const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <PageTransition>
            <div className={`dashboard-container ${selectedStudent ? 'viewing-student' : ''}`} style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>

                {/* Screen UI */}
                <div className="dashboard-ui">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2rem' }}>Student Progress Dashboard</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Monitor student completion and rewards across all courses
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Download size={18} style={{ marginRight: '8px' }} /> Export Report
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card elevated style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Search Students</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 10px 10px 40px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Filter by Course</label>
                                <div style={{ position: 'relative' }}>
                                    <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <select
                                        value={selectedCourseId}
                                        onChange={(e) => setSelectedCourseId(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 10px 10px 40px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="all">All Courses</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Data Grid */}
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '4rem' }}>Loading progress data...</div>
                        ) : (
                            filteredData.map(student => (
                                <Card
                                    key={student.studentId}
                                    hover
                                    onClick={() => setSelectedStudent(student)}
                                    className="student-progress-card"
                                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>

                                        {/* Student Info */}
                                        <div style={{ flex: '0 0 250px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: 'var(--color-brand-blue)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                            }}>
                                                {student.studentName.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{student.studentName}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    Last active: {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Overall Progress */}
                                        <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <span>Overall</span>
                                                <span>{student.overallProgress}%</span>
                                            </div>
                                            <ProgressBar
                                                current={student.overallProgress}
                                                total={100}
                                                showPercentage={false}
                                                color="var(--color-brand-blue)"
                                            />
                                        </div>

                                        {/* Rewards Stats */}
                                        <div style={{ display: 'flex', gap: '1.5rem', marginRight: 'auto', marginLeft: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-gold)' }}>
                                                <Trophy size={18} />
                                                <span style={{ fontWeight: 600 }}>{student.totalXp} XP</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-purple)' }}>
                                                <Coins size={18} />
                                                <span style={{ fontWeight: 600 }}>${student.totalDowdBucks}</span>
                                            </div>
                                        </div>

                                        {/* Course Overview (Small Breakdown) */}
                                        <div style={{ flex: '1 1 200px', opacity: 0.7 }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                                {courses.map(course => (
                                                    <div key={course.id} style={{ flex: 1, minWidth: '40px', textAlign: 'center' }} title={`${course.title}: ${student.courseProgress[course.id] || 0}%`}>
                                                        <div style={{ height: '40px', width: '6px', background: 'var(--bg-subtle)', borderRadius: '4px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                                                            <div style={{
                                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                                height: `${student.courseProgress[course.id] || 0}%`,
                                                                background: course.color || 'var(--color-brand-cyan)'
                                                            }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Print Summary Table (Hidden on Screen) */}
                <div id="print-summary" style={{ display: 'none' }}>
                    <h1 style={{ marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>Student Progress Report</h1>
                    <p style={{ marginBottom: '20px', color: '#666' }}>Generated on {new Date().toLocaleDateString()}</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', fontFamily: 'sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #999', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Student Name</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Overall Progress</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Total XP</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Balance</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((s, i) => (
                                <tr key={s.studentId} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}><strong>{s.studentName}</strong></td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '50px', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${s.overallProgress}%`, height: '100%', background: '#333' }} />
                                            </div>
                                            {s.overallProgress}%
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>{s.totalXp}</td>
                                    <td style={{ padding: '10px' }}>${s.totalDowdBucks}</td>
                                    <td style={{ padding: '10px' }}>{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Drill-down Modal */}
                {selectedStudent && (
                    <div
                        className="student-modal-overlay"
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            padding: '20px'
                        }}
                        onClick={() => setSelectedStudent(null)}
                    >
                        <Card
                            className="student-modal-content"
                            style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        >
                            <div style={{ position: 'absolute', right: '20px', top: '20px', zIndex: 5, display: 'flex', gap: '12px' }}>
                                <Button size="sm" variant="outline" onClick={() => window.print()} className="print-btn">
                                    <Download size={14} style={{ marginRight: '6px' }} /> Print
                                </Button>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                >
                                    &times;
                                </button>
                            </div>

                            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: 'var(--color-brand-blue)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold'
                                }}>
                                    {selectedStudent.studentName.charAt(0)}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedStudent.studentName}</h2>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <span>Total XP: <strong>{selectedStudent.totalXp}</strong></span>
                                        <span>Balance: <strong>${selectedStudent.totalDowdBucks}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Use the shared Detailed Progress Component */}
                            <DetailedStudentProgress studentId={selectedStudent.studentId} />
                        </Card>
                    </div>
                )}

                <style>{`
                    @media print {
                        /* Global Resets */
                        body, html { 
                            background: white !important; 
                            color: black !important; 
                            height: auto !important; 
                            overflow: visible !important;
                        }
                        nav, header, aside, .sidebar, .print-btn { display: none !important; }

                        /* Hide Main UI by default */
                        .dashboard-ui { display: none !important; }

                        /* SCENARIO 1: VIEWING A STUDENT (MODAL OPEN) */
                        .viewing-student .student-modal-overlay {
                            position: static !important;
                            background: none !important;
                            display: block !important;
                            padding: 0 !important;
                            height: auto !important;
                        }

                        .viewing-student .student-modal-content {
                            box-shadow: none !important;
                            border: none !important;
                            max-width: 100% !important;
                            max-height: none !important;
                            overflow: visible !important;
                            padding: 0 !important;
                        }

                        /* Hide summary table when viewing student */
                        .viewing-student #print-summary { display: none !important; }

                        /* SCENARIO 2: GLOBAL LIST (MODAL CLOSED) */
                        /* Shows when NOT viewing a student */
                        .dashboard-container:not(.viewing-student) #print-summary {
                            display: block !important; 
                        }
                        
                        /* Fix backgrounds for printing */
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                `}</style>
            </div>
        </PageTransition>
    );
};

export default StudentProgressDashboard;
