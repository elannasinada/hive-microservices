import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { taskAPI, projectAPI } from '@/utils/api';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Plus, LayoutGrid, List, Users } from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import TaskListView from '@/components/TaskListView';
import TaskForm from '@/components/TaskForm';
import { toast } from '@/hooks/use-toast';
import TaskList from '@/components/TaskList';

enum TaskStatus {
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

const TaskManagement = () => {
  console.log('TaskManagement mounted');
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('kanban');

  const canCreateTasks = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

  const canEditTasks = user && user.roles.length > 0; // Any logged-in user can edit existing tasks

  useEffect(() => {
    console.log('TaskManagement useEffect running, user:', user);
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  // Helper to determine project status
  function getProjectStatus(project) {
    if (!project || !project.startDate || !project.endDate) return 'unknown';
    const today = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    if (today < start) return 'future';
    if (today > end) return 'past';
    return 'active';
  }

  const loadData = async () => {
    try {
      const projects = await projectAPI.search();
      const leaderProjects = projects.filter((p) =>
        user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER')
          ? true
          : p.leaderId === user?.id
      );
      setProjects(leaderProjects);
      // Add memberCount to each project
      const updatedProjects = leaderProjects.map((project) => {
        const projectMembers = new Set();
        if (project.members && project.members.projectMembers) {
          project.members.projectMembers.forEach((member) => {
            projectMembers.add(member.userId);
          });
        }
        return {
          ...project,
          memberCount: projectMembers.size,
          _status: getProjectStatus(project),
        };
      });
      setProjects(updatedProjects);
      // Load tasks
      let tasksData = [];
      if (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER')) {
        tasksData = await taskAPI.search({}); // All tasks for all projects
      } else if (projects.length > 0) {
        // For regular team members, get tasks for their active project
        tasksData = await taskAPI.search({ projectId: projects[0].projectId });
      }
      // Normalize projectId for all tasks before filtering
      const normalizedTasks = tasksData.map(task => ({
        ...task,
        projectId: String(task.projectId || (task.project && (task.project.projectId || task.project.id)) || ''),
      }));
      console.log('TaskManagement loaded tasks:', normalizedTasks);
      // For team members, filter to only assigned tasks
      if (!(user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'))) {
        const filtered = normalizedTasks.filter((task) => {
          if (!task.assignedUsers) return false;
          return Object.keys(task.assignedUsers).includes(user.id.toString());
        });
        setTasks(filtered);
        console.log('TaskManagement setTasks (team member):', filtered);
      } else {
        setTasks(normalizedTasks);
        console.log('TaskManagement setTasks (admin/leader):', normalizedTasks);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks and projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a task is overdue - identical to TeamDashboard
  const isTaskOverdue = (task: any) => {
    if (!task.dueDate) return false;
    const isDueDate = new Date(task.dueDate) < new Date();
    // Use exact enum values from TaskStatus (COMPLETED)
    const isNotCompleted = task.taskStatus !== 'COMPLETED';
    return isDueDate && isNotCompleted;
  };

  const getDisplayStatus = (task: any) => {
    // Use the same status display logic as in TeamDashboard
    if (task.taskStatus === 'IN_PROGRESS') return 'In Progress'; 
    if (task.taskStatus === 'COMPLETED') return 'Completed';
    if (task.taskStatus === 'OVERDUE' || isTaskOverdue(task)) return 'Overdue';
    if (task.taskStatus === 'CANCELLED') return 'Cancelled';
    return 'Unknown Status';
  };

  // Helper function to consistently filter tasks by category - same approach as TeamDashboard
  const filterTasksByCategory = (tasks: any[], category: string, todayStr?: string) => {
    console.log(`Filtering ${tasks.length} tasks for category: ${category}`);
    
    let filtered = [];
    switch(category) {
      case 'to-do':
        filtered = tasks.filter(t => t.taskStatus === 'TO_DO');
        console.log('To Do tasks:', filtered.length);
        break;
      case 'due-today':
        const today = todayStr || new Date().toISOString().slice(0, 10);
        filtered = tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === today);
        console.log(`Tasks due today (${today}):`, filtered.length);
        break;
      case 'upcoming':
      case 'in-progress':
        filtered = tasks.filter(t => t.taskStatus === 'IN_PROGRESS' && !isTaskOverdue(t));
        console.log('Upcoming tasks:', filtered.length);
        break;
      case 'overdue':
        filtered = tasks.filter(t => 
          (t.taskStatus === 'OVERDUE' || isTaskOverdue(t)) && t.taskStatus !== 'CANCELLED'
        );
        console.log('Overdue tasks:', filtered.length);
        break;
      case 'completed':
        filtered = tasks.filter(t => t.taskStatus === 'COMPLETED');
        console.log('Completed tasks:', filtered.length);
        break;
      case 'cancelled':
        filtered = tasks.filter(t => t.taskStatus === 'CANCELLED');
        console.log('Cancelled tasks:', filtered.length);
        break;
      default:
        filtered = tasks;
        console.log('All tasks (no category filter):', filtered.length);
    }
    return filtered;
  };

  const applyFilters = () => {
    // TEMP: Bypass all filters for debugging
    setFilteredTasks(tasks);
    // Original filter logic is commented out below:
    // console.log('Applying filters to tasks:', tasks.length);
    // ...
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      await taskAPI.update(taskId, updates);
      await loadData();
      toast({
        title: "Success!",
        description: "Task updated successfully."
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    // Following TeamDashboard's approach for task status updates
    try {
      const task = tasks.find(t => t.taskId === taskId);
      if (!task) return;

      // Check for completed tasks with past deadlines - same logic as TeamDashboard
      if (task.taskStatus === 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date()) {
        toast({
          title: "Task Already Completed",
          description: "This task was completed before its deadline passed and cannot be changed.",
          variant: "default",
        });
        return;
      }

      // Check if task is overdue (past due date and not completed)
      if (task.dueDate) {
        const isDueDate = new Date(task.dueDate) < new Date();
        const isNotCompleted = task.taskStatus !== 'COMPLETED';

        if (isDueDate && isNotCompleted) {
          // Set status to OVERDUE - consistent with TeamDashboard
          await taskAPI.update(taskId, { taskStatus: 'OVERDUE' });
          
          toast({
            title: "Task Marked as Overdue",
            description: "This task has passed its deadline and has been marked as overdue.",
            variant: "destructive"
          });
          
          // Refresh data
          await loadData();
          return;
        }
      }

      // Normal update flow
      await taskAPI.update(taskId, { taskStatus: newStatus });
      
      // Refresh all data
      await loadData();
      
      toast({
        title: "Status Updated",
        description: "Task status has been updated successfully."
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update task status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getProjectStats = () => {
    // Use the same task filtering approach as TeamDashboard
    const totalTasks = filteredTasks.length;
    const toDoTasks = filterTasksByCategory(filteredTasks, 'to-do').length;
    const completedTasks = filterTasksByCategory(filteredTasks, 'completed').length;
    const inProgressTasks = filterTasksByCategory(filteredTasks, 'in-progress').length;
    const overdueTasks = filterTasksByCategory(filteredTasks, 'overdue').length;
    const dueTodayTasks = filterTasksByCategory(filteredTasks, 'due-today').length;
    const cancelledTasks = filterTasksByCategory(filteredTasks, 'cancelled').length;

    return { 
      totalTasks, 
      toDoTasks,
      completedTasks, 
      inProgressTasks, 
      overdueTasks,
      dueTodayTasks,
      cancelledTasks
    };
  };

  const stats = getProjectStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary/70">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Tasks</h1>
              <p className="text-secondary/70 mt-1">Manage and track your tasks across all projects</p>
            </div>
            
            <div className="flex items-center space-x-2 mt-4 lg:mt-0">
              {canCreateTasks && (
                <Button 
                  onClick={() => setShowTaskForm(true)}
                  className="bg-primary hover:bg-secondary text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="border-accent/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary/60 w-4 h-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="to-do">To Do</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.projectId || project.id} value={project.projectId || project.id}>
                        {project.projectName || project.name || project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <TaskList tasks={filteredTasks} onUpdate={loadData} user={user} />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.totalTasks}</p>
                  <p className="text-xs text-secondary/70">Total Tasks</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</p>
                  <p className="text-xs text-secondary/70">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
                  <p className="text-xs text-secondary/70">Overdue</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                  <p className="text-xs text-secondary/70">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.toDoTasks}</p>
                  <p className="text-xs text-secondary/70">To Do Tasks</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{stats.cancelledTasks}</p>
                  <p className="text-xs text-secondary/70">Cancelled Tasks</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Toggle */}
        <Tabs value={currentView} onValueChange={setCurrentView} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="kanban" className="flex items-center space-x-2">
                <LayoutGrid className="w-4 h-4" />
                <span>Kanban Board</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center space-x-2">
                <List className="w-4 h-4" />
                <span>List View</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kanban" className="space-y-6">
            <KanbanBoard 
              tasks={filteredTasks}
              onTaskUpdate={handleTaskUpdate}
              onStatusChange={handleTaskStatusChange}
              projects={projects}
              canEdit={canEditTasks}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <TaskListView 
              tasks={filteredTasks}
              onTaskUpdate={handleTaskUpdate}
              projects={projects}
              canEdit={canCreateTasks}
            />
          </TabsContent>
        </Tabs>

        {/* Task Form Modal */}
        {showTaskForm && (
          <TaskForm
            onClose={() => setShowTaskForm(false)}
            onSuccess={() => {
              setShowTaskForm(false);
              loadData();
            }}
            projects={projects}
          />
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
