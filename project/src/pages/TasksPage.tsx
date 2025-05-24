import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Filter, 
  Search, 
  PlusCircle, 
  Loader,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  User
} from 'lucide-react';
import { taskService, Task, TaskStatus, TaskPriority } from '../services/taskService';
import { projectService, Project } from '../services/projectService';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    projectId: string;
    dueDate?: string;
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    projectId: '',
  });
  
  const [filters, setFilters] = useState<{
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    projectId: string | 'all';
  }>({
    status: 'all',
    priority: 'all',
    projectId: 'all',
  });
  
  const [sort, setSort] = useState<{
    field: 'dueDate' | 'priority' | 'status';
    direction: 'asc' | 'desc';
  }>({
    field: 'dueDate',
    direction: 'asc',
  });
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, filters, searchQuery, sort]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects first
      const projectsData = await projectService.getProjects();
      setProjects(projectsData);
      
      // If there are projects, fetch tasks for the first project
      if (projectsData.length > 0) {
        const tasksData = await taskService.getTasks(projectsData[0].id);
        setTasks(tasksData);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tasks. Please try again.');
      setLoading(false);
    }
  };

  const filterAndSortTasks = () => {
    let filtered = [...tasks];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply project filter
    if (filters.projectId !== 'all') {
      filtered = filtered.filter(task => task.projectId === filters.projectId);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        task => 
          task.title.toLowerCase().includes(query) || 
          task.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sort.field) {
        case 'dueDate':
          valueA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          valueB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
          valueA = priorityOrder[a.priority];
          valueB = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { todo: 0, in_progress: 1, review: 2, done: 3 };
          valueA = statusOrder[a.status];
          valueB = statusOrder[b.status];
          break;
        default:
          return 0;
      }
      
      return sort.direction === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.projectId) {
      return; // Prevent creating a task without title or project
    }

    try {
      const createdTask = await taskService.createTask(
        newTask.projectId, 
        {
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          dueDate: newTask.dueDate,
        }
      );
      
      setTasks([...tasks, createdTask]);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        projectId: '',
      });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleSort = (field: 'dueDate' | 'priority' | 'status') => {
    if (sort.field === field) {
      // Toggle direction
      setSort({
        ...sort,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Change field and set default direction
      setSort({
        field,
        direction: 'asc'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <Loader size={32} className="animate-spin text-primary" />
          <p className="text-primary">Loading tasks...</p>
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
            onClick={fetchData}
          >
            Try again
          </button>
        </div>
      )}

      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">Tasks</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-accent w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60" size={18} />
          </div>
          
          <div className="flex gap-3">
            <button 
              className="btn btn-outline flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-2" />
              Filters
            </button>
            <button 
              className="btn btn-primary flex items-center"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusCircle size={16} className="mr-2" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Status
              </label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as TaskStatus | 'all'})}
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Priority
              </label>
              <select
                className="input"
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value as TaskPriority | 'all'})}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Project
              </label>
              <select
                className="input"
                value={filters.projectId}
                onChange={(e) => setFilters({...filters, projectId: e.target.value})}
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      {filteredTasks.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-primary/5">
                <th className="text-left p-4 text-primary font-medium">Task</th>
                <th className="text-left p-4 text-primary font-medium hidden md:table-cell">Project</th>
                <th 
                  className="text-left p-4 text-primary font-medium hidden md:table-cell cursor-pointer"
                  onClick={() => toggleSort('dueDate')}
                >
                  <div className="flex items-center">
                    Due Date
                    {sort.field === 'dueDate' && (
                      sort.direction === 'asc' ? 
                      <ChevronUp size={16} className="ml-1" /> : 
                      <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-primary font-medium cursor-pointer"
                  onClick={() => toggleSort('priority')}
                >
                  <div className="flex items-center">
                    Priority
                    {sort.field === 'priority' && (
                      sort.direction === 'asc' ? 
                      <ChevronUp size={16} className="ml-1" /> : 
                      <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-primary font-medium cursor-pointer"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sort.field === 'status' && (
                      sort.direction === 'asc' ? 
                      <ChevronUp size={16} className="ml-1" /> : 
                      <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                // Find project name
                const project = projects.find(p => p.id === task.projectId);
                
                return (
                  <tr key={task.id} className="border-t border-primary/10 hover:bg-primary/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-primary">{task.title}</div>
                      <div className="text-sm text-primary/60 mt-1 line-clamp-1 hidden sm:block">
                        {task.description}
                      </div>
                      <div className="text-sm text-primary/60 md:hidden">
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </div>
                    </td>
                    <td className="p-4 text-primary/70 hidden md:table-cell">
                      {project?.name || 'Unknown Project'}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {task.dueDate ? (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1 text-primary/60" />
                          <span className="text-primary/70">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-primary/50">No date</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'urgent' ? 'bg-error/10 text-error' :
                        task.priority === 'high' ? 'bg-warning/10 text-warning' :
                        task.priority === 'medium' ? 'bg-accent/10 text-primary' :
                        'bg-primary/5 text-primary/70'
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${
                          task.status === 'done' ? 'bg-success/10 text-success' :
                          task.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                          task.status === 'review' ? 'bg-accent/10 text-primary' :
                          'bg-primary/5 text-primary/70'
                        }`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <CheckCircle size={24} className="text-primary/40" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No tasks found</h3>
            <p className="text-primary/70 mb-4">
              {searchQuery 
                ? `No tasks match your search "${searchQuery}"`
                : filters.status !== 'all' || filters.priority !== 'all' || filters.projectId !== 'all'
                  ? 'No tasks match your filters'
                  : 'Get started by creating your first task'
              }
            </p>
            {(searchQuery || filters.status !== 'all' || filters.priority !== 'all' || filters.projectId !== 'all') ? (
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    status: 'all',
                    priority: 'all',
                    projectId: 'all',
                  });
                }}
              >
                Clear Filters
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusCircle size={16} className="mr-2" />
                Create New Task
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
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
              <h2 className="text-xl font-bold text-primary mb-4">Create New Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="taskTitle" className="block text-sm font-medium text-primary mb-1">
                    Task Title *
                  </label>
                  <input
                    id="taskTitle"
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="input"
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="taskProject" className="block text-sm font-medium text-primary mb-1">
                    Project *
                  </label>
                  <select
                    id="taskProject"
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="taskDescription" className="block text-sm font-medium text-primary mb-1">
                    Description
                  </label>
                  <textarea
                    id="taskDescription"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="input min-h-[80px]"
                    placeholder="Describe your task (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="taskStatus" className="block text-sm font-medium text-primary mb-1">
                      Status
                    </label>
                    <select
                      id="taskStatus"
                      value={newTask.status}
                      onChange={(e) => setNewTask({...newTask, status: e.target.value as TaskStatus})}
                      className="input"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="taskPriority" className="block text-sm font-medium text-primary mb-1">
                      Priority
                    </label>
                    <select
                      id="taskPriority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                      className="input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="taskDueDate" className="block text-sm font-medium text-primary mb-1">
                    Due Date
                  </label>
                  <input
                    id="taskDueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="input"
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
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim() || !newTask.projectId}
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;