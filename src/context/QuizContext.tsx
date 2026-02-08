import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Quiz, Course, Lesson } from '../types/ual';
import { useUser } from './UserContext';

interface QuizContextType {
    quizzes: Quiz[];
    addQuiz: (quiz: Quiz) => void;
    updateQuiz: (id: string, updates: Partial<Quiz>) => void;
    deleteQuiz: (id: string) => void;
    completeQuiz: (quizId: string) => void;
    completedQuizzes: string[]; // List of completed quiz IDs for current user
    reorderQuiz: (id: string, direction: 'up' | 'down') => void;
    courses: Course[];
    addCourse: (course: Course) => void;
    updateCourse: (id: string, updates: Partial<Course>) => void;
    deleteCourse: (id: string, deleteQuizzes?: boolean) => void;
    reorderCourse: (id: string, direction: 'up' | 'down') => void;
    lessons: Lesson[];
    addLesson: (lesson: Lesson) => void;
    updateLesson: (id: string, updates: Partial<Lesson>) => void;
    deleteLesson: (id: string) => void;
    completeLesson: (lessonId: string) => void;
    completedLessons: string[];
    reorderItem: (id: string, type: 'quiz' | 'lesson', direction: 'up' | 'down') => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, addXp } = useUser();

    // --- State ---
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);

    // --- Load / Save ---

    // Initial Load
    useEffect(() => {
        const storedQuizzes = localStorage.getItem('erc-quizzes');
        const storedCourses = localStorage.getItem('erc-courses');
        const storedLessons = localStorage.getItem('erc-lessons');

        if (storedQuizzes) {
            try { setQuizzes(JSON.parse(storedQuizzes)); } catch (e) { console.error(e); }
        }
        if (storedCourses) {
            try { setCourses(JSON.parse(storedCourses)); } catch (e) { console.error(e); }
        }
        if (storedLessons) {
            try { setLessons(JSON.parse(storedLessons)); } catch (e) { console.error(e); }
        }
        setIsInitialized(true);
    }, []);

    // Persist Updates
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('erc-quizzes', JSON.stringify(quizzes));
        }
    }, [quizzes, isInitialized]);

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('erc-courses', JSON.stringify(courses));
        }
    }, [courses, isInitialized]);

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('erc-lessons', JSON.stringify(lessons));
        }
    }, [lessons, isInitialized]);


    // User Progress (Mocked per user in local storage for now)
    useEffect(() => {
        if (user) {
            const history = localStorage.getItem(`quiz-history-${user.id}`);
            if (history) setCompletedQuizzes(JSON.parse(history));

            const lessonHistory = localStorage.getItem(`lesson-history-${user.id}`);
            if (lessonHistory) setCompletedLessons(JSON.parse(lessonHistory));
        }
    }, [user]);


    // --- Actions: Quizzes ---

    const addQuiz = (quiz: Quiz) => {
        // Calculate max order for this course
        const courseItems = [
            ...quizzes.filter(q => q.courseId === quiz.courseId),
            ...lessons.filter(l => l.courseId === quiz.courseId)
        ];
        const maxOrder = courseItems.length > 0 ? Math.max(...courseItems.map(i => i.order || 0)) : -1;
        setQuizzes(prev => [...prev, { ...quiz, order: maxOrder + 1 }]);
    };

    const updateQuiz = (id: string, updates: Partial<Quiz>) => {
        setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const deleteQuiz = (id: string) => {
        setQuizzes(prev => prev.filter(q => q.id !== id));
    };

    const completeQuiz = (quizId: string) => {
        if (!user || completedQuizzes.includes(quizId)) return;

        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        const newHistory = [...completedQuizzes, quizId];
        setCompletedQuizzes(newHistory);
        localStorage.setItem(`quiz-history-${user.id}`, JSON.stringify(newHistory));

        // Awards are handled in the UI component usually, but we could do it here
        // For now, StudentLearning handles the immediate reward display, 
        // but we should ensure XP is added if not already. 
        // (Actually StudentLearning calls completeQuiz AND addDowdBucks separately. 
        //  We'll explicitly add XP here just in case, or assume UI does it.)
        addXp(quiz.xpReward);
    };

    const reorderQuiz = (id: string, direction: 'up' | 'down') => {
        // Find current quiz
        const quiz = quizzes.find(q => q.id === id);
        if (!quiz) return;

        // Get all items in this course (quizzes + lessons) to respect total ordering?
        // Actually, the original request was just reorderQuiz, but now we have reorderItem.
        // We should PROBABLY alias this to reorderItem for consistency, 
        // OR keep it restricted to quizzes-only if we want (but checks mixed types).
        // Let's alias it to reorderItem to be safe.
        reorderItem(id, 'quiz', direction);
    };

    // --- Actions: Courses ---

    const addCourse = (course: Course) => {
        const maxOrder = courses.length > 0 ? Math.max(...courses.map(c => c.order || 0)) : -1;
        setCourses(prev => [...prev, { ...course, order: maxOrder + 1 }]);
    };

    const updateCourse = (id: string, updates: Partial<Course>) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCourse = (id: string, deleteChildren = false) => {
        setCourses(prev => prev.filter(c => c.id !== id));
        if (deleteChildren) {
            setQuizzes(prev => prev.filter(q => q.courseId !== id));
            setLessons(prev => prev.filter(l => l.courseId !== id));
        } else {
            // Unlink children
            setQuizzes(prev => prev.map(q => q.courseId === id ? { ...q, courseId: undefined } : q));
            setLessons(prev => prev.map(l => l.courseId === id ? { ...l, courseId: undefined } : l));
        }
    };

    // --- Actions: Lessons ---

    const addLesson = (lesson: Lesson) => {
        const courseItems = [
            ...quizzes.filter(q => q.courseId === lesson.courseId),
            ...lessons.filter(l => l.courseId === lesson.courseId)
        ];
        const maxOrder = courseItems.length > 0 ? Math.max(...courseItems.map(i => i.order || 0)) : -1;
        setLessons(prev => [...prev, { ...lesson, order: maxOrder + 1 }]);
    };

    const updateLesson = (id: string, updates: Partial<Lesson>) => {
        setLessons(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const deleteLesson = (id: string) => {
        setLessons(prev => prev.filter(l => l.id !== id));
    };

    const completeLesson = (lessonId: string) => {
        if (!user || completedLessons.includes(lessonId)) return;

        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const newHistory = [...completedLessons, lessonId];
        setCompletedLessons(newHistory);
        localStorage.setItem(`lesson-history-${user.id}`, JSON.stringify(newHistory));
        addXp(lesson.xpReward);
    };

    const reorderItem = (id: string, type: 'quiz' | 'lesson', direction: 'up' | 'down') => {
        let targetItem: Quiz | Lesson | undefined;
        let courseId: string | undefined;

        if (type === 'quiz') {
            targetItem = quizzes.find(q => q.id === id);
        } else {
            targetItem = lessons.find(l => l.id === id);
        }

        if (!targetItem || !targetItem.courseId) return;
        courseId = targetItem.courseId;

        // Combine and sort all items (quizzes + lessons)
        const allItems = [
            ...quizzes.filter(q => q.courseId === courseId).map(q => ({ ...q, itemType: 'quiz' as const })),
            ...lessons.filter(l => l.courseId === courseId).map(l => ({ ...l, itemType: 'lesson' as const }))
        ].sort((a, b) => (a.order || 0) - (b.order || 0));

        const index = allItems.findIndex(i => i.id === id && i.itemType === type);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            const prevItem = allItems[index - 1];
            const tempOrder = targetItem.order || 0;
            const prevOrder = prevItem.order || 0;

            if (type === 'quiz') updateQuiz(id, { order: prevOrder });
            else updateLesson(id, { order: prevOrder });

            if (prevItem.itemType === 'quiz') updateQuiz(prevItem.id, { order: tempOrder });
            else updateLesson(prevItem.id, { order: tempOrder });

        } else if (direction === 'down' && index < allItems.length - 1) {
            const nextItem = allItems[index + 1];
            const tempOrder = targetItem.order || 0;
            const nextOrder = nextItem.order || 0;

            if (type === 'quiz') updateQuiz(id, { order: nextOrder });
            else updateLesson(id, { order: nextOrder });

            if (nextItem.itemType === 'quiz') updateQuiz(nextItem.id, { order: tempOrder });
            else updateLesson(nextItem.id, { order: tempOrder });
        }
    };

    const reorderCourse = (id: string, direction: 'up' | 'down') => {
        const sortedCourses = [...courses].sort((a, b) => (a.order || 0) - (b.order || 0));
        const index = sortedCourses.findIndex(c => c.id === id);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            const prevCourse = sortedCourses[index - 1];
            const targetCourse = sortedCourses[index];

            const tempOrder = targetCourse.order || 0;
            const prevOrder = prevCourse.order || 0;

            updateCourse(targetCourse.id, { order: prevOrder });
            updateCourse(prevCourse.id, { order: tempOrder });

        } else if (direction === 'down' && index < sortedCourses.length - 1) {
            const nextCourse = sortedCourses[index + 1];
            const targetCourse = sortedCourses[index];

            const tempOrder = targetCourse.order || 0;
            const nextOrder = nextCourse.order || 0;

            updateCourse(targetCourse.id, { order: nextOrder });
            updateCourse(nextCourse.id, { order: tempOrder });
        }
    };

    return (
        <QuizContext.Provider value={{
            quizzes, addQuiz, updateQuiz, deleteQuiz, completeQuiz, completedQuizzes, reorderQuiz,
            courses, addCourse, updateCourse, deleteCourse, reorderCourse,
            lessons, addLesson, updateLesson, deleteLesson, completeLesson, completedLessons, reorderItem
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
