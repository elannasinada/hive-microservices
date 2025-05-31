import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {projectAPI, taskAPI, authAPI, adminAPI, projectLeaderAPI, apiRequest} from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, Calendar, User, Flag } from 'lucide-react';

interface ProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'medium' | 'high';
  status: 'to_do' | 'in_progress' | 'completed';
  dueDate: string;
  assignedUsers: string[];
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('project');
  const [formData, setFormData] = useState({
    projectId: '',
    projectName: '',
    projectDescription: '',
    startDate: '',
    endDate: ''
  });
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [currentTask, setCurrentTask] = useState<TaskData>({
    id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'to_do',
    dueDate: '',
    assignedUsers: []
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Check if user can assign tasks
  const canAssignUsers = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

  // Fetch available users for task assignment
  useEffect(() => {
    if (canAssignUsers) {
      fetchAvailableUsers();
    }
  }, [canAssignUsers]);  // Simplified user fetching logic - both ADMINs and PROJECT_LEADERs get all users
  const fetchAvailableUsers = async () => {
    try {
      console.log('ProjectForm: Fetching users for task assignment...');

      let users = [];

      if (user?.roles.includes('ADMIN') || user?.roles.includes('PROJECT_LEADER')) {
        // Both admins and project leaders can see all users
        try {
          console.log('Fetching all users using admin endpoint...');
          users = await adminAPI.getAllUsers();
          console.log('Successfully fetched users:', users.length);
        } catch (adminError) {
          console.warn('Admin API failed, falling back to auth API:', adminError);
          try {
            users = await authAPI.getAllUsers();
            console.log('Successfully fetched users using auth API:', users.length);
          } catch (authError) {
            console.error('Both admin and auth APIs failed:', authError);
            users = [];
          }
        }
      } else {
        console.log('User does not have permission to assign tasks');
        setAvailableUsers([]);
        return;
      }

      // Format and set available users (following AdminDashboard pattern)
      const formattedUsers = users.map((user: any) => ({
        userId: user.userId || user.user_id || user.id,
        username: user.actualUsername || user.username || 'Unknown User',
        email: user.email || 'No Email',
        department: user.department || (user.departments && user.departments.length > 0 ? user.departments[0].department : null),
        roles: user.roles || []
      }));

      setAvailableUsers(formattedUsers);
      console.log('Final available users:', formattedUsers.length);

    } catch (error) {
      console.error('Failed to fetch users:', error);
      setAvailableUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentTab === 'project') {
      // Validate project data and move to tasks tab
      if (!formData.projectName.trim()) {
        toast({
          title: "Error",
          description: "Project name is required",
          variant: "destructive"
        });
        return;
      }
      setCurrentTab('tasks');
      return;
    }

    // Submit both project and tasks
    setLoading(true);

    try {
      // Convert empty strings to null for date fields
      const payload = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      // Create the project first
      const createdProject = await projectAPI.create(payload);
      const projectId = createdProject.id || createdProject.projectId;

      // Create tasks if any
      if (tasks.length > 0) {
        for (const task of tasks) {
          try {
            const taskPayload = {
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status, // Will default to TO_DO as required
              dueDate: task.dueDate || null
            };

            const createdTask = await taskAPI.create(projectId, taskPayload);
            
            // Assign task to selected users if any
            if (task.assignedUsers.length > 0 && canAssignUsers) {
              try {
                await taskAPI.assignToUsers({
                  taskId: createdTask.id || createdTask.taskId,
                  userIds: task.assignedUsers
                });
              } catch (assignError) {
                console.error(`Failed to assign task ${task.title}:`, assignError);
                // Continue with other tasks even if assignment fails
              }
            }
          } catch (taskError) {
            console.error(`Failed to create task ${task.title}:`, taskError);
            // Continue with other tasks even if one fails
          }
        }
      }

      toast({
        title: "Success!",
        description: `Project created successfully${tasks.length > 0 ? ` with ${tasks.length} task(s)` : ''}.`
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentTask({
      ...currentTask,
      [e.target.name]: e.target.value
    });
  };

  const handleTaskSelectChange = (field: string, value: string) => {
    setCurrentTask({
      ...currentTask,
      [field]: value
    });
  };

  const handleUserAssignment = (userId: string, checked: boolean) => {
    setCurrentTask(prev => ({
      ...prev,
      assignedUsers: checked 
        ? [...prev.assignedUsers, userId]
        : prev.assignedUsers.filter(id => id !== userId)
    }));
  };

  const addTask = () => {
    if (!currentTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      });
      return;
    }

    const newTask: TaskData = {
      ...currentTask,
      id: Date.now().toString() // Temporary ID for UI
    };

    if (isEditingTask && editingTaskId) {
      // Update existing task
      setTasks(prev => prev.map(task => task.id === editingTaskId ? newTask : task));
      setIsEditingTask(false);
      setEditingTaskId(null);
    } else {
      // Add new task
      setTasks(prev => [...prev, newTask]);
    }

    // Reset form
    setCurrentTask({
      id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'to_do',
      dueDate: '',
      assignedUsers: []
    });

    toast({
      title: "Success",
      description: isEditingTask ? "Task updated" : "Task added to project"
    });
  };

  const editTask = (task: TaskData) => {
    setCurrentTask(task);
    setIsEditingTask(true);
    setEditingTaskId(task.id);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Success",
      description: "Task removed"
    });
  };

  const cancelTaskEdit = () => {
    setCurrentTask({
      id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'to_do',
      dueDate: '',
      assignedUsers: []
    });
    setIsEditingTask(false);
    setEditingTaskId(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'to_do': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Create New Project</DialogTitle>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project">Project Details</TabsTrigger>
            <TabsTrigger value="tasks" disabled={!formData.projectName.trim()}>
              Add Tasks ({tasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  required
                  className="border-accent/30 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  placeholder="Describe your project"
                  rows={3}
                  className="border-accent/30 focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="border-accent/30 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="border-accent/30 focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-accent/30"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-secondary text-white"
                >
                  Next: Add Tasks
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-6">
              {/* Task Creation Form */}
              <Card className="border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    {isEditingTask ? 'Edit Task' : 'Add New Task'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taskTitle">Task Title *</Label>
                      <Input
                        id="taskTitle"
                        name="title"
                        value={currentTask.title}
                        onChange={handleTaskChange}
                        placeholder="Enter task title"
                        className="border-accent/30 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taskDueDate">Due Date</Label>
                      <Input
                        id="taskDueDate"
                        name="dueDate"
                        type="date"
                        value={currentTask.dueDate}
                        onChange={handleTaskChange}
                        className="border-accent/30 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taskDescription">Description</Label>
                    <Textarea
                      id="taskDescription"
                      name="description"
                      value={currentTask.description}
                      onChange={handleTaskChange}
                      placeholder="Describe the task"
                      rows={2}
                      className="border-accent/30 focus:border-primary"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        value={currentTask.priority} 
                        onValueChange={(value) => handleTaskSelectChange('priority', value)}
                      >
                        <SelectTrigger className="border-accent/30 focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={currentTask.status} 
                        onValueChange={(value) => handleTaskSelectChange('status', value)}
                      >
                        <SelectTrigger className="border-accent/30 focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to_do">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>                  </div>
                  
                  {/* User Assignment Section */}
                  {canAssignUsers && availableUsers.length > 0 && (
                    <div className="space-y-2">
                      <Label>
                        Assign to Team Members
                        {user?.roles.includes('PROJECT_LEADER') && user?.department && 
                          ` in ${user.department}`
                        }
                      </Label>
                      <div className="border border-accent/30 rounded-md p-3 max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                          {availableUsers.map((assignableUser) => (
                            <div key={assignableUser.userId || assignableUser.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`task-user-${assignableUser.userId || assignableUser.id}`}
                                checked={currentTask.assignedUsers.includes(String(assignableUser.userId || assignableUser.id))} // Ensure string comparison
                                onCheckedChange={(checked) => handleUserAssignment(String(assignableUser.userId || assignableUser.id), !!checked)} // Ensure string assignment
                              />
                              <Label 
                                htmlFor={`task-user-${assignableUser.userId || assignableUser.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {assignableUser.username} ({assignableUser.email})
                                {assignableUser.department && (
                                  <span className="text-xs text-secondary/60 ml-2">
                                    - {assignableUser.department}
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-secondary/60">
                        Select team members to assign this task to. You can assign tasks later if needed.
                      </p>
                    </div>
                  )}
                  
                  {/* Show message when assignment is not available */}
                  {!canAssignUsers && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Task assignment is only available for Admins and Project Leaders.
                      </p>
                    </div>
                  )}
                  
                  {canAssignUsers && availableUsers.length === 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        ℹ️ No team members available to assign tasks to. Possible reasons:
                        <br />• No users in your department ({user?.department || 'Unknown'})
                        <br />• API call to fetch users failed (check console for details)
                        <br />• You're the only user in your department
                        <br />• Users haven't been added to the system yet
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={addTask}
                      className="bg-primary hover:bg-secondary text-white"
                    >
                      {isEditingTask ? 'Update Task' : 'Add Task'}
                    </Button>
                    {isEditingTask && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelTaskEdit}
                        className="border-accent/30"
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Added Tasks List */}
              {tasks.length > 0 && (
                <Card className="border-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Added Tasks ({tasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <Card key={task.id} className="border-accent/10 bg-gray-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium text-primary">{task.title}</h4>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    <Flag className="w-3 h-3 mr-1" />
                                    {task.priority}
                                  </Badge>
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-secondary/70 mb-2">{task.description}</p>
                                )}                                {task.assignedUsers.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <span className="text-xs text-secondary/60">Assigned to:</span>
                                    {task.assignedUsers.slice(0, 3).map((userId) => {
                                      const assignedUser = availableUsers.find(u => (u.userId || u.id) === userId);
                                      return assignedUser ? (
                                        <Badge key={userId} variant="outline" className="text-xs px-1 py-0">
                                          {assignedUser.username}
                                        </Badge>
                                      ) : null;
                                    })}
                                    {task.assignedUsers.length > 3 && (
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        +{task.assignedUsers.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-secondary/60">
                                  {task.dueDate && (
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {task.assignedUsers.length > 0 && (
                                    <span className="flex items-center">
                                      <User className="w-3 h-3 mr-1" />
                                      {task.assignedUsers.length} assigned
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editTask(task)}
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Edit</span>
                                  ✏️
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTask(task.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Final Submit Buttons */}
              <div className="flex justify-between space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentTab('project')}
                  className="border-accent/30"
                >
                  Back to Project
                </Button>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="border-accent/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary hover:bg-secondary text-white"
                  >
                    {loading ? 'Creating...' : `Create Project${tasks.length > 0 ? ` with ${tasks.length} Task(s)` : ''}`}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
