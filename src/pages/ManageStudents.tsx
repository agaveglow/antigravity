import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Search, Filter, Plus, MoreVertical, User, AlertCircle, CheckCircle } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

type StudentStatus = 'Active' | 'At Risk' | 'Inactive';

interface Student {
    id: string;
    name: string;
    level: 'Level 2' | 'Level 3';
    year: 'Year 1' | 'Year 2';
    attendance: number;
    status: StudentStatus;
    email: string;
}

const mockStudents: Student[] = [
    { id: '1', name: 'Alice Walker', level: 'Level 3', year: 'Year 1', attendance: 92, status: 'Active', email: 'alice.w@college.ac.uk' },
    { id: '2', name: 'Bob Smith', level: 'Level 3', year: 'Year 1', attendance: 84, status: 'At Risk', email: 'bob.s@college.ac.uk' },
    { id: '3', name: 'Charlie Davis', level: 'Level 2', year: 'Year 1', attendance: 96, status: 'Active', email: 'charlie.d@college.ac.uk' },
    { id: '4', name: 'Diana Prince', level: 'Level 3', year: 'Year 2', attendance: 88, status: 'Active', email: 'diana.p@college.ac.uk' },
    { id: '5', name: 'Ethan Hunt', level: 'Level 3', year: 'Year 2', attendance: 75, status: 'At Risk', email: 'ethan.h@college.ac.uk' },
    { id: '6', name: 'Fiona Gallagher', level: 'Level 2', year: 'Year 1', attendance: 90, status: 'Active', email: 'fiona.g@college.ac.uk' },
    { id: '7', name: 'George Martin', level: 'Level 3', year: 'Year 1', attendance: 40, status: 'Inactive', email: 'george.m@college.ac.uk' },
];

const ManageStudents: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<Student[]>(mockStudents);
    const [selectedLevel, setSelectedLevel] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<string>('All');

    const updateStudent = (id: string, field: 'level' | 'year', value: string) => {
        setItems(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const filteredStudents = items.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = selectedLevel === 'All' || student.level === selectedLevel;
        const matchesYear = selectedYear === 'All' || student.year === selectedYear;
        return matchesSearch && matchesLevel && matchesYear;
    });

    // Stats
    const totalStudents = items.length;
    const atRiskCount = items.filter(s => s.status === 'At Risk').length;
    const activeCount = items.filter(s => s.status === 'Active').length;

    return (
        <PageTransition>
            <div style={{ paddingBottom: 'var(--space-12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <div>
                        <h1>Manage Students</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Overview of all student cohorts and performance</p>
                    </div>
                    <Button>
                        <Plus size={20} style={{ marginRight: '8px' }} /> Add Student
                    </Button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
                    <Card elevated>
                        <h4 style={{ color: 'var(--text-secondary)' }}>Total Students</h4>
                        <h2 style={{ fontSize: '2rem', margin: 'var(--space-2) 0' }}>{totalStudents}</h2>
                    </Card>
                    <Card elevated>
                        <h4 style={{ color: 'var(--text-secondary)' }}>Active</h4>
                        <h2 style={{ fontSize: '2rem', margin: 'var(--space-2) 0', color: 'var(--color-success)' }}>{activeCount}</h2>
                    </Card>
                    <Card elevated>
                        <h4 style={{ color: 'var(--text-secondary)' }}>At Risk</h4>
                        <h2 style={{ fontSize: '2rem', margin: 'var(--space-2) 0', color: 'var(--color-error)' }}>{atRiskCount}</h2>
                    </Card>
                </div>

                {/* Filters */}
                <Card elevated style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    borderRadius: 'var(--border-radius-md)',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                style={{ padding: '10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                            >
                                <option value="All">All Levels</option>
                                <option value="Level 2">Level 2</option>
                                <option value="Level 3">Level 3</option>
                            </select>

                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                style={{ padding: '10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
                            >
                                <option value="All">All Years</option>
                                <option value="Year 1">Year 1</option>
                                <option value="Year 2">Year 2</option>
                            </select>

                            <Button variant="outline"><Filter size={20} /></Button>
                        </div>
                    </div>
                </Card>

                {/* Students Table */}
                <Card elevated style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                                <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Level</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Year</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Attendance</th>
                                <th style={{ textAlign: 'left', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                                <th style={{ textAlign: 'right', padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr
                                    key={student.id}
                                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }}
                                    onClick={() => navigate(`/teacher/students/${student.id}`)}
                                    className="hover-row"
                                >
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: 'var(--color-brand-blue)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 600
                                            }}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{student.name}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <select
                                            value={student.level}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateStudent(student.id, 'level', e.target.value as any)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-input)',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}
                                        >
                                            <option value="Level 2">Level 2</option>
                                            <option value="Level 3">Level 3</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <select
                                            value={student.year}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateStudent(student.id, 'year', e.target.value as any)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-input)',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}
                                        >
                                            <option value="Year 1">Year 1</option>
                                            <option value="Year 2">Year 2</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '3px', width: '80px' }}>
                                                <div style={{
                                                    width: `${student.attendance}%`,
                                                    height: '100%',
                                                    background: student.attendance < 85 ? 'var(--color-error)' : 'var(--color-success)',
                                                    borderRadius: '3px'
                                                }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{student.attendance}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {student.status === 'Active' && <CheckCircle size={16} color="var(--color-success)" />}
                                            {student.status === 'At Risk' && <AlertCircle size={16} color="var(--color-warning)" />}
                                            {student.status === 'Inactive' && <User size={16} color="var(--text-tertiary)" />}
                                            <span style={{
                                                color: student.status === 'Active' ? 'var(--color-success)' :
                                                    student.status === 'At Risk' ? 'var(--color-warning)' : 'var(--text-tertiary)',
                                                fontWeight: 500
                                            }}>
                                                {student.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                            <MoreVertical size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredStudents.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No students found matching your filters.
                        </div>
                    )}
                </Card>
            </div>
        </PageTransition>
    );
};

export default ManageStudents;
