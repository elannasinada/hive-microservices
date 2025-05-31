import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { taskAPI, adminAPI, apiRequest } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TaskFormProps {
  onClose: () => void;
  onSuccess: () => void;
  projects: any[];
  taskToEdit?: any;
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSuccess, projects, taskToEdit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: taskToEdit?.title || '',
    description: taskToEdit?.description || '',
    projectId: taskToEdit?.projectId || '',
    priority: taskToEdit?.priority || 'medium',
    status: taskToEdit?.status || 'in_progress',
    dueDate: taskToEdit?.dueDate || ''
  });
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Check if user is a leader or admin
  const canAssignUsers = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

  useEffect(() => {
    if (canAssignUsers && formData.projectId) {
      fetchProjectUsers();
    }
  }, [formData.projectId, canAssignUsers]);

  const fetchProjectUsers = async () => {
    try {
      let filteredUsers = [];
      
      if (user?.roles.includes('ADMIN')) {
        // Admins can assign to all users
        const users = await adminAPI.getAllUsers();
        filteredUsers = users || [];
      } else if (user?.roles.includes('PROJECT_LEADER')) {
        // Project leaders can assign to:
        // 1. Project members if project is selected
        // 2. Users in their department if no specific project
        if (formData.projectId) {
          const members = await apiRequest(`/api/v1/project/list-members/${formData.projectId}`);
          filteredUsers = members || [];
        } else {
          // For PROJECT_LEADERs without a specific project, get users from their department
          if (user.department) {
            const deptUsers = await adminAPI.getUsersByDepartment(user.department);
            filteredUsers = (deptUsers || []).filter((u: any) => 
              u.userId !== user.id
            );
          } else {
            console.warn('PROJECT_LEADER user has no department assigned');
            filteredUsers = [];
          }
        }
      }
      
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setAvailableUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (taskToEdit) {
        await taskAPI.update(taskToEdit.id, formData);
        toast({
          title: "Success!",
          description: "Task updated successfully."
        });
      } else {
        const newTask = await taskAPI.create(formData.projectId, formData);
        
        // Assign task to selected users if any
        if (selectedUsers.length > 0 && canAssignUsers) {
          try {
            await taskAPI.assignToUsers({
              taskId: newTask.id || newTask.taskId,
              userIds: selectedUsers
            });
          } catch (assignError) {
            console.error('Failed to assign task:', assignError);
            // Still show success for task creation
          }
        }
        
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

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

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
                  <SelectItem key={project.id || project.projectId} value={project.id || project.projectId}>
                    {project.name || project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
              value={formData.dueDate}
              onChange={handleChange}
              className="border-accent/30 focus:border-primary"
            />
          </div>

          {/* User Assignment Section */}
          {canAssignUsers && !taskToEdit && availableUsers.length > 0 && (
            <div className="space-y-2">
              <Label>
                Assign to Team Members
                {user?.roles.includes('PROJECT_LEADER') && !formData.projectId && user?.department && 
                  ` in ${user.department}`
                }
              </Label>
              <div className="border border-accent/30 rounded-md p-3 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {availableUsers.map((assignableUser) => (
                    <div key={assignableUser.userId || assignableUser.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${assignableUser.userId || assignableUser.id}`}
                        checked={selectedUsers.includes(assignableUser.userId || assignableUser.id)}
                        onCheckedChange={(checked) => handleUserSelection(assignableUser.userId || assignableUser.id, !!checked)}
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
              </div>
              <p className="text-xs text-secondary/60">
                Select team members to assign this task to. You can assign tasks later if needed.
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
