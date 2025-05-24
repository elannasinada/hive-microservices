import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Loader, 
  X, 
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { projectService, Project } from '../services/projectService';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(project => project.status === filter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        project => 
          project.name.toLowerCase().includes(query) || 
          project.description.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      return; // Prevent creating a project without a name
    }

    try {
      const createdProject = await projectService.createProject(newProject);
      setProjects([...projects, createdProject]);
      setNewProject({ name: '', description: '' });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <Loader size={32} className="animate-spin text-primary" />
          <p className="text-primary">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fadeIn">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
          <p>{error}</p>
          <button 
            className="mt-2 text-sm underline"
            onClick={fetchProjects}
          >
            Try again
          </button>
        </div>
      )}

      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">Projects</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-accent w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" size={18} />
          </div>
          
          <div className="flex gap-3">
            <button className="btn btn-outline flex items-center">
              <Filter size={16} className="mr-2" />
              Filter
            </button>
            <button 
              className="btn btn-primary flex items-center"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusCircle size={16} className="mr-2" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 border-b border-primary/10">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'archived', label: 'Archived' }
        ].map((option) => (
          <button
            key={option.key}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === option.key
                ? 'text-primary border-b-2 border-accent'
                : 'text-primary/60 hover:text-primary'
            }`}
            onClick={() => setFilter(option.key as any)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Project list */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="card hover:shadow-card-hover transition-all duration-200 group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-primary group-hover:text-primary-light transition-colors">
                    {project.name}
                  </h3>
                  <span 
                    className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'active' ? 'bg-success/10 text-success' :
                      project.status === 'completed' ? 'bg-primary/10 text-primary' :
                      'bg-primary/5 text-primary/70'
                    }`}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-primary/70 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-primary/70 text-sm">
                    <Clock size={14} className="mr-1" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-primary/70 text-sm">
                    <Users size={14} className="mr-1" />
                    <span>{project.members} members</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-primary/70 text-sm">
                      <CheckCircle size={14} className="mr-1" />
                      <span>{project.tasks} tasks</span>
                    </div>
                  </div>
                  <button className="text-accent hover:text-accent-light text-sm font-medium transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <PlusCircle size={24} className="text-primary/40" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No projects found</h3>
            <p className="text-primary/70 mb-4">
              {searchQuery 
                ? `No projects match your search "${searchQuery}"`
                : 'Get started by creating your first project'
              }
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusCircle size={16} className="mr-2" />
              Create New Project
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-primary/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative fadeIn">
            <button 
              className="absolute right-4 top-4 text-primary/50 hover:text-primary"
              onClick={() => setShowCreateModal(false)}
            >
              <X size={20} />
            </button>
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Create New Project</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-primary mb-1">
                    Project Name *
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="input"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-primary mb-1">
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="input min-h-[100px]"
                    placeholder="Describe your project (optional)"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3 justify-end">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim()}
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;