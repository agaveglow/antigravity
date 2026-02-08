import React, { useState, useRef } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useCurriculum } from '../context/CurriculumContext';
import { parseProjectBrief } from '../utils/ualParser';
import { useNavigate } from 'react-router-dom';
import { type ProjectBrief, type Task } from '../types/ual';
import { Trash2, CheckCircle2, FilePlus, Upload, FileText, Calendar, BookOpen, AlertCircle, Music, ExternalLink, Video } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Use legacy worker for better compatibility across environments
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

const CurriculumIngestion: React.FC = () => {
    const { addProject } = useCurriculum();
    const navigate = useNavigate();
    const [isParsing, setIsParsing] = useState(false);
    const [preview, setPreview] = useState<Partial<ProjectBrief> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const extractTextFromPDF = async (file: File): Promise<string> => {
        // Set worker source immediately before processing
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            // Use standard fonts if available
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/cmaps/',
            cMapPacked: true,
        }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // Join items with a space to allow the parser to handle consolidation
            const pageText = content.items
                .map((item: any) => ('str' in item ? item.str : ''))
                .join(' ');
            fullText += pageText + ' ';
        }
        console.log('PDF Extracted Text (Preview):', fullText.substring(0, 1000));
        return fullText;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        try {
            const text = await extractTextFromPDF(file);
            const parsed = parseProjectBrief(text);
            console.log('Parsed Brief Result:', parsed);
            setPreview(parsed);
        } catch (error: any) {
            console.error('PDF Parsing failed:', error);
            const errorMsg = error?.message || 'Unknown error';
            alert(`Failed to parse PDF: ${errorMsg}\n\nPlease ensure it is a valid project brief.`);
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

    const handleSave = () => {
        if (preview && preview.title) {
            const confirmPublish = window.confirm(
                "Are you sure you want to Finalize & Publish this project?\n\nIt will become immediately visible to students in the " +
                (preview.level || 'selected') + " cohort."
            );

            if (!confirmPublish) return;

            const newProject: ProjectBrief = {
                id: crypto.randomUUID(),
                projectNumber: preview.projectNumber || 'P000',
                title: preview.title || 'Untitled Project',
                unit: preview.unit || 'Unknown Unit',
                level: preview.level || 'Level 3',
                year: preview.year || 'Year 1',
                introduction: '',
                scenario: '',
                tasks: preview.tasks || [],
                learningOutcomes: preview.learningOutcomes || [],
                assessmentCriteria: preview.assessmentCriteria || [],
                deadline: preview.deadline,
                published: true
            };
            addProject(newProject);
            navigate('/teacher/projects');
        }
    };

    return (
        <div style={{ paddingBottom: 'var(--space-12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Curriculum Ingestion</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Convert PDF project briefs into structured coursework</p>
                </div>
                {preview && (
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        <Button onClick={() => setPreview(null)} variant="outline">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} variant="primary">
                            <CheckCircle2 size={18} style={{ marginRight: '8px' }} /> Finalize & Publish
                        </Button>
                    </div>
                )}
            </div>

            {preview && (
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    <Card style={{
                        background: 'rgba(231, 76, 60, 0.1)',
                        border: '2px solid var(--color-danger)',
                        animation: 'pulse 2s infinite',
                        boxShadow: '0 0 15px rgba(231, 76, 60, 0.2)',
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
                                <h3 style={{ margin: '0 0 4px', color: 'var(--color-danger)', fontSize: '1rem', textAlign: 'center' }}>Review Required</h3>
                                <p style={{ fontSize: '0.9rem', color: '#000000', margin: 0, fontWeight: 500, lineHeight: 1.4, textAlign: 'center' }}>
                                    Please verify all extracted data below. Ensure <strong>Project Number</strong> and <strong>Name</strong> (* marked) are correct before publishing.
                                </p>
                            </div>
                        </div>
                    </Card>
                    <style>{`
                        @keyframes pulse {
                            0% { transform: scale(1); box-shadow: 0 0 15px rgba(231, 76, 60, 0.2); }
                            50% { transform: scale(1.01); box-shadow: 0 0 25px rgba(231, 76, 60, 0.4); }
                            100% { transform: scale(1); box-shadow: 0 0 15px rgba(231, 76, 60, 0.2); }
                        }
                    `}</style>
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
                        <h2>{isParsing ? 'Processing Brief...' : 'Upload Project Brief'}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                            Select a PDF file to automatically extract tasks, deadlines, and units.
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
                            <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px', color: '#000000' }}>
                                <FileText size={20} color="var(--color-brand-purple)" /> Project Details
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Project Title <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. P1: Music Production Basics"
                                        value={preview.title || ''}
                                        onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: '8px',
                                            border: `1px solid ${preview.title ? 'var(--border-color)' : 'var(--color-warning)'}`,
                                            background: 'var(--bg-input)', color: '#000000'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Level</label>
                                        <select
                                            value={preview.level || 'Level 3'}
                                            onChange={(e) => setPreview({ ...preview, level: e.target.value as any })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#000000' }}
                                        >
                                            <option value="Level 2" style={{ background: 'var(--bg-surface)', color: '#000000' }}>Level 2</option>
                                            <option value="Level 3" style={{ background: 'var(--bg-surface)', color: '#000000' }}>Level 3</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Academic Year</label>
                                        <select
                                            value={preview.year || 'Year 1'}
                                            onChange={(e) => setPreview({ ...preview, year: e.target.value as any })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#000000' }}
                                        >
                                            <option value="Year 1" style={{ background: 'var(--bg-surface)', color: '#000000' }}>Year 1</option>
                                            <option value="Year 2" style={{ background: 'var(--bg-surface)', color: '#000000' }}>Year 2</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <BookOpen size={12} /> Units Covered
                                    </label>
                                    <input
                                        type="text"
                                        value={preview.unit || ''}
                                        onChange={(e) => setPreview({ ...preview, unit: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#000000' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} /> Project Deadline
                                    </label>
                                    <input
                                        type="date"
                                        value={preview.deadline || ''}
                                        onChange={(e) => setPreview({ ...preview, deadline: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#000000' }}
                                    />
                                </div>
                            </div>
                        </Card>

                    </div>

                    {/* Main: Task Manager */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#000000' }}>Project Tasks ({preview.tasks?.length})</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newTask: Task = {
                                        id: `t-${Date.now()}`,
                                        title: 'New Task',
                                        description: 'Enter task description...',
                                        evidenceRequirements: [],
                                        criteriaReferences: [],
                                        status: 'Not Started',
                                        xpReward: 100
                                    };
                                    setPreview({ ...preview, tasks: [...(preview.tasks || []), newTask] });
                                }}
                            >
                                <FilePlus size={16} style={{ marginRight: '6px' }} /> Add Task
                            </Button>
                        </div>

                        {preview.tasks?.map((task) => (
                            <Card key={task.id} elevated style={{ borderLeft: '4px solid var(--color-brand-cyan)', position: 'relative' }}>
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
                                                    borderRadius: '6px', padding: '8px 12px', color: '#000000', marginTop: '4px'
                                                }}
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setPreview({ ...preview, tasks: preview.tasks?.filter(t => t.id !== task.id) })}
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
                                            placeholder="Extracted task description..."
                                            style={{
                                                width: '100%', minHeight: '80px', padding: '12px',
                                                background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)',
                                                borderRadius: '6px', color: '#000000', resize: 'vertical',
                                                fontSize: '0.9rem', lineHeight: 1.5, marginTop: '4px'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                                            Required Evidence Types (Select all that apply)
                                        </label>
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

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Due Date</label>
                                            <input
                                                type="date"
                                                value={task.deadline || ''}
                                                onChange={(e) => updateTask(task.id, { deadline: e.target.value })}
                                                style={{
                                                    width: '100%', padding: '8px 12px', borderRadius: '6px',
                                                    border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)',
                                                    color: '#000000', marginTop: '4px'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>XP Reward</label>
                                            <input
                                                type="number"
                                                value={task.xpReward}
                                                onChange={(e) => updateTask(task.id, { xpReward: parseInt(e.target.value) || 0 })}
                                                style={{
                                                    width: '100%', padding: '8px 12px', borderRadius: '6px',
                                                    border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)',
                                                    color: '#000000', marginTop: '4px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Criteria (comma separated)</label>
                                            <input
                                                type="text"
                                                value={task.criteriaReferences.join(', ')}
                                                onChange={(e) => updateTask(task.id, { criteriaReferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                placeholder="e.g. 1.1, 1.2"
                                                style={{
                                                    width: '100%', padding: '8px 12px', borderRadius: '6px',
                                                    border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)',
                                                    color: '#000000', marginTop: '4px'
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
    );
};

export default CurriculumIngestion;
