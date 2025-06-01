import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {projectAPI, taskAPI, authAPI, adminAPI, projectLeaderAPI, apiRequest} from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, Calendar, User, Flag, Edit, Trash } from 'lucide-react';

interface ProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
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
      }      // Format and filter users - exclude ADMINs and PROJECT_LEADERs (only show TEAM_MEMBERs)
      const formattedUsers = users
        .map((user: any) => ({
          userId: user.userId || user.user_id || user.id,
          username: user.actualUsername || user.username || 'Unknown User',
          email: user.email || 'No Email',
          department: user.department || (user.departments && user.departments.length > 0 ? user.departments[0].department : null),
          roles: user.roles || []
        }))
        .filter((user: any) => {
          // Only include users who are TEAM_MEMBERs (exclude ADMINs and PROJECT_LEADERs)
          const userRoles = Array.isArray(user.roles) 
            ? user.roles.map((r: any) => typeof r === 'string' ? r : r.role)
            : [];
          
          const isAdmin = userRoles.some((role: string) => role === 'ROLE_ADMIN' || role === 'ADMIN');
          const isProjectLeader = userRoles.some((role: string) => role === 'ROLE_PROJECT_LEADER' || role === 'PROJECT_LEADER');
          
          // Only include if not admin or project leader
          return !isAdmin && !isProjectLeader;
        });

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
      console.log('Creating project with payload:', payload);
      let createdProject;
      try {
        createdProject = await projectAPI.create(payload);
      } catch (error: any) {
        const errorMessage = error?.data?.errorMessage || error?.message || '';
        if (errorMessage.includes('User already has an active project assignment.')) {
          toast({
            title: 'Error',
            description: 'You already have an active project assignment. Please complete or leave your current project before creating a new one.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        } else {
          toast({
            title: 'Error',
            description: errorMessage || 'Failed to create project',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }
      console.log('Created project response:', createdProject);
      const projectId = createdProject?.id || createdProject?.projectId;

      // Validate projectId obtained from created project
      if (!projectId) {
        console.error('Failed to obtain projectId from created project response:', createdProject);
        toast({
          title: "Error",
          description: "Project created, but failed to get project ID for tasks. Please add tasks manually.",
          variant: "destructive"
        });
        setLoading(false);
        onSuccess(); // Indicate project creation was successful
        return;
      }

      const projectIdStr = String(projectId);

      // Create tasks if any
      if (tasks.length > 0) {
        for (const task of tasks) {
          try {
            // Defensive: ensure required fields
            if (!task.title || !task.priority || !task.status) {
              console.error('Task missing required fields:', task);
              continue;
            }
            const taskPayload = {
              taskName: task.title,
              description: task.description || '',
              taskPriority: (task.priority as string || 'MEDIUM').toUpperCase(), // LOW, MEDIUM, HIGH
              taskStatus: task.status === 'to_do' ? 'TO_DO' :
                          task.status === 'in_progress' ? 'IN_PROGRESS' :
                          task.status === 'completed' ? 'COMPLETED' :
                          ((task.status as string) || 'TO_DO').toUpperCase(),
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null
            };
            console.log('Creating task with payload for projectId:', projectIdStr, taskPayload);
            const createdTask = await taskAPI.create(projectIdStr, taskPayload);
            console.log('Created task response:', createdTask);
            // Assignment logic
            if (task.assignedUsers.length > 0 && task.assignedUsers[0] && canAssignUsers) {
              try {
                // Ensure user is a member of the project before assigning the task
                await projectAPI.addMember(projectId, task.assignedUsers[0]);
                await taskAPI.assignToUsers({
                  taskId: Number(createdTask.id || createdTask.taskId),
                  projectId: Number(projectId),
                  userIdList: task.assignedUsers.map(id => Number(id))
                });
              } catch (assignError) {
                console.error(`Failed to add member or assign task ${task.title}:`, assignError);
                toast({
                  title: 'Error',
                  description: `Failed to add user to project or assign task: ${assignError.message || assignError}`,
                  variant: 'destructive'
                });
              }
            }
          } catch (taskError) {
            if (taskError && taskError.response && taskError.response.data) {
              console.error(`Failed to create task ${task.title}:`, taskError.response.data);
            } else {
              console.error(`Failed to create task ${task.title}:`, taskError);
            }
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
  const handleUserAssignment = (userId: string) => {
    setCurrentTask(prev => ({
      ...prev,
      assignedUsers: [String(userId)] // Always store as string
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

  const minDueDate = formData.startDate || undefined;
  const maxDueDate = formData.endDate || undefined;

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
                        min={minDueDate}
                        max={maxDueDate}
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
                        Assign to Team Member
                        {user?.roles.includes('PROJECT_LEADER') && user?.department && 
                          ` in ${user.department}`
                        }
                      </Label>
                      <div className="border border-accent/30 rounded-md p-3 max-h-40 overflow-y-auto">
                        <RadioGroup 
                          value={currentTask.assignedUsers[0] || ""} 
                          onValueChange={(value) => handleUserAssignment(value)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="" id="no-assignment" />
                              <Label htmlFor="no-assignment" className="text-sm font-normal cursor-pointer">
                                No assignment (assign later)
                              </Label>
                            </div>
                          {availableUsers.map((assignableUser) => (
                            <div key={assignableUser.userId || assignableUser.id} className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value={String(assignableUser.userId || assignableUser.id)} 
                                  id={`task-user-${assignableUser.userId || assignableUser.id}`}
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
                        </RadioGroup>
                      </div>
                      <p className="text-xs text-secondary/60">
                        Select one team member to assign this task to. You can change assignment later if needed.
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
                              <div>
                                <h3 className="font-semibold text-primary mb-1">{task.title}</h3>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge className={`text-xs px-2 py-0 ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </Badge>
                                  <Badge className={`text-xs px-2 py-0 ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-secondary/70 text-sm mb-2">{task.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-secondary/60">
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                  </span>
                                  <span className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    Assigned to: {task.assignedUsers.length > 0 ? (() => {
                                      const assignedUser = availableUsers.find(u => String(u.userId || u.id) === String(task.assignedUsers[0]));
                                      return assignedUser ? (assignedUser.username || assignedUser.email) : 'Unassigned';
                                    })() : 'Unassigned'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button size="icon" variant="ghost" onClick={() => editTask(task)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => removeTask(task.id)}>
                                  <Trash className="w-4 h-4" />
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
