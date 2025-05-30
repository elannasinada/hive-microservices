import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Calendar, 
  User, 
  Flag, 
  Eye, 
  Edit, 
  ArrowUpDown,
  Clock
} from 'lucide-react';
import TaskDetails from '@/components/TaskDetails';
import TaskForm from '@/components/TaskForm';

interface TaskListViewProps {
  tasks: any[];
  onTaskUpdate: (taskId: string, updates: any) => void;
  projects: any[];
  canEdit: boolean;
}

const TaskListView: React.FC<TaskListViewProps> = ({ 
  tasks, 
  onTaskUpdate, 
  projects, 
  canEdit 
}) => {
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    // Handle TO_DO tasks
    if (statusLower === 'to-do' || statusLower === 'to_do' || statusLower === 'todo') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    
    // Handle overdue tasks
    if (statusLower === 'overdue') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    // Handle completed tasks
    if (statusLower === 'completed' || statusLower === 'complete' || statusLower === 'completed_task') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    // Handle in-progress tasks
    if (statusLower === 'in-progress' || statusLower === 'in_progress' || statusLower === 'inprogress') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    
    // Default case
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
    if (sortField === 'dueDate') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue?.toLowerCase() || '';
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || project?.title || 'Unknown Project';
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className="w-3 h-3" />
      </div>
    </TableHead>
  );

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="text-primary flex items-center">
          <Flag className="w-5 h-5 mr-2" />
          Task List ({tasks.length} tasks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="title">Task</SortableHeader>
                <SortableHeader field="priority">Priority</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <SortableHeader field="projectId">Project</SortableHeader>
                <SortableHeader field="dueDate">Due Date</SortableHeader>
                <TableHead>Assignees</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => {
                const overdue = isOverdue(task.dueDate);
                
                return (
                  <TableRow 
                    key={task.taskId}
                    className={`hover:bg-accent/50 cursor-pointer ${
                      overdue ? 'bg-red-50/50' : ''
                    }`}
                    onClick={() => setViewingTask(task)}
                  >
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <p className="font-semibold text-primary">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-secondary/70 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {task.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                      <TableCell>                      <Badge className={`${overdue ? 'bg-red-100 text-red-800 border-red-200' : getStatusColor(task.status)} text-xs`}>
                        {overdue ? 'Overdue' : (task.status?.replace('-', ' ') || 'In Progress')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm font-medium">
                        {getProjectName(task.projectId)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      {task.dueDate ? (
                        <div className={`flex items-center text-sm ${
                          overdue ? 'text-red-600' : 'text-secondary/70'
                        }`}>
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString()}
                          {overdue && (
                            <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-secondary/60">No due date</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {task.assignees?.slice(0, 3).map((assignee: any, index: number) => (
                          <Avatar key={index} className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {assignee.username?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )) || (
                          <span className="text-xs text-secondary/60">Unassigned</span>
                        )}
                        {task.assignees?.length > 3 && (
                          <div className="w-6 h-6 bg-accent/30 rounded-full flex items-center justify-center text-xs">
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTask(task)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTask(task)}
                            className="h-8 w-8 p-0"
                            title="Edit Task"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-12 h-12 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">No tasks found</h3>
              <p className="text-secondary/70">Try adjusting your filters or create a new task</p>
            </div>
          )}
        </div>
      </CardContent>

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

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskForm
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            onTaskUpdate(editingTask.id, {});
          }}
          projects={projects}
          taskToEdit={editingTask}
        />
      )}
    </Card>
  );
};

export default TaskListView;
