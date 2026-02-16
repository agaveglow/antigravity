import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { type ProjectBrief, type UALCohort, type CalendarEvent } from '../types/ual';
import { supabase } from '../lib/supabase';

interface CurriculumContextType {
    projects: ProjectBrief[];
    events: CalendarEvent[];
    allEvents: CalendarEvent[];
    isLoading: boolean;
    addProject: (project: ProjectBrief) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    updateProject: (id: string, updates: Partial<ProjectBrief>) => Promise<void>;
    addEvent: (event: CalendarEvent) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
    getProjectsByCohort: (cohort: UALCohort) => ProjectBrief[];
    getProjectById: (id: string) => ProjectBrief | undefined;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<ProjectBrief[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            console.log('CurriculumContext: loadData triggered');
            setIsLoading(true);

            try {
                // Fetch projects and tasks separately to avoid join errors (400)
                const [projectsRes, tasksRes] = await Promise.all([
                    supabase.from('curriculum_projects').select('*'),
                    supabase.from('curriculum_tasks').select('*')
                ]);

                if (projectsRes.error) throw projectsRes.error;
                if (tasksRes.error) {
                    console.warn('CurriculumContext: curriculum_tasks fetch failed:', tasksRes.error.message);
                }

                const rawProjects = projectsRes.data || [];
                const rawTasks = tasksRes.data || [];

                console.log(`CurriculumContext: Loaded ${rawProjects.length} projects and ${rawTasks.length} tasks`);
                if (rawProjects.length > 0) {
                    console.log('CurriculumContext: Raw Project Keys:', Object.keys(rawProjects[0]));
                }

                const mappedProjects: ProjectBrief[] = rawProjects.map((p: any) => {
                    const projectTasks = rawTasks
                        .filter((t: any) => t.project_id === p.id || t.projectId === p.id)
                        .map((t: any) => ({
                            id: t.id,
                            title: t.title || 'Untitled Task',
                            description: t.description || '',
                            deadline: t.deadline,
                            status: t.status || 'Not Started',
                            evidenceRequirements: t.evidence_requirements || [],
                            criteriaReferences: t.criteria_references || [],
                            xpReward: t.xp_reward || 0,
                            dowdBucksReward: t.dowd_bucks_reward || 0
                        }));

                    return {
                        id: p.id,
                        projectNumber: p.project_number || p.projectNumber || 'P0',
                        title: p.title || 'Untitled',
                        unit: p.unit || '',
                        cohort: p.cohort as UALCohort,
                        introduction: p.introduction || '',
                        scenario: p.scenario || '',
                        tasks: projectTasks,
                        learningOutcomes: p.learning_outcomes || p.learningOutcomes || [],
                        assessmentCriteria: p.assessment_criteria || p.assessmentCriteria || [],
                        deadline: p.deadline,
                        published: p.published !== false,
                        gradingScheme: p.grading_scheme || p.gradingScheme || 'Pass/Fail',
                        imageUrl: p.image_url || p.imageUrl,
                        xpReward: p.xp_reward || p.xpReward || 0,
                        dowdBucksReward: p.dowd_bucks_reward || p.dowdBucksReward || 0
                    };
                });

                setProjects(mappedProjects);
            } catch (error: any) {
                console.error('CurriculumContext: Error loading data:', error);
            } finally {
                setIsLoading(false);
            }

            // Load Events
            try {
                const { data: eventsData, error: eventsError } = await supabase
                    .from('calendar_events')
                    .select('*');

                if (eventsError) console.error('Error loading events:', eventsError);
                else if (eventsData) {
                    setEvents(eventsData.map((e: any) => {
                        // Resilient date mapping - handle both start_date and legacy start_time
                        const startDate = e.start_date || e.start_time || new Date().toISOString();
                        const endDate = e.end_date || e.end_time || startDate;

                        return {
                            id: e.id,
                            title: e.title || 'Untitled Event',
                            description: e.description || '',
                            startDate,
                            endDate,
                            category: e.category || 'School',
                            relatedId: e.related_id,
                            allDay: e.all_day || false,
                            isLocked: e.is_locked || false,
                            externalSource: e.external_source
                        };
                    }));
                }
            } catch (e) {
                console.error('Failed to load events', e);
            }
        };

