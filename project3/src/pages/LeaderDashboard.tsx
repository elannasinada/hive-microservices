import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, Users, Calendar, Plus, FolderPlus, BarChart3, PieChart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { projectAPI, taskAPI } from '@/utils/api';
import ProjectForm from '@/components/ProjectForm';
import TaskForm from '@/components/TaskForm';
import ProjectList from '@/components/ProjectList';
import TaskList from '@/components/TaskList';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie } from 'recharts';

const LeaderDashboard = () => {
  console.log('LeaderDashboard mounted');
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalMembers: 0,
    activeProjects: 0,
    completedProjects: 0
  });
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0
  });
  const [projectTimeFilter, setProjectTimeFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    // Update task stats when project filter changes
    updateTaskStats(allTasks, selectedProjectId);
  }, [selectedProjectId, allTasks]);

  const loadData = async () => {
    try {
      const projects = await projectAPI.search();
      // Backend already filters projects for PROJECT_LEADERs, but double-check for safety
      const leaderProjects = projects.filter((p: any) => p.leaderId === user?.id);
      setMyProjects(leaderProjects);
      // Fetch tasks for all projects
      let allProjectTasks: any[] = [];
      
      await Promise.all(
        leaderProjects.map(async (project: any) => {
          try {
            const projectTasks = await taskAPI.search({ projectId: project.projectId });
            console.log('Fetched tasks for project', project.projectId, projectTasks);
            allProjectTasks = allProjectTasks.concat(projectTasks || []);
          } catch (error) {
            console.error(`Failed to fetch tasks for project ${project.projectId}:`, error);
          }
        })
      );
      
      setAllTasks(allProjectTasks);
      console.log('allTasks after loading:', allProjectTasks);
      
      // Calculate comprehensive statistics using getProjectStatus
      const uniqueMembers = new Set();
      let activeProjects = 0;
      let completedProjects = 0;
      
      leaderProjects.forEach((project: any) => {
        if (project.members && project.members.projectMembers) {
          project.members.projectMembers.forEach((member: any) => {
            uniqueMembers.add(member.userId);
          });
        }
        // Use getProjectStatus for status
        const status = getProjectStatus(project);
        if (status === 'active') activeProjects++;
        if (status === 'past') completedProjects++;
      });
        setStats({
        totalProjects: leaderProjects.length,
        totalMembers: uniqueMembers.size,
        activeProjects,
        completedProjects
      });
      
      // Calculate task statistics (filtered by selected project)
      updateTaskStats(allProjectTasks, selectedProjectId);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const updateTaskStats = (tasks: any[], projectId: string) => {
    const filteredTasks = projectId === 'all' ? tasks : tasks.filter(task => task.projectId === projectId);
    
    setTaskStats({
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter(task => task.status === 'completed').length,
      inProgressTasks: filteredTasks.filter(task => task.status === 'in_progress').length,
      todoTasks: filteredTasks.filter(task => task.status === 'to_do').length
    });
  };

  const handleProjectCreated = () => {
    setShowProjectForm(false);
    loadData();
  };

  const handleTaskCreated = () => {
    loadData();
  };

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

  // Filter projects by time filter
  const filteredMyProjects = myProjects.filter(project => {
    if (projectTimeFilter === 'all') return true;
    const status = getProjectStatus(project);
    if (projectTimeFilter === 'active') return status === 'active';
    if (projectTimeFilter === 'past') return status === 'past';
    if (projectTimeFilter === 'future') return status === 'future';
    return true;
  });

  console.log('Passing tasks to TaskList:', allTasks.filter(task => selectedProjectId === 'all' || task.projectId === selectedProjectId));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">          <div>
            <h2 className="text-3xl font-bold text-primary">Project Leader Dashboard</h2>
            <p className="text-secondary/70 mt-1">Manage your projects and track individual project progress</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowProjectForm(true)} 
              className="bg-primary hover:bg-secondary text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>        {/* Enhanced Statistics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Project Overview Chart */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Project Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Active Projects', value: stats.activeProjects, color: '#3B82F6' },
                        { name: 'Completed Projects', value: stats.completedProjects, color: '#10B981' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#10B981" />
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeProjects}</div>
                  <div className="text-sm text-blue-600">Active</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.completedProjects}</div>
                  <div className="text-sm text-green-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Statistics with Project Filter */}
          <Card className="border-accent/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Task Statistics
                </CardTitle>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {myProjects.map((project) => (
                      <SelectItem key={String(project.projectId)} value={String(project.projectId)}>
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'To Do', value: taskStats.todoTasks, color: '#6B7280' },
                    { name: 'In Progress', value: taskStats.inProgressTasks, color: '#F59E0B' },
                    { name: 'Completed', value: taskStats.completedTasks, color: '#10B981' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-600">{taskStats.todoTasks}</div>
                  <div className="text-xs text-gray-600">To Do</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="text-lg font-bold text-orange-600">{taskStats.inProgressTasks}</div>
                  <div className="text-xs text-orange-600">In Progress</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">{taskStats.completedTasks}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">Total Projects</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalProjects}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">Team Members</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalMembers}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">Active Projects</p>
                    <p className="text-2xl font-bold text-primary">{stats.activeProjects}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">Total Tasks</p>
                    <p className="text-2xl font-bold text-primary">{taskStats.totalTasks}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="border-accent/20 mb-8 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">              <CardTitle className="text-primary flex items-center">
                <Target className="w-5 h-5 mr-2" />
                My Projects - Individual Progress Tracking
              </CardTitle>
              <div className="flex items-center gap-4">
                <label htmlFor="project-time-filter" className="mr-2 font-medium text-secondary/80">Project Time:</label>
                <select
                  id="project-time-filter"
                  className="px-3 py-2 border border-accent/20 rounded-md text-sm bg-background"
                  value={projectTimeFilter}
                  onChange={e => setProjectTimeFilter(e.target.value)}
                >
                  <option value="all">All Projects</option>
                  <option value="active">Active Projects</option>
                  <option value="future">Future Projects</option>
                  <option value="past">Past Projects</option>
                </select>
                <Button
                  onClick={() => setShowProjectForm(true)}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProjectList projects={filteredMyProjects} onUpdate={handleProjectCreated} />
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card className="border-accent/20 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Task Management
              </CardTitle>
            </div>
          </CardHeader>          <CardContent>
            <TaskList tasks={allTasks.filter(task => selectedProjectId === 'all' || task.projectId === selectedProjectId)} onUpdate={handleTaskCreated} user={user} />
          </CardContent>
        </Card>

        {/* Modal Forms */}
        {showProjectForm && (
          <ProjectForm onClose={() => setShowProjectForm(false)} onSuccess={handleProjectCreated} />
        )}
      </div>
    </div>
  );
};

export default LeaderDashboard;
