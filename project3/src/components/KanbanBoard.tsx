
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, Flag, MoreHorizontal, Clock } from 'lucide-react';
import TaskDetails from '@/components/TaskDetails';

interface KanbanBoardProps {
  tasks: any[];
  onTaskUpdate: (taskId: string, updates: any) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  projects: any[];
  canEdit: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onTaskUpdate, 
  onStatusChange, 
  projects, 
  canEdit 
}) => {
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);

  const columns = [
    { id: 'todo', title: 'To Do', count: tasks.filter(t => t.status === 'todo').length },
    { id: 'in-progress', title: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length },
    { id: 'review', title: 'In Review', count: tasks.filter(t => t.status === 'review').length },
    { id: 'completed', title: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'review': return 'bg-purple-500';
      case 'todo': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus && canEdit) {
      onStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && true;
  };

  const TaskCard = ({ task }: { task: any }) => {
    const project = projects.find(p => p.id === task.projectId);
    const overdue = isOverdue(task.dueDate);

    return (
      <Card 
        className={`mb-3 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
          overdue ? 'border-l-red-500 bg-red-50/50' : `border-l-${getStatusColor(task.status).replace('bg-', '')}`
        }`}
        draggable={canEdit}
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => setViewingTask(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">{task.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setViewingTask(task);
              }}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>

          {task.description && (
            <p className="text-xs text-secondary/70 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
              <Flag className="w-3 h-3 mr-1" />
              {task.priority || 'Medium'}
            </Badge>
            
            {overdue && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          {task.dueDate && (
            <div className={`flex items-center text-xs mb-3 ${
              overdue ? 'text-red-600' : 'text-secondary/60'
            }`}>
              <Calendar className="w-3 h-3 mr-1" />
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}

          {project && (
            <div className="flex items-center text-xs text-secondary/60 mb-2">
              <span className="font-medium">{project.name || project.title}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {task.assignees?.slice(0, 3).map((assignee: any, index: number) => (
                <Avatar key={index} className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {assignee.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignees?.length > 3 && (
                <div className="w-6 h-6 bg-accent/30 rounded-full flex items-center justify-center text-xs">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {task.comments && (
                <span className="text-xs text-secondary/60">{task.comments} comments</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => (
        <div
          key={column.id}
          className="bg-gray-50 rounded-lg p-4 min-h-[500px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(column.id)}`}></div>
              <h3 className="font-semibold text-primary">{column.title}</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {column.count}
            </Badge>
          </div>

          <div className="space-y-3">
            {getTasksByStatus(column.id).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {getTasksByStatus(column.id).length === 0 && (
            <div className="text-center py-8 text-secondary/60">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className={`w-8 h-8 rounded-full ${getStatusColor(column.id)}`}></div>
              </div>
              <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
            </div>
          )}
        </div>
      ))}

      {/* Task Details Modal */}
      {viewingTask && (
        <TaskDetails
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onUpdate={() => {
            setViewingTask(null);
            onTaskUpdate(viewingTask.id, {});
          }}
          canEdit={canEdit}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
