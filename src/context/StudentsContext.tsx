import React, { createContext, useContext, useState, useEffect } from 'react';

export type StudentStatus = 'Active' | 'At Risk' | 'Inactive';

export interface Student {
    id: string;
    name: string;
    level: 'Level 2' | 'Level 3';
    year: 'Year 1' | 'Year 2';
    attendance: number;
    status: StudentStatus;
    email: string;
}

interface StudentsContextType {
    students: Student[];
    addStudent: (student: Student) => void;
    updateStudent: (id: string, updates: Partial<Student>) => void;
    deleteStudent: (id: string) => void;
    getStudentById: (id: string) => Student | undefined;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Save students to localStorage whenever they change (after initial load)
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('erc-students', JSON.stringify(students));
        }
    }, [students, isInitialized]);

    // Load from localStorage on mount
    useEffect(() => {
        const storedStudents = localStorage.getItem('erc-students');

        if (storedStudents) {
            setStudents(JSON.parse(storedStudents));
        } else {
            // Seed default students including the logged-in student
            const defaultStudents: Student[] = [
                { id: '1', name: 'Student Name', level: 'Level 3', year: 'Year 1', attendance: 95, status: 'Active', email: 'student@college.ac.uk' },
                { id: '2', name: 'Alice Walker', level: 'Level 3', year: 'Year 1', attendance: 92, status: 'Active', email: 'alice.w@college.ac.uk' },
                { id: '3', name: 'Bob Smith', level: 'Level 3', year: 'Year 1', attendance: 84, status: 'At Risk', email: 'bob.s@college.ac.uk' },
                { id: '4', name: 'Charlie Davis', level: 'Level 2', year: 'Year 1', attendance: 96, status: 'Active', email: 'charlie.d@college.ac.uk' },
                { id: '5', name: 'Diana Prince', level: 'Level 3', year: 'Year 2', attendance: 88, status: 'Active', email: 'diana.p@college.ac.uk' },
                { id: '6', name: 'Ethan Hunt', level: 'Level 3', year: 'Year 2', attendance: 75, status: 'At Risk', email: 'ethan.h@college.ac.uk' },
                { id: '7', name: 'Fiona Gallagher', level: 'Level 2', year: 'Year 1', attendance: 90, status: 'Active', email: 'fiona.g@college.ac.uk' },
                { id: '8', name: 'George Martin', level: 'Level 3', year: 'Year 1', attendance: 40, status: 'Inactive', email: 'george.m@college.ac.uk' },
            ];
            setStudents(defaultStudents);
        }

        setIsInitialized(true);
    }, []);

    const addStudent = (student: Student) => {
        setStudents(prev => [...prev, student]);
    };

    const updateStudent = (id: string, updates: Partial<Student>) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const getStudentById = (id: string) => students.find(s => s.id === id);

    return (
        <StudentsContext.Provider value={{
            students,
            addStudent,
            updateStudent,
            deleteStudent,
            getStudentById
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