        loadData();

        // Subscriptions
        const projectSub = supabase
            .channel('curriculum_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'curriculum_projects' }, loadData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'curriculum_tasks' }, loadData)
            .subscribe();

        return () => {
            supabase.removeChannel(projectSub);
        };
    }, []);

    // Derive All Events (Custom + Project Deadlines + Task Deadlines)
    const allEvents = useMemo(() => {
        const derived: CalendarEvent[] = [...events];

        projects.forEach(project => {
            // Add Project Deadlines
            if (project.deadline) {
                derived.push({
                    id: `proj-${project.id}`,
                    title: `Deadline: ${project.title}`,
                    startDate: project.deadline,
                    category: 'Project',
                    allDay: true,
                    isLocked: true,
                    relatedId: project.id
                });
            }

            // Add Task Deadlines
            project.tasks.forEach(task => {
                if (task.deadline) {
                    derived.push({
                        id: `task-${task.id}`,
                        title: `Task Due: ${task.title}`,
                        startDate: task.deadline,
                        category: 'Task',
                        allDay: false,
                        isLocked: true,
                        relatedId: task.id,
                        description: `Part of ${project.title}`
                    });
                }
            });
        });

        return derived.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [events, projects]);

    const addProject = async (project: ProjectBrief) => {
        const { id, tasks, ...projectData } = project;

        if (!id) {
            console.error('CurriculumContext: addProject called without ID!', project);
            throw new Error('Project ID is missing. Cannot save project.');
        }

        console.log('CurriculumContext: addProject start', id);

        // Optimistic update
        setProjects(prev => {
            console.log('CurriculumContext: Applying optimistic update for project', id);
            // Avoid duplicate optimistic entries
            const filtered = prev.filter(p => p.id !== id);
            return [...filtered, project];
        });

        try {
            // Check current user role for troubleshooting
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                console.log(`CurriculumContext: User ${user.email} (Role: ${profile?.role || 'unknown'}) is saving project atomically: ${id}`);
            }

            // Map project and tasks for RPC
            const projectToSave = {
                id,
                title: projectData.title,
                unit: projectData.unit,
                projectNumber: projectData.projectNumber,
                cohort: projectData.cohort,
                introduction: projectData.introduction,
                scenario: projectData.scenario,
                published: projectData.published,
                learningOutcomes: projectData.learningOutcomes || [],
                assessmentCriteria: projectData.assessmentCriteria || [],
                deadline: projectData.deadline,
                gradingScheme: projectData.gradingScheme,
                xpReward: projectData.xpReward,
                dowdBucksReward: projectData.dowdBucksReward
            };

            const tasksToSave = (tasks || []).map(t => ({
                id: t.id || crypto.randomUUID(),
                title: t.title || 'Untitled Task',
                description: t.description || '',
                deadline: t.deadline,
                status: t.status || 'Not Started',
                evidenceRequirements: t.evidenceRequirements || [],
                criteriaReferences: t.criteriaReferences || [],
                xpReward: t.xpReward || 0,
                dowdBucksReward: t.dowdBucksReward || 0
            }));

            console.log(`CurriculumContext: Calling save_project_atomically for ${id} with ${tasksToSave.length} tasks`);

            const { data: savedId, error: rpcError } = await supabase.rpc('save_project_atomically', {
                p_project: projectToSave,
                p_tasks: tasksToSave
            });

            if (rpcError) {
                console.error('CurriculumContext: RPC save failed:', rpcError.message);
                throw new Error(`Atomic save failed: ${rpcError.message}`);
            }

            console.log('CurriculumContext: Successfully saved project and tasks via RPC:', savedId);
        } catch (error: any) {
            console.error('CurriculumContext: Fatal error in addProject:', error);
            // Revert optimistic update on error
            setProjects(prev => prev.filter(p => p.id !== id));
            throw error;
        }
    };

    const deleteProject = async (id: string) => {
        const projectToDelete = projects.find(p => p.id === id);
        console.log('CurriculumContext: Deleting project', id);

        // Optimistic update
        setProjects(prev => prev.filter(p => p.id !== id));

        try {
            // 1. Delete assessments first due to foreign key constraints
            const { error: assessmentsError } = await supabase
                .from('project_assessments')
                .delete()
                .eq('project_id', id);

            if (assessmentsError) {
                console.warn('CurriculumContext: Note: assessments delete failed (might not exist or table missing):', assessmentsError.message);
            }

            // 2. Delete tasks second
            const { error: tasksError } = await supabase
                .from('curriculum_tasks')
                .delete()
                .eq('project_id', id);

            if (tasksError) {
                console.error('CurriculumContext: Error deleting tasks for project:', tasksError);
            }

            // 3. Finally delete the project
            const { error: projectError } = await supabase
                .from('curriculum_projects')
                .delete()
                .eq('id', id);

            if (projectError) {
                throw projectError;
            }

            console.log('CurriculumContext: Successfully deleted project', id);
        } catch (error: any) {
            console.error('CurriculumContext: Error deleting project:', error);
            // Revert optimistic update on error
            if (projectToDelete) {
                setProjects(prev => [...prev, projectToDelete]);
            }
            alert(`Failed to delete project: ${error.message || 'Unknown error'}`);
        }
    };

    const updateProject = async (id: string, updates: Partial<ProjectBrief>) => {
        const originalProject = projects.find(p => p.id === id);

        // Optimistic update
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

        const { tasks, ...projectData } = updates;

        // Map to DB structure
        const dbProject: any = {};
        if (projectData.projectNumber !== undefined) dbProject.project_number = projectData.projectNumber;
        if (projectData.title !== undefined) dbProject.title = projectData.title;
        if (projectData.unit !== undefined) dbProject.unit = projectData.unit;
        if (projectData.cohort !== undefined) dbProject.cohort = projectData.cohort;
        if (projectData.introduction !== undefined) dbProject.introduction = projectData.introduction;
        if (projectData.scenario !== undefined) dbProject.scenario = projectData.scenario;
        if (projectData.learningOutcomes !== undefined) dbProject.learning_outcomes = projectData.learningOutcomes;
        if (projectData.assessmentCriteria !== undefined) dbProject.assessment_criteria = projectData.assessmentCriteria;
        if (projectData.deadline !== undefined) dbProject.deadline = projectData.deadline;
        if (projectData.published !== undefined) dbProject.published = projectData.published;
        if (projectData.gradingScheme !== undefined) dbProject.grading_scheme = projectData.gradingScheme;
        if (projectData.xpReward !== undefined) dbProject.xp_reward = projectData.xpReward;
        if (projectData.dowdBucksReward !== undefined) dbProject.dowd_bucks_reward = projectData.dowdBucksReward;

        if (Object.keys(dbProject).length > 0) {
            let currentPayload = { ...dbProject };
            let success = false;
            let attempts = 0;

            while (!success && attempts < 5) {
                const { error: projectError } = await supabase
                    .from('curriculum_projects')
                    .update(currentPayload)
                    .eq('id', id);

                if (projectError) {
                    console.error(`CurriculumContext: Update attempt ${attempts + 1} failed:`, projectError.message);

                    if (projectError.code === 'PGRST204' || projectError.message?.includes('column')) {
                        // Match both: column "name" AND "name" column (Fix for user error)
                        const match = projectError.message.match(/column ['"](.+)['"]/) || projectError.message.match(/['"](.+)['"] column/);
                        const missingColumn = match ? match[1] : null;

                        if (missingColumn && currentPayload[missingColumn] !== undefined) {
                            console.warn(`CurriculumContext: Column '${missingColumn}' missing. Removing from update payload and retrying.`);
                            delete currentPayload[missingColumn];
                            attempts++;
                            continue;
                        }
                    }

                    console.error('Error updating project:', projectError);
                    // Revert on error
                    if (originalProject) {
                        setProjects(prev => prev.map(p => p.id === id ? originalProject : p));
                    }
                    break;
                }
                success = true;
            }
        }

        // Update tasks if provided
        if (tasks) {
            await supabase.from('curriculum_tasks').delete().eq('project_id', id);

            let currentTasksPayload: any[] = tasks.map(t => ({
                id: t.id,
                project_id: id,
                title: t.title,
                description: t.description,
                deadline: t.deadline,
                status: t.status,
                evidence_requirements: t.evidenceRequirements,
                criteria_references: t.criteriaReferences,
                xp_reward: t.xpReward,
                dowd_bucks_reward: t.dowdBucksReward
            }));

            let tasksSuccess = false;
            let tasksAttempts = 0;

            while (!tasksSuccess && tasksAttempts < 5) {
                const { error: tasksError } = await supabase
                    .from('curriculum_tasks')
                    .insert(currentTasksPayload);

                if (tasksError) {
                    console.error(`CurriculumContext: Tasks update attempt ${tasksAttempts + 1} failed:`, tasksError.message);
                    if (tasksError.code === 'PGRST204' || tasksError.message?.includes('column')) {
                        const match = tasksError.message.match(/column ['"](.+)['"]/) || tasksError.message.match(/['"](.+)['"] column/);
                        const missingColumn = match ? match[1] : null;

                        if (missingColumn) {
                            console.warn(`CurriculumContext: Column '${missingColumn}' missing in curriculum_tasks. Removing and retrying.`);
                            currentTasksPayload = currentTasksPayload.map(t => {
                                const { [missingColumn]: _, ...rest } = t;
                                return rest;
                            });
                            tasksAttempts++;
                            continue;
                        }
                    }
                    console.error('Error updating tasks:', tasksError);
                    break;
                }
                tasksSuccess = true;
            }
        }
    };

    const addEvent = async (event: CalendarEvent) => {
        setEvents(prev => [...prev, event]);
        const dbEvent = {
            id: event.id,
            title: event.title,
            description: event.description,
            start_date: event.startDate,
            end_date: event.endDate,
            category: event.category,
            related_id: event.relatedId,
            all_day: event.allDay,
            is_locked: event.isLocked,
            external_source: event.externalSource
        };
        const { error } = await supabase.from('calendar_events').insert([dbEvent]);
        if (error) {
            console.error('Error adding event:', error);
            setEvents(prev => prev.filter(e => e.id !== event.id));
        }
    };

    const deleteEvent = async (id: string) => {
        const eventToDelete = events.find(e => e.id === id);
        setEvents(prev => prev.filter(e => e.id !== id));
        const { error } = await supabase.from('calendar_events').delete().eq('id', id);
        if (error) {
            console.error('Error deleting event:', error);
            if (eventToDelete) setEvents(prev => [...prev, eventToDelete]);
        }
    };

    const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
        const originalEvent = events.find(e => e.id === id);
        setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
        if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.relatedId !== undefined) dbUpdates.related_id = updates.relatedId;
        if (updates.allDay !== undefined) dbUpdates.all_day = updates.allDay;
        if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
        if (updates.externalSource !== undefined) dbUpdates.external_source = updates.externalSource;

        const { error } = await supabase.from('calendar_events').update(dbUpdates).eq('id', id);
        if (error) {
            console.error('Error updating event:', error);
            if (originalEvent) setEvents(prev => prev.map(e => e.id === id ? originalEvent : e));
        }
    };

    const getProjectsByCohort = (cohort: UALCohort) => {
        return projects.filter(p => p.cohort === cohort);
    };

    const getProjectById = (id: string) => projects.find(p => p.id === id);

    return (
        <CurriculumContext.Provider value={{
            projects,
            events,
            allEvents,
            isLoading,
            addProject,
            deleteProject,
            updateProject,
            addEvent,
            deleteEvent,
            updateEvent,
            getProjectsByCohort,
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
