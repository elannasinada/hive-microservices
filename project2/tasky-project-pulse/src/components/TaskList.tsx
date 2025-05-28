import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, User, Edit, Trash, Search, Users } from 'lucide-react';
import { taskAPI } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import TaskForm from './TaskForm';

interface TaskListProps {
  tasks: any[];
  onUpdate: () => void;
  user: any;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdate, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Only allow task management for ADMIN or PROJECT_LEADER
  const canManageTasks = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskAPI.delete(projectId, taskId);
      toast({
        title: "Success!",
        description: "Task deleted successfully."
      });
      onUpdate();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
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

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
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

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task: any) => (
          <Card key={task.id} className="border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-primary text-lg">{task.title}</CardTitle>
                <div className="flex space-x-1">
                  {canManageTasks && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.projectId, task.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status?.replace('-', ' ')}
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
                
                {task.assignee && (
                  <div className="flex items-center text-secondary/60">
                    <User className="w-4 h-4 mr-2" />
                    {task.assignee}
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-accent/20 space-y-2">
                {canManageTasks && (
                  <>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleUpdateProgress(task.id, task.projectId, 'in-progress')}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Start
                      </Button>
                      <Button
                        onClick={() => handleUpdateProgress(task.id, task.projectId, 'completed')}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-green-200 text-green-600 hover:bg-green-50"
                      >
                        Complete
                      </Button>
                    </div>
                    <Button
                      onClick={() => handleAssignTask({ taskId: task.id, userId: 'current-user' })}
                      variant="outline"
                      size="sm"
                      className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign to Me
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">
            {searchTerm ? 'No tasks found' : 'No tasks yet'}
          </h3>
          <p className="text-secondary/70">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first task to get started'}
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
          projects={[]}
          taskToEdit={editingTask}
        />
      )}
    </div>
  );
};

export default TaskList;
