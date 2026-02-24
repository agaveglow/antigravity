import React, { useState } from 'react';
import { useERC } from '../../context/ERCContext';
import { useUser } from '../../context/UserContext';
import { useStudents } from '../../context/StudentsContext';
import { Plus, Music, Disc, Loader2, List, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { type ProjectType } from '../../types/erc';
import Card from '../../components/common/Card';

const ERCProjects: React.FC = () => {
    const { projects, createProject, createTask, updateTaskStatus, deleteTask, loading } = useERC();
    const { role, user } = useUser();
    const { students } = useStudents();

    const [isCreating, setIsCreating] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', type: 'Song' as ProjectType, targetStudentId: '' });
    const [submitting, setSubmitting] = useState(false);

    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await createProject(newProject.title, newProject.type, newProject.targetStudentId || undefined);
        setSubmitting(false);
        setIsCreating(false);
        setNewProject({ title: '', type: 'Song', targetStudentId: '' });
    };

    const handleAddTask = async (projectId: string) => {
        if (!newTask.title) return;
        await createTask(projectId, newTask.title, newTask.description, newTask.dueDate || undefined);
        setIsAddingTask(null);
        setNewTask({ title: '', description: '', dueDate: '' });
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const isTeacher = role !== 'student';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Disc className="w-6 h-6 text-indigo-600" />
                        Projects
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isTeacher ? 'Overview of all student projects' : 'Manage your music projects and track progress'}
                    </p>
                </div>
                {isTeacher && (
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Create Student Project
                    </button>
                )}
            </div>

            {isCreating && (
                <Card className="mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create Project</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Title</label>
                            <input
                                required
                                type="text"
                                value={newProject.title}
                                onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="e.g. End of Year Recording"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                                value={newProject.type}
                                onChange={e => setNewProject({ ...newProject, type: e.target.value as ProjectType })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="Song">Song</option>
                                <option value="EP">EP</option>
                                <option value="Album">Album</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Student (Optional)</label>
                            <select
                                value={newProject.targetStudentId}
                                onChange={e => setNewProject({ ...newProject, targetStudentId: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="">None (Personal)</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.cohort})</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(isTeacher ? projects : projects.filter(p => p.owner_id === user?.id || p.target_student_id === user?.id)).length === 0 ? (
                    <Card className="col-span-full text-center py-12 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Start your musical journey by creating a project.</p>
                    </Card>
                ) : (
                    (isTeacher ? projects : projects.filter(p => p.owner_id === user?.id || p.target_student_id === user?.id)).map(project => (
                        <Card key={project.id} elevated hover className="flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${project.type === 'Album' ? 'bg-purple-100 text-purple-600' :
                                    project.type === 'EP' ? 'bg-pink-100 text-pink-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                    <Disc size={20} />
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                        {project.type}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{project.title}</h3>

                            {project.target_student_id && isTeacher && (
                                <p className="text-xs text-indigo-600 font-semibold mb-2 flex items-center gap-1">
                                    Assigned to: {students.find(s => s.id === project.target_student_id)?.name || 'Student'}
                                </p>
                            )}

                            {/* Task Summary */}
                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                        <List size={14} />
                                        Task Tracker ({project.tasks?.filter(t => t.status === 'Completed').length || 0}/{project.tasks?.length || 0})
                                    </div>
                                    <button
                                        onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        {expandedProjectId === project.id ? 'Hide' : 'Manage Tasks'}
                                    </button>
                                </div>

                                {expandedProjectId === project.id && (
                                    <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
                                        {project.tasks?.map(task => (
                                            <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 group">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <button onClick={() => updateTaskStatus(task.id, task.status === 'Completed' ? 'To Do' : 'Completed')}>
                                                        {task.status === 'Completed' ?
                                                            <CheckCircle size={16} className="text-green-500" /> :
                                                            <Circle size={16} className="text-gray-300" />
                                                        }
                                                    </button>
                                                    <span className={`text-sm ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {isAddingTask === project.id ? (
                                            <div className="p-2 border border-indigo-200 rounded-lg bg-indigo-50/30">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={newTask.title}
                                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                                    placeholder="Task title..."
                                                    className="w-full bg-transparent text-sm mb-2 outline-none"
                                                    onKeyDown={e => e.key === 'Enter' && handleAddTask(project.id)}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setIsAddingTask(null)} className="text-xs text-gray-500">Cancel</button>
                                                    <button onClick={() => handleAddTask(project.id)} className="text-xs font-bold text-indigo-600">Add</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingTask(project.id)}
                                                className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-1"
                                            >
                                                <Plus size={14} /> Add Task
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ERCProjects;
