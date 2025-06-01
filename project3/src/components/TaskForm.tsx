import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { taskAPI, adminAPI, authAPI, projectAPI, projectLeaderAPI, apiRequest } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TaskFormProps {
  onClose: () => void;
  onSuccess: () => void;
  projects: any[];
  taskToEdit?: any;
  availableUsers?: any[];
  selectedUser?: string;
  setSelectedUser?: (userId: string) => void;
  handleEditTaskSubmit?: (formData: any) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSuccess, projects, taskToEdit, availableUsers: controlledUsers, selectedUser: controlledSelectedUser, setSelectedUser: controlledSetSelectedUser, handleEditTaskSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: taskToEdit?.taskName || '',
    description: taskToEdit?.description || '',
    projectId: (projects && projects.length === 1)
      ? (projects[0].projectId ?? projects[0].id ?? '')
      : (taskToEdit?.projectId ?? ''),
    priority: taskToEdit?.priority || 'medium',
    status: taskToEdit?.status || 'in_progress',
    taskdueDate: taskToEdit?.dueDate || ''
  });
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [originalAssignedUser, setOriginalAssignedUser] = useState<string>('');

  // Check if user is a leader or admin
  const canAssignUsers = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));
  
  useEffect(() => {
    if (canAssignUsers) {
      fetchProjectUsers();
    }
  }, [canAssignUsers]);

  useEffect(() => {
    if (taskToEdit && canAssignUsers) {
      // Fetch the current assigned user for the task
      (async () => {
        const taskDetails = await taskAPI.get(taskToEdit.id || taskToEdit.taskId);
        // Assume assignedUsers is a map or array; get the first userId
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
  }, [taskToEdit, canAssignUsers]);

  const fetchProjectUsers = async () => {
    try {
      let filteredUsers = [];
      
      if (user?.roles.includes('ADMIN') || user?.roles.includes('PROJECT_LEADER')) {
        // Both admins and project leaders can see all users
        try {
          console.log('Fetching all users using admin endpoint...');
          const users = await adminAPI.getAllUsers();
          filteredUsers = users || [];
          console.log('Successfully fetched users:', filteredUsers.length);
        } catch (adminError) {
          console.warn('Admin API failed, falling back to auth API:', adminError);
          try {
            const users = await authAPI.getAllUsers();
            filteredUsers = users || [];
            console.log('Successfully fetched users using auth API:', filteredUsers.length);
          } catch (authError) {
            console.error('Both admin and auth APIs failed:', authError);
            filteredUsers = [];
          }        }
      }      
      // Format and filter users - exclude ADMINs and PROJECT_LEADERs (only show TEAM_MEMBERs)
      console.log('Raw users before filtering:', filteredUsers.length);
      const formattedUsers = filteredUsers
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
          
          // Debug logging
          console.log(`User ${user.username}: roles=${JSON.stringify(userRoles)}, isAdmin=${isAdmin}, isProjectLeader=${isProjectLeader}`);
          
          // Only include if not admin or project leader
          return !isAdmin && !isProjectLeader;
        });
      
      console.log('Filtered users (TEAM_MEMBERs only):', formattedUsers.length);
      setAvailableUsers(formattedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setAvailableUsers([]);
    }
  };

  // Auto-select the only project if there is just one
  useEffect(() => {
    if (projects && projects.length === 1 && !formData.projectId) {
      setFormData(f => ({ ...f, projectId: projects[0].projectId ?? projects[0].id ?? '' }));
    }
  }, [projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.projectId || formData.projectId === 'undefined' || isNaN(Number(formData.projectId))) {
        toast({
          title: 'Error',
          description: 'No valid project selected. Please select a project or try again from the project card.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      if (handleEditTaskSubmit) {
        // Use controlled submit logic from TaskList
        await handleEditTaskSubmit({
          taskName: formData.title,
          description: formData.description,
          taskPriority: formData.priority.toUpperCase(),
          taskStatus: formData.status === 'to_do' ? 'TO_DO' : 
                     formData.status === 'in_progress' ? 'IN_PROGRESS' : 
                     formData.status === 'completed' ? 'COMPLETED' : 
                     formData.status.toUpperCase(),
          dueDate: formData.taskdueDate ? new Date(formData.taskdueDate).toISOString() : null
        });
        onSuccess();
        return;
      }
      if (taskToEdit) {        // For updates, transform the field names to match backend expectations
        const updatePayload = {
          taskName: formData.title,
          description: formData.description,
          taskPriority: formData.priority.toUpperCase(), // LOW, MEDIUM, HIGH
          taskStatus: formData.status === 'to_do' ? 'TO_DO' : 
                     formData.status === 'in_progress' ? 'IN_PROGRESS' : 
                     formData.status === 'completed' ? 'COMPLETED' : 
                     formData.status.toUpperCase(),
          dueDate: formData.taskdueDate ? new Date(formData.taskdueDate).toISOString() : null
        };
        await taskAPI.update(taskToEdit.id, updatePayload);
        // Assignment logic for editing
        if (canAssignUsers && selectedUser !== undefined && selectedUser !== originalAssignedUser) {
          // Unassign previous user if any
          if (originalAssignedUser) {
            await taskAPI.unassign({
              taskId: String(taskToEdit.id || taskToEdit.taskId),
              projectId: String(formData.projectId),
              userIdList: [String(originalAssignedUser)]
            });
          }
          // Assign new user
          if (selectedUser) {
            await taskAPI.assignToUsers({
              taskId: String(taskToEdit.id || taskToEdit.taskId),
              projectId: String(formData.projectId),
              userIdList: [String(selectedUser)]
            });
          }
        }
        toast({
          title: "Success!",
          description: "Task updated successfully."
        });
      } else {        // For creation, transform the field names to match backend expectations
        const createPayload = {
          taskName: formData.title,
          description: formData.description,
          taskPriority: formData.priority.toUpperCase(), // LOW, MEDIUM, HIGH
          taskStatus: formData.status === 'to_do' ? 'TO_DO' : 
                     formData.status === 'in_progress' ? 'IN_PROGRESS' : 
                     formData.status === 'completed' ? 'COMPLETED' : 
                     formData.status.toUpperCase(),
          dueDate: formData.taskdueDate ? new Date(formData.taskdueDate).toISOString() : null
        };
        console.log('Creating task for projectId:', formData.projectId, createPayload);
        const newTask = await taskAPI.create(String(formData.projectId), createPayload);
        console.log('Created task response:', newTask);
        // Only assign to the selected user if one is chosen (and not the project leader by default)
        if (selectedUser && canAssignUsers) {
          try {
            await taskAPI.assignToUsers({
              taskId: String(newTask.id || newTask.taskId),
              projectId: String(formData.projectId),
              userIdList: [String(selectedUser)]
            });
          } catch (assignError) {
            console.error('Failed to assign task:', assignError);
            // Still show success for task creation
          }
        }
        // No assignment if no user is selected; do not assign to project leader
        toast({
          title: "Success!",
          description: "Task created successfully."
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast({
        title: "Error",
        description: "Failed to save task",
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
  const handleUserSelection = (userId: string) => {
    setSelectedUser(userId);
  };

  // In the due date input, restrict min/max to project start/end date if available
  const project = projects && projects.length === 1 ? projects[0] : null;
  const minDueDate = project && project.startDate ? project.startDate : undefined;
  const maxDueDate = project && project.endDate ? project.endDate : undefined;

  // Use controlled assignment if provided
  const assignmentUsers = controlledUsers || availableUsers;
  const assignmentSelectedUser = controlledSelectedUser !== undefined ? controlledSelectedUser : selectedUser;
  const assignmentSetSelectedUser = controlledSetSelectedUser || setSelectedUser;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
              className="border-accent/30 focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the task"
              rows={3}
              className="border-accent/30 focus:border-primary"
            />
          </div>
          {projects.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => setFormData({...formData, projectId: value})}
              >
                <SelectTrigger className="border-accent/30 focus:border-primary">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.projectId || project.id} value={project.projectId || project.id}>
                      {project.projectName || project.name || project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="border-accent/30 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_do">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.taskdueDate}
              onChange={handleChange}
              className="border-accent/30 focus:border-primary"
              min={minDueDate}
              max={maxDueDate}
            />
          </div>          {/* User Assignment Section */}
          {canAssignUsers && !taskToEdit && assignmentUsers && assignmentUsers.length > 0 && (
            <div className="space-y-2">
              <Label>
                Assign to Team Member
                {user?.roles.includes('PROJECT_LEADER') && !formData.projectId && user?.department && 
                  ` in ${user.department}`
                }
              </Label>
              <div className="border border-accent/30 rounded-md p-3 max-h-40 overflow-y-auto">
                <RadioGroup 
                  value={assignmentSelectedUser} 
                  onValueChange={(value) => assignmentSetSelectedUser(value)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="" id="no-assignment" />
                      <Label htmlFor="no-assignment" className="text-sm font-normal cursor-pointer">
                        No assignment (assign later)
                      </Label>
                    </div>
                    {assignmentUsers.map((assignableUser) => (
                      <div key={assignableUser.userId || assignableUser.id} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={String(assignableUser.userId || assignableUser.id)} 
                          id={`user-${assignableUser.userId || assignableUser.id}`}
                        />
                        <Label 
                          htmlFor={`user-${assignableUser.userId || assignableUser.id}`}
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
              </p>            </div>
          )}
          
          {/* Show message when assignment is not available */}
          {!canAssignUsers && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Task assignment is only available for Admins and Project Leaders.
              </p>
            </div>
          )}
          
          {canAssignUsers && assignmentUsers.length === 0 && (
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
              disabled={loading}
              className="bg-primary hover:bg-secondary text-white"
            >
              {loading ? 'Saving...' : (taskToEdit ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
