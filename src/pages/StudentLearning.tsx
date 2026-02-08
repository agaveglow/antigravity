import React, { useState, useEffect } from 'react';
import { useQuizzes } from '../context/QuizContext';
import { useUser } from '../context/UserContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Lock, Star, CheckCircle2, Play, Flag, Menu, X, ArrowLeft, BookOpen, FileText } from 'lucide-react';
import type { Quiz, Course, Lesson } from '../types/ual';
import PageTransition from '../components/common/PageTransition';
import Markdown from 'react-markdown';
import { audioService } from '../utils/audio';

const StudentLearning: React.FC = () => {
    const { quizzes, completeQuiz, completedQuizzes, courses, lessons, completeLesson, completedLessons } = useQuizzes();
    const { user } = useUser();

    // UI State
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    // Quiz Execution State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- Helpers ---

    const handleStartQuiz = (quiz: Quiz) => {
        setActiveQuiz(quiz);
        setCurrentQuestionIndex(0);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setQuizCompleted(false);
        setShowConfetti(false);
    };

    const handleStartLesson = (lesson: Lesson) => {
        setActiveLesson(lesson);
    };

    const handleAnswer = (optionId: string) => {
        if (isAnswered || !activeQuiz) return;
        setSelectedOptionId(optionId);
        setIsAnswered(true);

        const currentQ = activeQuiz.questions[currentQuestionIndex];
        const correct = currentQ.correctOptionId === optionId;
        setIsCorrect(correct);

        if (correct) {
            audioService.playSuccess();
        } else {
            audioService.playError();
        }
    };

    const handleNextQuestion = () => {
        if (!activeQuiz) return;
        if (currentQuestionIndex < activeQuiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOptionId(null);
            setIsAnswered(false);
            setIsCorrect(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        if (!activeQuiz) return;
        setQuizCompleted(true);
        setShowConfetti(true);
        completeQuiz(activeQuiz.id);
        audioService.playLevelUp();
    };

    const handleFinishLesson = () => {
        if (!activeLesson) return;
        completeLesson(activeLesson.id);
        setActiveLesson(null);
        audioService.playSuccess(); // Small success sound
    };

    // --- Render Views ---

    // 1. Active Quiz View
    if (activeQuiz) {
        const currentQ = activeQuiz.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;

        if (quizCompleted) {
            return (
                <PageTransition>
                    <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
                        <Card elevated>
                            <div style={{ marginBottom: '2rem' }}>
                                <Star size={64} color="var(--color-brand-gold)" fill="var(--color-brand-gold)" className="animate-bounce" />
                            </div>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Quiz Completed!</h1>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                You earned <span style={{ color: 'var(--color-brand-cyan)', fontWeight: 'bold' }}>{activeQuiz.xpReward} XP</span> and <span style={{ color: 'var(--color-brand-purple)', fontWeight: 'bold' }}>${activeQuiz.dowdBucksReward}</span>
                            </p>
                            <Button variant="primary" size="lg" onClick={() => setActiveQuiz(null)}>
                                Continue Learning
                            </Button>
                        </Card>
                    </div>
                </PageTransition>
            );
        }

        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <Button variant="ghost" onClick={() => setActiveQuiz(null)} style={{ marginRight: '1rem' }}>
                        <X size={24} />
                    </Button>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold' }}>{activeQuiz.title}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{currentQuestionIndex + 1} / {activeQuiz.questions.length}</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-brand-cyan)', transition: 'width 0.3s ease' }} />
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <Card elevated style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{currentQ.text}</h2>

                    {/* Interactive Question Types */}
                    {currentQ.type === 'listening' && (
                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', textAlign: 'center' }}>
                            <Button variant="secondary" onClick={() => {/* Play Interval Logic */ }}>
                                <Play size={20} style={{ marginRight: '8px' }} /> Play Interval
                            </Button>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {currentQ.options.map(opt => {
                            let bg = 'var(--bg-subtle)';
                            let border = '2px solid transparent';

                            if (isAnswered) {
                                if (opt.id === currentQ.correctOptionId) {
                                    bg = 'rgba(46, 204, 113, 0.2)';
                                    border = '2px solid var(--color-success)';
                                } else if (opt.id === selectedOptionId) {
                                    bg = 'rgba(231, 76, 60, 0.2)';
                                    border = '2px solid var(--color-danger)';
                                }
                            }

                            return (
                                <div
                                    key={opt.id}
                                    onClick={() => !isAnswered && handleAnswer(opt.id)}
                                    style={{
                                        padding: '1.5rem',
                                        background: bg,
                                        border: border,
                                        borderRadius: '12px',
                                        cursor: isAnswered ? 'default' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontSize: '1.1rem',
                                        fontWeight: 500
                                    }}
                                >
                                    {opt.text}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Footer Controls */}
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="primary" size="lg" disabled={!isAnswered} onClick={handleNextQuestion}>
                        {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                </div>
            </div>
        );
    }

    // 2. Active Lesson View
    if (activeLesson) {
        return (
            <PageTransition>
                <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                        <Button variant="ghost" onClick={() => setActiveLesson(null)} style={{ marginRight: '1rem' }}>
                            <ArrowLeft size={24} /> Back
                        </Button>
                        <h2 style={{ margin: 0 }}>{activeLesson.title}</h2>
                    </div>

                    <Card elevated style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div className="markdown-content" style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>
                            <Markdown>{activeLesson.content}</Markdown>
                        </div>
                    </Card>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Button variant="primary" size="lg" onClick={handleFinishLesson}>
                            Complete Lesson (+{activeLesson.xpReward} XP)
                        </Button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // 3. Course Roadmap View
    if (activeCourseId) {
        const course = courses.find(c => c.id === activeCourseId);

        // Combine and Sort Items
        const courseQuizzes = quizzes.filter(q => q.courseId === activeCourseId).map(q => ({ ...q, itemType: 'quiz' as const }));
        const courseLessons = lessons?.filter(l => l.courseId === activeCourseId).map(l => ({ ...l, itemType: 'lesson' as const })) || [];
        const roadmapItems = [...courseQuizzes, ...courseLessons].sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
            <PageTransition>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                        <Button variant="ghost" onClick={() => setActiveCourseId(null)} style={{ marginRight: '1rem' }}>
                            <ArrowLeft size={24} />
                        </Button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', color: course?.color }}>{course?.title}</h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{course?.description}</p>
                        </div>
                    </div>

                    {/* Roadmap Container */}
                    <div style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '2rem 0' }}>

                        {/* Start Node */}
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-surface-elevated)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                                border: `4px solid ${course?.color || 'white'}`, boxShadow: '0 0 15px rgba(0,0,0,0.2)'
                            }}>
                                <Flag size={24} color={course?.color || 'white'} />
                            </div>
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>START</div>
                        </div>

                        {/* Nodes */}
                        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto', minHeight: '400px' }}>
                            {/* Connecting Line (Zig Zag / Wavy) */}
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
                                <path
                                    d={roadmapItems.map((_, i) => {
                                        const x = i % 2 === 0 ? '50%' : (i % 4 === 1 ? '80%' : '20%'); // Zig-zag center, right, center, left? No, let's do center vertical or zig zag
                                        // Simple Zig Zag: Even = Right (70%), Odd = Left (30%)
                                        const xPos = i % 2 === 0 ? 30 : 70;
                                        const yPos = (i * 120) + 60; // Spacing
                                        return `${i === 0 ? 'M 50 20' : ''} L ${xPos} ${yPos}`;
                                    }).join(' ')}
                                // stroke="var(--border-color)" 
                                // strokeWidth="4" 
                                // fill="none"
                                // opacity="0.5"
                                // Actually, drawing SVG paths dynamically with React is tricky for perfect curves without a library.
                                // Let's use a simpler central line approach or purely CSS positioning relative to a center line.
                                />
                                {/* Simple center line for now, nodes offset */}
                                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="var(--border-color)" strokeWidth="4" strokeDasharray="10, 10" />
                            </svg>

                            {roadmapItems.map((item, index) => {
                                // Progression Logic
                                // An item is locked if the PREVIOUS item is NOT completed.
                                const prevItem = roadmapItems[index - 1];
                                const isPrevCompleted = !prevItem || (prevItem.itemType === 'quiz' ? completedQuizzes.includes(prevItem.id) : completedLessons.includes(prevItem.id));

                                const isLocked = index > 0 && !isPrevCompleted;
                                const isCompleted = item.itemType === 'quiz' ? completedQuizzes.includes(item.id) : completedLessons.includes(item.id);
                                const isCurrent = !isLocked && !isCompleted;

                                // Layout: Zig Zag
                                const isLeft = index % 2 === 1;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => !isLocked && (item.itemType === 'quiz' ? handleStartQuiz(item as Quiz) : handleStartLesson(item as Lesson))}
                                        style={{
                                            position: 'relative',
                                            margin: '0 auto 60px', // Vertical spacing
                                            width: 'fit-content',
                                            zIndex: 2,
                                            transform: `translateX(${isLeft ? '-80px' : '80px'})`, // Basic offset
                                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                                        }}
                                    >
                                        <div style={{
                                            width: '100px', height: '100px',
                                            borderRadius: '50%',
                                            background: isLocked ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                                            border: isCurrent
                                                ? `6px solid ${course?.color || 'var(--color-brand-cyan)'}`
                                                : isCompleted
                                                    ? '6px solid var(--color-success)'
                                                    : `4px solid ${isLocked ? 'var(--border-color)' : 'var(--bg-surface-elevated)'}`,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: isLocked ? 'none' : '0 10px 25px -5px rgba(0,0,0,0.1), 0 5px 10px -5px rgba(0,0,0,0.05)',
                                            cursor: isLocked ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                                            opacity: isLocked ? 0.7 : 1
                                        }}>
                                            {isCompleted && (
                                                <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--color-success)', color: 'white', borderRadius: '50%', padding: '4px', zIndex: 3 }}>
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}

                                            {isLocked ? (
                                                <Lock size={28} color="var(--text-tertiary)" />
                                            ) : (
                                                <>
                                                    {item.itemType === 'quiz' ? (
                                                        <Star size={32} color={course?.color || 'var(--color-brand-gold)'} fill={isCurrent ? (course?.color || 'var(--color-brand-gold)') : 'none'} />
                                                    ) : (
                                                        <BookOpen size={32} color={course?.color || 'var(--color-brand-purple)'} fill={isCurrent ? (course?.color || 'var(--color-brand-purple)') : 'none'} />
                                                    )}
                                                </>
                                            )}

                                            {/* Label inside bubble */}
                                            <div style={{ marginTop: '5px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>
                                                {item.itemType.toUpperCase()}
                                            </div>
                                        </div>

                                        {/* Title Label Below */}
                                        <div style={{
                                            marginTop: '1rem',
                                            background: 'var(--bg-surface)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                            maxWidth: '160px',
                                            textAlign: 'center',
                                            border: isCurrent ? `2px solid ${course?.color}` : '1px solid var(--border-color)'
                                        }}>
                                            {item.title}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Finish Flag */}
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-surface-elevated)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                                border: '4px dashed var(--text-tertiary)', opacity: 0.5
                            }}>
                                <Flag size={24} />
                            </div>
                        </div>

                    </div>
                </div>
            </PageTransition>
        );
    }

    // 4. Main Course List (Sidebar style or Grid?)
    // This looks similar to TeacherQuizzes but readonly and progress focused
    return (
        <PageTransition>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '2rem' }}>My Courses</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {courses.map(course => {
                        // Calc progress
                        const cQuizzes = quizzes.filter(q => q.courseId === course.id);
                        const cLessons = lessons.filter(l => l.courseId === course.id);
                        const totalItems = cQuizzes.length + cLessons.length;

                        const completedQ = cQuizzes.filter(q => completedQuizzes.includes(q.id)).length;
                        const completedL = cLessons.filter(l => completedLessons.includes(l.id)).length;
                        const totalCompleted = completedQ + completedL;

                        const percent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

                        return (
                            <Card
                                key={course.id}
                                hover elevated
                                onClick={() => setActiveCourseId(course.id)}
                                style={{ cursor: 'pointer', borderTop: `4px solid ${course.color}` }}
                            >
                                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{course.title}</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{course.description}</p>

                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <span>Progress</span>
                                    <span>{percent}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percent}%`, height: '100%', background: course.color }} />
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </PageTransition>
    );
};

export default StudentLearning;
