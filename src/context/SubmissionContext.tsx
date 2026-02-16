import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationContext';

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
    projectBriefId?: string; // Aligning with other types if needed? No, keeping projectId.
    studentCohort: string; // 'Level 2' | 'Level 3A' | 'Level 3B'
    evidence?: Evidence[]; // Now optional
    status: 'Pending Mark' | 'Graded' | 'Resubmission Required' | 'Verified' | 'In Progress' | 'Late'; // added Late status
    taskTitle?: string;
    feedback?: string;
    grade?: string;
    submittedAt: string;
    verifiedBy?: string; // Teacher ID
    verifiedAt?: string;
    verificationRequested?: boolean;
    verificationRequestedAt?: string;
}

interface SubmissionContextType {
    submissions: Submission[];
    isLoading: boolean;
    addSubmission: (submission: Submission) => Promise<void>;
    updateSubmission: (id: string, updates: Partial<Submission>) => Promise<void>;
    getSubmissionsByProject: (projectId: string) => Submission[];
    getStudentSubmissions: (studentId: string) => Submission[];
    getSubmissionByTask: (taskId: string, studentId: string) => Submission | undefined;
    deleteSubmission: (id: string) => Promise<void>;
    refreshSubmissions: () => Promise<void>;
    requestVerification: (taskId: string, projectId: string, studentId: string, studentName: string, taskTitle: string, studentCohort: string) => Promise<void>;
    cancelVerificationRequest: (submissionId: string) => Promise<void>;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { createNotification } = useNotifications();

