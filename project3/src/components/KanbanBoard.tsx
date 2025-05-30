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

// Helper function to check if a task is overdue
const isTaskOverdue = (task: any) => {
  if (!task.dueDate) return false;
  const dueDate = new Date(task.dueDate);
  const currentDate = new Date();

  // Reset time to compare only dates, not time
  dueDate.setHours(23, 59, 59, 999);
  currentDate.setHours(0, 0, 0, 0);

  // If task is completed, it's not overdue regardless of due date
  if (task.taskStatus === 'COMPLETED') return false;

  // If task is cancelled, it's not overdue
  if (task.taskStatus === 'CANCELLED') return false;

  // Task is overdue if due date has passed and it's not completed
  return dueDate < currentDate;
};

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
    { id: 'overdue', title: 'Overdue', count: tasks.filter(t => t.taskStatus === 'OVERDUE' || isTaskOverdue(t)).length },
    { id: 'to-do', title: 'To Do', count: tasks.filter(t => t.taskStatus === 'TO_DO' && !isTaskOverdue(t)).length },
    { id: 'in-progress', title: 'In Progress', count: tasks.filter(t => t.taskStatus === 'IN_PROGRESS' && !isTaskOverdue(t)).length },
    { id: 'completed', title: 'Completed', count: tasks.filter(t => t.taskStatus === 'COMPLETED').length }
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
      case 'overdue': return 'bg-red-500';
      case 'to-do': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    // Prevent dragging overdue tasks
    if (task.taskStatus === 'OVERDUE' || isTaskOverdue(task)) {
      e.preventDefault();
      return;
    }

    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';

    // Add visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop by preventing default
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); // Prevent default behavior
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.add('ring-2', 'ring-primary/50', 'ring-offset-2'); // Add visual feedback
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); // Prevent default behavior
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove('ring-2', 'ring-primary/50', 'ring-offset-2'); // Remove visual feedback
  };

  const handleDrop = (e: React.DragEvent, newColumnId: string) => {
    e.preventDefault(); // Prevent default behavior

    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove('ring-2', 'ring-primary/50', 'ring-offset-2'); // Remove visual feedback

    if (!draggedTask || !canEdit) {
      setDraggedTask(null);
      return;
    }

    if (draggedTask.taskStatus === 'OVERDUE' || isTaskOverdue(draggedTask)) {
      setDraggedTask(null); // Prevent dropping overdue tasks
      return;
    }

    const newTaskStatus = getTaskStatusFromColumn(newColumnId);
    const currentTaskStatus = draggedTask.taskStatus;

    if (currentTaskStatus !== newTaskStatus) {
      onStatusChange(draggedTask.taskId || draggedTask.id, newTaskStatus); // Update task status
    }

    setDraggedTask(null);
  };
  // Helper function to convert column ID to TaskStatus enum value
  const getTaskStatusFromColumn = (columnId: string) => {
    switch (columnId) {
      case 'overdue': return 'OVERDUE';
      case 'to-do': return 'TO_DO';
      case 'in-progress': return 'IN_PROGRESS';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return 'TO_DO';
    }
  };

  const getTasksByStatus = (status: string) => {
    if (status === 'overdue') {
      return tasks.filter(task => task.taskStatus === 'OVERDUE' || isTaskOverdue(task));
    } else if (status === 'to-do') {
      return tasks.filter(task => task.taskStatus === 'TO_DO' && !isTaskOverdue(task));
    } else if (status === 'in-progress') {
      return tasks.filter(task =>
          task.taskStatus === 'IN_PROGRESS' &&
          !isTaskOverdue(task)
      );
    } else if (status === 'completed') {
      return tasks.filter(task => task.taskStatus === 'COMPLETED');
    } else {
      return tasks.filter(task => task.taskStatus === status);
    }
  };

  const TaskCard = ({ task }: { task: any }) => {
    const project = projects.find(p => p.projectId === task.projectId);
    const overdue = task.taskStatus === 'OVERDUE' || isTaskOverdue(task);
    const [isDragging, setIsDragging] = useState(false);

    // Get the appropriate border color based on task status
    const getBorderColor = () => {
      if (overdue) return 'border-l-red-500 bg-red-50/50';

      switch (task.taskStatus) {
        case 'TO_DO': return 'border-l-purple-500 bg-purple-50/30';
        case 'IN_PROGRESS': return 'border-l-blue-500 bg-blue-50/30';
        case 'COMPLETED': return 'border-l-green-500 bg-green-50/30';
        case 'CANCELLED': return 'border-l-gray-500 bg-gray-50/30';
        default: return 'border-l-gray-400 bg-gray-50/30';
      }
    };

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't open task details if we're in the middle of dragging
      if (!isDragging) {
        setViewingTask(task);
      }
    };

    const handleTaskDragStart = (e: React.DragEvent) => {
      // Prevent dragging overdue tasks
      if (overdue) {
        e.preventDefault();
        return;
      }

      setIsDragging(true);
      handleDragStart(e, task);
    };

    const handleTaskDragEnd = (e: React.DragEvent) => {
      setIsDragging(false);
      handleDragEnd(e);
    };

    return (
        <Card
            className={`mb-3 group transition-all duration-200 border-l-4 ${getBorderColor()} ${
                overdue
                    ? 'cursor-not-allowed opacity-75'
                    : isDragging
                        ? 'cursor-grabbing shadow-lg scale-105'
                        : 'cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:cursor-grab'
            }`}
            draggable={canEdit && !overdue}
            onDragStart={handleTaskDragStart}
            onDragEnd={handleTaskDragEnd}
            onClick={handleCardClick}
            title={overdue ? 'Overdue tasks cannot be moved' : 'Click to view details, drag to move'}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-sm line-clamp-2 flex-1">{task.taskName || task.title}</h3>
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
              <Badge className={`text-xs ${getPriorityColor(task.taskPriority || task.priority)}`}>
                <Flag className="w-3 h-3 mr-1" />
                {task.taskPriority || task.priority || 'Medium'}
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
                  <span className="font-medium">{project.projectName || project.name || project.title}</span>
                </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {task.assignedUsers && Object.keys(task.assignedUsers).slice(0, 3).map((userId: string, index: number) => (
                    <Avatar key={`${task.taskId}-${userId}-${index}`} className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {task.assignedUsers[userId]?.username?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                ))}
                {task.assignedUsers && Object.keys(task.assignedUsers).length > 3 && (
                    <div className="w-6 h-6 bg-accent/30 rounded-full flex items-center justify-center text-xs">
                      +{Object.keys(task.assignedUsers).length - 3}
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
                className={`rounded-lg p-4 min-h-[500px] border border-gray-200 transition-all duration-200 ${
                    column.id === 'overdue' ? 'bg-red-50/50' :
                        column.id === 'to-do' ? 'bg-purple-50/50' :
                            column.id === 'in-progress' ? 'bg-blue-50/50' :
                                column.id === 'completed' ? 'bg-green-50/50' : 'bg-gray-50'
                } ${column.id === 'overdue' ? 'opacity-75' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(column.id)}`}></div>
                  <h3 className="font-semibold text-primary">{column.title}</h3>
                </div>
                <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${
                        column.id === 'overdue' ? 'border-red-300 text-red-700' :
                            column.id === 'to-do' ? 'border-purple-300 text-purple-700' :
                                column.id === 'in-progress' ? 'border-blue-300 text-blue-700' :
                                    column.id === 'completed' ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-700'
                    }`}
                >
                  {column.count}
                </Badge>
              </div>

              <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                    <TaskCard key={task.taskId || task.id} task={task} />
                ))}
              </div>

              {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-secondary/60">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(column.id)}`}></div>
                    </div>
                    <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                    {column.id === 'overdue' && (
                        <p className="text-xs text-secondary/40 mt-1">Tasks become overdue automatically</p>
                    )}
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
                  onTaskUpdate(viewingTask.taskId || viewingTask.id, {});
                }}
                canEdit={canEdit}
            />
        )}
      </div>
  );
};

export default KanbanBoard;