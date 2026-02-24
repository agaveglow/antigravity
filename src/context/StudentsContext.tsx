import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

import type { Student, StudentStatus } from '../types/student';

// Re-export for compatibility
export type { Student, StudentStatus };

interface StudentsContextType {
    students: Student[];
    isLoading: boolean;
    addStudent: (student: Student) => Promise<void>;
    inviteStudent: (name: string, username: string, cohort: string, department: string, password?: string) => Promise<void>;
    updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
    getStudentById: (id: string) => Student | undefined;
    awardRewards: (studentId: string, xpAmount: number, currencyAmount: number) => Promise<void>; // Added
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role } = useUser(); // Get current user and role
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadStudents = async () => {
        console.log('StudentsContext: loadStudents triggered');
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')

                .select('id, name, cohort, status, username, email, phone, dob, address, avatar, xp, balance, department, predicted_grade') // Exclude sensitive fields
                .eq('role', 'student');

            if (error) {
                console.error('StudentsContext: Error loading students:', error.message, error.details);
            }

            const allStudents: Student[] = [];

            // Add profiles
            if (data) {
                allStudents.push(...data.map((s: any) => ({
                    id: s.id,
                    name: s.name || 'Unknown',
                    cohort: s.cohort || 'Level 3A',
                    status: s.status || 'Active',
                    username: s.username || '',
                    email: s.email,
                    phone: s.phone,
                    dob: s.dob,
                    address: s.address,
                    avatar: s.avatar,
                    xp: s.xp || 0,
                    balance: s.balance || 0,
                    department: s.department || 'music', // Default to music
                    predicted_grade: s.predicted_grade,
                    grades: [],
                    notes: []
                })));
            }

            console.log(`StudentsContext: Loaded ${allStudents.length} students. User Role:`, role, 'Dept:', user?.department);

            // Client-side filtering as a backup to RLS
            const filteredStudents = allStudents.filter(s => {
                // Admins see everyone
                if (role === 'admin') return true;

                // Teachers see their department (strict check, but safely handled)
                if (role === 'teacher') {
                    const studentDept = s.department || 'music';
                    const teacherDept = user?.department || 'music';
                    return studentDept === teacherDept;
                }

                return true;
            });

            console.log(`StudentsContext: Filtered to ${filteredStudents.length} students for display.`);
            setStudents(filteredStudents);
        } catch (e) {
            console.error('StudentsContext: Exception in loadStudents:', e);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (user) {
            loadStudents();
        } else {
            setStudents([]);
            setIsLoading(false);
            return;
        }

        // Subscription
        const profilesChannel = supabase.channel('profiles_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadStudents)
            .subscribe();

        return () => {
            supabase.removeChannel(profilesChannel).catch(() => { });
        };
    }, [user, role]);

    const addStudent = async (student: Student) => {
        // Direct profile creation (old method, kept for compatibility if needed)
        setStudents(prev => [...prev, student]);
        const { error } = await supabase.from('profiles').insert([{ ...student, role: 'student' }]);
        if (error) {
            console.error('Error adding student:', error);
            setStudents(prev => prev.filter(s => s.id !== student.id));
            if (error.code === '23505' || error.message?.includes('unique constraint')) {
                alert(`The username '${student.username}' is already taken.`);
            }
        }
    };

    const inviteStudent = async (name: string, username: string, cohort: string, department: string, password?: string) => {
        // Optimistic update
        const tempId = `new-${username}-${Date.now()}`;
        const newStudent: Student = {
            id: tempId,
            name,
            cohort: cohort as any,
            status: 'Active',
            username,
            department: department as any,
            xp: 0,
            balance: 0,
            grades: [],
            notes: []
        };

        setStudents(prev => [...prev, newStudent]);

        try {
            const { data: userId, error } = await supabase.rpc('manage_student_auth', {
                p_username: username,
                p_password: password,
                p_name: name,
                p_cohort: cohort,
                p_department: department
            });

            if (error) throw error;

            // Update with real ID
            setStudents(prev => prev.map(s => s.id === tempId ? { ...s, id: userId } : s));
        } catch (error: any) {
            console.error('Error creating student:', error);
            setStudents(prev => prev.filter(s => s.id !== tempId));
            if (error.code === '23505' || error.message?.includes('unique constraint')) {
                alert(`The username '${username}' is already taken. Please choose a different one.`);
            } else {
                alert(`Failed to create student: ${error.message}`);
            }
        }
    };

    const updateStudent = async (id: string, updates: Partial<Student>) => {
        // If password, name, cohort, username or department is being updated, use the RPC
        if (updates.password || updates.name || updates.cohort || updates.username || updates.department) {
            const student = students.find(s => s.id === id);
            if (student) {
                const { error } = await supabase.rpc('manage_student_auth', {
                    p_username: updates.username || student.username,
                    p_password: updates.password || '', // Empty means keep current
                    p_name: updates.name || student.name,
                    p_cohort: updates.cohort || student.cohort,
                    p_department: updates.department || student.department || 'music'
                });

                if (error) {
                    console.error('Error updating student credentials:', error);
                    if (error.code === '23505' || error.message?.includes('unique constraint')) {
                        alert(`The username '${updates.username || student.username}' is already taken. Please choose a different one.`);
                    } else {
                        alert(`Failed to update credentials: ${error.message}`);
                    }
                    return;
                }
            }
        }

        // Optimistic update for UI
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

        // Standard profile update for other fields
        const dbUpdates: any = { ...updates };
        delete dbUpdates.id;
        delete dbUpdates.grades;
        delete dbUpdates.notes;
        delete dbUpdates.password; // Don't send password to profiles table

        let currentPayload = { ...dbUpdates };
        let success = false;
        let attempts = 0;

        while (!success && attempts < 5) {
            try {
                if (Object.keys(currentPayload).length === 0) {
                    success = true;
                    continue;
                }
                const { error } = await supabase.from('profiles').update(currentPayload).eq('id', id);
                if (error) {
                    if (error.code === 'PGRST204' || error.message?.includes('column')) {
                        const match = error.message.match(/column ['"](.+)['"]/);
                        const missingColumn = match ? match[1] : null;

                        if (missingColumn && currentPayload[missingColumn] !== undefined) {
                            console.warn(`StudentsContext: Column '${missingColumn}' missing. Removing from update payload and retrying.`);
                            delete currentPayload[missingColumn];
                            attempts++;
                            continue;
                        }
                    }
                    throw error;
                }
                success = true;
            } catch (error: any) {
                console.error('Error updating student:', error);
                // Revert on error
                loadStudents();
                throw error;
            }
        }
    };

    const deleteStudent = async (id: string) => {
        const studentToUpdate = students.find(s => s.id === id);

        // Optimistic update
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'Inactive' as StudentStatus } : s));

        try {
            const { error } = await supabase.from('profiles').update({ status: 'Inactive' }).eq('id', id);
            if (error) throw error;
        } catch (error: any) {
            console.error('Error deleting student:', error);
            // Revert on error
            if (studentToUpdate) {
                setStudents(prev => prev.map(s => s.id === id ? studentToUpdate : s));
            }
        }
    };

    const awardRewards = async (studentId: string, xpAmount: number, currencyAmount: number) => {
        // Optimistic update
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                return {
                    ...s,
                    xp: (s.xp || 0) + xpAmount,
                    balance: (s.balance || 0) + currencyAmount
                };
            }
            return s;
        }));

        try {
            const { error } = await supabase.rpc('award_student_rewards', {
                p_student_id: studentId,
                p_xp_amount: xpAmount,
                p_currency_amount: currencyAmount
            });

            if (error) {
                console.error('Error awarding rewards:', error);
                throw error;
            }
        } catch (error) {
            // Revert on error (fetch fresh data to be safe)
            loadStudents();
        }
    };

    const getStudentById = (id: string) => students.find(s => s.id === id);

    return (
        <StudentsContext.Provider value={{
            students,
            isLoading,
            addStudent,
            inviteStudent,
            updateStudent,
            deleteStudent,
            getStudentById,
            awardRewards
        }}>
            {children}
        </StudentsContext.Provider>
    );
};

export const useStudents = () => {
    const context = useContext(StudentsContext);
    if (context === undefined) {
        throw new Error('useStudents must be used within a StudentsProvider');
    }
    return context;
};
