import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

export interface ProjectAssessment {
    id: string;
    student_id: string;
    project_id: string;
    grade: string;
    feedback: string;
    updated_at: string;
}

interface AssessmentContextType {
    projectAssessments: ProjectAssessment[];
    isLoading: boolean;
    saveProjectGrade: (studentId: string, projectId: string, grade: string, feedback: string) => Promise<void>;
    getAssessment: (studentId: string, projectId: string) => ProjectAssessment | undefined;
    refreshAssessments: () => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projectAssessments, setProjectAssessments] = useState<ProjectAssessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAssessments = async () => {
        console.log('AssessmentContext: loadAssessments triggered');
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('project_assessments')
                .select('*');

            if (error) {
                console.error('AssessmentContext: Error loading assessments:', error.message, error.details);
                console.warn('AssessmentContext: Note: assessments table might not exist or schema mismatch.');
            } else if (data) {
                console.log(`AssessmentContext: Loaded ${data.length} assessments`);
                setProjectAssessments(data);
            }
        } catch (e) {
            console.error('AssessmentContext: Exception in loadAssessments:', e);
        }
        setIsLoading(false);
    };

    const { user } = useUser();

    useEffect(() => {
        if (user) {
            loadAssessments();
        } else {
            setProjectAssessments([]);
            setIsLoading(false);
        }
    }, [user]);

    const saveProjectGrade = async (studentId: string, projectId: string, grade: string, feedback: string) => {
        const dbPayload: any = {
            student_id: studentId,
            project_id: projectId,
            grade,
            feedback,
            updated_at: new Date().toISOString()
        };

        let currentPayload = { ...dbPayload };
        let success = false;
        let attempts = 0;

        while (!success && attempts < 5) {
            try {
                const { error } = await supabase
                    .from('project_assessments')
                    .upsert(currentPayload, { onConflict: 'student_id,project_id' });

                if (error) {
                    if (error.code === 'PGRST204' || error.message?.includes('column')) {
                        const match = error.message.match(/column ['"](.+)['"]/);
                        const missingColumn = match ? match[1] : null;

                        if (missingColumn && currentPayload[missingColumn] !== undefined) {
                            console.warn(`AssessmentContext: Column '${missingColumn}' missing. Removing from payload and retrying.`);
                            delete currentPayload[missingColumn];
                            attempts++;
                            continue;
                        }
                    }
                    throw error;
                }
                success = true;
                await loadAssessments();
            } catch (e: any) {
                console.error('Error saving project grade:', e);
                throw e;
            }
        }
    };


    const getAssessment = (studentId: string, projectId: string) => {
        return projectAssessments.find(a => a.student_id === studentId && a.project_id === projectId);
    };

    return (
        <AssessmentContext.Provider value={{
            projectAssessments,
            isLoading,
            saveProjectGrade,
            getAssessment,
            refreshAssessments: loadAssessments
        }}>
            {children}
        </AssessmentContext.Provider>
    );
};

export const useAssessment = () => {
    const context = useContext(AssessmentContext);
    if (context === undefined) {
        throw new Error('useAssessment must be used within an AssessmentProvider');
    }
    return context;
};
