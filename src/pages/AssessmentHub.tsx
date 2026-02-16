import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Clock, AlertCircle, Search, Filter, CheckCircle2, MoreHorizontal, Bell } from 'lucide-react';
import { useState } from 'react';
import { useSubmissions } from '../context/SubmissionContext';
import { useLanguage } from '../context/LanguageContext';
import { useStudents } from '../context/StudentsContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useAssessment } from '../context/AssessmentContext';
import PageTransition from '../components/common/PageTransition';

const AssessmentHub: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { submissions } = useSubmissions();
    const { students, updateStudent } = useStudents();
    const { projects } = useCurriculum();
    const { getAssessment } = useAssessment();
    const [activeTab, setActiveTab] = useState<'Submissions' | 'Matrix'>('Submissions');
    const [filter, setFilter] = useState<'All' | 'Pending Mark' | 'Late' | 'Graded' | 'Verification Requests'>('All');

    const verificationRequests = submissions.filter(s => s.verificationRequested && !s.verifiedAt);

    const displaySubmissions = filter === 'All'
        ? submissions
        : filter === 'Verification Requests'
            ? verificationRequests
            : submissions.filter(s => s.status === filter);

    const stats = [
        { label: 'Verification Requests', value: verificationRequests.length, color: 'var(--color-brand-orange)' },
        { label: t('teacher.assessment.stat.pending'), value: submissions.filter(s => s.status === 'Pending Mark').length, color: 'var(--color-info)' },
        { label: t('teacher.assessment.stat.late'), value: submissions.filter(s => s.status === 'Late').length, color: 'var(--color-warning)' },
        { label: t('teacher.assessment.stat.completed'), value: submissions.filter(s => s.status === 'Graded').length, color: 'var(--color-success)' },
    ];

    return (
        <PageTransition>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{t('teacher.assessment.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('teacher.assessment.subtitle')}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            style={{ marginTop: 'var(--space-2)' }}
                            onClick={() => navigate('/teacher/verification')}
                        >
                            <CheckCircle2 size={16} style={{ marginRight: '8px' }} />
                            {t('teacher.assessment.verify')}
                        </Button>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        {stats.map(stat => (
                            <Card key={stat.label} style={{ padding: 'var(--space-2) var(--space-6)', minWidth: '140px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                    <Button
                        variant={activeTab === 'Submissions' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('Submissions')}
                    >
                        Submissions Feed
                    </Button>
                    <Button
                        variant={activeTab === 'Matrix' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('Matrix')}
                    >
                        Grades Matrix
                    </Button>
                </div>

                {activeTab === 'Submissions' ? (
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
                                            border: '1px solid var(--border-color)', background: 'var(--bg-input)'
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
                ) : (
                    <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                    <tr>
                                        <th style={{ padding: '16px', minWidth: '200px' }}>Student</th>
                                        <th style={{ padding: '16px', minWidth: '120px' }}>Predicted Grade</th>
                                        {projects.slice(0, 5).map(p => (
                                            <th key={p.id} style={{ padding: '16px', minWidth: '120px', fontSize: '0.8rem' }}>
                                                {(p.title || '').length > 20 ? (p.title || '').substring(0, 20) + '...' : (p.title || 'Unknown')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
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
                                            {projects.slice(0, 5).map(p => {
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
                )}

                {displaySubmissions.length === 0 && (
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
