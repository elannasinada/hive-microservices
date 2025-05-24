import React, { useState, useEffect } from 'react';
import { 
  BarChart as BarChartIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  PlusCircle,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectService, Project } from '../services/projectService';
import { taskService, Task } from '../services/taskService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mock data for statistics - would be replaced with real data from API
  const statistics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'done').length,
    pendingTasks: tasks.filter(task => task.status !== 'done').length,
    urgentTasks: tasks.filter(task => task.priority === 'urgent').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <Loader size={32} className="animate-spin text-primary" />
          <p className="text-primary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
        <p>{error}</p>
        <button 
          className="mt-2 text-sm underline"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fadeIn">
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Welcome back, {user?.name || 'User'}</h1>
          <p className="text-primary/70 mt-1">Here's your task overview for today</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn btn-primary">
            <PlusCircle size={18} className="mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <BarChartIcon size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-primary/70 text-sm">Total Tasks</p>
              <p className="text-2xl font-bold text-primary">{statistics.totalTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mr-3">
              <CheckCircle size={20} className="text-success" />
            </div>
            <div>
              <p className="text-primary/70 text-sm">Completed</p>
              <p className="text-2xl font-bold text-primary">{statistics.completedTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center mr-3">
              <Clock size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-primary/70 text-sm">Pending</p>
              <p className="text-2xl font-bold text-primary">{statistics.pendingTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center mr-3">
              <AlertCircle size={20} className="text-error" />
            </div>
            <div>
              <p className="text-primary/70 text-sm">Urgent</p>
              <p className="text-2xl font-bold text-primary">{statistics.urgentTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-xl font-bold text-primary mb-4">Recent Projects</h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="card hover:shadow-card-hover transition-shadow">
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-primary mb-2">{project.name}</h3>
                  <p className="text-primary/70 text-sm line-clamp-2 mb-4">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary">
                        {project.tasks} tasks
                      </span>
                    </div>
                    <span className="text-xs text-primary/60">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-primary/70 mb-4">You don't have any projects yet.</p>
            <button className="btn btn-primary">
              <PlusCircle size={18} className="mr-2" />
              Create Your First Project
            </button>
          </div>
        )}
      </div>

      {/* Tasks Due Soon */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Tasks Due Soon</h2>
          <button className="text-accent hover:text-accent-light text-sm">View All</button>
        </div>
        
        {tasks.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-primary/5">
                <tr>
                  <th className="text-left p-4 text-primary font-medium">Task</th>
                  <th className="text-left p-4 text-primary font-medium hidden md:table-cell">Project</th>
                  <th className="text-left p-4 text-primary font-medium hidden md:table-cell">Due Date</th>
                  <th className="text-left p-4 text-primary font-medium">Priority</th>
                  <th className="text-left p-4 text-primary font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 5).map((task) => (
                  <tr key={task.id} className="border-t border-primary/10 hover:bg-primary/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-primary">{task.title}</div>
                      <div className="text-sm text-primary/60 md:hidden">
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </div>
                    </td>
                    <td className="p-4 text-primary/70 hidden md:table-cell">Project Name</td>
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
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'done' ? 'bg-success/10 text-success' :
                        task.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                        task.status === 'review' ? 'bg-accent/10 text-primary' :
                        'bg-primary/5 text-primary/70'
                      }`}>
                        {task.status === 'in_progress' ? 'In Progress' : 
                         task.status === 'todo' ? 'To Do' : 
                         task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-primary/70 mb-4">No upcoming tasks.</p>
            <button className="btn btn-primary">
              <PlusCircle size={18} className="mr-2" />
              Create a Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;