    const loadSubmissions = async () => {
        console.log('SubmissionContext: loadSubmissions triggered');
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select('*');

            if (error) {
                console.error('SubmissionContext: Error loading submissions:', error.message, error.details);
                console.warn('SubmissionContext: Note: submissions table might not exist or schema mismatch.');
            } else if (data) {
                console.log(`SubmissionContext: Loaded ${data.length} submissions`);
                setSubmissions(data.map((s: any) => ({
                    id: s.id,
                    taskId: s.task_id || s.taskId,
                    projectId: s.project_id || s.projectId,
                    studentId: s.student_id || s.studentId,
                    studentName: s.student_name || s.studentName,
                    studentCohort: s.student_cohort || s.studentCohort,
                    status: s.status,
                    evidence: s.evidence || [],
                    taskTitle: s.task_title || s.taskTitle,
                    feedback: s.feedback,
                    grade: s.grade,
                    submittedAt: s.submitted_at || s.submittedAt,
                    verifiedBy: s.verified_by || s.verifiedBy,
                    verifiedAt: s.verified_at || s.verifiedAt,
                    verificationRequested: s.verification_requested || s.verificationRequested || false,
                    verificationRequestedAt: s.verification_requested_at || s.verificationRequestedAt
                })));
            }
        } catch (e) {
            console.error('SubmissionContext: Exception in loadSubmissions:', e);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadSubmissions();

        // Subscription
        const channel = supabase.channel('submissions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, loadSubmissions)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addSubmission = async (submission: Submission) => {
        // Optimistic update
        setSubmissions(prev => {
            const existingIdx = prev.findIndex(s => s.taskId === submission.taskId && s.studentId === submission.studentId);
            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = submission;
                return updated;
            }
            return [...prev, submission];
        });

        const dbSubmission: any = {
            id: submission.id,
            task_id: submission.taskId,
            project_id: submission.projectId,
            student_id: submission.studentId,
            student_name: submission.studentName,
            student_cohort: submission.studentCohort,
            status: submission.status,
            evidence: submission.evidence,
            task_title: submission.taskTitle,
            submitted_at: submission.submittedAt,
            verified_by: submission.verifiedBy,
            verified_at: submission.verifiedAt,
            verification_requested: submission.verificationRequested,
            verification_requested_at: submission.verificationRequestedAt
        };

        let currentPayload = { ...dbSubmission };
        let success = false;
        let attempts = 0;

        while (!success && attempts < 5) {
            const { error } = await supabase.from('submissions').upsert([currentPayload]);
            if (error) {
                console.error(`SubmissionContext: Add attempt ${attempts + 1} failed:`, error.message);
                if (error.code === 'PGRST204' || error.message?.includes('column')) {
                    const match = error.message.match(/column ['"](.+)['"]/);
                    const missingColumn = match ? match[1] : null;

                    if (missingColumn && currentPayload[missingColumn] !== undefined) {
                        console.warn(`SubmissionContext: Column '${missingColumn}' missing. Removing from payload and retrying.`);
                        delete currentPayload[missingColumn];
                        attempts++;
                        continue;
                    }
                }
                if (error.code === '42501') {
                    alert('Permission Denied: You do not have permission to submit this task. Please ask your administrator to run the "fix_submissions_rls.sql" migration.');
                } else {
                    console.error('Error adding submission:', error);
                }
                loadSubmissions(); // Revert on error
                break;
            }
            success = true;
        }
    };

    const updateSubmission = async (id: string, updates: Partial<Submission>) => {
        // Optimistic update
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

        // Map camelCase to snake_case
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback;
        if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
        if (updates.evidence) dbUpdates.evidence = updates.evidence;
        if (updates.verifiedBy) dbUpdates.verified_by = updates.verifiedBy;
        if (updates.verifiedAt) dbUpdates.verified_at = updates.verifiedAt;
        if (updates.verificationRequested !== undefined) dbUpdates.verification_requested = updates.verificationRequested;
        if (updates.verificationRequestedAt) dbUpdates.verification_requested_at = updates.verificationRequestedAt;

        let currentPayload = { ...dbUpdates };
        let success = false;
        let attempts = 0;

        while (!success && attempts < 5) {
            const { error } = await supabase.from('submissions').update(currentPayload).eq('id', id);
            if (error) {
                console.error(`SubmissionContext: Update attempt ${attempts + 1} failed:`, error.message);
                if (error.code === 'PGRST204' || error.message?.includes('column')) {
                    const match = error.message.match(/column ['"](.+)['"]/);
                    const missingColumn = match ? match[1] : null;

                    if (missingColumn && currentPayload[missingColumn] !== undefined) {
                        console.warn(`SubmissionContext: Column '${missingColumn}' missing. Removing from update payload and retrying.`);
                        delete currentPayload[missingColumn];
                        attempts++;
                        continue;
                    }
                }
                if (error.code === '42501') {
                    alert('Permission Denied: You do not have permission to submit this task. Please ask your administrator to run the "fix_submissions_rls.sql" migration.');
                } else {
                    console.error('Error updating submission:', error);
                }
                loadSubmissions(); // Revert on error
                break;
            }
            success = true;
        }
    };

    const getSubmissionsByProject = (projectId: string) => submissions.filter(s => s.projectId === projectId || s.projectBriefId === projectId);
    const getStudentSubmissions = (studentId: string) => submissions.filter(s => s.studentId === studentId);
    const getSubmissionByTask = (taskId: string, studentId: string) =>
        submissions.find(s => s.taskId === taskId && s.studentId === studentId);

    const deleteSubmission = async (id: string) => {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        const { error } = await supabase.from('submissions').delete().eq('id', id);
        if (error) {
            console.error('Error deleting submission:', error);
            loadSubmissions(); // Revert on error
        }
    };

    const requestVerification = async (
        taskId: string,
        projectId: string,
        studentId: string,
        studentName: string,
        taskTitle: string,
        studentCohort: string
    ) => {
        // Check if submission already exists
        const existing = submissions.find(s => s.taskId === taskId && s.studentId === studentId);

        if (existing) {
            // Update existing submission
            await updateSubmission(existing.id, {
                verificationRequested: true,
                verificationRequestedAt: new Date().toISOString()
            });
        } else {
            // Create new submission with verification request
            const newSubmission: Submission = {
                id: crypto.randomUUID(),
                taskId,
                projectId,
                studentId,
                studentName,
                studentCohort,
                taskTitle,
                status: 'Pending Mark',
                submittedAt: new Date().toISOString(),
                verificationRequested: true,
                verificationRequestedAt: new Date().toISOString()
            };
            await addSubmission(newSubmission);
        }

        // Notify Teachers
        try {
            // Find all teachers (for MVP, notifying all teachers)
            const { data: teachers } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'teacher');

            if (teachers) {
                const promises = teachers.map(teacher =>
                    createNotification(
                        teacher.id,
                        'Verification Request',
                        `${studentName} requested verification for ${taskTitle}`,
                        'verification',
                        `/teacher/assessment?student=${studentId}` // Link to assessment
                    )
                );
                await Promise.all(promises);
            }
        } catch (error) {
            console.error('Error sending detailed notifications:', error);
        }
    };

    const cancelVerificationRequest = async (submissionId: string) => {
        await updateSubmission(submissionId, {
            verificationRequested: false,
            verificationRequestedAt: undefined
        });
    };

    return (
        <SubmissionContext.Provider value={{
            submissions,
            isLoading,
            addSubmission,
            updateSubmission,
            getSubmissionsByProject,
            getStudentSubmissions,
            getSubmissionByTask,
            deleteSubmission,
            refreshSubmissions: loadSubmissions,
            requestVerification,
            cancelVerificationRequest
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
