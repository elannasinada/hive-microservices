import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, User, Edit, Trash, Search, Users, Eye } from 'lucide-react';
import { taskAPI, projectAPI } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import TaskForm from './TaskForm';
import TaskDetails from './TaskDetails';
import { useAuth } from '@/contexts/AuthContext';

interface TaskListProps {
  tasks: any[];
  onUpdate: () => void;
  user: any;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdate, user }) => {
  console.log('TaskList received tasks:', tasks);
  const { user: currentUser } = useAuth();
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [originalAssignedUser, setOriginalAssignedUser] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [projects, setProjects] = useState<{ projectId: string, projectName: string }[]>([]);
  const [projectTimeFilter, setProjectTimeFilter] = useState<string>('all');

  // Only allow task management for ADMIN or PROJECT_LEADER
  const canManageTasks = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

  // Helper function to check if a task is overdue
  const isTaskOverdue = (task: any) => {
    if (!task.dueDate) return false;
    const isDueDate = new Date(task.dueDate) < new Date();
    const statusLower = task.status?.toLowerCase() || '';
    const isNotCompleted = statusLower !== 'completed' && 
                          statusLower !== 'complete' && 
                          statusLower !== 'completed_task';
    return isDueDate && isNotCompleted;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-green-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-yellow-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    // Check for overdue tasks
    if (statusLower === 'overdue') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    // Check for completed tasks
    if (statusLower === 'completed' || 
        statusLower === 'complete' || 
        statusLower === 'completed_task') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    // Check for in-progress tasks
    if (statusLower === 'in_progress' || 
        statusLower === 'inprogress' || 
        statusLower === 'in-progress') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    
    // Default
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      onUpdate();
      return;
    }

    setSearchLoading(true);
    try {
      await taskAPI.search({ query: searchTerm });
      onUpdate();
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Error",
        description: "Failed to search tasks",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await taskAPI.update(taskId, { taskStatus: 'CANCELLED' });
      toast({ title: 'Task Cancelled', description: 'The task has been marked as cancelled.' });
      onUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel task', variant: 'destructive' });
    }
  };

  const handleUpdateProgress = async (taskId: string, projectId: string, newStatus: string) => {
    try {
      await taskAPI.updateProgress(taskId, projectId, { status: newStatus });
      toast({
        title: "Success!",
        description: "Task progress updated."
      });
      onUpdate();
    } catch (error) {
      console.error('Progress update failed:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const handleAssignTask = async (taskData: any) => {
    try {
      await taskAPI.assignToUsers(taskData);
      toast({
        title: "Success!",
        description: "Task assigned successfully."
      });
      onUpdate();
    } catch (error) {
      console.error('Assignment failed:', error);
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (editingTask && canManageTasks) {
      // Fetch all users for assignment
      (async () => {
        let users = [];
        try {
          users = await (await import('@/utils/api')).adminAPI.getAllUsers();
        } catch {
          users = await (await import('@/utils/api')).authAPI.getAllUsers();
        }
        const formattedUsers = users
          .map((user: any) => ({
            userId: user.userId || user.user_id || user.id,
            username: user.actualUsername || user.username || 'Unknown User',
            email: user.email || 'No Email',
            roles: user.roles || []
          }))
          .filter((user: any) => {
            const userRoles = Array.isArray(user.roles)
              ? user.roles.map((r: any) => typeof r === 'string' ? r : r.role)
              : [];
            const isAdmin = userRoles.some((role: string) => role === 'ROLE_ADMIN' || role === 'ADMIN');
            const isProjectLeader = userRoles.some((role: string) => role === 'ROLE_PROJECT_LEADER' || role === 'PROJECT_LEADER');
            return !isAdmin && !isProjectLeader;
          });
        setAvailableUsers(formattedUsers);
      })();
      // Fetch current assigned user
      (async () => {
        const taskDetails = await taskAPI.get(editingTask.id || editingTask.taskId);
        let assignedUserId = '';
        if (taskDetails && taskDetails.assignedUsers) {
          if (Array.isArray(taskDetails.assignedUsers)) {
            assignedUserId = String(taskDetails.assignedUsers[0]?.userId || '');
          } else if (typeof taskDetails.assignedUsers === 'object') {
            assignedUserId = Object.keys(taskDetails.assignedUsers)[0] || '';
          }
        }
        setSelectedUser(assignedUserId);
        setOriginalAssignedUser(assignedUserId);
      })();
    }
  }, [editingTask, canManageTasks]);

  const handleEditTaskSubmit = async (formData: any) => {
    try {
      // Update task details
      await taskAPI.update(editingTask.id, formData);
      // Assignment logic
      if (canManageTasks && selectedUser && selectedUser !== originalAssignedUser) {
        // Unassign previous user if any
        if (originalAssignedUser) {
          await taskAPI.unassign({
            taskId: editingTask.id,
            projectId: editingTask.projectId,
            userIdList: [Number(originalAssignedUser)]
          });
        }
        // Assign new user
        await taskAPI.assignToUsers({
          taskId: Number(editingTask.id),
          projectId: Number(editingTask.projectId),
          userIdList: [Number(selectedUser)]
        });
      }
      toast({ title: 'Success!', description: 'Task updated successfully.' });
      setEditingTask(null);
      onUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add a helper to resolve the assignee name/email from assignedUsers
  const resolveAssignee = (task) => {
    if (!task.assignedUsers) return '';
    // If assignedUsers is a map/object with userId: username
    if (
      typeof task.assignedUsers === 'object' &&
      !Array.isArray(task.assignedUsers)
    ) {
      const userIds = Object.keys(task.assignedUsers);
      if (userIds.length > 0) {
        // Use the value (username) instead of the key (userId)
        return task.assignedUsers[userIds[0]] || userIds[0] || '';
      }
    }
    // Fallbacks for other formats
    if (Array.isArray(task.assignedUsers) && task.assignedUsers.length > 0) {
      const user = task.assignedUsers[0];
      if (typeof user === 'object') {
        return user.username || user.email || user.userId || '';
      }
      return user;
    }
    return '';
  };

  const tasksWithAssignee = filteredTasks.map(task => {
    let assignee = resolveAssignee(task);
    return { ...task, assignee };
  });

  // Debug: Print the full task object before normalization
  console.log('tasksWithAssignee:', tasksWithAssignee);

  // Helper to determine project time status
  function getProjectTimeStatus(project) {
    if (!project || !project.endDate) return 'active';
    const now = new Date();
    const end = new Date(project.endDate);
    if (end < now) return 'past';
    if (end.toDateString() === now.toDateString()) return 'active';
    return end > now ? 'future' : 'active';
  }

  // Filter projects by time filter
  const filteredProjectIds = projects
    .filter(project => {
      if (projectTimeFilter === 'all') return true;
      const status = getProjectTimeStatus(project);
      if (projectTimeFilter === 'active') return status === 'active';
      if (projectTimeFilter === 'past') return status === 'past';
      if (projectTimeFilter === 'future') return status === 'future';
      return true;
    })
    .map(project => String(project.projectId || project.id));

  // Normalize projectId for all tasks before filtering
  const normalizedTasks = tasksWithAssignee.map(task => ({
    ...task,
    projectId: String(task.taskId),
  }));

  // Debug: Log selectedProjectId and projectIds in normalizedTasks
  console.log('Selected projectId:', selectedProjectName);
  console.log('All task projectIds:', normalizedTasks.map(t => t.projectId));

  // Only show tasks when a project is selected
  const filteredTasksByProject = !selectedProjectName
    ? []
    : normalizedTasks.filter(task => String(task.projectName) === String(selectedProjectName));
  console.log('Filtered tasks for selected project:', filteredTasksByProject);

  // Fetch all projects for the project selection buttons
  useEffect(() => {
    // Fetch all projects for the project selection buttons
    async function fetchProjects() {
      try {
        const projectsData = await projectAPI.search();
        const today = new Date();
        const filtered = projectsData.filter((p: any) => {
          const start = p.startDate ? new Date(p.startDate) : null;
          const end = p.endDate ? new Date(p.endDate) : null;
          if (!start || !end) return false;
          // Active: today >= start && today <= end
          // Future: today < start
          return (today >= start && today <= end) || (today < start);
        }).map((p: any) => ({
          projectId: String(p.projectId),
          projectName: p.projectName || p.name || p.title || 'Unnamed Project',
        }));
        setProjects(filtered);
      } catch (err) {
        setProjects([]);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      {/* Project Selection Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {projects.length === 0 ? (
          <span className="text-secondary/60">No projects available.</span>
        ) : (
          projects.map((project) => (
            <button
              key={project.projectName}
              onClick={() => setSelectedProjectName(project.projectName)}
              className={`px-4 py-2 rounded border transition-colors duration-150 ${selectedProjectName === project.projectName ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-accent/30 hover:bg-accent/10'}`}
            >
              {project.projectName}
            </button>
          ))
        )}
        <button
          onClick={() => setSelectedProjectName('')}
          className={`px-4 py-2 rounded border transition-colors duration-150 ${!selectedProjectName ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-accent/30 hover:bg-accent/10'}`}
        >
          Show None
        </button>
      </div>
      {/* Search and Actions */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center justify-between">
            <div className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Task Management
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => taskAPI.export()}
                variant="outline"
                size="sm"
                className="border-accent/30"
              >
                Export Tasks
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border-accent/30 focus:border-primary"
            />
            <Button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-primary hover:bg-secondary text-white"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Tasks Grid */}
      <h2 className="text-lg font-bold text-primary mb-2">Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasksByProject.map((task: any) => (
          <Card 
            key={task.id} 
            className="border-accent/20 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => setViewingTask(task)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-primary text-lg group-hover:text-secondary transition-colors">
                  {task.taskName}
                </CardTitle>
                <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingTask(task)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {canManageTasks && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit Task"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleCancelTask(task.id)}
                        variant="destructive"
                        size="sm"
                      >
                        Cancel Task
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Badge className={getPriorityColor(task.taskPriority)}>
                  {task.taskPriority === 'HIGH' ? 'High' :
                      task.taskPriority === 'MEDIUM' ? 'Medium' :
                          task.taskPriority === 'LOW' ? 'Low' : 'Not Set'}
                </Badge>                <Badge className={isTaskOverdue(task) 
                  ? 'bg-red-100 text-red-800 border-red-200' 
                  : getStatusColor(task.status)}>
                  {isTaskOverdue(task) ? 'Overdue' : task.taskStatus?.replace('_-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-secondary/70 text-sm mb-4 line-clamp-2">
                {task.description || 'No description available'}
              </p>
              
              <div className="space-y-2 text-sm">
                {task.dueDate && (
                  <div className="flex items-center text-secondary/60">
                    <Calendar className="w-4 h-4 mr-2" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center text-secondary/60">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Assigned to:</span>&nbsp;
                  {task.assignee ? task.assignee : <span className="italic text-secondary/50">Unassigned</span>}
                </div>
              </div>
              
              {/*<div className="mt-4 pt-4 border-t border-accent/20 space-y-2" onClick={(e) => e.stopPropagation()}>*/}
              {/*  {canManageTasks && (*/}
              {/*    <>*/}
              {/*      <div className="flex space-x-1">*/}
              {/*        <Button*/}
              {/*          onClick={() => handleUpdateProgress(task.id, task.projectId, 'in-progress')}*/}
              {/*          variant="outline"*/}
              {/*          size="sm"*/}
              {/*          className="flex-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"*/}
              {/*        >*/}
              {/*          Start*/}
              {/*        </Button>*/}
              {/*        <Button*/}
              {/*          onClick={() => handleUpdateProgress(task.id, task.projectId, 'completed')}*/}
              {/*          variant="outline"*/}
              {/*          size="sm"*/}
              {/*          className="flex-1 text-xs border-green-200 text-green-600 hover:bg-green-50"*/}
              {/*        >*/}
              {/*          Complete*/}
              {/*        </Button>*/}
              {/*      </div>*/}
              {/*      <Button*/}
              {/*        onClick={() => handleAssignTask({ taskId: task.id, userId: 'current-user' })}*/}
              {/*        variant="outline"*/}
              {/*        size="sm"*/}
              {/*        className="w-full border-primary text-primary hover:bg-primary hover:text-white"*/}
              {/*      >*/}
              {/*        <Users className="w-4 h-4 mr-2" />*/}
              {/*        Assign to Me*/}
              {/*      </Button>*/}
              {/*    </>*/}
              {/*  )}*/}
              {/*</div>*/}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasksByProject.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">
            No tasks found
          </h3>
          <p className="text-secondary/70">
            No tasks for the selected project/time filter.
          </p>
        </div>
      )}

      {editingTask && (
        <TaskForm
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            onUpdate();
          }}
          projects={projects}
          taskToEdit={editingTask}
          availableUsers={availableUsers}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          handleEditTaskSubmit={handleEditTaskSubmit}
        />
      )}

      {viewingTask && (
        <TaskDetails
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onUpdate={() => {
            setViewingTask(null);
            onUpdate();
          }}
          canEdit={canManageTasks}
        />
      )}
    </div>
  );
};

export default TaskList;
