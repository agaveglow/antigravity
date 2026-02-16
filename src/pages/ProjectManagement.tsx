import React, { useState, useRef } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useStudents } from '../context/StudentsContext';
import { useSubmissions } from '../context/SubmissionContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
    Trash2,
    ExternalLink,
    Users,
    CheckCircle2,
    Clock,
    Filter,
    Search,
    ChevronRight,
    BookOpen,
    Edit3,
    Plus,
    X,
    Save,
    Music,
    FileText,
    Video,
    CheckCircle,
    Circle,
    MessageSquare,
    RotateCcw,
    SaveAll,
    Upload,
    FilePlus,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/common/PageTransition';
import { type ProjectBrief, type Task } from '../types/ual';
import { useLanguage } from '../context/LanguageContext';
import { parseProjectBrief } from '../utils/ualParser';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

const ProjectManagement: React.FC = () => {
    const { projects, deleteProject, updateProject, isLoading, addProject } = useCurriculum();
    const { students } = useStudents();
    const { submissions } = useSubmissions();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Tab state
    const [activeTab, setActiveTab] = useState<'manage' | 'import'>('manage');

    // Existing state
    const [selectedLevel, setSelectedLevel] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [managingProjectId, setManagingProjectId] = useState<string | null>(null);
    const [trackingProjectId, setTrackingProjectId] = useState<string | null>(null);

    // Import state
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [preview, setPreview] = useState<Partial<ProjectBrief> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const managingProject = projects.find(p => p.id === managingProjectId);
    const trackingProject = projects.find(p => p.id === trackingProjectId);

    const filteredProjects = projects.filter(p => {
        const matchesCohort = selectedLevel === 'All' || p.cohort === selectedLevel;
        const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.unit || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCohort && matchesSearch;
    });

    const getProjectStats = (project: ProjectBrief) => {
        // Count eligible students based on Cohort
        const eligibleStudents = students.filter(s =>
            s.cohort === project.cohort &&
            s.status === 'Active' // Only count active students
        );

        const totalStudents = eligibleStudents.length;

        if (totalStudents === 0) return { totalStudents: 0, completionRate: 0 };

        // Count completions (projects where all tasks have at least one submission that is not 'Resubmission Required')
        // OR simplified: Count total task completions vs total expected tasks
        // Let's go with: A student has completed the project if they have submitted something for every task.

        let completedStudents = 0;

        eligibleStudents.forEach(student => {
            const studentSubmissions = submissions.filter(s =>
                s.projectId === project.id &&
                s.studentId === student.id
            );

            // Check if they have a submission for every task in the project
            const totalTasks = project.tasks.length;
            if (totalTasks === 0) return; // Avoid division by zero, but if no tasks, maybe 100%? Let's say 0 for now.

            // Get unique task IDs submitted
            const submittedTaskIds = new Set(studentSubmissions.map(s => s.taskId));

            // Check if they have submitted all tasks
            if (submittedTaskIds.size === totalTasks) {
                completedStudents++;
            }
        });

        const completionRate = Math.round((completedStudents / totalStudents) * 100);

        return { totalStudents, completionRate };
    };

    const handleDelete = (id: string, title: string) => {
        if (window.confirm(t('teacher.projects.deleteConfirm').replace('{title}', title))) {
            deleteProject(id);
        }
    };

    const handleUpdateProject = (projectId: string, updates: Partial<ProjectBrief>) => {
        updateProject(projectId, updates);
    };

    // Ingestion functions
    const extractTextFromPDF = async (file: File): Promise<string> => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/cmaps/',
            cMapPacked: true,
        }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item: any) => ('str' in item ? item.str : ''))
                .join(' ');
            fullText += pageText + ' ';
        }
        return fullText;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        try {
            const text = await extractTextFromPDF(file);
            const parsed = parseProjectBrief(text);

            const projectWithDefaults = {
                ...parsed,
                id: parsed.id || crypto.randomUUID(),
                xpReward: parsed.xpReward || 500,
                dowdBucksReward: parsed.dowdBucksReward || 200,
                tasks: parsed.tasks?.map(t => ({
                    ...t,
                    xpReward: t.xpReward || 200,
                    dowdBucksReward: t.dowdBucksReward || 50
                })) || []
            };

            setPreview(projectWithDefaults);
        } catch (error: any) {
            console.error('PDF Parsing failed:', error);
            const errorMsg = error?.message || 'Unknown error';
            alert(t('teacher.ingestion.parseError').replace('{error}', errorMsg));
        } finally {
            setIsParsing(false);
        }
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
        if (!preview || !preview.tasks) return;
        const updatedTasks = preview.tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        );
        setPreview({ ...preview, tasks: updatedTasks });
    };

    const handleSaveImport = async () => {
        if (preview && preview.title) {
            const confirmPublish = window.confirm(
                t('teacher.ingestion.publishConfirm').replace('{cohort}', preview.cohort || t('teacher.ingestion.selected'))
            );

            if (!confirmPublish) return;

            setIsSaving(true);
            try {
                // More robust way to ensure we have a valid ProjectBrief
                const newProject: ProjectBrief = {
                    ...preview as ProjectBrief,
                    id: preview.id || crypto.randomUUID(),
                    published: true,
                    // Ensure defaults for required fields if they are missing
                    title: preview.title || 'Untitled Project',
                    unit: preview.unit || '',
                    cohort: preview.cohort || 'Level 3A',
                    tasks: preview.tasks || [],
                    gradingScheme: preview.gradingScheme || 'Distinction',
                    xpReward: preview.xpReward || 0,
                    dowdBucksReward: preview.dowdBucksReward || 0
                };
                await addProject(newProject);
                alert(t('teacher.ingestion.publishSuccess') || 'Project published successfully!');
                setPreview(null);
                setActiveTab('manage');
            } catch (error: any) {
                console.error('Failed to save project:', error);
                alert(`Error: ${error.message || 'Failed to save project'}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleCreateManual = () => {
        const blankProject: Partial<ProjectBrief> = {
            id: crypto.randomUUID(),
            title: '',
            unit: '',
            cohort: 'Level 3A',
            tasks: [
                {
                    id: crypto.randomUUID(),
                    title: 'Task 1',
                    description: '',
                    evidenceRequirements: [],
                    criteriaReferences: [],
                    status: 'Not Started',
                    xpReward: 200,
                    dowdBucksReward: 50
                }
            ],
            learningOutcomes: [],
            assessmentCriteria: [],
            published: true,
            gradingScheme: 'Distinction',
            xpReward: 0,
            dowdBucksReward: 0
        };
        setPreview(blankProject);
        setActiveTab('import');
    };

    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{t('teacher.projects.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('teacher.projects.subtitle')}</p>
                    </div>
                    {preview && activeTab === 'import' && (
                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <Button onClick={() => setPreview(null)} variant="outline">
                                {t('teacher.quizzes.cancel')}
                            </Button>
                            <Button onClick={handleSaveImport} variant="primary" disabled={isSaving}>
                                <CheckCircle2 size={18} style={{ marginRight: '8px' }} />
                                {isSaving ? t('teacher.ingestion.publishing') || 'Publishing...' : t('teacher.ingestion.finalize')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-6)',
                    borderBottom: '2px solid var(--border-color)'
                }}>
                    <button
                        onClick={() => setActiveTab('manage')}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            background: activeTab === 'manage' ? 'var(--bg-surface)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'manage' ? '3px solid var(--color-brand-cyan)' : '3px solid transparent',
                            color: activeTab === 'manage' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'manage' ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease',
                            marginBottom: '-2px'
                        }}
                    >
                        <BookOpen size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Manage Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            background: activeTab === 'import' ? 'var(--bg-surface)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'import' ? '3px solid var(--color-brand-cyan)' : '3px solid transparent',
                            color: activeTab === 'import' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'import' ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s ease',
                            marginBottom: '-2px'
                        }}
                    >
                        <Upload size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Import Project
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'manage' ? (
                    <div>
                        {/* Filters */}
                        <Card elevated style={{ marginBottom: 'var(--space-6)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text"
                                        placeholder={t('teacher.projects.searchPlaceholder')}
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

                                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                                    >
                                        <option value="All">{t('teacher.students.allCohorts')}</option>
                                        <option value="Level 2">{t('teacher.students.level2')}</option>
                                        <option value="Level 3A">{t('teacher.students.level3a')}</option>
                                        <option value="Level 3B">{t('teacher.students.level3b')}</option>
                                    </select>

                                    <Button variant="primary" onClick={handleCreateManual}>
                                        <Plus size={18} style={{ marginRight: '8px' }} />
                                        Manual Create
                                    </Button>
                                    <Button variant="outline"><Filter size={20} /></Button>
                                </div>
                            </div>
                        </Card>

                        {/* Projects Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
                            {isLoading ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-20)' }}>
                                    <div className="spinner" style={{ margin: '0 auto var(--space-4)' }}></div>
                                    <p>{t('teacher.projects.loading') || 'Loading projects...'}</p>
                                </div>
                            ) : filteredProjects.map(project => (
                                <Card key={project.id} elevated style={{ display: 'flex', flexDirection: 'column', height: '100%', opacity: project.published ? 1 : 0.6 }}>
                                    {/* ... existing card content ... */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                                        <div style={{
                                            background: (project.cohort || '').includes('Level 3') ? 'var(--color-brand-purple)' : 'var(--color-brand-cyan)',
                                            color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px'
                                        }}>
                                            {project.cohort || 'Unknown'}
                                        </div>
                                        {!project.published && (
                                            <div style={{
                                                background: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
                                                color: 'var(--text-tertiary)', fontSize: '0.7rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px',
                                                marginLeft: '8px'
                                            }}>
                                                HIDDEN
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleUpdateProject(project.id, { published: !project.published })}
                                                style={{ padding: '4px', color: project.published ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                                                title={project.published ? "Visible to Students" : "Hidden from Students"}
                                            >
                                                {project.published ? <Users size={16} /> : <Users size={16} style={{ opacity: 0.3 }} />}
                                                {/* Alternatively use Eye/EyeOff but Users implies 'Student Access' which might be clearer contextually, or stick to Eye */}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(project.id, project.title)} style={{ padding: '4px', color: 'var(--color-danger)' }}>
                                                <Trash2 size={16} />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => navigate(`/teacher/assessment?project=${project.id}`)} style={{ padding: '4px' }}>
                                                <ExternalLink size={16} />
                                            </Button>
                                        </div>
                                    </div>

                                    <h3 style={{ margin: '0 0 var(--space-2)', fontSize: '1.25rem' }}>{project.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-4)', flexGrow: 1 }}>
                                        {project.unit}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Users size={18} color="var(--color-brand-cyan)" />
                                            <div>
                                                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                                                    {getProjectStats(project).totalStudents} / {getProjectStats(project).totalStudents}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('teacher.projects.studentsTracking')}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CheckCircle2 size={18} color="var(--color-success)" />
                                            <div>
                                                <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                                                    {getProjectStats(project).completionRate}%
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('teacher.projects.completionRate')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <Clock size={14} />
                                            <span>{t('teacher.projects.tasksCount').replace('{count}', project.tasks.length.toString())}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            <Button size="sm" variant="outline" onClick={() => setManagingProjectId(project.id)}>
                                                <Edit3 size={14} style={{ marginRight: '4px' }} /> {t('teacher.projects.editProject')}
                                            </Button>
                                            <Button size="sm" onClick={() => setTrackingProjectId(project.id)}>
                                                {t('teacher.projects.cohort')} <ChevronRight size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {!isLoading && filteredProjects.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-20)', color: 'var(--text-secondary)' }}>
                                    <BookOpen size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-4)' }} />
                                    <h3>{t('teacher.projects.noProjects')}</h3>
                                    <p>{t('teacher.projects.noProjectsDesc')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Import Tab Content - from CurriculumIngestion.tsx */
                    <div>
                        {preview && (
                            <div style={{ marginBottom: 'var(--space-8)' }}>
                                <Card style={{
                                    background: 'rgba(231, 76, 60, 0.1)',
                                    border: '2px solid var(--color-danger)',
                                    padding: 'var(--space-4) var(--space-6)'
                                }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{
                                            background: 'var(--color-danger)', color: 'white', padding: '8px',
                                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: '0 0 4px', color: 'var(--color-danger)', fontSize: '1rem', textAlign: 'center' }}>{t('teacher.ingestion.reviewRequired')}</h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500, lineHeight: 1.4, textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: t('teacher.ingestion.reviewDesc').replace('Project Number', '<strong>Project Number</strong>').replace('Name', '<strong>Name</strong>') }}>
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {!preview ? (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <Card
                                    elevated
                                    style={{
                                        padding: 'var(--space-12)',
                                        textAlign: 'center',
                                        border: '2px dashed var(--border-color)',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileUpload}
                                    />
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-brand-cyan)15',
                                        color: 'var(--color-brand-cyan)', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', margin: '0 auto var(--space-6)'
                                    }}>
                                        <Upload size={40} />
                                    </div>
                                    <h2>{isParsing ? t('teacher.ingestion.processing') : t('teacher.ingestion.upload')}</h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                                        {t('teacher.ingestion.uploadDesc')}
                                    </p>
                                    {isParsing && (
                                        <div style={{ width: '100%', height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: 'var(--color-brand-cyan)', animation: 'progress 2s infinite linear' }}></div>
                                        </div>
                                    )}
                                </Card>
                                <style>{`
                                    @keyframes progress {
                                        0% { width: 0%; transform: translateX(-100%); }
                                        100% { width: 100%; transform: translateX(100%); }
                                    }
                                `}</style>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-8)' }}>
                                {/* Sidebar: Project Metadata */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                    <Card elevated>
                                        <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                            <FileText size={20} color="var(--color-brand-purple)" /> Project Details
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Project Title <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. P1: Music Production Basics"
                                                    value={preview?.title || ''}
                                                    onChange={(e) => preview && setPreview({ ...preview, title: e.target.value })}
                                                    style={{
                                                        width: '100%', padding: '10px', borderRadius: '8px',
                                                        border: `1px solid ${preview?.title ? 'var(--border-color)' : 'var(--color-warning)'}`,
                                                        background: 'var(--bg-input)', color: 'var(--text-primary)'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Cohort</label>
                                                <select
                                                    value={preview?.cohort || 'Level 3A'}
                                                    onChange={(e) => preview && setPreview({ ...preview, cohort: e.target.value as any })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                                >
                                                    <option value="Level 2">Level 2</option>
                                                    <option value="Level 3A">Level 3A</option>
                                                    <option value="Level 3B">Level 3B</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <BookOpen size={12} /> Units Covered
                                                </label>
                                                <input
                                                    type="text"
                                                    value={preview?.unit || ''}
                                                    onChange={(e) => preview && setPreview({ ...preview, unit: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} /> Project Deadline
                                                </label>
                                                <input
                                                    type="date"
                                                    value={preview?.deadline || ''}
                                                    onChange={(e) => preview && setPreview({ ...preview, deadline: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Main: Task Manager */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Project Tasks ({preview?.tasks?.length || 0})</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newTask: Task = {
                                                    id: crypto.randomUUID(),
                                                    title: t('teacher.ingestion.newTask'),
                                                    description: t('teacher.ingestion.taskDesc'),
                                                    evidenceRequirements: [],
                                                    criteriaReferences: [],
                                                    status: 'Not Started',
                                                    xpReward: 200,
                                                    dowdBucksReward: 50
                                                };
                                                setPreview({ ...preview, tasks: [...(preview?.tasks || []), newTask] } as any);
                                            }}
                                        >
                                            <FilePlus size={16} style={{ marginRight: '6px' }} /> {t('teacher.ingestion.addTask')}
                                        </Button>
                                    </div>

                                    {preview?.tasks?.map((task) => (
                                        <Card key={task.id} elevated style={{ borderLeft: '4px solid var(--color-brand-cyan)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1, marginRight: 'var(--space-4)' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Task Title</label>
                                                        <input
                                                            type="text"
                                                            value={task.title}
                                                            onChange={(e) => updateTask(task.id, { title: e.target.value })}
                                                            style={{
                                                                width: '100%', fontSize: '1.1rem', fontWeight: 700,
                                                                background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)',
                                                                borderRadius: '6px', padding: '8px 12px', color: 'var(--text-primary)', marginTop: '4px'
                                                            }}
                                                        />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => preview && setPreview({ ...preview, tasks: preview.tasks?.filter(t => t.id !== task.id) })}
                                                        style={{ padding: '6px', minWidth: 'auto', color: 'var(--color-danger)' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Description</label>
                                                    <textarea
                                                        value={task.description}
                                                        onChange={(e) => updateTask(task.id, { description: e.target.value })}
                                                        placeholder={t('teacher.ingestion.taskDesc')}
                                                        style={{
                                                            width: '100%', minHeight: '80px', padding: '12px',
                                                            background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)',
                                                            borderRadius: '6px', color: 'var(--text-primary)', resize: 'vertical',
                                                            fontSize: '0.9rem', lineHeight: 1.5, marginTop: '4px'
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                                                        {t('teacher.ingestion.evidenceTypes')}
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {[
                                                            { id: 'media_file', label: t('teacher.ingestion.audio'), icon: <Music size={14} /> },
                                                            { id: 'video_file', label: t('teacher.ingestion.video'), icon: <Video size={14} /> },
                                                            { id: 'google_app', label: t('teacher.ingestion.google'), icon: <FileText size={14} /> },
                                                            { id: 'external_url', label: t('teacher.ingestion.url'), icon: <ExternalLink size={14} /> }
                                                        ].map(type => {
                                                            const isSelected = task.evidenceRequirements.includes(type.id);
                                                            return (
                                                                <Button
                                                                    key={type.id}
                                                                    size="sm"
                                                                    variant={isSelected ? 'primary' : 'outline'}
                                                                    onClick={() => {
                                                                        const newReqs = isSelected
                                                                            ? task.evidenceRequirements.filter(r => r !== type.id)
                                                                            : [...task.evidenceRequirements, type.id];
                                                                        updateTask(task.id, { evidenceRequirements: newReqs });
                                                                    }}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                                        borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    {type.icon} {type.label}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                {task.deadline && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                                                        <Calendar size={12} /> {t('task.deadline')}: {new Date(task.deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: '1 1 200px' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                                            {t('teacher.ingestion.deadline')}
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={task.deadline || ''}
                                                            onChange={(e) => updateTask(task.id, { deadline: e.target.value })}
                                                            style={{
                                                                width: '100%', padding: '10px',
                                                                background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)',
                                                                borderRadius: '6px', color: 'var(--text-primary)'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Project Edit Overlay */}
                {managingProject && (
                    <ProjectEditOverlay
                        project={managingProject}
                        onClose={() => setManagingProjectId(null)}
                        onSave={(updates) => handleUpdateProject(managingProject.id, updates)}
                    />
                )}

                {trackingProject && (
                    <ProjectCohortTracker
                        project={trackingProject}
                        onClose={() => setTrackingProjectId(null)}
                    />
                )}
            </div>
        </PageTransition >
    );
};

interface ProjectEditOverlayProps {
    project: ProjectBrief;
    onClose: () => void;
    onSave: (updates: Partial<ProjectBrief>) => void;
}

function ProjectEditOverlay({ project, onClose, onSave }: ProjectEditOverlayProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'settings' | 'tasks'>('settings');
    const [metadata, setMetadata] = useState({
        title: project.title,
        unit: project.unit,
        cohort: project.cohort,
        deadline: project.deadline || '',
        gradingScheme: project.gradingScheme || 'Distinction',
        xpReward: project.xpReward,
        dowdBucksReward: project.dowdBucksReward
    });
    const [tasks, setTasks] = useState<Task[]>(project.tasks);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const handleAddTask = () => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            title: 'New Task',
            description: 'Enter task description...',
            evidenceRequirements: [],
            criteriaReferences: [],
            status: 'Not Started',
            xpReward: 100
        };
        setTasks([...tasks, newTask]);
        setEditingTaskId(newTask.id);
        setActiveTab('tasks');
    };

    const handleRemoveTask = (id: string) => {
        if (window.confirm(t('teacher.projects.overlay.removeTaskConfirm'))) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const handleUpdateTask = (id: string, updates: Partial<Task>) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleSave = () => {
        onSave({
            ...metadata,
            tasks
        });
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999,
                    backdropFilter: 'blur(4px)'
                }}
            />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '550px',
                backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '1px solid var(--border-color)',
                zIndex: 1000, display: 'flex', flexDirection: 'column',
                boxShadow: '-20px 0 50px rgba(0,0,0,0.8)',
                transition: 'transform 0.3s ease-out',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Edit Project</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{metadata.title}</p>
                    </div>
                    <Button variant="ghost" onClick={onClose}><X size={24} /></Button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            flex: 1, padding: '16px', border: 'none', background: 'none',
                            color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'settings' ? '2px solid var(--color-primary)' : 'none',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                        }}
                    >
                        {t('teacher.projects.overlay.settings')}
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        style={{
                            flex: 1, padding: '16px', border: 'none', background: 'none',
                            color: activeTab === 'tasks' ? 'var(--color-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'tasks' ? '2px solid var(--color-primary)' : 'none',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                        }}
                    >
                        {t('teacher.projects.overlay.tasks').replace('{count}', tasks.length.toString())}
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
                    {activeTab === 'settings' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.title')}</label>
                                <input
                                    type="text"
                                    value={metadata.title}
                                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.unit')}</label>
                                <input
                                    type="text"
                                    value={metadata.unit}
                                    onChange={(e) => setMetadata({ ...metadata, unit: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.targetCohort')}</label>
                                    <select
                                        value={metadata.cohort}
                                        onChange={(e) => setMetadata({ ...metadata, cohort: e.target.value as any })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                    >
                                        <option value="Level 2">{t('teacher.students.level2')}</option>
                                        <option value="Level 3A">{t('teacher.students.level3a')}</option>
                                        <option value="Level 3B">{t('teacher.students.level3b')}</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.deadline')}</label>
                                <input
                                    type="date"
                                    value={metadata.deadline}
                                    onChange={(e) => setMetadata({ ...metadata, deadline: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.gradingScheme')}</label>
                                <select
                                    value={metadata.gradingScheme}
                                    onChange={(e) => setMetadata({ ...metadata, gradingScheme: e.target.value as any })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                >
                                    <option value="Distinction">Pass / Merit / Distinction</option>
                                    <option value="Pass/Fail">Pass / Fail</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.xpReward')}</label>
                                    <input
                                        type="number"
                                        value={metadata.xpReward || 0}
                                        onChange={(e) => setMetadata({ ...metadata, xpReward: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.dowdBucks')}</label>
                                    <input
                                        type="number"
                                        value={metadata.dowdBucksReward || 0}
                                        onChange={(e) => setMetadata({ ...metadata, dowdBucksReward: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {tasks.map((task, index) => (
                                <Card key={task.id} style={{
                                    border: editingTaskId === task.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                    position: 'relative'
                                }}>
                                    {editingTaskId === task.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                            <input
                                                type="text"
                                                value={task.title}
                                                onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                                                placeholder="Task Title"
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    background: 'var(--bg-input)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '1rem',
                                                    fontWeight: 600
                                                }}
                                            />
                                            <textarea
                                                value={task.description}
                                                onChange={(e) => handleUpdateTask(task.id, { description: e.target.value })}
                                                placeholder="Description"
                                                style={{
                                                    width: '100%',
                                                    minHeight: '100px',
                                                    padding: '12px',
                                                    background: 'var(--bg-input)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    color: 'var(--text-primary)',
                                                    resize: 'vertical',
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.5
                                                }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{t('teacher.projects.overlay.evidenceTypes')}</label>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {[
                                                            { id: 'media_file', label: t('teacher.projects.evidence.audio'), icon: <Music size={14} /> },
                                                            { id: 'video_file', label: t('teacher.projects.evidence.video'), icon: <Video size={14} /> },
                                                            { id: 'google_app', label: t('teacher.projects.evidence.google'), icon: <FileText size={14} /> },
                                                            { id: 'external_url', label: t('teacher.projects.evidence.url'), icon: <ExternalLink size={14} /> }
                                                        ].map(type => {
                                                            const isSelected = task.evidenceRequirements.includes(type.id);
                                                            return (
                                                                <Button
                                                                    key={type.id}
                                                                    size="sm"
                                                                    variant={isSelected ? 'primary' : 'outline'}
                                                                    onClick={() => {
                                                                        const newReqs = isSelected
                                                                            ? task.evidenceRequirements.filter(r => r !== type.id)
                                                                            : [...task.evidenceRequirements, type.id];
                                                                        handleUpdateTask(task.id, { evidenceRequirements: newReqs });
                                                                    }}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '20px',
                                                                        border: isSelected ? 'none' : '1px solid var(--border-color)'
                                                                    }}
                                                                >
                                                                    {type.icon} {type.label}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: '1 1 120px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>XP Reward</label>
                                                        <input
                                                            type="number"
                                                            value={task.xpReward}
                                                            onChange={(e) => handleUpdateTask(task.id, { xpReward: parseInt(e.target.value) || 0 })}
                                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: '1 1 120px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>DowdBucks</label>
                                                        <input
                                                            type="number"
                                                            value={task.dowdBucksReward || 0}
                                                            onChange={(e) => handleUpdateTask(task.id, { dowdBucksReward: parseInt(e.target.value) || 0 })}
                                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: '1 1 150px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Deadline</label>
                                                        <input
                                                            type="date"
                                                            value={task.deadline || ''}
                                                            onChange={(e) => handleUpdateTask(task.id, { deadline: e.target.value })}
                                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: '2 1 200px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{t('teacher.projects.overlay.criteria')}</label>
                                                        <input
                                                            type="text"
                                                            value={task.criteriaReferences.join(', ')}
                                                            onChange={(e) => handleUpdateTask(task.id, { criteriaReferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}
                                                            placeholder="e.g. 1.1, 1.2"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                                <Button size="sm" onClick={() => setEditingTaskId(null)}>{t('teacher.projects.overlay.done')}</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, marginRight: 'var(--space-4)' }}>
                                                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{index + 1}. {task.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}</p>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '12px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px', color: 'var(--color-brand-cyan)' }}>{task.xpReward} XP</span>
                                                    {(task.dowdBucksReward || 0) > 0 && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,215,0,0.15)', padding: '3px 8px', borderRadius: '4px', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
                                                            {task.dowdBucksReward} DB
                                                        </span>
                                                    )}
                                                    {task.evidenceRequirements.map(req => (
                                                        <span key={req} style={{
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            background: req === 'video_file' ? 'rgba(231, 76, 60, 0.15)' :
                                                                req === 'media_file' ? 'rgba(155, 89, 182, 0.15)' :
                                                                    req === 'google_app' ? 'rgba(52, 152, 219, 0.15)' :
                                                                        'rgba(46, 204, 113, 0.15)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: req === 'video_file' ? '#e74c3c' :
                                                                req === 'media_file' ? '#bc8f8f' :
                                                                    req === 'google_app' ? '#5dade2' :
                                                                        '#52be80',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            {req === 'video_file' ? <Video size={10} /> :
                                                                req === 'media_file' ? <Music size={10} /> :
                                                                    req === 'google_app' ? <FileText size={10} /> :
                                                                        <ExternalLink size={10} />}
                                                            {req.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    ))}
                                                    {task.criteriaReferences.length > 0 && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#4caf50', padding: '2px 8px', borderRadius: '4px' }}>
                                                            {task.criteriaReferences.join(', ')}
                                                        </span>
                                                    )}
                                                    {task.deadline && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.2)', color: 'var(--color-danger)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingTaskId(task.id)}
                                                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Edit3 size={18} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRemoveTask(task.id)}
                                                    style={{ width: '40px', height: '40px', padding: 0, color: 'var(--color-danger)', borderColor: 'rgba(244,67,54,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}

                            <Button variant="outline" onClick={handleAddTask} style={{ borderStyle: 'dashed', height: '60px' }}>
                                <Plus size={20} style={{ marginRight: '8px' }} /> {t('teacher.projects.overlay.addTask')}
                            </Button>
                        </div>
                    )}
                </div>

                <div style={{ padding: 'var(--space-6)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 'var(--space-4)' }}>
                    <Button onClick={handleSave} variant="primary" style={{ flex: 1 }}>
                        <Save size={20} style={{ marginRight: '8px' }} /> {t('teacher.projects.overlay.save')}
                    </Button>
                    <Button onClick={onClose} variant="outline" style={{ flex: 1 }}>{t('teacher.projects.overlay.cancel')}</Button>
                </div>

                <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
            </div>
        </>
    );
};

interface ProjectCohortTrackerProps {
    project: ProjectBrief;
    onClose: () => void;
}

function ProjectCohortTracker({ project, onClose }: ProjectCohortTrackerProps) {
    const { students, updateStudent } = useStudents();
    const { submissions, addSubmission, updateSubmission, deleteSubmission } = useSubmissions();
    const { t } = useLanguage();
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [editingNoteTaskId, setEditingNoteTaskId] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState('');

    const eligibleStudents = students.filter(s => s.cohort === project.cohort && s.status === 'Active');

    const getStudentProgress = (studentId: string) => {
        const studentSubmissions = submissions.filter(s =>
            s.projectId === project.id &&
            s.studentId === studentId
        );

        const totalTasks = project.tasks.length;
        if (totalTasks === 0) return 0;

        const submittedTaskIds = new Set(
            studentSubmissions
                .filter(s => s.status !== 'Resubmission Required') // Only count valid submissions
                .map(s => s.taskId)
        );

        return Math.round((submittedTaskIds.size / totalTasks) * 100);
    };

    const handleVerify = (student: any, taskId: string) => {
        const task = project.tasks.find(t => t.id === taskId);
        const xpReward = task?.xpReward || 0;

        addSubmission({
            id: crypto.randomUUID(),
            taskId: taskId,
            projectId: project.id,
            studentId: student.id,
            studentName: student.name,
            studentCohort: student.cohort,
            status: 'Verified',
            submittedAt: new Date().toISOString(),
            verifiedBy: 'Teacher',
            verifiedAt: new Date().toISOString(),
            evidence: []
        });

        // Calculate if this completes the project
        // We need to know if all OTHER tasks are already completed.
        const otherTasks = project.tasks.filter(t => t.id !== taskId);
        const studentSubmissions = submissions.filter(s => s.projectId === project.id && s.studentId === student.id);

        const completedTaskIds = new Set(
            studentSubmissions
                .filter(s => (s.status === 'Verified' || s.status === 'Graded') && s.taskId !== taskId) // Exclude current task (not supported by filter above effectively if reused)
                .map(s => s.taskId)
        );

        // Check if all other tasks are in the set of completed tasks
        const allOtherTasksCompleted = otherTasks.every(t => completedTaskIds.has(t.id));

        let bonusXp = 0;
        let bonusDB = 0;

        if (allOtherTasksCompleted) {
            // This was the last task!
            bonusXp = project.xpReward || 0;
            bonusDB = project.dowdBucksReward || 0;
        }

        // Award XP & DowdBucks (Task + Project Bonus)
        const totalXp = xpReward + bonusXp;
        const totalDB = (task?.dowdBucksReward || 0) + bonusDB;

        if (totalXp > 0 || totalDB > 0) {
            const currentXp = student.xp || 0;
            const currentBalance = student.balance || 0;

            updateStudent(student.id, {
                xp: currentXp + totalXp,
                balance: currentBalance + totalDB
            });

            if (bonusXp > 0 || bonusDB > 0) {
                // Ideally show a toast here, but for now console log
                console.log(`Project Completed! Awarded Bonus: ${bonusXp} XP, ${bonusDB} DB`);
            }
        }
    };

    const handleUnverify = (submissionId: string) => {
        if (window.confirm(t('teacher.projects.tracker.uncheckConfirm'))) {
            const submission = submissions.find(s => s.id === submissionId);
            if (submission) {
                const task = project.tasks.find(t => t.id === submission.taskId);
                const xpAmount = task?.xpReward || 0;
                const student = students.find(s => s.id === submission.studentId);

                deleteSubmission(submissionId);

                if (student) {
                    // Deduct XP & DowdBucks (Task)
                    const taskRewardDB = task?.dowdBucksReward || 0;
                    let deductXp = xpAmount;
                    let deductDB = taskRewardDB;

                    // Check if this WAS a completed project
                    const otherTasks = project.tasks.filter(t => t.id !== submission.taskId);
                    const studentSubmissions = submissions.filter(s => s.projectId === project.id && s.studentId === student.id);
                    const completedTaskIds = new Set(
                        studentSubmissions
                            .filter(s => (s.status === 'Verified' || s.status === 'Graded') && s.id !== submissionId)
                            .map(s => s.taskId)
                    );

                    const allOtherTasksCompleted = otherTasks.every(t => completedTaskIds.has(t.id));

                    // If all OTHER tasks were completed, then removing THIS one breaks the project completion
                    // So we must also deduct the project bonus
                    if (allOtherTasksCompleted) {
                        deductXp += (project.xpReward || 0);
                        deductDB += (project.dowdBucksReward || 0);
                    }

                    const currentXp = student.xp || 0;
                    const currentBalance = student.balance || 0;

                    updateStudent(student.id, {
                        xp: Math.max(0, currentXp - deductXp),
                        balance: Math.max(0, currentBalance - deductDB)
                    });
                }
            }
        }
    };

    const handleOpenNote = (submission: any, task: any, _student: any) => {
        setEditingNoteTaskId(task.id);
        setNoteContent(submission?.feedback || '');
    };

    const handleSaveNote = (submission: any, task: any, student: any) => {
        if (submission) {
            updateSubmission(submission.id, { feedback: noteContent });
        } else {
            // Create a submission just for the note if it doesn't exist?
            // Or maybe notes should only be on submissions?
            // User asked for "notes on each task".
            // If we mark it 'In Progress' or 'Pending Mark' just to save a note?
            // Let's create a submission with status 'In Progress' if none exists.
            addSubmission({
                id: crypto.randomUUID(),
                taskId: task.id,
                projectId: project.id,
                studentId: student.id,
                studentName: student.name,
                studentCohort: student.cohort,
                status: 'In Progress', // Placeholder status
                submittedAt: new Date().toISOString(),
                evidence: [],
                feedback: noteContent
            });
        }
        setEditingNoteTaskId(null);
    };

    const selectedStudent = eligibleStudents.find(s => s.id === selectedStudentId);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050,
                    backdropFilter: 'blur(4px)'
                }}
            />
            {/* Modal */}
            <div style={{
                position: 'fixed', top: '5%', bottom: '5%', left: '0', right: '0', margin: 'auto', width: '900px',
                backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '16px',
                zIndex: 1060, display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: 'var(--space-6)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-surface)'
                }}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '8px',
                            background: project.cohort.includes('Level 3') ? 'var(--color-brand-purple)' : 'var(--color-brand-cyan)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800
                        }}>
                            {project.cohort.replace('Level ', 'L')}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{project.title}</h2>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {t('teacher.projects.tracker.tracking').replace('{count}', eligibleStudents.length.toString())}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose}><X size={24} /></Button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Student List (Left) */}
                    <div style={{
                        width: '320px',
                        borderRight: '1px solid var(--border-color)',
                        overflowY: 'auto',
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ padding: 'var(--space-4)' }}>
                            <input
                                type="text"
                                placeholder={t('teacher.projects.tracker.search')}
                                style={{
                                    width: '100%', padding: '10px',
                                    borderRadius: '8px', border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)', color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {eligibleStudents.map(student => {
                                const progress = getStudentProgress(student.id);
                                const isSelected = selectedStudentId === student.id;
                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => setSelectedStudentId(student.id)}
                                        style={{
                                            padding: 'var(--space-4)',
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            background: isSelected ? 'var(--bg-action-hover)' : 'transparent',
                                            borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.name}</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: progress === 100 ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Task Details (Right) */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', background: 'var(--bg-surface)' }}>
                        {selectedStudent ? (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{selectedStudent.name}</h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('teacher.projects.tracker.status')}</p>
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-tertiary)', opacity: 0.2 }}>
                                        {getStudentProgress(selectedStudent.id)}%
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                    {project.tasks.map(task => {
                                        const submission = submissions.find(s => s.taskId === task.id && s.studentId === selectedStudent.id);
                                        const isCompleted = submission?.status === 'Verified' || submission?.status === 'Graded';
                                        const isPending = submission?.status === 'Pending Mark';
                                        const isEditingNote = editingNoteTaskId === task.id;

                                        return (
                                            <Card key={task.id} style={{
                                                border: isCompleted ? '1px solid rgba(46, 204, 113, 0.3)' : '1px solid var(--border-color)',
                                                background: isCompleted ? 'rgba(46, 204, 113, 0.05)' : 'var(--bg-surface-elevated)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: isCompleted ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: isCompleted ? 'white' : 'var(--text-tertiary)'
                                                        }}>
                                                            {isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '1rem', textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                                                {task.title}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                                {task.xpReward} XP • {task.criteriaReferences.join(', ')}
                                                            </div>
                                                            {submission?.feedback && !isEditingNote && (
                                                                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-brand-purple)', fontStyle: 'italic' }}>
                                                                    {t('teacher.projects.tracker.note')}: "{submission.feedback}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleOpenNote(submission, task, selectedStudent)}
                                                            style={{ color: submission?.feedback ? 'var(--color-brand-purple)' : 'var(--text-tertiary)' }}
                                                            title={t('teacher.projects.tracker.addNote')}
                                                        >
                                                            <MessageSquare size={18} />
                                                        </Button>

                                                        {isCompleted ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{
                                                                    padding: '4px 10px', borderRadius: '20px',
                                                                    background: 'rgba(46, 204, 113, 0.2)', color: '#27ae60',
                                                                    fontSize: '0.8rem', fontWeight: 700
                                                                }}>
                                                                    {t('teacher.projects.tracker.completed')}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleUnverify(submission!.id)}
                                                                    style={{ color: 'var(--text-tertiary)', padding: '4px' }}
                                                                    title={t('teacher.projects.tracker.undo')}
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant={isPending ? 'primary' : 'outline'}
                                                                onClick={() => handleVerify(selectedStudent, task.id)}
                                                            >
                                                                {isPending ? t('teacher.projects.tracker.verify') : t('teacher.projects.tracker.markComplete')}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {isEditingNote && (
                                                    <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', animation: 'slideIn 0.2s ease' }}>
                                                        <textarea
                                                            value={noteContent}
                                                            onChange={(e) => setNoteContent(e.target.value)}
                                                            placeholder={t('teacher.projects.tracker.enterNotes')}
                                                            style={{
                                                                width: '100%', minHeight: '80px', padding: '10px',
                                                                borderRadius: '8px', border: '1px solid var(--border-color)',
                                                                background: 'var(--bg-input)', color: 'var(--text-primary)',
                                                                marginBottom: '8px'
                                                            }}
                                                            autoFocus
                                                        />
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                            <Button size="sm" variant="ghost" onClick={() => setEditingNoteTaskId(null)}>{t('teacher.students.modal.cancel')}</Button>
                                                            <Button size="sm" variant="primary" onClick={() => handleSaveNote(submission, task, selectedStudent)}>
                                                                <SaveAll size={16} style={{ marginRight: '4px' }} /> {t('teacher.projects.tracker.saveNote')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                                <Users size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
                                <p>{t('teacher.projects.tracker.selectStudent')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectManagement;
