import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Evidence {
    id: string;
    type: 'google_app' | 'media_file' | 'video_file' | 'link';
    url?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: string;
    submittedAt: string;
}

export interface Submission {
    id: string;
    taskId: string;
    projectId: string;
    studentId: string;
    studentName: string;
    studentLevel: string;
    studentYear: string;
    evidence: Evidence[];
    status: 'Pending Mark' | 'Graded' | 'Resubmission Required';
    taskTitle?: string;
    feedback?: string;
    grade?: string;
    submittedAt: string;
}

interface SubmissionContextType {
    submissions: Submission[];
    addSubmission: (submission: Submission) => void;
    updateSubmission: (id: string, updates: Partial<Submission>) => void;
    getSubmissionsByProject: (projectId: string) => Submission[];
    getStudentSubmissions: (studentId: string) => Submission[];
    getSubmissionByTask: (taskId: string, studentId: string) => Submission | undefined;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('erc-submissions');
        if (stored) {
            setSubmissions(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('erc-submissions', JSON.stringify(submissions));
    }, [submissions]);

    const addSubmission = (submission: Submission) => {
        setSubmissions(prev => {
            // Replace if already exists for same task/student or add new
            const existingIdx = prev.findIndex(s => s.taskId === submission.taskId && s.studentId === submission.studentId);
            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = submission;
                return updated;
            }
            return [...prev, submission];
        });
    };

    const updateSubmission = (id: string, updates: Partial<Submission>) => {
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const getSubmissionsByProject = (projectId: string) => submissions.filter(s => s.projectId === projectId);
    const getStudentSubmissions = (studentId: string) => submissions.filter(s => s.studentId === studentId);
    const getSubmissionByTask = (taskId: string, studentId: string) =>
        submissions.find(s => s.taskId === taskId && s.studentId === studentId);

    return (
        <SubmissionContext.Provider value={{
            submissions,
            addSubmission,
            updateSubmission,
            getSubmissionsByProject,
            getStudentSubmissions,
            getSubmissionByTask
        }}>
            {children}
        </SubmissionContext.Provider>
    );
};

export const useSubmissions = () => {
    const context = useContext(SubmissionContext);
    if (context === undefined) {
        throw new Error('useSubmissions must be used within a SubmissionProvider');
    }
    return context;
};
