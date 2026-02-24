import React, { useState } from 'react';
import { useQuizzes } from '../context/QuizContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useLanguage } from '../context/LanguageContext';
import BadgeAttachment from '../components/BadgeAttachment';
import {
    Plus, Edit3, Trash2, Save, Sparkles, Loader2, Folder, FolderPlus, ArrowLeft,
    ChevronUp, ChevronDown, BookOpen, FileText, Image as ImageIcon, Search
} from 'lucide-react';
import type { Quiz, Question, Course, Lesson, Walkthrough, Stage, Module, CourseFolder } from '../types/ual';
import PageTransition from '../components/common/PageTransition';
import { generateQuizAI } from '../services/QuizGenerator';
import WalkthroughEditor from '../components/curriculum/WalkthroughEditor';
import RichTextEditor from '../components/common/RichTextEditor';
import RichTextViewer from '../components/common/RichTextViewer';

// Simple UUID generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const TeacherQuizzes: React.FC = () => {
    const {
        quizzes, addQuiz, updateQuiz, deleteQuiz,
        courses, addCourse, updateCourse, deleteCourse, reorderCourse,
        stages, addStage, updateStage, deleteStage, reorderStage,
        modules, addModule, updateModule, deleteModule, reorderModule,
        lessons, addLesson, updateLesson, deleteLesson,
        walkthroughs, addWalkthrough, updateWalkthrough, deleteWalkthrough,
        reorderItem,
        folders, addFolder, updateFolder, deleteFolder, reorderFolder
    } = useQuizzes();
    const { t } = useLanguage();

    // UI State
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const [isEditingQuiz, setIsEditingQuiz] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const [isEditingLesson, setIsEditingLesson] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

    const [isEditingWalkthrough, setIsEditingWalkthrough] = useState(false);
    const [editingWalkthrough, setEditingWalkthrough] = useState<Walkthrough | null>(null);

    // Hierarchy State
    const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditingStage, setIsEditingStage] = useState(false);
    const [editingStage, setEditingStage] = useState<Stage | null>(null);

    const [isEditingModule, setIsEditingModule] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [isEditingFolder, setIsEditingFolder] = useState(false);
    const [editingFolder, setEditingFolder] = useState<CourseFolder | null>(null);
    const [showFolderManager, setShowFolderManager] = useState(false);

    // Filters
    const [selectedFilterLevel, setSelectedFilterLevel] = useState<string>('');
    const [selectedFilterSubject, setSelectedFilterSubject] = useState<string>('');

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        type: 'course' | 'stage' | 'module' | 'quiz' | 'lesson' | 'walkthrough';
        id: string;
        title: string;
    }>({ isOpen: false, type: 'course', id: '', title: '' });

    const openDeleteConfirm = (type: 'course' | 'stage' | 'module' | 'quiz' | 'lesson' | 'walkthrough', id: string, title: string) => {
        setDeleteConfirmation({ isOpen: true, type, id, title });
    };

    const confirmDelete = () => {
        const { type, id } = deleteConfirmation;
        switch (type) {
            case 'course': deleteCourse(id); break;
            case 'stage': deleteStage(id); break;
            case 'module': deleteModule(id); break;
            case 'quiz': deleteQuiz(id); break;
            case 'lesson': deleteLesson(id); break;
            case 'walkthrough': deleteWalkthrough(id); break;
        }
        setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    };

    // --- Course Management ---

    const handleCreateCourse = () => {
        const newCourse: Course = {
            id: generateId(),
            title: t('teacher.quizzes.newCourse'),
            description: t('teacher.quizzes.courseDesc'),
            color: '#3498db',
            order: 0,
            published: false,
            createdAt: new Date().toISOString()
        };
        setEditingCourse(newCourse);
        setIsEditingCourse(true);
    };

    const handleCreateStage = () => {
        if (!selectedCourseId) return;
        const newStage: Stage = {
            id: generateId(),
            courseId: selectedCourseId,
            title: 'New Stage',
            description: 'Stage description',
            order: stages.filter(s => s.courseId === selectedCourseId).length,
            createdAt: new Date().toISOString()
        };
        setEditingStage(newStage);
        setIsEditingStage(true);
        // Store scroll position before navigating away
        sessionStorage.setItem('courseScrollPosition', window.scrollY.toString());
    };

    const handleSaveStage = async () => {
        if (!editingStage) return;
        const existing = stages.find(s => s.id === editingStage.id);
        let success = false;
        if (existing) {
            success = await updateStage(editingStage.id, editingStage);
        } else {
            success = await addStage(editingStage);
        }
        if (success) {
            setIsEditingStage(false);
            setEditingStage(null);
            // Restore scroll position after a short delay to allow render
            setTimeout(() => {
                const scrollPos = sessionStorage.getItem('courseScrollPosition');
                if (scrollPos) {
                    window.scrollTo(0, parseInt(scrollPos));
                    sessionStorage.removeItem('courseScrollPosition');
                }
            }, 100);
        } else {
            alert('Failed to save stage');
        }
    };

    const handleDeleteStage = (id: string) => {
        const stage = stages.find(s => s.id === id);
        if (stage) {
            openDeleteConfirm('stage', id, stage.title);
        }
    };

    const handleCreateModule = (stageId?: string) => {
        const targetStageId = stageId || selectedStageId;
        if (!targetStageId) return;
        const newModule: Module = {
            id: generateId(),
            stageId: targetStageId,
            title: 'New Module',
            description: 'Module description',
            order: modules.filter(m => m.stageId === targetStageId).length,
            createdAt: new Date().toISOString()
        };
        setEditingModule(newModule);
        setIsEditingModule(true);
        // Store scroll position before navigating away
        sessionStorage.setItem('courseScrollPosition', window.scrollY.toString());
    };

    const handleSaveModule = async () => {
        if (!editingModule) return;
        const existing = modules.find(m => m.id === editingModule.id);
        let success = false;
        if (existing) {
            success = await updateModule(editingModule.id, editingModule);
        } else {
            success = await addModule(editingModule);
        }
        if (success) {
            setIsEditingModule(false);
            setEditingModule(null);
            // Restore scroll position after a short delay to allow render
            setTimeout(() => {
                const scrollPos = sessionStorage.getItem('courseScrollPosition');
                if (scrollPos) {
                    window.scrollTo(0, parseInt(scrollPos));
                    sessionStorage.removeItem('courseScrollPosition');
                }
            }, 100);
        } else {
            alert('Failed to save module');
        }
    };

    const handleDeleteModule = (id: string) => {
        const module = modules.find(m => m.id === id);
        if (module) {
            openDeleteConfirm('module', id, module.title);
        }
    };

    const handleSaveCourse = async () => {
        if (!editingCourse) return;
        const existing = courses.find(c => c.id === editingCourse.id);
        let result: { success: boolean; error?: string } = { success: false, error: '' };

        if (existing) {
            result = await updateCourse(editingCourse.id, editingCourse);
        } else {
            result = await addCourse(editingCourse);
        }

        if (result.success) {
            setIsEditingCourse(false);
            setEditingCourse(null);
        } else {
            alert(result.error || t('teacher.quizzes.saveFail') || 'Failed to save course. Please check your connection and try again.');
        }
    };

    const handleDeleteCourse = (id: string) => {
        const course = courses.find(c => c.id === id);
        if (course) {
            openDeleteConfirm('course', id, course.title);
        }
    };

    // --- Folder Management ---
    const handleCreateFolder = () => {
        const newFolder: CourseFolder = {
            id: generateId(),
            title: 'New Folder',
            description: '',
            color: '#9b59b6',
            orderIndex: folders.length,
            createdAt: new Date().toISOString()
        };
        setEditingFolder(newFolder);
        setIsEditingFolder(true);
    };

    const handleSaveFolder = async () => {
        if (!editingFolder) return;
        const existing = folders.find(f => f.id === editingFolder.id);
        let result: { success: boolean; error?: string };

        if (existing) {
            result = await updateFolder(editingFolder.id, editingFolder);
        } else {
            result = await addFolder(editingFolder);
        }

        if (result.success) {
            setIsEditingFolder(false);
            setEditingFolder(null);
        } else {
            alert(result.error || 'Failed to save folder');
        }
    };

    const handleDeleteFolder = (id: string) => {
        if (window.confirm('Are you sure you want to delete this folder? Courses within it will be moved to "Uncategorized".')) {
            deleteFolder(id);
        }
    };

    // --- Quiz Management ---

    const handleGenerateQuiz = async () => {
        if (!selectedCourseId) return;
        const topic = window.prompt(t('teacher.quizzes.enterTopic'));
        if (!topic) return;

        setIsGenerating(true);
        try {
            const generatedQuiz = await generateQuizAI(topic);
            generatedQuiz.courseId = selectedCourseId; // Link to current course
            generatedQuiz.moduleId = selectedModuleId || undefined; // Link to current module
            setEditingQuiz(generatedQuiz);
            setIsEditingQuiz(true);
        } catch (error) {
            alert(t('teacher.quizzes.generateFail'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateQuiz = () => {
        if (!selectedCourseId && selectedCourseId !== undefined) return;

        const newQuiz: Quiz = {
            id: generateId(),
            courseId: selectedCourseId || undefined,
            moduleId: selectedModuleId || undefined,
            title: t('teacher.quizzes.newQuiz'),
            description: t('teacher.quizzes.quizDesc'),
            questions: [],
            xpReward: 100,
            dowdBucksReward: 50,
            status: 'draft',
            createdAt: new Date().toISOString()
        };
        setEditingQuiz(newQuiz);
        setIsEditingQuiz(true);
    };

    const handleSaveQuiz = () => {
        if (editingQuiz) {
            const existing = quizzes.find(q => q.id === editingQuiz.id);
            if (existing) {
                updateQuiz(editingQuiz.id, editingQuiz);
            } else {
                addQuiz(editingQuiz);
            }
            setIsEditingQuiz(false);
            setEditingQuiz(null);
        }
    };

    const updateQuestion = (qId: string, updates: Partial<Question>) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
        });
    };

    const deleteQuestion = (qId: string) => {
        if (!editingQuiz) return;
        setEditingQuiz({
            ...editingQuiz,
            questions: editingQuiz.questions.filter(q => q.id !== qId)
        });
    };

    const handleAddQuestion = () => {
        if (!editingQuiz) return;
        const newQuestion: Question = {
            id: generateId(),
            text: t('teacher.quizzes.newQuestion'),
            type: 'multiple-choice',
            options: [
                { id: '1', text: t('teacher.quizzes.option').replace('{number}', '1') },
                { id: '2', text: t('teacher.quizzes.option').replace('{number}', '2') }
            ],
            correctOptionId: '1'
        };
        setEditingQuiz({
            ...editingQuiz,
            questions: [...editingQuiz.questions, newQuestion]
        });
    };

    // --- Lesson Management ---

    const handleCreateLesson = () => {
        if (!selectedCourseId) return;

        const newLesson: Lesson = {
            id: generateId(),
            courseId: selectedCourseId,
            moduleId: selectedModuleId || undefined,
            title: t('teacher.quizzes.newLesson'),
            description: t('teacher.quizzes.lessonDesc'),
            content: t('teacher.quizzes.lessonContent'),
            order: 0,
            type: 'lesson',
            xpReward: 50,
            createdAt: new Date().toISOString()
        };
        setEditingLesson(newLesson);
        setIsEditingLesson(true);
    };

    const handleSaveLesson = () => {
        if (editingLesson) {
            const existing = lessons.find(l => l.id === editingLesson.id);
            if (existing) {
                updateLesson(editingLesson.id, editingLesson);
            } else {
                addLesson(editingLesson);
            }
            setIsEditingLesson(false);
            setEditingLesson(null);
        }
    };

    const handleCreateWalkthrough = () => {
        if (!selectedCourseId) return;
        setEditingWalkthrough(null); // New walkthrough
        setIsEditingWalkthrough(true);
    };

    const handleSaveWalkthrough = (walkthrough: Walkthrough) => {
        if (walkthrough.id && walkthroughs.find(w => w.id === walkthrough.id)) {
            updateWalkthrough(walkthrough.id, walkthrough);
        } else {
            addWalkthrough(walkthrough);
        }
        setIsEditingWalkthrough(false);
        setEditingWalkthrough(null);
    };

    const handleDeleteWalkthrough = (id: string) => {
        const w = walkthroughs.find(i => i.id === id);
        if (w) openDeleteConfirm('walkthrough', id, w.title);
    };



    // --- Render Views ---

    // 0. Stage & Module Editors
    if (isEditingStage && editingStage) {
        return (
            <PageTransition>
                <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                    <h2>{stages.find(s => s.id === editingStage.id) ? 'Edit Stage' : 'New Stage'}</h2>
                    <Card>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('teacher.quizzes.field.title')}</label>
                                <input
                                    value={editingStage.title}
                                    onChange={e => setEditingStage({ ...editingStage, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('teacher.quizzes.field.description')}</label>
                                <RichTextEditor
                                    value={editingStage.description}
                                    onChange={value => setEditingStage({ ...editingStage, description: value })}
                                    height="200px"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>XP Reward</label>
                                    <input
                                        type="number"
                                        value={editingStage.xpReward || 0}
                                        onChange={e => setEditingStage({ ...editingStage, xpReward: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>DowdBucks Reward</label>
                                    <input
                                        type="number"
                                        value={editingStage.dowdBucksReward || 0}
                                        onChange={e => setEditingStage({ ...editingStage, dowdBucksReward: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setIsEditingStage(false)}>{t('teacher.quizzes.cancel')}</Button>
                                <Button variant="primary" onClick={handleSaveStage}>{t('teacher.quizzes.saveStage') || 'Save Stage'}</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </PageTransition>
        );
    }

    if (isEditingModule && editingModule) {
        return (
            <PageTransition>
                <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                    <h2>{modules.find(m => m.id === editingModule.id) ? 'Edit Module' : 'New Module'}</h2>
                    <Card>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('teacher.quizzes.field.title')}</label>
                                <input
                                    value={editingModule.title}
                                    onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('teacher.quizzes.field.description')}</label>
                                <RichTextEditor
                                    value={editingModule.description}
                                    onChange={value => setEditingModule({ ...editingModule, description: value })}
                                    height="200px"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>XP Reward</label>
                                    <input
                                        type="number"
                                        value={editingModule.xpReward || 0}
                                        onChange={e => setEditingModule({ ...editingModule, xpReward: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>DowdBucks Reward</label>
                                    <input
                                        type="number"
                                        value={editingModule.dowdBucksReward || 0}
                                        onChange={e => setEditingModule({ ...editingModule, dowdBucksReward: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setIsEditingModule(false)}>{t('teacher.quizzes.cancel')}</Button>
                                <Button variant="primary" onClick={handleSaveModule}>Save</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </PageTransition>
        );
    }

    // 1. Course Editor
    if (isEditingCourse && editingCourse) {
        return (
            <PageTransition>
                <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                    <h2>{courses.find(c => c.id === editingCourse.id) ? t('teacher.quizzes.editCourse') : t('teacher.quizzes.createCourse')}</h2>
                    <Card>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('teacher.quizzes.field.title')}</label>
                                <input
                                    value={editingCourse.title}
                                    onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('teacher.quizzes.field.description')}</label>
                                <RichTextEditor
                                    value={editingCourse.description}
                                    onChange={value => setEditingCourse({ ...editingCourse, description: value })}
                                    height="250px"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Level</label>
                                <select
                                    value={editingCourse.level || ''}
                                    onChange={e => setEditingCourse({ ...editingCourse, level: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Select Level (All)</option>
                                    <option value="Level 2">Level 2</option>
                                    <option value="Level 3A">Level 3 - First Year</option>
                                    <option value="Level 3B">Level 3 - Second Year</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject</label>
                                <select
                                    value={editingCourse.subject || ''}
                                    onChange={e => setEditingCourse({ ...editingCourse, subject: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Select Subject (All)</option>
                                    <option value="music">Music</option>
                                    <option value="performing_arts">Performing Arts</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Folder</label>
                                <select
                                    value={editingCourse.folderId || ''}
                                    onChange={e => setEditingCourse({ ...editingCourse, folderId: e.target.value || undefined })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">No Folder (Uncategorized)</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('teacher.quizzes.field.color')}</label>
                                <input
                                    type="color"
                                    value={editingCourse.color}
                                    onChange={e => setEditingCourse({ ...editingCourse, color: e.target.value })}
                                    style={{ width: '100%', height: '40px', padding: '0', border: 'none', cursor: 'pointer' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="course-published"
                                    checked={editingCourse.published || false}
                                    onChange={e => setEditingCourse({ ...editingCourse, published: e.target.checked })}
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                />
                                <label htmlFor="course-published" style={{ cursor: 'pointer' }}>Published (Visible to Students)</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="outline" onClick={() => setIsEditingCourse(false)}>{t('teacher.quizzes.cancel')}</Button>
                                <Button variant="primary" onClick={handleSaveCourse}>{t('teacher.quizzes.saveCourse')}</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </PageTransition>
        );
    }

    // 2. Lesson Editor
    if (isEditingLesson && editingLesson) {
        return (
            <PageTransition>
                <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                        <h1 style={{ margin: 0 }}>{editingLesson.title}</h1>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button variant="outline" onClick={() => setIsEditingLesson(false)}>{t('teacher.quizzes.cancel')}</Button>
                            <Button variant="primary" onClick={handleSaveLesson}><Save size={18} style={{ marginRight: '8px' }} /> {t('teacher.quizzes.saveLesson')}</Button>
                        </div>
                    </div>

                    <Card style={{ marginBottom: 'var(--space-6)' }}>
                        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.quizzes.field.title')}</label>
                                <input
                                    type="text"
                                    value={editingLesson.title}
                                    onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.quizzes.field.description')}</label>
                                <input
                                    type="text"
                                    value={editingLesson.description}
                                    onChange={e => setEditingLesson({ ...editingLesson, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.quizzes.field.xp')}</label>
                                <input
                                    type="number"
                                    value={editingLesson.xpReward}
                                    onChange={e => setEditingLesson({ ...editingLesson, xpReward: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.quizzes.field.content')}</label>
                                <RichTextEditor
                                    value={editingLesson.content}
                                    onChange={value => setEditingLesson({ ...editingLesson, content: value })}
                                    height="450px"
                                    placeholder="Write your lesson content here..."
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </PageTransition>
        );
    }

    if (isEditingWalkthrough) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Button variant="outline" onClick={() => setIsEditingWalkthrough(false)}>
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                        Back to Course
                    </Button>
                </div>
                <h1>{editingWalkthrough ? 'Edit Walkthrough' : 'New Walkthrough'}</h1>
                <Card elevated>
                    <WalkthroughEditor
                        initialData={editingWalkthrough || {}}
                        courseId={selectedCourseId || undefined}
                        moduleId={selectedModuleId || undefined} // Pass moduleId to editor
                        onSave={handleSaveWalkthrough}
                        onCancel={() => setIsEditingWalkthrough(false)}
                    />
                </Card>
            </div>
        );
    }

    // 3. Quiz Editor
    if (isEditingQuiz && editingQuiz) {
        return (
            <PageTransition>
                <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                        <h1 style={{ margin: 0 }}>{editingQuiz.title}</h1>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button variant="outline" onClick={() => setIsEditingQuiz(false)}>{t('teacher.quizzes.cancel')}</Button>
                            <Button variant="primary" onClick={handleSaveQuiz}><Save size={18} style={{ marginRight: '8px' }} /> {t('teacher.quizzes.saveQuiz')}</Button>
                        </div>
                    </div>

                    <Card style={{ marginBottom: 'var(--space-6)' }}>
                        <h3 style={{ marginTop: 0 }}>{t('teacher.quizzes.settings')}</h3>
                        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.quizzes.field.title')}</label>
                                <input
                                    type="text"
                                    value={editingQuiz.title}
                                    onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            {/* ... (Other fields: Description, Rewards, Status) ... */}
                            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.quizzes.field.xp')}</label>
                                    <input type="number" value={editingQuiz.xpReward} onChange={e => setEditingQuiz({ ...editingQuiz, xpReward: parseInt(e.target.value) || 0 })} style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.projects.overlay.dowdBucks')}</label>
                                    <input type="number" value={editingQuiz.dowdBucksReward} onChange={e => setEditingQuiz({ ...editingQuiz, dowdBucksReward: parseInt(e.target.value) || 0 })} style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>{t('teacher.quizzes.field.status')}</label>
                                    <select value={editingQuiz.status} onChange={e => setEditingQuiz({ ...editingQuiz, status: e.target.value as 'draft' | 'published' })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                                        <option value="draft">{t('teacher.quizzes.draft')}</option>
                                        <option value="published">{t('teacher.quizzes.published')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <h3>{t('teacher.quizzes.questions').replace('{count}', editingQuiz.questions.length.toString())}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {editingQuiz.questions.map((q, qIndex) => (
                            <Card key={q.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                                    <span style={{ fontWeight: 'bold' }}>{t('teacher.quizzes.question').replace('{number}', (qIndex + 1).toString())}</span>
                                    <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                </div>
                                <input type="text" value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })} placeholder={t('teacher.quizzes.enterQuestion')} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />

                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('teacher.quizzes.field.questionType')}</label>
                                    <select value={q.type || 'multiple-choice'} onChange={e => updateQuestion(q.id, { type: e.target.value as any })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                                        <option value="multiple-choice">{t('teacher.quizzes.type.mc')}</option>
                                        <option value="listening">{t('teacher.quizzes.type.listening')}</option>
                                        <option value="instrument">{t('teacher.quizzes.type.instrument')}</option>
                                    </select>
                                </div>

                                {/* Metadata Editor */}
                                {q.type === 'listening' && (
                                    <div style={{ padding: '10px', background: 'var(--bg-subtle)', borderRadius: '6px', marginBottom: '10px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <input placeholder="Note 1" value={q.metadata?.interval?.note1 || ''} onChange={e => updateQuestion(q.id, { metadata: { ...q.metadata, interval: { ...q.metadata?.interval, note1: e.target.value } as any } })} style={{ padding: '4px' }} />
                                            <input placeholder="Note 2" value={q.metadata?.interval?.note2 || ''} onChange={e => updateQuestion(q.id, { metadata: { ...q.metadata, interval: { ...q.metadata?.interval, note2: e.target.value } as any } })} style={{ padding: '4px' }} />
                                            <input placeholder="Oct 1" type="number" value={q.metadata?.interval?.octave1 || ''} onChange={e => updateQuestion(q.id, { metadata: { ...q.metadata, interval: { ...q.metadata?.interval, octave1: parseInt(e.target.value) } as any } })} style={{ padding: '4px' }} />
                                            <input placeholder="Oct 2" type="number" value={q.metadata?.interval?.octave2 || ''} onChange={e => updateQuestion(q.id, { metadata: { ...q.metadata, interval: { ...q.metadata?.interval, octave2: parseInt(e.target.value) } as any } })} style={{ padding: '4px' }} />
                                        </div>
                                    </div>
                                )}
                                {q.type === 'instrument' && (
                                    <div style={{ padding: '10px', background: 'var(--bg-subtle)', borderRadius: '6px', marginBottom: '10px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <input type="number" placeholder="String" value={q.metadata?.instrument?.correctString || ''} onChange={e => updateQuestion(q.id, { metadata: { ...q.metadata, instrument: { ...q.metadata?.instrument, type: 'guitar', correctString: parseInt(e.target.value) } as any } })} style={{ padding: '4px' }} />
                                            <input type="number" placeholder="Fret" value={q.metadata?.instrument?.correctFret || ''} onChange={e => updateQuestion(q.id, { metadata: { ...q.metadata, instrument: { ...q.metadata?.instrument, type: 'guitar', correctFret: parseInt(e.target.value) } as any } })} style={{ padding: '4px' }} />
                                            <input type="text" placeholder="Note" value={q.metadata?.instrument?.correctNote || ''} onChange={e => updateQuestion(q.id, { metadata: { ...q.metadata, instrument: { ...q.metadata?.instrument, type: 'guitar', correctNote: e.target.value } as any } })} style={{ padding: '4px' }} />
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginLeft: 'var(--space-4)' }}>
                                    {q.options.map((opt, oIndex) => (
                                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <input type="radio" checked={q.correctOptionId === opt.id} onChange={() => updateQuestion(q.id, { correctOptionId: opt.id })} />
                                            <input type="text" value={opt.text} onChange={e => { const newOptions = [...q.options]; newOptions[oIndex] = { ...opt, text: e.target.value }; updateQuestion(q.id, { options: newOptions }); }} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                                        </div>
                                    ))}
                                    <Button size="sm" variant="ghost" onClick={() => { const newOption = { id: generateId(), text: t('teacher.quizzes.option').replace('{number}', (q.options.length + 1).toString()) }; updateQuestion(q.id, { options: [...q.options, newOption] }); }}>{t('teacher.quizzes.addOption')}</Button>
                                </div>
                            </Card>
                        ))}
                        <Button variant="outline" onClick={handleAddQuestion} style={{ borderStyle: 'dashed' }}><Plus size={18} /> {t('teacher.quizzes.addQuestion')}</Button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={deleteConfirmation.isOpen}
                    onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                    title={`Delete ${deleteConfirmation.type.charAt(0).toUpperCase() + deleteConfirmation.type.slice(1)}`}
                >
                    <div>
                        <p>Are you sure you want to delete <strong>{deleteConfirmation.title}</strong>?</p>
                        <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                            This action cannot be undone. All related content will also be permanently deleted.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button variant="outline" onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={confirmDelete}
                                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            </PageTransition>
        );
    }

    // 4. Course Details (Hierarchy View: Stages -> Modules -> Content)
    if (selectedCourseId) {
        const course = courses.find(c => c.id === selectedCourseId);

        if (!course) {
            return (
                <div style={{ padding: '2rem' }}>
                    <p>Course not found.</p>
                    <Button onClick={() => setSelectedCourseId(null)}>Back to Courses</Button>
                </div>
            );
        }
        const courseStages = stages.filter(s => s.courseId === selectedCourseId).sort((a, b) => a.order - b.order);

        // Helper to get modules for a stage
        const getStageModules = (stageId: string) => modules.filter(m => m.stageId === stageId).sort((a, b) => a.order - b.order);

        // Helper to get content for a module OR course (legacy)
        const getContent = (moduleId?: string, courseId?: string) => {
            let filteredQuizzes: Quiz[] = [];
            let filteredLessons: Lesson[] = [];
            let filteredWalkthroughs: Walkthrough[] = [];

            if (moduleId) {
                filteredQuizzes = quizzes.filter(q => q.moduleId === moduleId);
                filteredLessons = lessons.filter(l => l.moduleId === moduleId);
                filteredWalkthroughs = walkthroughs.filter(w => w.moduleId === moduleId);
            } else if (courseId) {
                // Legacy: Content directly attached to course and NOT in any module
                filteredQuizzes = quizzes.filter(q => q.courseId === courseId && !q.moduleId);
                filteredLessons = lessons.filter(l => l.courseId === courseId && !l.moduleId);
                filteredWalkthroughs = walkthroughs.filter(w => w.courseId === courseId && !w.moduleId);
            }

            return [
                ...filteredQuizzes.map(q => ({ ...q, itemType: 'quiz' as const })),
                ...filteredLessons.map(l => ({ ...l, itemType: 'lesson' as const })),
                ...filteredWalkthroughs.map(w => ({ ...w, itemType: 'walkthrough' as const }))
            ].sort((a, b) => (a.order || 0) - (b.order || 0));
        };

        const renderContentItem = (item: any, index: number, array: any[]) => (
            <Card key={item.id} elevated hover style={{
                display: 'flex', flexDirection: 'column',
                borderLeft: item.itemType === 'lesson' ? '4px solid var(--color-brand-purple)' : (item.itemType === 'walkthrough' ? '4px solid #43a047' : '4px solid var(--color-brand-cyan)'),
                marginBottom: 'var(--space-2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {item.itemType === 'lesson' ? <BookOpen size={12} /> : (item.itemType === 'walkthrough' ? <ImageIcon size={12} /> : <FileText size={12} />)}
                        {item.itemType.toUpperCase()}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderItem(item.id, item.itemType, 'up')}><ChevronUp size={16} /></Button>
                        <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderItem(item.id, item.itemType, 'down')}><ChevronDown size={16} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                            if (item.itemType === 'quiz') { setEditingQuiz(item as Quiz); setIsEditingQuiz(true); }
                            else if (item.itemType === 'walkthrough') { setEditingWalkthrough(item as Walkthrough); setIsEditingWalkthrough(true); }
                            else { setEditingLesson(item as Lesson); setIsEditingLesson(true); }
                        }}><Edit3 size={16} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                            if (item.itemType === 'quiz') openDeleteConfirm('quiz', item.id, item.title);
                            else if (item.itemType === 'walkthrough') handleDeleteWalkthrough(item.id);
                            else openDeleteConfirm('lesson', item.id, item.title);
                        }} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                    </div>
                </div>
                <h3 style={{ margin: '0 0 var(--space-2)' }}>{item.title}</h3>
            </Card>
        );

        return (
            <PageTransition>
                <div style={{ paddingBottom: 'var(--space-12)' }}>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <Button variant="ghost" onClick={() => setSelectedCourseId(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <ArrowLeft size={16} /> {t('teacher.quizzes.backToCourses')}
                        </Button>

                        {/* Course Header Card */}
                        <Card elevated style={{ marginBottom: 'var(--space-6)', borderTop: `4px solid ${course?.color || 'var(--primary-color)'}` }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h1 style={{ margin: 0, color: course?.color || 'var(--text-primary)', fontSize: '2rem' }}>{course?.title}</h1>
                                        {!course?.published && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                background: 'var(--bg-subtle)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-tertiary)'
                                            }}>
                                                DRAFT
                                            </span>
                                        )}
                                    </div>

                                    {/* Metadata Chips */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        {course?.level && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                background: 'var(--color-brand-cyan)',
                                                color: 'white',
                                                fontWeight: 600
                                            }}>
                                                {course.level === 'Level 2' ? 'Level 2' : course.level === 'Level 3A' ? 'Level 3 First Year' : 'Level 3 Second Year'}
                                            </span>
                                        )}
                                        {course?.subject && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                background: 'var(--color-brand-purple)',
                                                color: 'white',
                                                fontWeight: 600
                                            }}>
                                                {course.subject === 'music' ? 'Music' : 'Performing Arts'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {course?.description && (
                                        <div style={{
                                            lineHeight: '1.6',
                                            margin: '0 0 1.5rem 0',
                                            fontSize: '0.95rem',
                                            maxWidth: '800px'
                                        }}>
                                            <RichTextViewer content={course.description} />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <BadgeAttachment
                                            entityType="course"
                                            entityId={course!.id}
                                            entityName={course!.title}
                                        />
                                        <Button onClick={handleCreateStage} variant="primary" style={{ flexShrink: 0 }}>
                                            <Plus size={20} style={{ marginRight: '8px' }} /> Add Stage
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Stages List */}
                        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                            {
                                courseStages.map((stage, index, array) => (
                                    <Card key={stage.id} style={{ border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{stage.title}</h2>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderStage(stage.id, 'up')}><ChevronUp size={16} /></Button>
                                                <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderStage(stage.id, 'down')}><ChevronDown size={16} /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingStage(stage); setIsEditingStage(true); }}><Edit3 size={16} /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDeleteStage(stage.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                            </div>
                                        </div>

                                        {/* Modules in Stage */}
                                        <div style={{ marginLeft: '1rem', display: 'grid', gap: '1rem' }}>
                                            {getStageModules(stage.id).map((module, index, array) => (
                                                <div key={module.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'var(--bg-subtle)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{module.title}</h3>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderModule(module.id, 'up')}><ChevronUp size={14} /></Button>
                                                            <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderModule(module.id, 'down')}><ChevronDown size={14} /></Button>
                                                            <Button size="sm" variant="ghost" onClick={() => { setEditingModule(module); setIsEditingModule(true); }}><Edit3 size={14} /></Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleDeleteModule(module.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></Button>
                                                        </div>
                                                    </div>

                                                    {/* Content in Module */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
                                                        {getContent(module.id).map(renderContentItem)}

                                                        {/* Add Content Buttons for Module */}
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setSelectedStageId(stage.id);
                                                                setSelectedModuleId(module.id);
                                                                handleCreateLesson();
                                                            }}><Plus size={14} /> Lesson</Button>
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setSelectedStageId(stage.id);
                                                                setSelectedModuleId(module.id);
                                                                handleCreateQuiz();
                                                            }}><Plus size={14} /> Quiz</Button>
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setSelectedStageId(stage.id);
                                                                setSelectedModuleId(module.id);
                                                                handleGenerateQuiz();
                                                            }} disabled={isGenerating}>
                                                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Quiz
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setSelectedStageId(stage.id);
                                                                setSelectedModuleId(module.id);
                                                                handleCreateWalkthrough();
                                                            }}><Plus size={14} /> Walkthrough</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button variant="outline" onClick={() => handleCreateModule(stage.id)} style={{ justifySelf: 'start', marginTop: '0.5rem' }}>
                                                <Plus size={16} style={{ marginRight: '6px' }} /> Add Module
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            }
                        </div >

                        {/* Legacy/Uncategorized Content */}
                        <div style={{ marginTop: '2rem' }}>
                            <h3>Uncategorized Content</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
                                {getContent(undefined, selectedCourseId).map(renderContentItem)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={deleteConfirmation.isOpen}
                    onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                    title={`Delete ${deleteConfirmation.type.charAt(0).toUpperCase() + deleteConfirmation.type.slice(1)}`}
                >
                    <div>
                        <p>Are you sure you want to delete <strong>{deleteConfirmation.title}</strong>?</p>
                        <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                            This action cannot be undone. All related content (modules, lessons, quizzes) will also be permanently deleted.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button variant="outline" onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={confirmDelete}
                                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            </PageTransition>
        );
    }

    // 5. Main Course List View
    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 style={{ margin: 0 }}>{t('teacher.quizzes.title')}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('teacher.quizzes.subtitle')}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 36px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <select
                            value={selectedFilterLevel}
                            onChange={e => setSelectedFilterLevel(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="">All Levels</option>
                            <option value="Level 2">Level 2</option>
                            <option value="Level 3A">Level 3 - First Year</option>
                            <option value="Level 3B">Level 3 - Second Year</option>
                        </select>
                        <select
                            value={selectedFilterSubject}
                            onChange={e => setSelectedFilterSubject(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="">All Subjects</option>
                            <option value="music">Music</option>
                            <option value="performing_arts">Performing Arts</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" onClick={() => setShowFolderManager(true)}>
                            <Folder size={20} style={{ marginRight: '8px' }} /> Manage Folders
                        </Button>
                        <Button onClick={handleCreateCourse} variant="primary">
                            <FolderPlus size={20} style={{ marginRight: '8px' }} /> {t('teacher.quizzes.newCourse')}
                        </Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
                    {/* Folders and their Courses */}
                    {folders.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map(folder => {
                        const folderCourses = courses.filter(c => c.folderId === folder.id)
                            .filter(c => !selectedFilterLevel || c.level === selectedFilterLevel)
                            .filter(c => !selectedFilterSubject || c.subject === selectedFilterSubject)
                            .filter(c => !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())))
                            .sort((a, b) => (a.order || 0) - (b.order || 0));

                        if (folderCourses.length === 0 && searchTerm) return null;

                        return (
                            <div key={folder.id}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: `2px solid ${folder.color || 'var(--border-color)'}`, paddingBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Folder size={24} color={folder.color || 'var(--text-primary)'} />
                                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{folder.title}</h2>
                                        {folder.description && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginLeft: '1rem' }}>{folder.description}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button size="sm" variant="ghost" onClick={() => { setEditingFolder(folder); setIsEditingFolder(true); }}><Edit3 size={16} /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteFolder(folder.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                                    {folderCourses.map((course, index, array) => (
                                        <Card
                                            key={course.id}
                                            elevated
                                            hover
                                            onClick={() => setSelectedCourseId(course.id)}
                                            style={{
                                                cursor: 'pointer',
                                                borderTop: `4px solid ${course.color || 'var(--primary-color)'}`,
                                                opacity: course.published ? 1 : 0.7,
                                                border: course.published ? undefined : '1px dashed var(--border-color)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                {!course.published && <span style={{ fontSize: '0.7rem', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>DRAFT</span>}
                                                <div style={{ display: 'flex' }} onClick={(e) => e.stopPropagation()}>
                                                    <Button size="sm" variant="ghost" onClick={() => { setEditingCourse(course); setIsEditingCourse(true); }}><Edit3 size={16} /></Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteCourse(course.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                                <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderCourse(course.id, 'up')}><ChevronUp size={16} /></Button>
                                                <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderCourse(course.id, 'down')}><ChevronDown size={16} /></Button>
                                            </div>
                                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>{course.title}</h3>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                {course.level && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>{course.level}</span>}
                                                {course.subject && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>{course.subject === 'music' ? 'Music' : 'Performing Arts'}</span>}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Uncategorized Courses */}
                    <div>
                        {(courses.filter(c => !c.folderId).length > 0 || (searchTerm && courses.some(c => !c.folderId && c.title.toLowerCase().includes(searchTerm.toLowerCase())))) && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                                    <Folder size={24} color="var(--text-tertiary)" />
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Uncategorized</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                                    {courses.filter(c => !c.folderId)
                                        .filter(c => !selectedFilterLevel || c.level === selectedFilterLevel)
                                        .filter(c => !selectedFilterSubject || c.subject === selectedFilterSubject)
                                        .filter(c => !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())))
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map((course, index, array) => (
                                            <Card
                                                key={course.id}
                                                elevated
                                                hover
                                                onClick={() => setSelectedCourseId(course.id)}
                                                style={{
                                                    cursor: 'pointer',
                                                    borderTop: `4px solid ${course.color || 'var(--primary-color)'}`,
                                                    opacity: course.published ? 1 : 0.7,
                                                    border: course.published ? undefined : '1px dashed var(--border-color)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    {!course.published && <span style={{ fontSize: '0.7rem', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>DRAFT</span>}
                                                    <div style={{ display: 'flex' }} onClick={(e) => e.stopPropagation()}>
                                                        <Button size="sm" variant="ghost" onClick={() => { setEditingCourse(course); setIsEditingCourse(true); }}><Edit3 size={16} /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteCourse(course.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                                    <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderCourse(course.id, 'up')}><ChevronUp size={16} /></Button>
                                                    <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderCourse(course.id, 'down')}><ChevronDown size={16} /></Button>
                                                </div>
                                                <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>{course.title}</h3>
                                                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                    {course.level && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>{course.level}</span>}
                                                    {course.subject && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>{course.subject === 'music' ? 'Music' : 'Performing Arts'}</span>}
                                                </div>
                                            </Card>
                                        ))}

                                    {/* Uncategorized Content (Legacy) */}
                                    {quizzes.some(q => !q.courseId) && !searchTerm && (
                                        <Card
                                            elevated
                                            hover
                                            onClick={() => setSelectedCourseId('uncategorized')}
                                            style={{ cursor: 'pointer', borderTop: '4px solid var(--text-tertiary)', opacity: 0.8 }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <Folder size={32} color="var(--text-tertiary)" />
                                            </div>
                                            <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>{t('teacher.quizzes.uncategorized')}</h2>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{t('teacher.quizzes.uncategorizedDesc')}</p>
                                        </Card>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>


            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                title={`Delete ${deleteConfirmation.type.charAt(0).toUpperCase() + deleteConfirmation.type.slice(1)}`}
            >
                <div>
                    <p>Are you sure you want to delete <strong>{deleteConfirmation.title}</strong>?</p>
                    <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                        This action cannot be undone. All related content (modules, lessons, quizzes) will also be permanently deleted.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button variant="outline" onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={confirmDelete}
                            style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Folder Manager Modal */}
            <Modal
                isOpen={showFolderManager}
                onClose={() => setShowFolderManager(false)}
                title="Manage Course Folders"
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="sm" onClick={handleCreateFolder}><Plus size={16} /> New Folder</Button>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'grid', gap: '0.5rem' }}>
                        {folders.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>No folders created yet.</p>
                        ) : (
                            folders.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((folder, index, array) => (
                                <div key={folder.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: folder.color || 'var(--primary-color)' }} />
                                        <span>{folder.title}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '2px', marginRight: '0.5rem' }}>
                                            <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderFolder(folder.id, 'up')}><ChevronUp size={16} /></Button>
                                            <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderFolder(folder.id, 'down')}><ChevronDown size={16} /></Button>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => { setEditingFolder(folder); setIsEditingFolder(true); }}><Edit3 size={16} /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteFolder(folder.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* Folder Editor Modal */}
            <Modal
                isOpen={isEditingFolder}
                onClose={() => setIsEditingFolder(false)}
                title={folders.find(f => f.id === editingFolder?.id) ? 'Edit Folder' : 'New Folder'}
            >
                {editingFolder && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
                            <input
                                value={editingFolder.title}
                                onChange={e => setEditingFolder({ ...editingFolder, title: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                placeholder="Folder Title"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                            <textarea
                                value={editingFolder.description || ''}
                                onChange={e => setEditingFolder({ ...editingFolder, description: e.target.value })}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white', minHeight: '100px' }}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Theme Color</label>
                            <input
                                type="color"
                                value={editingFolder.color || '#9b59b6'}
                                onChange={e => setEditingFolder({ ...editingFolder, color: e.target.value })}
                                style={{ width: '100%', height: '40px', padding: '0', border: 'none', cursor: 'pointer' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => setIsEditingFolder(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveFolder}>Save Folder</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </PageTransition>
    );
};

export default TeacherQuizzes;
