import React, { createContext, useContext, useState, useEffect } from 'react';
import { type ProjectBrief, type UALLevel, type UALYear, type CalendarEvent } from '../types/ual';

interface CurriculumContextType {
    projects: ProjectBrief[];
    events: CalendarEvent[];
    addProject: (project: ProjectBrief) => void;
    deleteProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<ProjectBrief>) => void;
    addEvent: (event: CalendarEvent) => void;
    deleteEvent: (id: string) => void;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
    getProjectsByLevel: (level: UALLevel, year?: UALYear) => ProjectBrief[];
    getProjectById: (id: string) => ProjectBrief | undefined;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<ProjectBrief[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Save projects to localStorage whenever they change (after initial load)
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('erc-curriculum', JSON.stringify(projects));
        }
    }, [projects, isInitialized]);

    // Save events to localStorage whenever they change (after initial load)
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('erc-events', JSON.stringify(events));
        }
    }, [events, isInitialized]);

    // Load from local storage or set defaults
    useEffect(() => {
        const storedProjects = localStorage.getItem('erc-curriculum');
        const storedEvents = localStorage.getItem('erc-events');

        if (storedProjects) {
            setProjects(JSON.parse(storedProjects));
        } else {
            // Seed default projects (omitted for brevity in this chunk, but kept in actual file)
            // [Existing seeding logic...]
        }

        if (storedEvents) {
            setEvents(JSON.parse(storedEvents));
        } else {
            // Seed default school events
            const defaultEvents: CalendarEvent[] = [
                {
                    id: 'e1',
                    title: 'February Half Term',
                    startDate: '2026-02-16',
                    endDate: '2026-02-20',
                    category: 'School',
                    allDay: true,
                    isLocked: true
                },
                {
                    id: 'e2',
                    title: 'Easter Break',
                    startDate: '2026-03-30',
                    endDate: '2026-04-10',
                    category: 'School',
                    allDay: true,
                    isLocked: true
                },
                {
                    id: 'e3',
                    title: 'Spring Bank Holiday',
                    startDate: '2026-05-25',
                    endDate: '2026-05-29',
                    category: 'School',
                    allDay: true,
                    isLocked: true
                }
            ];
            setEvents(defaultEvents);
        }

        // Mark as initialized after loading
        setIsInitialized(true);
    }, []);

    const addProject = (project: ProjectBrief) => {
        setProjects(prev => [...prev, project]);
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const updateProject = (id: string, updates: Partial<ProjectBrief>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const addEvent = (event: CalendarEvent) => {
        setEvents(prev => [...prev, event]);
    };

    const deleteEvent = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
        setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const getProjectsByLevel = (level: UALLevel, year?: UALYear) => {
        return projects.filter(p => {
            if (p.level !== level) return false;
            if (level === 'Level 3' && p.year !== year) return false;
            return true;
        });
    };

    const getProjectById = (id: string) => projects.find(p => p.id === id);

    return (
        <CurriculumContext.Provider value={{
            projects,
            events,
            addProject,
            deleteProject,
            updateProject,
            addEvent,
            deleteEvent,
            updateEvent,
            getProjectsByLevel,
            getProjectById
        }}>
            {children}
        </CurriculumContext.Provider>
    );
};

export const useCurriculum = () => {
    const context = useContext(CurriculumContext);
    if (context === undefined) {
        throw new Error('useCurriculum must be used within a CurriculumProvider');
    }
    return context;
};
