import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
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
    Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/common/PageTransition';
import { type ProjectBrief, type Task } from '../types/ual';

const ProjectManagement: React.FC = () => {
    const { projects, deleteProject, updateProject } = useCurriculum();
    const navigate = useNavigate();
    const [selectedLevel, setSelectedLevel] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [managingProjectId, setManagingProjectId] = useState<string | null>(null);

    const managingProject = projects.find(p => p.id === managingProjectId);

    const filteredProjects = projects.filter(p => {
        const matchesLevel = selectedLevel === 'All' || p.level === selectedLevel;
        const matchesYear = selectedYear === 'All' || p.year === selectedYear;
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.unit.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesLevel && matchesYear && matchesSearch;
    });

    const handleDelete = (id: string, title: string) => {
        if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            deleteProject(id);
        }
    };

    const handleUpdateProject = (projectId: string, updates: Partial<ProjectBrief>) => {
        updateProject(projectId, updates);
    };

    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Project Management</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Oversee, track, and manage all published coursework</p>
                    </div>
                    <Button onClick={() => navigate('/teacher/ingestion')} variant="primary">
                        <BookOpen size={20} style={{ marginRight: '8px' }} /> New Project Ingestion
                    </Button>
                </div>

                {/* Filters */}
                <Card elevated style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search projects or units..."
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
                                <option value="All">All Levels</option>
                                <option value="Level 2">Level 2</option>
                                <option value="Level 3">Level 3</option>
                            </select>

                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                            >
                                <option value="All">All Years</option>
                                <option value="Year 1">Year 1</option>
                                <option value="Year 2">Year 2</option>
                            </select>

                            <Button variant="outline"><Filter size={20} /></Button>
                        </div>
                    </div>
                </Card>

                {/* Projects Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
                    {filteredProjects.map(project => (
                        <Card key={project.id} elevated style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                                <div style={{
                                    background: project.level === 'Level 3' ? 'var(--color-brand-purple)' : 'var(--color-brand-cyan)',
                                    color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px'
                                }}>
                                    {project.level.toUpperCase()} - {project.year?.toUpperCase() || 'Y1'}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
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
                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>24 / 28</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Students Tracking</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle2 size={18} color="var(--color-success)" />
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>12%</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Completion Rate</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <Clock size={14} />
                                    <span>Tasks: {project.tasks.length}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <Button size="sm" variant="outline" onClick={() => setManagingProjectId(project.id)}>
                                        <Edit3 size={14} style={{ marginRight: '4px' }} /> Edit Project
                                    </Button>
                                    <Button size="sm" onClick={() => navigate(`/teacher/students`)}>
                                        Cohort <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredProjects.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-20)', color: 'var(--text-secondary)' }}>
                            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-4)' }} />
                            <h3>No projects found</h3>
                            <p>Try adjusting your filters or ingest a new project brief.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Project Edit Overlay */}
            {managingProject && (
                <ProjectEditOverlay
                    project={managingProject}
                    onClose={() => setManagingProjectId(null)}
                    onSave={(updates) => handleUpdateProject(managingProject.id, updates)}
                />
            )}
        </PageTransition>
    );
};

interface ProjectEditOverlayProps {
    project: ProjectBrief;
    onClose: () => void;
    onSave: (updates: Partial<ProjectBrief>) => void;
}

const ProjectEditOverlay: React.FC<ProjectEditOverlayProps> = ({ project, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'tasks'>('settings');
    const [metadata, setMetadata] = useState({
        title: project.title,
        unit: project.unit,
        level: project.level,
        year: project.year,
        deadline: project.deadline || '',
        gradingScheme: project.gradingScheme || 'Distinction'
    });
    const [tasks, setTasks] = useState<Task[]>(project.tasks);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const handleAddTask = () => {
        const newTask: Task = {
            id: `t-${Date.now()}`,
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
        if (window.confirm('Are you sure you want to remove this task?')) {
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
                        <h2 style={{ margin: 0, color: '#000000' }}>Edit Project</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#333333' }}>{metadata.title}</p>
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
                        Project Settings
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
                        Tasks ({tasks.length})
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
                    {activeTab === 'settings' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333333', display: 'block', marginBottom: '8px' }}>Project Title</label>
                                <input
                                    type="text"
                                    value={metadata.title}
                                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333333', display: 'block', marginBottom: '8px' }}>Unit / Qualification</label>
                                <input
                                    type="text"
                                    value={metadata.unit}
                                    onChange={(e) => setMetadata({ ...metadata, unit: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333333', display: 'block', marginBottom: '8px' }}>Target Level</label>
                                    <select
                                        value={metadata.level}
                                        onChange={(e) => setMetadata({ ...metadata, level: e.target.value as any })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                    >
                                        <option value="Level 2">Level 2</option>
                                        <option value="Level 3">Level 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333333', display: 'block', marginBottom: '8px' }}>Academic Year</label>
                                    <select
                                        value={metadata.year || 'Year 1'}
                                        onChange={(e) => setMetadata({ ...metadata, year: e.target.value as any })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                    >
                                        <option value="Year 1">Year 1</option>
                                        <option value="Year 2">Year 2</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333333', display: 'block', marginBottom: '8px' }}>Project Deadline</label>
                                <input
                                    type="date"
                                    value={metadata.deadline}
                                    onChange={(e) => setMetadata({ ...metadata, deadline: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333333', display: 'block', marginBottom: '8px' }}>Grading Scheme</label>
                                <select
                                    value={metadata.gradingScheme}
                                    onChange={(e) => setMetadata({ ...metadata, gradingScheme: e.target.value as any })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                >
                                    <option value="Distinction">Pass / Merit / Distinction</option>
                                    <option value="Pass/Fail">Pass / Fail</option>
                                </select>
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
                                                    color: '#000000',
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
                                                    color: '#000000',
                                                    resize: 'vertical',
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.5
                                                }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333333', display: 'block', marginBottom: '8px' }}>Allowed Evidence Types (Select all that apply)</label>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {[
                                                            { id: 'media_file', label: 'Audio File', icon: <Music size={14} /> },
                                                            { id: 'video_file', label: 'Video File', icon: <Video size={14} /> },
                                                            { id: 'google_app', label: 'Google App', icon: <FileText size={14} /> },
                                                            { id: 'external_url', label: 'External URL', icon: <ExternalLink size={14} /> }
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
                                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: '2 1 200px' }}>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Criteria References</label>
                                                        <input
                                                            type="text"
                                                            value={task.criteriaReferences.join(', ')}
                                                            onChange={(e) => handleUpdateTask(task.id, { criteriaReferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#000000', fontWeight: 500 }}
                                                            placeholder="e.g. 1.1, 1.2"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                                <Button size="sm" onClick={() => setEditingTaskId(null)}>Done</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, marginRight: 'var(--space-4)' }}>
                                                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{index + 1}. {task.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}</p>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '12px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px', color: 'var(--color-brand-cyan)' }}>{task.xpReward} XP</span>
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
                                <Plus size={20} style={{ marginRight: '8px' }} /> Add Task
                            </Button>
                        </div>
                    )}
                </div>

                <div style={{ padding: 'var(--space-6)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 'var(--space-4)' }}>
                    <Button onClick={handleSave} variant="primary" style={{ flex: 1 }}>
                        <Save size={20} style={{ marginRight: '8px' }} /> Save Changes
                    </Button>
                    <Button onClick={onClose} variant="outline" style={{ flex: 1 }}>Cancel</Button>
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

export default ProjectManagement;
