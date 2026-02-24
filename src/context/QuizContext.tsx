import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Quiz, Course, Lesson, Walkthrough, Stage, Module, CourseFolder } from '../types/ual';
import { useUser } from './UserContext';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationContext';

interface QuizContextType {
    quizzes: Quiz[];
    isLoading: boolean;
    addQuiz: (quiz: Quiz) => Promise<void>;
    updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<void>;
    deleteQuiz: (id: string) => Promise<void>;
    completeQuiz: (quizId: string) => Promise<void>;
    completedQuizzes: string[];
    reorderQuiz: (id: string, direction: 'up' | 'down') => Promise<void>;
    courses: Course[];
    addCourse: (course: Course) => Promise<{ success: boolean; error?: string }>;
    updateCourse: (id: string, updates: Partial<Course>) => Promise<{ success: boolean; error?: string }>;
    deleteCourse: (id: string, deleteQuizzes?: boolean) => Promise<void>;
    reorderCourse: (id: string, direction: 'up' | 'down') => Promise<void>;
    stages: Stage[];
    addStage: (stage: Stage) => Promise<boolean>;
    updateStage: (id: string, updates: Partial<Stage>) => Promise<boolean>;
    deleteStage: (id: string) => Promise<void>;
    reorderStage: (id: string, direction: 'up' | 'down') => Promise<void>;
    modules: Module[];
    addModule: (module: Module) => Promise<boolean>;
    updateModule: (id: string, updates: Partial<Module>) => Promise<boolean>;
    deleteModule: (id: string) => Promise<void>;
    reorderModule: (id: string, direction: 'up' | 'down') => Promise<void>;
    lessons: Lesson[];
    addLesson: (lesson: Lesson) => Promise<void>;
    updateLesson: (id: string, updates: Partial<Lesson>) => Promise<void>;
    deleteLesson: (id: string) => Promise<void>;
    completeLesson: (lessonId: string) => Promise<void>;
    completedLessons: string[];
    walkthroughs: Walkthrough[];
    addWalkthrough: (walkthrough: Walkthrough) => Promise<void>;
    updateWalkthrough: (id: string, updates: Partial<Walkthrough>) => Promise<void>;
    deleteWalkthrough: (id: string) => Promise<void>;
    completeWalkthrough: (walkthroughId: string) => Promise<void>;
    completedWalkthroughs: string[];
    reorderItem: (id: string, type: 'quiz' | 'lesson' | 'walkthrough', direction: 'up' | 'down') => Promise<void>;
    resetCourseProgress: (courseId: string) => Promise<void>;
    // Folders
    folders: CourseFolder[];
    addFolder: (folder: CourseFolder) => Promise<{ success: boolean; error?: string }>;
    updateFolder: (id: string, updates: Partial<CourseFolder>) => Promise<{ success: boolean; error?: string }>;
    deleteFolder: (id: string) => Promise<void>;
    reorderFolder: (id: string, direction: 'up' | 'down') => Promise<void>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, addXp } = useUser();
    const { triggerCelebration, createNotification } = useNotifications();

    // --- State ---
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [walkthroughs, setWalkthroughs] = useState<Walkthrough[]>([]);
    const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [completedWalkthroughs, setCompletedWalkthroughs] = useState<string[]>([]);
    const [folders, setFolders] = useState<CourseFolder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load
    useEffect(() => {
        const loadContent = async () => {
            const start = performance.now();
            console.log('QuizContext: loadContent started');
            setIsLoading(true);

            try {
                // Fetch everything in parallel
                const [
                    { data: coursesData, error: coursesError },
                    { data: stagesData, error: stagesError },
                    { data: modulesData, error: modulesError },
                    { data: lessonsData, error: lessonsError },
                    { data: quizzesData, error: quizzesError },
                    { data: walkthroughsData, error: walkthroughsError },
                    { data: foldersData, error: foldersError }
                ] = await Promise.all([
                    supabase.from('courses').select('*').order('order_index'),
                    supabase.from('stages').select('*').order('order_index'),
                    supabase.from('modules').select('*').order('order_index'),
                    supabase.from('lessons').select('*').order('order_index'),
                    supabase.from('quizzes').select('*').order('order_index'),
                    supabase.from('walkthroughs').select('*').order('order_index'),
                    supabase.from('course_folders').select('*').order('order_index')
                ]);

                if (coursesError) console.error('QuizContext: Courses load failed:', coursesError.message);
                if (stagesError) console.error('QuizContext: Stages load failed:', stagesError.message);
                if (modulesError) console.error('QuizContext: Modules load failed:', modulesError.message);
                if (lessonsError) console.error('QuizContext: Lessons load failed:', lessonsError.message);
                if (quizzesError) console.error('QuizContext: Quizzes load failed:', quizzesError.message);
                if (walkthroughsError) console.error('QuizContext: Walkthroughs load failed:', walkthroughsError.message);
                if (foldersError) console.error('QuizContext: Folders load failed:', foldersError.message);

                // Map data with fallbacks
                if (coursesData) {
                    setCourses(coursesData.map((c: any) => ({
                        ...c,
                        imageUrl: c.image_url,
                        order: c.order_index,
                        folderId: c.folder_id
                    })));
                }

                if (stagesData) {
                    setStages(stagesData.map((s: any) => ({
                        ...s,
                        courseId: s.course_id,
                        xpReward: s.xp_reward,
                        dowdBucksReward: s.dowd_bucks_reward,
                        order: s.order_index
                    })));
                }

                if (modulesData) {
                    setModules(modulesData.map((m: any) => ({
                        ...m,
                        stageId: m.stage_id,
                        xpReward: m.xp_reward,
                        dowdBucksReward: m.dowd_bucks_reward,
                        order: m.order_index
                    })));
                }

                if (lessonsData) {
                    setLessons(lessonsData.map((l: any) => ({
                        ...l,
                        courseId: l.course_id,
                        moduleId: l.module_id,
                        xpReward: l.xp_reward,
                        order: l.order_index
                    })));
                }

                if (quizzesData) {
                    setQuizzes(quizzesData.map((q: any) => ({
                        ...q,
                        courseId: q.course_id,
                        moduleId: q.module_id,
                        projectId: q.project_id,
                        xpReward: q.xp_reward,
                        dowdBucksReward: q.dowd_bucks_reward || q.dowdBucksReward,
                        order: q.order_index
                    })));
                }

                if (walkthroughsData) {
                    setWalkthroughs(walkthroughsData.map((w: any) => ({
                        ...w,
                        courseId: w.course_id,
                        moduleId: w.module_id,
                        xpReward: w.xp_reward,
                        dowdBucksReward: w.dowd_bucks_reward,
                        order: w.order_index
                    })));
                }

                if (foldersData) {
                    setFolders(foldersData.map((f: any) => ({
                        ...f,
                        orderIndex: f.order_index,
                        createdAt: f.created_at
                    })));
                }

                const end = performance.now();
                console.log(`QuizContext: Curriculum loaded in ${(end - start).toFixed(2)}ms`);
            } catch (error) {
                console.error('QuizContext: Fatal error in loadContent:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            loadContent();
        } else {
            setCourses([]);
            setStages([]);
            setModules([]);
            setLessons([]);
            setQuizzes([]);
            setWalkthroughs([]);
            setIsLoading(false);
        }
    }, [user]);

    // Load User Progress
    useEffect(() => {
        if (!user) return;

        const loadProgress = async () => {
            const { data: progress } = await supabase
                .from('content_completion')
                .select('*')
                .eq('user_id', user.id);

            if (progress) {
                setCompletedQuizzes(progress.filter((p: any) => p.content_type === 'quiz').map((p: any) => p.content_id));
                setCompletedLessons(progress.filter((p: any) => p.content_type === 'lesson').map((p: any) => p.content_id));
                setCompletedWalkthroughs(progress.filter((p: any) => p.content_type === 'walkthrough').map((p: any) => p.content_id));
            }
        };

        loadProgress();
    }, [user]);

    const completeQuiz = async (quizId: string) => {
        if (!user || completedQuizzes.includes(quizId)) return;
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        const { error } = await supabase.from('content_completion').insert({
            user_id: user.id,
            content_id: quizId,
            content_type: 'quiz'
        });

        if (!error) {
            setCompletedQuizzes(prev => [...prev, quizId]);
            await addXp(quiz.xpReward);

            // Trigger celebration
            triggerCelebration({
                type: 'course_completed',
                title: 'Quiz Completed! 📝',
                message: quiz.title,
                icon: '✅',
                color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                xpGained: quiz.xpReward
            });

            // Check for module/stage/course completion
            await checkHierarchyCompletion(quiz.moduleId, quiz.courseId);
        }
    };

    const completeLesson = async (lessonId: string) => {
        if (!user || completedLessons.includes(lessonId)) return;
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const { error } = await supabase.from('content_completion').insert({
            user_id: user.id,
            content_id: lessonId,
            content_type: 'lesson'
        });

        if (!error) {
            setCompletedLessons(prev => [...prev, lessonId]);
            await addXp(lesson.xpReward);

            // Trigger celebration
            triggerCelebration({
                type: 'course_completed',
                title: 'Lesson Completed! 📖',
                message: lesson.title,
                icon: '✅',
                color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                xpGained: lesson.xpReward
            });

            // Check for module/stage/course completion
            await checkHierarchyCompletion(lesson.moduleId, lesson.courseId);
        }
    };

    const completeWalkthrough = async (walkthroughId: string) => {
        if (!user || completedWalkthroughs.includes(walkthroughId)) return;
        const walkthrough = walkthroughs.find(w => w.id === walkthroughId);
        if (!walkthrough) return;

        const { error } = await supabase.from('content_completion').insert({
            user_id: user.id,
            content_id: walkthroughId,
            content_type: 'walkthrough'
        });

        if (!error) {
            setCompletedWalkthroughs(prev => [...prev, walkthroughId]);
            await addXp(walkthrough.xpReward || 0);

            // Trigger celebration
            triggerCelebration({
                type: 'course_completed',
                title: 'Walkthrough Completed! 🎬',
                message: walkthrough.title,
                icon: '✅',
                color: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                xpGained: walkthrough.xpReward || 0
            });

            // Check for module/stage/course completion
            await checkHierarchyCompletion(walkthrough.moduleId, walkthrough.courseId);
        }
    };

    // Helper function to check if module/stage/course is completed
    const checkHierarchyCompletion = async (moduleId?: string, courseId?: string) => {
        if (!user) return;

        // Check module completion
        if (moduleId) {
            const module = modules.find(m => m.id === moduleId);
            if (module) {
                const moduleContent = [
                    ...quizzes.filter(q => q.moduleId === moduleId),
                    ...lessons.filter(l => l.moduleId === moduleId),
                    ...walkthroughs.filter(w => w.moduleId === moduleId)
                ];

                const allCompleted = moduleContent.every(content => {
                    if ('xpReward' in content && quizzes.some(q => q.id === content.id)) {
                        return completedQuizzes.includes(content.id);
                    }
                    if ('xpReward' in content && lessons.some(l => l.id === content.id)) {
                        return completedLessons.includes(content.id);
                    }
                    if ('xpReward' in content && walkthroughs.some(w => w.id === content.id)) {
                        return completedWalkthroughs.includes(content.id);
                    }
                    return false;
                });

                if (allCompleted && moduleContent.length > 0) {
                    triggerCelebration({
                        type: 'module_completed',
                        title: 'Module Completed! 📖',
                        message: module.title,
                        icon: '⭐',
                        color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        xpGained: 100
                    });

                    await createNotification(
                        user.id,
                        'Module Completed',
                        `You completed: ${module.title}`,
                        'module_completed',
                        `/student/courses/${courseId}`,
                        moduleId,
                        'module'
                    );

                    // Check stage completion
                    const stage = stages.find(s => s.id === module.stageId);
                    if (stage) {
                        const stageModules = modules.filter(m => m.stageId === stage.id);
                        const allStageModulesCompleted = stageModules.every(m => {
                            const modContent = [
                                ...quizzes.filter(q => q.moduleId === m.id),
                                ...lessons.filter(l => l.moduleId === m.id),
                                ...walkthroughs.filter(w => w.moduleId === m.id)
                            ];
                            return modContent.every(c => {
                                if (quizzes.some(q => q.id === c.id)) return completedQuizzes.includes(c.id);
                                if (lessons.some(l => l.id === c.id)) return completedLessons.includes(c.id);
                                if (walkthroughs.some(w => w.id === c.id)) return completedWalkthroughs.includes(c.id);
                                return false;
                            });
                        });

                        if (allStageModulesCompleted && stageModules.length > 0) {
                            triggerCelebration({
                                type: 'stage_completed',
                                title: 'Stage Completed! 🌟',
                                message: stage.title,
                                icon: '🎯',
                                color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                xpGained: 250
                            });

                            await createNotification(
                                user.id,
                                'Stage Completed',
                                `You completed: ${stage.title}`,
                                'stage_completed',
                                `/student/courses/${courseId}`,
                                stage.id,
                                'stage'
                            );
                        }
                    }
                }
            }
        }

        // Check course completion
        if (courseId) {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                const courseStages = stages.filter(s => s.courseId === courseId);
                const allStagesCompleted = courseStages.every(stage => {
                    const stageModules = modules.filter(m => m.stageId === stage.id);
                    return stageModules.every(m => {
                        const modContent = [
                            ...quizzes.filter(q => q.moduleId === m.id),
                            ...lessons.filter(l => l.moduleId === m.id),
                            ...walkthroughs.filter(w => w.moduleId === m.id)
                        ];
                        return modContent.every(c => {
                            if (quizzes.some(q => q.id === c.id)) return completedQuizzes.includes(c.id);
                            if (lessons.some(l => l.id === c.id)) return completedLessons.includes(c.id);
                            if (walkthroughs.some(w => w.id === c.id)) return completedWalkthroughs.includes(c.id);
                            return false;
                        });
                    });
                });

                if (allStagesCompleted && courseStages.length > 0) {
                    triggerCelebration({
                        type: 'course_completed',
                        title: 'Course Completed! 🎓',
                        message: course.title,
                        icon: '🏆',
                        color: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                        xpGained: 500
                    });

                    await createNotification(
                        user.id,
                        'Course Completed',
                        `You completed: ${course.title}`,
                        'course_completed',
                        `/student/courses`,
                        courseId,
                        'course'
                    );
                }
            }
        }
    };

    const resetCourseProgress = async (courseId: string) => {
        if (!user) return;

        const cQuizzes = quizzes.filter(q => q.courseId === courseId).map(q => q.id);
        const cLessons = lessons.filter(l => l.courseId === courseId).map(l => l.id);
        const cWalkthroughs = walkthroughs.filter(w => w.courseId === courseId).map(w => w.id);
        const allIds = [...cQuizzes, ...cLessons, ...cWalkthroughs];

        if (allIds.length === 0) return;

        const { error } = await supabase
            .from('content_completion')
            .delete()
            .eq('user_id', user.id)
            .in('content_id', allIds);

        if (!error) {
            setCompletedQuizzes(prev => prev.filter(id => !cQuizzes.includes(id)));
            setCompletedLessons(prev => prev.filter(id => !cLessons.includes(id)));
            setCompletedWalkthroughs(prev => prev.filter(id => !cWalkthroughs.includes(id)));
        } else {
            console.error('QuizContext: Error resetting course progress:', error);
        }
    };

    // --- Mutators (Teachers) ---
    const addCourse = async (course: Course): Promise<{ success: boolean; error?: string }> => {
        const { id, order, ...data } = course;
        setCourses(prev => [...prev, course]);

        // Include ID in payload to ensure client-side ID matches server-side ID
        // Map camelCase to snake_case
        const { createdAt, imageUrl, folderId, ...rest } = data;
        let currentPayload: any = {
            ...rest,
            id,
            order_index: order,
            created_at: createdAt,
            image_url: imageUrl,
            folder_id: folderId
        };
        let success = false;
        let attempts = 0;
        let lastError: any = null;

        while (!success && attempts < 5) {
            const { error } = await supabase.from('courses').insert(currentPayload);
            if (error) {
                console.error(`QuizContext: Add course attempt ${attempts + 1} failed:`, error.message);
                lastError = error;
                if (error.code === 'PGRST204' || error.message?.includes('column')) {
                    const match = error.message.match(/column ['"](.+)['"]/);
                    const missingColumn = match ? match[1] : null;

                    if (missingColumn && currentPayload[missingColumn] !== undefined) {
                        console.warn(`QuizContext: Column '${missingColumn}' missing. Removing from payload and retrying.`);
                        delete currentPayload[missingColumn];
                        attempts++;
                        continue;
                    }
                }
                console.error('Error adding course:', error);
                setCourses(prev => prev.filter(c => c.id !== id));
                return { success: false, error: lastError?.message || 'Unknown error' };
            }
            success = true;
        }
        return { success: true };
    };

    const updateCourse = async (id: string, updates: Partial<Course>): Promise<{ success: boolean; error?: string }> => {
        const originalCourse = courses.find(c => c.id === id);
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        const { createdAt, imageUrl, order, folderId, ...rest } = updates;
        let currentPayload: any = { ...rest };
        if (order !== undefined) currentPayload.order_index = order;
        if (createdAt !== undefined) currentPayload.created_at = createdAt;
        if (imageUrl !== undefined) currentPayload.image_url = imageUrl;
        if (folderId !== undefined) currentPayload.folder_id = folderId;
        let success = false;
        let attempts = 0;
        let lastError: any = null;

        while (!success && attempts < 5) {
            const { error } = await supabase.from('courses').update(currentPayload).eq('id', id);
            if (error) {
                console.error(`QuizContext: Update course attempt ${attempts + 1} failed:`, error.message);
                lastError = error;
                if (error.code === 'PGRST204' || error.message?.includes('column')) {
                    const match = error.message.match(/column ['"](.+)['"]/);
                    const missingColumn = match ? match[1] : null;

                    if (missingColumn && currentPayload[missingColumn] !== undefined) {
                        console.warn(`QuizContext: Column '${missingColumn}' missing. Removing from update payload and retrying.`);
                        delete currentPayload[missingColumn];
                        attempts++;
                        continue;
                    }
                }
                console.error('Error updating course:', error);
                if (originalCourse) setCourses(prev => prev.map(c => c.id === id ? originalCourse : c));
                return { success: false, error: lastError?.message || 'Unknown error' };
            }
            success = true;
        }
        return { success: true };
    };

    const deleteCourse = async (id: string) => {
        const courseToDelete = courses.find(c => c.id === id);
        setCourses(prev => prev.filter(c => c.id !== id));
        const { error } = await supabase.from('courses').delete().eq('id', id);
        if (error) {
            console.error('Error deleting course:', error);
            if (courseToDelete) setCourses(prev => [...prev, courseToDelete]);
        }
    };

    // --- Stages & Modules CRUD ---
    const addStage = async (stage: Stage): Promise<boolean> => {
        const { id, order, createdAt, courseId, ...data } = stage;
        setStages(prev => [...prev, stage]);
        const { error } = await supabase.from('stages').insert({
            ...data,
            id,
            course_id: courseId,
            order_index: order,
            created_at: createdAt
        });
        if (error) {
            console.error('Error adding stage:', error);
            setStages(prev => prev.filter(s => s.id !== id));
            return false;
        }
        return true;
    };

    const updateStage = async (id: string, updates: Partial<Stage>): Promise<boolean> => {
        const original = stages.find(s => s.id === id);
        setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

        // Explicitly construct payload to avoid sending invalid columns (id, camelCase keys, etc.)
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.order !== undefined) payload.order_index = updates.order;
        if (updates.courseId !== undefined) payload.course_id = updates.courseId;
        if (updates.xpReward !== undefined) payload.xp_reward = updates.xpReward;
        if (updates.dowdBucksReward !== undefined) payload.dowd_bucks_reward = updates.dowdBucksReward;
        if (updates.createdAt !== undefined) payload.created_at = updates.createdAt;

        const { error } = await supabase.from('stages').update(payload).eq('id', id);
        if (error) {
            console.error('Error updating stage:', error);
            if (original) setStages(prev => prev.map(s => s.id === id ? original : s));
            return false;
        }
        return true;
    };

    const deleteStage = async (id: string) => {
        console.log('QuizContext: deleteStage triggered for', id);

        // Collect everything to delete for rollback purposes or local state updates
        const stageToDelete = stages.find(s => s.id === id);
        if (!stageToDelete) {
            console.error('QuizContext: Stage not found for deletion:', id);
            return;
        }

        const modulesToDelete = modules.filter(m => m.stageId === id);
        const moduleIds = modulesToDelete.map(m => m.id);

        const quizzesToDelete = quizzes.filter(q => q.moduleId && moduleIds.includes(q.moduleId));
        const lessonsToDelete = lessons.filter(l => l.moduleId && moduleIds.includes(l.moduleId));
        const walkthroughsToDelete = walkthroughs.filter(w => w.moduleId && moduleIds.includes(w.moduleId));

        // 0. Collect all content IDs to clean up dependencies
        const allContentIds = [
            ...quizzesToDelete.map(q => q.id),
            ...lessonsToDelete.map(l => l.id),
            ...walkthroughsToDelete.map(w => w.id)
        ];

        // Optimistically update local state
        setStages(prev => prev.filter(s => s.id !== id));
        setModules(prev => prev.filter(m => m.stageId !== id));
        setQuizzes(prev => prev.filter(q => !q.moduleId || !moduleIds.includes(q.moduleId)));
        setLessons(prev => prev.filter(l => !l.moduleId || !moduleIds.includes(l.moduleId)));
        setWalkthroughs(prev => prev.filter(w => !w.moduleId || !moduleIds.includes(w.moduleId)));

        try {
            // 1. Delete Dependencies (Student Progress, Calendar Events)
            if (allContentIds.length > 0) {
                console.log('QuizContext: Deleting dependencies for', allContentIds.length, 'content items');
                const [completionRes, eventRes] = await Promise.all([
                    supabase.from('content_completion').delete().in('content_id', allContentIds),
                    supabase.from('calendar_events').delete().in('related_id', allContentIds)
                ]);

                if (completionRes.error) console.warn('Content completion delete error:', completionRes.error.message);
                if (eventRes.error) console.warn('Calendar events delete error:', eventRes.error.message);
            }

            // 2. Delete Content
            if (moduleIds.length > 0) {
                console.log('QuizContext: Deleting content for', moduleIds.length, 'modules');
                const [qRes, lRes, wRes] = await Promise.all([
                    supabase.from('quizzes').delete().in('module_id', moduleIds),
                    supabase.from('lessons').delete().in('module_id', moduleIds),
                    supabase.from('walkthroughs').delete().in('module_id', moduleIds)
                ]);

                if (qRes.error) throw new Error(`Quizzes: ${qRes.error.message}`);
                if (lRes.error) throw new Error(`Lessons: ${lRes.error.message}`);
                if (wRes.error) throw new Error(`Walkthroughs: ${wRes.error.message}`);
            }

            // 3. Delete Modules
            if (moduleIds.length > 0) {
                console.log('QuizContext: Deleting modules for stage', id);
                const { error: mError } = await supabase.from('modules').delete().eq('stage_id', id);
                if (mError) throw new Error(`Modules: ${mError.message}`);
            }

            // 4. Delete Stage
            console.log('QuizContext: Deleting stage', id);
            const { error: sError } = await supabase.from('stages').delete().eq('id', id);
            if (sError) throw new Error(`Stage: ${sError.message}`);

            console.log('QuizContext: Stage deletion successful');

        } catch (error: any) {
            console.error('QuizContext: Error deleting stage:', error);
            // Rollback local state
            setStages(prev => [...prev, stageToDelete]);
            if (modulesToDelete.length > 0) setModules(prev => [...prev, ...modulesToDelete]);
            setQuizzes(prev => [...prev, ...quizzesToDelete]);
            setLessons(prev => [...prev, ...lessonsToDelete]);
            setWalkthroughs(prev => [...prev, ...walkthroughsToDelete]);

            alert(`Failed to delete stage: ${error.message}`);
        }
    };

    const reorderStage = async (id: string, direction: 'up' | 'down') => {
        const stage = stages.find(s => s.id === id);
        if (!stage) return;

        // Sort by current order
        const relevantStages = stages
            .filter(s => s.courseId === stage.courseId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const currentIndex = relevantStages.findIndex(s => s.id === id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= relevantStages.length) return;

        // Move
        const [moved] = relevantStages.splice(currentIndex, 1);
        relevantStages.splice(newIndex, 0, moved);

        // Re-index relevant stages
        const updatedStages = relevantStages.map((s, index) => ({ ...s, order: index }));

        // Update local state (merge updated stages back into full list)
        setStages(prev => prev.map(s => {
            const updated = updatedStages.find(u => u.id === s.id);
            return updated ? updated : s;
        }));

        // DB update
        const { error } = await supabase.from('stages').upsert(
            updatedStages.map(s => ({ id: s.id, order_index: s.order }))
        );

        if (error) {
            console.error('Error reordering stages:', error);
            alert(`Failed to save stage order: ${error.message}`);
            // Revert local state
            setStages(stages);
        }
    };

    const addModule = async (module: Module): Promise<boolean> => {
        const { id, order, createdAt, stageId, ...data } = module;
        setModules(prev => [...prev, module]);
        const { error } = await supabase.from('modules').insert({
            ...data,
            id,
            order_index: order,
            stage_id: stageId,
            created_at: createdAt
        });
        if (error) {
            console.error('Error adding module:', error);
            setModules(prev => prev.filter(m => m.id !== id));
            return false;
        }
        return true;
    };

    const updateModule = async (id: string, updates: Partial<Module>): Promise<boolean> => {
        const original = modules.find(m => m.id === id);
        setModules(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

        // Explicitly construct payload
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.order !== undefined) payload.order_index = updates.order;
        if (updates.stageId !== undefined) payload.stage_id = updates.stageId;
        if (updates.xpReward !== undefined) payload.xp_reward = updates.xpReward;
        if (updates.dowdBucksReward !== undefined) payload.dowd_bucks_reward = updates.dowdBucksReward;
        if (updates.createdAt !== undefined) payload.created_at = updates.createdAt;

        const { error } = await supabase.from('modules').update(payload).eq('id', id);
        if (error) {
            console.error('Error updating module:', error);
            if (original) setModules(prev => prev.map(m => m.id === id ? original : m));
            return false;
        }
        return true;
    };

    const deleteModule = async (id: string) => {
        console.log('QuizContext: deleteModule triggered for', id);
        const toDelete = modules.find(m => m.id === id);
        if (!toDelete) {
            console.error('QuizContext: Module not found for deletion:', id);
            return;
        }

        const quizzesToDelete = quizzes.filter(q => q.moduleId === id);
        const lessonsToDelete = lessons.filter(l => l.moduleId === id);
        const walkthroughsToDelete = walkthroughs.filter(w => w.moduleId === id);

        // 0. Collect content IDs
        const allContentIds = [
            ...quizzesToDelete.map(q => q.id),
            ...lessonsToDelete.map(l => l.id),
            ...walkthroughsToDelete.map(w => w.id)
        ];

        // Optimistic update
        setModules(prev => prev.filter(m => m.id !== id));
        setQuizzes(prev => prev.filter(q => q.moduleId !== id));
        setLessons(prev => prev.filter(l => l.moduleId !== id));
        setWalkthroughs(prev => prev.filter(w => w.moduleId !== id));

        try {
            // 1. Delete Dependencies (Progress, Events)
            if (allContentIds.length > 0) {
                console.log('QuizContext: Deleting dependencies for', allContentIds.length, 'content items');
                const [completionRes, eventRes] = await Promise.all([
                    supabase.from('content_completion').delete().in('content_id', allContentIds),
                    supabase.from('calendar_events').delete().in('related_id', allContentIds)
                ]);

                if (completionRes.error) console.warn('Content completion delete error:', completionRes.error.message);
                if (eventRes.error) console.warn('Calendar events delete error:', eventRes.error.message);
            }

            // 2. Delete Content
            console.log('QuizContext: Deleting content for module', id);
            const [qRes, lRes, wRes] = await Promise.all([
                supabase.from('quizzes').delete().eq('module_id', id),
                supabase.from('lessons').delete().eq('module_id', id),
                supabase.from('walkthroughs').delete().eq('module_id', id)
            ]);

            if (qRes.error) throw new Error(`Quizzes: ${qRes.error.message}`);
            if (lRes.error) throw new Error(`Lessons: ${lRes.error.message}`);
            if (wRes.error) throw new Error(`Walkthroughs: ${wRes.error.message}`);

            // 3. Delete Module
            console.log('QuizContext: Deleting module', id);
            const { error: mError } = await supabase.from('modules').delete().eq('id', id);
            if (mError) throw new Error(`Module: ${mError.message}`);

            console.log('QuizContext: Module deletion successful');

        } catch (error: any) {
            console.error('QuizContext: Error deleting module:', error);
            // Rollback local state
            setModules(prev => [...prev, toDelete]);
            setQuizzes(prev => [...prev, ...quizzesToDelete]);
            setLessons(prev => [...prev, ...lessonsToDelete]);
            setWalkthroughs(prev => [...prev, ...walkthroughsToDelete]);

            alert(`Failed to delete module: ${error.message}`);
        }
    };

    const reorderModule = async (id: string, direction: 'up' | 'down') => {
        const module = modules.find(m => m.id === id);
        if (!module) return;

        const relevantModules = modules
            .filter(m => m.stageId === module.stageId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const currentIndex = relevantModules.findIndex(m => m.id === id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= relevantModules.length) return;

        // Move
        const [moved] = relevantModules.splice(currentIndex, 1);
        relevantModules.splice(newIndex, 0, moved);

        // Re-index
        const updatedModules = relevantModules.map((m, index) => ({ ...m, order: index }));

        // Optimistic update
        setModules(prev => prev.map(m => {
            const updated = updatedModules.find(u => u.id === m.id);
            return updated ? updated : m;
        }));

        // DB update
        const { error } = await supabase.from('modules').upsert(
            updatedModules.map(m => ({ id: m.id, order_index: m.order }))
        );

        if (error) {
            console.error('Error reordering modules:', error);
            alert(`Failed to save module order: ${error.message}`);
            // Revert local state
            setModules(modules);
        }
    };

    const reorderItem = async (id: string, type: 'quiz' | 'lesson' | 'walkthrough', direction: 'up' | 'down') => {
        let item: (Quiz | Lesson | Walkthrough) | undefined;
        let collection: (Quiz | Lesson | Walkthrough)[] = [];
        let tableName = '';
        let setState: React.Dispatch<React.SetStateAction<any[]>> | undefined;

        if (type === 'quiz') {
            item = quizzes.find(q => q.id === id);
            collection = quizzes;
            tableName = 'quizzes';
            setState = setQuizzes;
        } else if (type === 'lesson') {
            item = lessons.find(l => l.id === id);
            collection = lessons;
            tableName = 'lessons';
            setState = setLessons as any;
        } else if (type === 'walkthrough') {
            item = walkthroughs.find(w => w.id === id);
            collection = walkthroughs;
            tableName = 'walkthroughs';
            setState = setWalkthroughs as any;
        }

        if (!item || !setState) return;

        const sameTypeSiblings = collection.filter(i => {
            if (item!.moduleId) return i.moduleId === item!.moduleId;
            if (item!.courseId) return i.courseId === item!.courseId && !i.moduleId;
            return false;
        }).sort((a, b) => (a.order || 0) - (b.order || 0));

        const currentIndex = sameTypeSiblings.findIndex(i => i.id === id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= sameTypeSiblings.length) return;

        // Move
        const [moved] = sameTypeSiblings.splice(currentIndex, 1);
        sameTypeSiblings.splice(newIndex, 0, moved);

        // Re-index
        const updatedItems = sameTypeSiblings.map((i, index) => ({ ...i, order: index }));

        // Optimistic update
        setState(prev => prev.map(i => {
            const updated = updatedItems.find(u => u.id === i.id);
            return updated ? updated : i;
        }));

        // DB Update
        const { error } = await supabase.from(tableName).upsert(
            updatedItems.map(i => ({ id: i.id, order_index: i.order }))
        );

        if (error) {
            console.error(`Error reordering ${tableName}:`, error);
            alert(`Failed to save ${type} order: ${error.message}`);
            // Revert
            setState(collection);
        }
    };

    const addQuiz = async (quiz: Quiz) => {
        const { id, order, courseId, moduleId, projectId, xpReward, dowdBucksReward, createdAt, ...data } = quiz;
        setQuizzes(prev => [...prev, quiz]);

        const payload = {
            ...data,
            id,
            course_id: courseId,
            module_id: moduleId,
            project_id: projectId,
            xp_reward: xpReward,
            dowd_bucks_reward: dowdBucksReward,
            order_index: order,
            created_at: createdAt
        };

        const { error } = await supabase.from('quizzes').insert(payload);
        if (error) {
            console.error('Error adding quiz:', error);
            setQuizzes(prev => prev.filter(q => q.id !== id));
        }
    };

    const updateQuiz = async (id: string, updates: Partial<Quiz>) => {
        const original = quizzes.find(q => q.id === id);
        setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));

        const { courseId, moduleId, projectId, xpReward, dowdBucksReward, createdAt, order, ...rest } = updates;
        const payload: any = { ...rest };
        if (courseId !== undefined) payload.course_id = courseId;
        if (moduleId !== undefined) payload.module_id = moduleId;
        if (projectId !== undefined) payload.project_id = projectId;
        if (xpReward !== undefined) payload.xp_reward = xpReward;
        if (dowdBucksReward !== undefined) payload.dowd_bucks_reward = dowdBucksReward;
        if (order !== undefined) payload.order_index = order;
        if (createdAt !== undefined) payload.created_at = createdAt;

        const { error } = await supabase.from('quizzes').update(payload).eq('id', id);
        if (error && original) setQuizzes(prev => prev.map(q => q.id === id ? original : q));
    };

    const deleteQuiz = async (id: string) => {
        const original = quizzes.find(q => q.id === id);
        setQuizzes(prev => prev.filter(q => q.id !== id));

        // Delete dependencies first
        await Promise.all([
            supabase.from('content_completion').delete().eq('content_id', id),
            supabase.from('calendar_events').delete().eq('related_id', id)
        ]);

        const { error } = await supabase.from('quizzes').delete().eq('id', id);
        if (error && original) {
            console.error('Error deleting quiz:', error);
            setQuizzes(prev => [...prev, original]);
            alert(`Failed to delete quiz: ${error.message}`);
        }
    };

    const reorderQuiz = async (id: string, direction: 'up' | 'down') => reorderItem(id, 'quiz', direction);

    const addLesson = async (lesson: Lesson) => {
        const { id, order, courseId, moduleId, xpReward, createdAt, ...data } = lesson;
        setLessons(prev => [...prev, lesson]);

        const payload = {
            ...data,
            id,
            course_id: courseId,
            module_id: moduleId,
            xp_reward: xpReward,
            order_index: order,
            created_at: createdAt
        };

        const { error } = await supabase.from('lessons').insert(payload);
        if (error) {
            console.error('Error adding lesson:', error);
            setLessons(prev => prev.filter(l => l.id !== id));
        }
    };

    const updateLesson = async (id: string, updates: Partial<Lesson>) => {
        const original = lessons.find(l => l.id === id);
        setLessons(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

        const { courseId, moduleId, xpReward, createdAt, order, ...rest } = updates;
        const payload: any = { ...rest };
        if (courseId !== undefined) payload.course_id = courseId;
        if (moduleId !== undefined) payload.module_id = moduleId;
        if (xpReward !== undefined) payload.xp_reward = xpReward;
        if (order !== undefined) payload.order_index = order;
        if (createdAt !== undefined) payload.created_at = createdAt;

        const { error } = await supabase.from('lessons').update(payload).eq('id', id);
        if (error && original) setLessons(prev => prev.map(l => l.id === id ? original : l));
    };

    const deleteLesson = async (id: string) => {
        const original = lessons.find(l => l.id === id);
        setLessons(prev => prev.filter(l => l.id !== id));

        // Delete dependencies first
        await Promise.all([
            supabase.from('content_completion').delete().eq('content_id', id),
            supabase.from('calendar_events').delete().eq('related_id', id)
        ]);

        const { error } = await supabase.from('lessons').delete().eq('id', id);
        if (error && original) {
            console.error('Error deleting lesson:', error);
            setLessons(prev => [...prev, original]);
            alert(`Failed to delete lesson: ${error.message}`);
        }
    };

    const addWalkthrough = async (walkthrough: Walkthrough) => {
        const { id, order, courseId, moduleId, xpReward, dowdBucksReward, createdAt, ...data } = walkthrough;
        setWalkthroughs(prev => [...prev, walkthrough]);

        const payload = {
            ...data,
            id,
            course_id: courseId,
            module_id: moduleId,
            xp_reward: xpReward,
            dowd_bucks_reward: dowdBucksReward,
            order_index: order,
            created_at: createdAt
        };

        const { error } = await supabase.from('walkthroughs').insert(payload);
        if (error) {
            console.error('Error adding walkthrough:', error);
            setWalkthroughs(prev => prev.filter(w => w.id !== id));
        }
    };

    const updateWalkthrough = async (id: string, updates: Partial<Walkthrough>) => {
        const original = walkthroughs.find(w => w.id === id);
        setWalkthroughs(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));

        const { courseId, moduleId, xpReward, dowdBucksReward, createdAt, order, ...rest } = updates;
        const payload: any = { ...rest };
        if (courseId !== undefined) payload.course_id = courseId;
        if (moduleId !== undefined) payload.module_id = moduleId;
        if (xpReward !== undefined) payload.xp_reward = xpReward;
        if (dowdBucksReward !== undefined) payload.dowd_bucks_reward = dowdBucksReward;
        if (order !== undefined) payload.order_index = order;
        if (createdAt !== undefined) payload.created_at = createdAt;

        const { error } = await supabase.from('walkthroughs').update(payload).eq('id', id);
        if (error && original) setWalkthroughs(prev => prev.map(w => w.id === id ? original : w));
    };

    const deleteWalkthrough = async (id: string) => {
        const original = walkthroughs.find(w => w.id === id);
        setWalkthroughs(prev => prev.filter(w => w.id !== id));

        // Delete dependencies first
        await Promise.all([
            supabase.from('content_completion').delete().eq('content_id', id),
            supabase.from('calendar_events').delete().eq('related_id', id)
        ]);

        const { error } = await supabase.from('walkthroughs').delete().eq('id', id);
        if (error && original) {
            console.error('Error deleting walkthrough:', error);
            setWalkthroughs(prev => [...prev, original]);
            alert(`Failed to delete walkthrough: ${error.message}`);
        }
    };

    const reorderCourse = async (id: string, direction: 'up' | 'down') => {
        // Sort first to ensure we work with correct order
        const sortedCourses = [...courses].sort((a, b) => (a.order || 0) - (b.order || 0));
        const idx = sortedCourses.findIndex(c => c.id === id);
        if (idx === -1) return;

        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= sortedCourses.length) return;

        // Move
        const [moved] = sortedCourses.splice(idx, 1);
        sortedCourses.splice(newIdx, 0, moved);

        // Re-index all
        const newCourses = sortedCourses.map((c, index) => ({ ...c, order: index }));

        // Optimistic update
        setCourses(newCourses);

        // Persist all
        await Promise.all(
            newCourses.map(c =>
                supabase.from('courses').update({ order_index: c.order }).eq('id', c.id)
            )
        );
    };

    const addFolder = async (folder: CourseFolder) => {
        const { data, error } = await supabase.from('course_folders').insert({
            id: folder.id,
            title: folder.title,
            description: folder.description,
            color: folder.color,
            order_index: folder.orderIndex
        }).select().single();

        if (error) {
            console.error('Error adding folder:', error);
            return { success: false, error: error.message };
        }

        if (data) {
            setFolders(prev => [...prev, {
                ...data,
                orderIndex: data.order_index,
                createdAt: data.created_at
            }]);
        }
        return { success: true };
    };

    const updateFolder = async (id: string, updates: Partial<CourseFolder>) => {
        const { id: _, createdAt, orderIndex, ...rest } = updates;
        const dbUpdates: any = { ...rest };
        if (orderIndex !== undefined) dbUpdates.order_index = orderIndex;

        const { data, error } = await supabase.from('course_folders').update(dbUpdates).eq('id', id).select().single();

        if (error) {
            console.error('Error updating folder:', error);
            return { success: false, error: error.message };
        }

        if (data) {
            setFolders(prev => prev.map(f => f.id === id ? {
                ...data,
                orderIndex: data.order_index,
                createdAt: data.created_at
            } : f));
        }
        return { success: true };
    };

    const deleteFolder = async (id: string) => {
        const { error } = await supabase.from('course_folders').delete().eq('id', id);
        if (error) {
            console.error('Error deleting folder:', error);
            alert(`Failed to delete folder: ${error.message}`);
        } else {
            setFolders(prev => prev.filter(f => f.id !== id));
            // Also unset folderId for courses in this folder
            setCourses(prev => prev.map(c => c.folderId === id ? { ...c, folderId: undefined } : c));
        }
    };

    const reorderFolder = async (id: string, direction: 'up' | 'down') => {
        // Sort first to ensure we work with correct order
        const sortedFolders = [...folders].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const idx = sortedFolders.findIndex(f => f.id === id);
        if (idx === -1) return;

        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= sortedFolders.length) return;

        // Move
        const [moved] = sortedFolders.splice(idx, 1);
        sortedFolders.splice(newIdx, 0, moved);

        // Re-index all
        const newFolders = sortedFolders.map((f, index) => ({ ...f, orderIndex: index }));

        // Optimistic update
        setFolders(newFolders);

        // Persist all
        await Promise.all(
            newFolders.map(f =>
                supabase.from('course_folders').update({ order_index: f.orderIndex }).eq('id', f.id)
            )
        );
    };

    return (
        <QuizContext.Provider value={{
            quizzes, addQuiz, updateQuiz, deleteQuiz, completeQuiz, completedQuizzes, reorderQuiz,
            courses, addCourse, updateCourse, deleteCourse, reorderCourse,
            stages, addStage, updateStage, deleteStage, reorderStage,
            modules, addModule, updateModule, deleteModule, reorderModule,
            lessons, addLesson, updateLesson, deleteLesson, completeLesson, completedLessons,
            walkthroughs, addWalkthrough, updateWalkthrough, deleteWalkthrough, completeWalkthrough, completedWalkthroughs,
            reorderItem, isLoading, resetCourseProgress,
            folders, addFolder, updateFolder, deleteFolder, reorderFolder
        }}>
            {children}
        </QuizContext.Provider>
    );
};

export const useQuizzes = () => {
    const context = useContext(QuizContext);
    if (context === undefined) {
        throw new Error('useQuizzes must be used within a QuizProvider');
    }
    return context;
};
