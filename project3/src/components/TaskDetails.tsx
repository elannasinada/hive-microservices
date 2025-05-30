
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, MessageSquare, Clock, Flag } from 'lucide-react';
import { taskAPI, commentAPI } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

interface TaskDetailsProps {
  task: any;
  onClose: () => void;
  onUpdate: () => void;
  canEdit: boolean;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose, onUpdate, canEdit }) => {
  const [editingTask, setEditingTask] = useState(false);
  const [taskData, setTaskData] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'in_progress',
    priority: task.priority || 'medium',
    dueDate: task.dueDate || ''
  });
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load comments (mock data for now)
    setComments([
      {
        id: 1,
        author: 'John Doe',
        content: 'Started working on this task',
        timestamp: new Date().toISOString(),
        avatar: '/placeholder-avatar.png'
      }
    ]);
  }, [task.id]);

  const handleUpdateTask = async () => {
    if (!canEdit) return;
    
    setLoading(true);
    try {
      await taskAPI.update(task.id, taskData);
      toast({
        title: "Success!",
        description: "Task updated successfully."
      });
      setEditingTask(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!canEdit) return;
    
    try {
      await taskAPI.updateProgress(task.id, task.projectId, { status: newStatus });
      toast({
        title: "Success!",
        description: "Task status updated."
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await commentAPI.onTask({
        taskId: task.id,
        content: newComment,
        projectId: task.projectId
      });
      
      setComments(prev => [...prev, {
        id: Date.now(),
        author: 'Current User',
        content: newComment,
        timestamp: new Date().toISOString(),
        avatar: '/placeholder-avatar.png'
      }]);
      
      setNewComment('');
      toast({
        title: "Success!",
        description: "Comment added successfully."
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

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
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'complete') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower === 'in-progress' || statusLower === 'in_progress' || statusLower === 'inprogress') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (statusLower === 'overdue') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center justify-between">
            <span>{editingTask ? 'Edit Task' : 'Task Details'}</span>
            <div className="flex space-x-2">
              <Badge className={getPriorityColor(task.priority)}>
                <Flag className="w-3 h-3 mr-1" />
                {task.priority}
              </Badge>
              <Badge className={getStatusColor(task.status)}>
                {task.status?.replace('-', ' ')}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Task Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingTask ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={taskData.title}
                        onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                        className="border-accent/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={taskData.description}
                        onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                        rows={3}
                        className="border-accent/30 focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select value={taskData.status} onValueChange={(value) => setTaskData({...taskData, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>                          <SelectContent>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Priority</label>
                        <Select value={taskData.priority} onValueChange={(value) => setTaskData({...taskData, priority: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={taskData.dueDate}
                        onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
                        className="border-accent/30 focus:border-primary"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-medium text-primary">{task.title}</h3>
                      <p className="text-secondary/70 text-sm mt-1">{task.description || 'No description available'}</p>
                    </div>
                    <div className="flex items-center text-sm text-secondary/60">
                      <Calendar className="w-4 h-4 mr-2" />
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                    <div className="flex items-center text-sm text-secondary/60">
                      <Clock className="w-4 h-4 mr-2" />
                      Created: {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </>
                )}

                {canEdit && (
                  <div className="flex space-x-2 pt-4">
                    {editingTask ? (
                      <>
                        <Button
                          onClick={handleUpdateTask}
                          disabled={loading}
                          className="bg-primary hover:bg-secondary text-white"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingTask(false)}
                          className="border-accent/30"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setEditingTask(true)}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white"
                      >
                        Edit Task
                      </Button>
                    )}
                  </div>
                )}

                {/* Quick Status Actions */}
                {canEdit && !editingTask && (
                  <div className="pt-4 border-t border-accent/20">
                    <p className="text-sm font-medium mb-2">Quick Actions:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange('in-progress')}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Start Work
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange('completed')}
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium">{comment.author}</p>
                          <p className="text-xs text-secondary/60">
                            {new Date(comment.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-secondary/80">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="border-accent/30 focus:border-primary"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="sm"
                      className="bg-primary hover:bg-secondary text-white"
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-accent/20">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-accent/30"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetails;
