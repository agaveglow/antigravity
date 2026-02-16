import React, { useState } from 'react';
import { useQuizzes } from '../context/QuizContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';
import {
    Plus, Edit3, Trash2, Save, Sparkles, Loader2, Folder, FolderPlus, ArrowLeft,
    ChevronUp, ChevronDown, BookOpen, FileText, Image as ImageIcon
} from 'lucide-react';
import type { Quiz, Question, Course, Lesson, Walkthrough } from '../types/ual';
import PageTransition from '../components/common/PageTransition';
import { generateQuizAI } from '../services/QuizGenerator';
import WalkthroughEditor from '../components/curriculum/WalkthroughEditor';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

const TeacherQuizzes: React.FC = () => {
    const {
        quizzes, addQuiz, updateQuiz, deleteQuiz,
        courses, addCourse, updateCourse, deleteCourse, reorderCourse,
        lessons, addLesson, updateLesson, deleteLesson,
        walkthroughs, addWalkthrough, updateWalkthrough, deleteWalkthrough,
        reorderItem
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

    // --- Course Management ---

    const handleCreateCourse = () => {
        const newCourse: Course = {
            id: generateId(),
            title: t('teacher.quizzes.newCourse'),
            description: t('teacher.quizzes.courseDesc'),
            color: '#3498db',
            order: 0,
            createdAt: new Date().toISOString()
        };
        setEditingCourse(newCourse);
        setIsEditingCourse(true);
    };

    const handleSaveCourse = () => {
        if (!editingCourse) return;
        const existing = courses.find(c => c.id === editingCourse.id);
        if (existing) {
            updateCourse(editingCourse.id, editingCourse);
        } else {
            addCourse(editingCourse);
        }
        setIsEditingCourse(false);
        setEditingCourse(null);
    };

    const handleDeleteCourse = (id: string) => {
        if (window.confirm(t('teacher.quizzes.deleteConfirm'))) {
            deleteCourse(id);
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
        if (window.confirm('Delete this walkthrough?')) {
            deleteWalkthrough(id);
        }
    };



    // --- Render Views ---

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
                                <textarea
                                    value={editingCourse.description}
                                    onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'white' }}
                                />
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
                                <textarea
                                    value={editingLesson.content}
                                    onChange={e => setEditingLesson({ ...editingLesson, content: e.target.value })}
                                    style={{ width: '100%', height: '400px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
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
            </PageTransition >
        );
    }

    // 4. Course Details (List of Quizzes & Lessons)
    if (selectedCourseId) {
        const course = courses.find(c => c.id === selectedCourseId);
        const courseQuizzes = quizzes.filter(q => q.courseId === selectedCourseId).map(q => ({ ...q, itemType: 'quiz' as const }));
        const courseLessons = lessons?.filter(l => l.courseId === selectedCourseId).map(l => ({ ...l, itemType: 'lesson' as const })) || [];
        const courseWalkthroughs = walkthroughs?.filter(w => w.courseId === selectedCourseId).map(w => ({ ...w, itemType: 'walkthrough' as const })) || [];

        const allItems = [...courseQuizzes, ...courseLessons, ...courseWalkthroughs].sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
            <PageTransition>
                <div style={{ paddingBottom: 'var(--space-12)' }}>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <Button variant="ghost" onClick={() => setSelectedCourseId(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <ArrowLeft size={16} /> {t('teacher.quizzes.backToCourses')}
                        </Button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ margin: 0, color: course?.color || 'white' }}>{course?.title}</h1>
                                <p style={{ color: 'var(--text-secondary)' }}>{course?.description}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button onClick={handleGenerateQuiz} variant="secondary" disabled={isGenerating}>
                                    {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} style={{ marginRight: '8px' }} />}
                                    {t('teacher.quizzes.aiGenerate')}
                                </Button>
                                <Button onClick={handleCreateLesson} variant="secondary">
                                    <BookOpen size={20} style={{ marginRight: '8px' }} /> {t('teacher.quizzes.addLesson')}
                                </Button>
                                <Button onClick={handleCreateWalkthrough} variant="secondary">
                                    <ImageIcon size={20} style={{ marginRight: '8px' }} /> Add Walkthrough
                                </Button>
                                <Button onClick={handleCreateQuiz} variant="primary">
                                    <Plus size={20} style={{ marginRight: '8px' }} /> {t('teacher.quizzes.createQuiz')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
                        {allItems.map((item, index, array) => (
                            <Card key={item.id} elevated hover style={{ display: 'flex', flexDirection: 'column', borderLeft: item.itemType === 'lesson' ? '4px solid var(--color-brand-purple)' : (item.itemType === 'walkthrough' ? '4px solid #43a047' : '4px solid var(--color-brand-cyan)') }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {item.itemType === 'lesson' ? <BookOpen size={12} /> : (item.itemType === 'walkthrough' ? <ImageIcon size={12} /> : <FileText size={12} />)}
                                        {item.itemType.toUpperCase()}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <Button size="sm" variant="ghost" onClick={() => {
                                            if (item.itemType === 'quiz') { setEditingQuiz(item as Quiz); setIsEditingQuiz(true); }
                                            else if (item.itemType === 'walkthrough') { setEditingWalkthrough(item as Walkthrough); setIsEditingWalkthrough(true); }
                                            else { setEditingLesson(item as Lesson); setIsEditingLesson(true); }
                                        }}><Edit3 size={16} /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => {
                                            if (item.itemType === 'quiz') deleteQuiz(item.id);
                                            else if (item.itemType === 'walkthrough') handleDeleteWalkthrough(item.id);
                                            else deleteLesson(item.id);
                                        }} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                    <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderItem(item.id, item.itemType, 'up')}><ChevronUp size={16} /></Button>
                                    <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderItem(item.id, item.itemType, 'down')}><ChevronDown size={16} /></Button>
                                </div>
                                <h3 style={{ margin: '0 0 var(--space-2)' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>{item.description}</p>
                                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {item.itemType === 'quiz' && <span>{(item as Quiz).questions?.length || 0} Qs</span>}
                                    {item.itemType === 'walkthrough' && <span>{(item as Walkthrough).steps?.length || 0} Steps</span>}
                                    <span style={{ color: 'var(--color-brand-cyan)' }}>{item.xpReward} XP</span>
                                </div>
                            </Card>
                        ))}
                        {allItems.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                                <p>{t('teacher.quizzes.noContent')}</p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                                    <Button variant="ghost" onClick={handleCreateLesson}>{t('teacher.quizzes.addLesson')}</Button>
                                    <Button variant="ghost" onClick={handleCreateQuiz}>{t('teacher.quizzes.createQuiz')}</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>
        );
    }

    // 5. Main Course List View
    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{t('teacher.quizzes.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('teacher.quizzes.subtitle')}</p>
                    </div>
                    <Button onClick={handleCreateCourse} variant="primary">
                        <FolderPlus size={20} style={{ marginRight: '8px' }} /> {t('teacher.quizzes.newCourse')}
                    </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                    {[...courses].sort((a, b) => (a.order || 0) - (b.order || 0)).map((course, index, array) => (
                        <Card
                            key={course.id}
                            elevated
                            hover
                            onClick={() => setSelectedCourseId(course.id)}
                            style={{ cursor: 'pointer', borderTop: `4px solid ${course.color || 'var(--primary-color)'}` }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <Folder size={32} color={course.color || 'var(--text-primary)'} />
                                <div style={{ display: 'flex' }} onClick={(e) => e.stopPropagation()}>
                                    <Button size="sm" variant="ghost" onClick={() => { setEditingCourse(course); setIsEditingCourse(true); }}><Edit3 size={16} /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteCourse(course.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></Button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => reorderCourse(course.id, 'up')}><ChevronUp size={16} /></Button>
                                <Button size="sm" variant="ghost" disabled={index === array.length - 1} onClick={() => reorderCourse(course.id, 'down')}><ChevronDown size={16} /></Button>
                            </div>
                            <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>{course.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{course.description}</p>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                {t('teacher.quizzes.quizCount').replace('{count}', quizzes.filter(q => q.courseId === course.id).length.toString())} • {t('teacher.quizzes.lessonCount').replace('{count}', (lessons?.filter(l => l.courseId === course.id).length || 0).toString())}
                            </div>
                        </Card>
                    ))}

                    {/* Uncategorized Section */}
                    {quizzes.some(q => !q.courseId) && (
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
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                {t('teacher.quizzes.quizCount').replace('{count}', quizzes.filter(q => !q.courseId).length.toString())}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default TeacherQuizzes;
