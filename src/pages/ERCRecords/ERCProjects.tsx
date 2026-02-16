import React, { useState } from 'react';
import { useERC } from '../../context/ERCContext';
import { Plus, Music, Disc, MoreVertical, Loader2 } from 'lucide-react';
import { type ProjectType } from '../../types/erc';
import Card from '../../components/common/Card';

const ERCProjects: React.FC = () => {
    const { projects, createProject, loading } = useERC();
    const [isCreating, setIsCreating] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', type: 'Song' as ProjectType });
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await createProject(newProject.title, newProject.type);
        setSubmitting(false);
        setIsCreating(false);
        setNewProject({ title: '', type: 'Song' });
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Disc className="w-6 h-6 text-indigo-600" />
                        Projects
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your discography</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    New Project
                </button>
            </div>

            {isCreating && (
                <Card className="mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Project</h3>
                    <form onSubmit={handleCreate} className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input
                                required
                                type="text"
                                value={newProject.title}
                                onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Summer Hits 2024"
                            />
                        </div>
                        <div className="w-40">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                                value={newProject.type}
                                onChange={e => setNewProject({ ...newProject, type: e.target.value as ProjectType })}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Song">Song</option>
                                <option value="EP">EP</option>
                                <option value="Album">Album</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                    <Card className="col-span-full text-center py-12 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" style={{ boxShadow: 'none' }}>
                        <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Start your musical journey by creating a project.</p>
                    </Card>
                ) : (
                    projects.map(project => (
                        <Card key={project.id} elevated hover className="group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className={`p-2 rounded-lg ${project.type === 'Album' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                                    project.type === 'EP' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600' :
                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                    }`}>
                                    <Disc size={20} />
                                </div>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 relative z-10">{project.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 relative z-10">
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs translate-y-px">{project.type}</span>
                                <span>•</span>
                                <span>{project.status || 'Demo'}</span>
                            </div>
                            <div className="flex -space-x-2 overflow-hidden mb-4 relative z-10">
                                {project.collaborators && project.collaborators.length > 0 ? (
                                    project.collaborators.map((collab, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800" title={collab.role} />
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic pl-1">No collaborators</span>
                                )}
                            </div>
                            <button className="w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors relative z-10">
                                View Details
                            </button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ERCProjects;
