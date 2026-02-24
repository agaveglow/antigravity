import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import {
    Clock,
    AlertCircle,
    Search,
    Filter,
    CheckCircle2,
    MoreHorizontal,
    Bell,
    Download,
    ClipboardCheck,
    History,
    Users,
    CheckCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useMemo } from 'react';
import { useSubmissions, type Submission } from '../context/SubmissionContext';
import { useLanguage } from '../context/LanguageContext';
import { useStudents } from '../context/StudentsContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useAssessment } from '../context/AssessmentContext';
import { useUser } from '../context/UserContext';
import PageTransition from '../components/common/PageTransition';

const AssessmentHub: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { submissions, updateSubmission } = useSubmissions();
    const { students, updateStudent } = useStudents();
    const { projects } = useCurriculum();
    const { getAssessment } = useAssessment();
    const { user: currentUser } = useUser();

    const [activeTab, setActiveTab] = useState<'Submissions' | 'Matrix' | 'QA'>('Submissions');
    const [filter, setFilter] = useState<'All' | 'Pending Mark' | 'Late' | 'Graded' | 'Verification Requests'>('All');
    const [matrixLevelFilter, setMatrixLevelFilter] = useState<string>('All');
    const [matrixSubjectFilter, setMatrixSubjectFilter] = useState<string>('All');

    // QA State
    const [sampleGenerated, setSampleGenerated] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [ivFeedback, setIvFeedback] = useState('');
    const [isSubmittingIV, setIsSubmittingIV] = useState(false);

    // --- Derived Data ---

    const handleExportPDF = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.text(`Grades Matrix - ${matrixLevelFilter} - ${matrixSubjectFilter === 'All' ? 'All Subjects' : matrixSubjectFilter === 'music' ? 'Music' : 'Performing Arts'}`, 14, 15);

        autoTable(doc, {
            html: '#grades-matrix-table',
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] },
        });

        doc.save(`grades-matrix-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const filteredStudentsForMatrix = useMemo(() => students.filter(s => {
        const matchLevel = matrixLevelFilter === 'All' || s.cohort === matrixLevelFilter;
        const matchSubject = matrixSubjectFilter === 'All' || s.department === matrixSubjectFilter;
        return matchLevel && matchSubject;
    }), [students, matrixLevelFilter, matrixSubjectFilter]);

    const filteredProjectsForMatrix = useMemo(() => projects.filter(p => {
        const matchLevel = matrixLevelFilter === 'All' || p.cohort === matrixLevelFilter;
        const matchSubject = matrixSubjectFilter === 'All' || p.subject === matrixSubjectFilter;
        return matchLevel && matchSubject;
    }), [projects, matrixLevelFilter, matrixSubjectFilter]);

    const verificationRequests = submissions.filter(s => s.verificationRequested && !s.verifiedAt);

    const displaySubmissions = filter === 'All'
        ? submissions
        : filter === 'Verification Requests'
            ? verificationRequests
            : submissions.filter(s => s.status === filter);

    // QA Computations
    const outstandingIVs = useMemo(() => {
        return submissions.filter(s => (s.verificationRequested || s.status === 'Pending Mark') && s.ivStatus !== 'Verified');
    }, [submissions]);

    const verifiedIVs = useMemo(() => {
        return submissions.filter(s => s.ivStatus === 'Verified' || s.status === 'Verified');
    }, [submissions]);

    const complianceRate = useMemo(() => {
        const total = outstandingIVs.length + verifiedIVs.length;
        if (total === 0) return 100;
        return Math.round((verifiedIVs.length / total) * 100);
    }, [outstandingIVs, verifiedIVs]);

    const gradedSubmissions = submissions.filter(s => s.status === 'Graded');
    const samplingTarget = Math.ceil(gradedSubmissions.length * 0.2);
    const sampledCount = verifiedIVs.length;

    const stats = [
        { label: 'Compliance', value: `${complianceRate}%`, color: complianceRate > 80 ? 'var(--color-success)' : 'var(--color-warning)' },
        { label: 'IV Requests', value: outstandingIVs.length, color: outstandingIVs.length > 5 ? 'var(--color-warning)' : 'var(--color-brand-orange)' },
        { label: t('teacher.assessment.stat.pending'), value: submissions.filter(s => s.status === 'Pending Mark').length, color: 'var(--color-info)' },
        { label: t('teacher.assessment.stat.completed'), value: submissions.filter(s => s.status === 'Graded').length, color: 'var(--color-success)' },
    ];

    const getProjectInfo = (projectId: string) => {
        const proj = projects.find(p => p.id === projectId);
        return {
            title: proj?.title || 'Unknown Project',
            unit: proj?.unit || 'Unknown Unit'
        };
    };

    // --- QA Actions ---

    const handleGenerateSample = () => {
        const candidates = submissions.filter(s => s.status === 'Graded' && !s.verificationRequested && !s.ivStatus);
        const sampleSize = Math.min(3, candidates.length);
        const shuffled = [...candidates].sort(() => 0.5 - Math.random());
        setSampleGenerated(shuffled.slice(0, sampleSize));
    };

    const handleOpenIVModal = (submission: Submission) => {
        setSelectedSubmission(submission);
        setIvFeedback(submission.ivFeedback || '');
    };

    const handleConfirmIV = async (status: 'Verified' | 'Action Required') => {
        if (!selectedSubmission || !currentUser) return;
        setIsSubmittingIV(true);
        try {
            await updateSubmission(selectedSubmission.id, {
                ivStatus: status,
                ivFeedback: ivFeedback,
                ivVerifiedBy: currentUser.name,
                status: status === 'Verified' ? 'Verified' : selectedSubmission.status
            });
            setSelectedSubmission(null);
            setIvFeedback('');
        } catch (e) {
            console.error('Failed to sign off IV:', e);
        } finally {
            setIsSubmittingIV(false);
        }
    };

    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                {/* Header aligned with TeacherDashboard */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '2rem',
                            background: 'linear-gradient(45deg, var(--text-primary), var(--text-secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Assessment & QA Hub
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Consolidated tracking for submissions, grades, and IV compliance
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        {stats.slice(0, 3).map(stat => (
                            <Card key={stat.label} style={{ padding: 'var(--space-2) var(--space-4)', minWidth: '120px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
                    {[
                        { id: 'Submissions', label: 'Submissions Feed', icon: <Clock size={18} /> },
                        { id: 'Matrix', label: 'Grades Matrix', icon: <Download size={18} /> },
                        { id: 'QA', label: 'QA & Internal Verification', icon: <ClipboardCheck size={18} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                border: 'none',
                                background: 'none',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginBottom: '-2px'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'Submissions' && (
                    <>
                        <Card elevated style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-2) var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)', paddingRight: 'var(--space-6)' }}>
                                    <Filter size={18} />
                                    <span style={{ fontWeight: 600 }}>{t('teacher.assessment.filter')}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    {['All', 'Verification Requests', 'Pending Mark', 'Late', 'Graded'].map(f => (
                                        <button
                                            key={f}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                background: filter === f ? 'var(--color-primary)' : 'transparent',
                                                color: filter === f ? 'white' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                fontSize: '0.85rem'
                                            }}
                                            onClick={() => setFilter(f as any)}
                                        >
                                            {f === 'All' ? t('teacher.assessment.filter.all') :
                                                f === 'Verification Requests' ? 'Verification Requests' :
                                                    f === 'Pending Mark' ? t('teacher.assessment.filter.pending') :
                                                        f === 'Late' ? t('teacher.assessment.filter.late') :
                                                            t('teacher.assessment.filter.graded')}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ flex: 1 }}></div>
                                <div style={{ position: 'relative', width: '300px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text"
                                        placeholder={t('teacher.assessment.search')}
                                        style={{
                                            width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px',
                                            border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>
                            </div>
                        </Card>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
                            {displaySubmissions.map(sub => (
                                <Card key={sub.id} elevated style={{
                                    borderLeft: `4px solid ${sub.verificationRequested && !sub.verifiedAt ? 'var(--color-brand-orange)' :
                                        sub.status === 'Late' ? 'var(--color-warning)' :
                                            sub.status === 'Graded' ? 'var(--color-success)' : 'var(--color-info)'
                                        }`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '8px',
                                                background: 'var(--bg-input)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {sub.studentName?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0 }}>{sub.studentName}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.studentCohort}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" style={{ padding: 0 }}><MoreHorizontal size={20} /></Button>
                                    </div>

                                    <div style={{ marginBottom: 'var(--space-6)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{(sub as any).taskTitle || (sub as any).task}</div>
                                            {sub.verificationRequested && !sub.verifiedAt && (
                                                <Bell size={16} color="var(--color-brand-orange)" />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {sub.status === 'Late' ? <AlertCircle size={14} color="var(--color-warning)" /> : <Clock size={14} />}
                                            {new Date(sub.submittedAt || '').toLocaleString()}
                                        </div>
                                        {sub.verificationRequested && !sub.verifiedAt && (
                                            <div style={{ marginTop: '8px', padding: '6px 12px', background: 'rgba(255, 171, 0, 0.1)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--color-brand-orange)', fontWeight: 600 }}>
                                                Verification Requested
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                        <Button
                                            size="sm"
                                            variant={sub.status === 'Graded' ? 'outline' : 'primary'}
                                            style={{ flex: 1 }}
                                            onClick={() => navigate(`/teacher/assessment/${sub.id}`)}
                                        >
                                            {sub.status === 'Graded' ? t('teacher.assessment.viewGrade') : t('teacher.assessment.grade')}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'Matrix' && (
                    <>
                        <Card elevated style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-2) var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)', paddingRight: 'var(--space-6)' }}>
                                    <Filter size={18} />
                                    <span style={{ fontWeight: 600 }}>Filter Matrix</span>
                                </div>
                                <select
                                    value={matrixLevelFilter}
                                    onChange={(e) => setMatrixLevelFilter(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                >
                                    <option value="All">All Levels</option>
                                    <option value="Level 2">Level 2</option>
                                    <option value="Level 3A">Level 3A</option>
                                    <option value="Level 3B">Level 3B</option>
                                </select>
                                <select
                                    value={matrixSubjectFilter}
                                    onChange={(e) => setMatrixSubjectFilter(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                >
                                    <option value="All">All Subjects</option>
                                    <option value="music">Music</option>
                                    <option value="performing_arts">Performing Arts</option>
                                </select>
                                <Button variant="outline" onClick={handleExportPDF} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Download size={16} /> Export to PDF
                                </Button>
                            </div>
                        </Card>
                        <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table id="grades-matrix-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                        <tr>
                                            <th style={{ padding: '16px', minWidth: '200px' }}>Student</th>
                                            <th style={{ padding: '16px', minWidth: '120px' }}>Predicted Grade</th>
                                            {filteredProjectsForMatrix.map(p => (
                                                <th key={p.id} style={{ padding: '16px', minWidth: '120px', fontSize: '0.8rem' }}>
                                                    {(p.title || '').length > 20 ? (p.title || '').substring(0, 20) + '...' : (p.title || 'Unknown')}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudentsForMatrix.map(student => (
                                            <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{student.name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{student.cohort}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <select
                                                        value={student.predicted_grade || ''}
                                                        onChange={(e) => updateStudent(student.id, { predicted_grade: e.target.value })}
                                                        style={{
                                                            background: 'var(--bg-input)',
                                                            color: 'var(--text-primary)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '4px',
                                                            padding: '4px 8px',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        <option value="">Not Set</option>
                                                        <option value="Distinction">Distinction</option>
                                                        <option value="Merit">Merit</option>
                                                        <option value="Pass">Pass</option>
                                                        <option value="Fail">Fail</option>
                                                        <option value="Referred">Referred</option>
                                                    </select>
                                                </td>
                                                {filteredProjectsForMatrix.map(p => {
                                                    const assessment = getAssessment(student.id, p.id);
                                                    return (
                                                        <td key={p.id} style={{ padding: '16px' }}>
                                                            {assessment ? (
                                                                <span style={{
                                                                    fontSize: '0.75rem',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    background: assessment.grade === 'Distinction' ? 'var(--color-success)' : 'var(--color-info)',
                                                                    color: 'white',
                                                                    fontWeight: 600
                                                                }}>
                                                                    {assessment.grade}
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No Grade</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}

                {activeTab === 'QA' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 'var(--space-8)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Outstanding IV sign-offs</h3>
                                <Button size="sm" variant="ghost">View All <History size={14} style={{ marginLeft: '4px' }} /></Button>
                            </div>

                            <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                                {outstandingIVs.length === 0 ? (
                                    <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <CheckCircle size={48} style={{ marginBottom: '1rem', color: 'var(--color-success)', opacity: 0.5 }} />
                                        <p>All caught up! No outstanding internal verifications.</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            <tr>
                                                <th style={{ padding: '16px' }}>Student</th>
                                                <th style={{ padding: '16px' }}>Project/Task</th>
                                                <th style={{ padding: '16px' }}>Status</th>
                                                <th style={{ padding: '16px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {outstandingIVs.slice(0, 10).map(item => {
                                                const projInfo = getProjectInfo(item.projectId);
                                                return (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '16px', fontWeight: 700 }}>{item.studentName}</td>
                                                        <td style={{ padding: '16px' }}>
                                                            <div style={{ fontWeight: 600 }}>{projInfo.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.taskTitle}</div>
                                                        </td>
                                                        <td style={{ padding: '16px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span style={{
                                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                                    background: item.status === 'Graded' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 171, 0, 0.1)',
                                                                    color: item.status === 'Graded' ? 'var(--color-success)' : 'var(--color-warning)',
                                                                    fontWeight: 600, width: 'fit-content'
                                                                }}>
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '16px' }}>
                                                            <Button variant="outline" size="sm" onClick={() => handleOpenIVModal(item)}>
                                                                IV Sign-off
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </Card>

                            <h3 style={{ marginTop: 'var(--space-4)' }}>Sampling Status (Verification of Assessment)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                                <Card style={{ background: 'rgba(255, 255, 255, 0.05)', borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)' }}>
                                    <Users size={32} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-2)' }} />
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                                        {sampleGenerated.length > 0
                                            ? `Selected ${sampleGenerated.length} submissions`
                                            : "Select students for random sampling (20%)"}
                                    </p>
                                    {sampleGenerated.length > 0 ? (
                                        <div style={{ width: '100%', marginTop: '1rem' }}>
                                            {sampleGenerated.map(s => (
                                                <div key={s.id} style={{ fontSize: '0.8rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{s.studentName}</span>
                                                    <Button size="sm" variant="ghost" onClick={() => handleOpenIVModal(s)}>Verify</Button>
                                                </div>
                                            ))}
                                            <Button size="sm" variant="outline" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setSampleGenerated([])}>Clear</Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={handleGenerateSample}>Generate Sample</Button>
                                    )}
                                </Card>
                                <Card elevated>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Sampling Progress (Target: 20%)</div>
                                    <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                        <div style={{ width: `${Math.min(100, Math.round((sampledCount / samplingTarget) * 100)) || 0}%`, height: '100%', background: 'var(--color-brand-cyan)' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span>{sampledCount} / {samplingTarget} samples</span>
                                        <span style={{ fontWeight: 600 }}>{Math.min(100, Math.round((sampledCount / samplingTarget) * 100)) || 0}%</span>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            <h3 style={{ margin: 0 }}>Compliance Tools</h3>
                            <Card elevated style={{ border: '1px solid var(--color-brand-purple)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-purple)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Tracking</div>
                                <h4 style={{ margin: '0 0 8px' }}>UAL External Audit Prep</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Ensure all IV forms are digitally signed by end of term.</p>
                                <Button variant="ghost" size="sm" style={{ marginTop: '12px', paddingLeft: 0, color: 'var(--color-brand-purple)' }}>
                                    <Download size={14} style={{ marginRight: '6px' }} /> Download Report
                                </Button>
                            </Card>

                            <Card elevated style={{ border: '1px solid var(--color-brand-orange)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-orange)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Standardisation</div>
                                <h4 style={{ margin: '0 0 8px' }}>Term 2 Portfolio Review</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Check standardisation meet scheduled for Mar 12th.</p>
                            </Card>
                        </div>
                    </div>
                )}

                {/* IV Sign-off Modal */}
                {selectedSubmission && (
                    <Modal
                        isOpen={!!selectedSubmission}
                        onClose={() => setSelectedSubmission(null)}
                        title="Internal Verification (IV) Sign-off"
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div style={{ padding: 'var(--space-4)', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Submission Details</div>
                                <div style={{ fontWeight: 700 }}>{selectedSubmission.studentName}</div>
                                <div style={{ fontSize: '0.85rem' }}>{selectedSubmission.taskTitle || "Project Task"}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>IV Feedback / Notes</label>
                                <textarea
                                    value={ivFeedback}
                                    onChange={(e) => setIvFeedback(e.target.value)}
                                    placeholder="Confirm grading accuracy or specify required actions..."
                                    style={{
                                        width: '100%', height: '120px', padding: '12px', borderRadius: '8px',
                                        border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                                        color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                                <Button
                                    variant="outline"
                                    style={{ flex: 1, borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}
                                    onClick={() => handleConfirmIV('Action Required')}
                                    disabled={isSubmittingIV}
                                >
                                    Action Required
                                </Button>
                                <Button
                                    variant="primary"
                                    style={{ flex: 1, background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                    onClick={() => handleConfirmIV('Verified')}
                                    disabled={isSubmittingIV}
                                >
                                    {isSubmittingIV ? 'Processing...' : 'Verify Assessment'}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}

                {displaySubmissions.length === 0 && activeTab === 'Submissions' && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
                        <CheckCircle2 size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
                        <p>{t('teacher.assessment.noSubmissions')}</p>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default AssessmentHub;
