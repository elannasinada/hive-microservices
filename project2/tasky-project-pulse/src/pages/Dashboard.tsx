import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Users, CheckSquare, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { projectAPI, taskAPI, demoAPI } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ProjectForm from '@/components/ProjectForm';
import TaskForm from '@/components/TaskForm';
import ProjectList from '@/components/ProjectList';
import TaskList from '@/components/TaskList';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load demo data to get initial information
      const [projectsData, tasksData, teamData] = await Promise.all([
        projectAPI.search().catch(() => []),
        taskAPI.search().catch(() => []),
        demoAPI.getTeamMembers().catch(() => [])
      ]);

      setProjects(projectsData || []);
      setTasks(tasksData || []);
      
      // Calculate stats
      setStats({
        totalProjects: Array.isArray(projectsData) ? projectsData.length : 0,
        totalTasks: Array.isArray(tasksData) ? tasksData.length : 0,
        completedTasks: Array.isArray(tasksData) ? tasksData.filter((t: any) => t.status === 'completed').length : 0,
        teamMembers: Array.isArray(teamData) ? teamData.length : 0
      });

    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      let errorMsg = "Failed to load dashboard data";
      if (error && error.message) {
        errorMsg = error.message;
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    setShowProjectForm(false);
    loadDashboardData();
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary/70">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary">Dashboard</h2>
              <p className="text-secondary/70 mt-1">Manage your projects and tasks efficiently</p>
            </div>
            <Button
              onClick={() => setShowProjectForm(true)}
              className="bg-primary hover:bg-secondary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Total Projects</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Total Tasks</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Completed</p>
                  <p className="text-2xl font-bold text-primary">{stats.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Team Members</p>
                  <p className="text-2xl font-bold text-primary">{stats.teamMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="bg-accent/10">
              <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Projects
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Tasks
              </TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTaskForm(true)}
                className="border-accent/30 hover:bg-accent/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>

          <TabsContent value="projects" className="space-y-6">
            <ProjectList projects={projects} onUpdate={loadDashboardData} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskList tasks={tasks} onUpdate={loadDashboardData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showProjectForm && (
        <ProjectForm
          onClose={() => setShowProjectForm(false)}
          onSuccess={handleProjectCreated}
        />
      )}

      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onSuccess={handleTaskCreated}
          projects={projects}
        />
      )}
    </div>
  );
};

export default Dashboard;
