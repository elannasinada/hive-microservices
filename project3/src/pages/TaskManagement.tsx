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

const TaskManagement = () => {
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

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load projects based on user role
      let projectsData = [];
      if (user.roles.includes('ADMIN')) {
        projectsData = await projectAPI.search();
      } else if (user.roles.includes('PROJECT_LEADER')) {
        projectsData = await projectAPI.search();
        projectsData = projectsData.filter((p: any) => p.leaderId === user.id);
      } else {
        // Team member - get active project
        try {
          const activeProject = await projectAPI.getActiveProjectForUser(user.id);
          projectsData = activeProject ? [activeProject] : [];
        } catch (error) {
          projectsData = [];
        }
      }
      
      setProjects(projectsData);

      // Load tasks
      let tasksData = [];
      if (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER')) {
        tasksData = await taskAPI.search({});
      } else {
        tasksData = await taskAPI.search({ assignedTo_UserId: user.id });
      }
      
      setTasks(tasksData);
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

  // Helper function to check if a task is overdue
  const isTaskOverdue = (task: any) => {
    if (!task.dueDate) return false;
    const isDueDate = new Date(task.dueDate) < new Date();
    const status = task.status?.toLowerCase() || '';
    const isNotCompleted = status !== 'completed' && 
                          status !== 'complete' && 
                          status !== 'completed_task';
    return isDueDate && isNotCompleted;
  };

  // Helper function to map the current status display values
  const getDisplayStatus = (status: string | undefined, dueDate: string | undefined) => {
    // If status is undefined, return a default
    if (!status) return 'In Progress';
    
    // Check if the task is overdue (past due date and not completed)
    if (dueDate) {
      const isDueDate = new Date(dueDate) < new Date();
      const lowercaseStatus = status.toLowerCase();
      const isNotCompleted = lowercaseStatus !== 'completed' && 
                            lowercaseStatus !== 'complete' && 
                            lowercaseStatus !== 'completed_task';
      
      if (isDueDate && isNotCompleted) {
        return 'Overdue';
      }
    }
    
    // Format the status for display
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        filtered = filtered.filter(task => isTaskOverdue(task));
      } else if (statusFilter === 'in-progress') {
        // Filter by in-progress status (both in-progress and in_progress) and not overdue
        filtered = filtered.filter(task => 
          (task.status === 'in-progress' || task.status === 'in_progress') && 
          !isTaskOverdue(task)
        );
      } else {
        filtered = filtered.filter(task => task.status === statusFilter);
      }
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.projectId === projectFilter);
    }

    setFilteredTasks(filtered);
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
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await handleTaskUpdate(taskId, { status: newStatus });
    }
  };
  const getProjectStats = () => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;
    const overdueTasks = filteredTasks.filter(t => isTaskOverdue(t)).length;

    return { totalTasks, completedTasks, inProgressTasks, overdueTasks };
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            </Card>            <Card className="border-accent/20">
              <CardContent className="p-4">                <div className="text-center">
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
                  </SelectTrigger>                  <SelectContent>                    <SelectItem value="all">All Status</SelectItem>
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
                      <SelectItem key={project.id} value={project.id}>
                        {project.name || project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
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
              canEdit={canCreateTasks}
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
