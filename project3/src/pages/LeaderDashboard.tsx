
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Users, Calendar, Plus, FolderPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { projectAPI } from '@/utils/api';
import ProjectForm from '@/components/ProjectForm';
import TaskForm from '@/components/TaskForm';
import ProjectList from '@/components/ProjectList';
import TaskList from '@/components/TaskList';

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalMembers: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const projects = await projectAPI.search();
      const leaderProjects = projects.filter((p: any) => p.leaderId === user?.id);
      setMyProjects(leaderProjects);
      
      // Aggregate team members and tasks for all leader projects
      let allMembers: any[] = [];
      let allTasks: any[] = [];
      leaderProjects.forEach((project: any) => {
        if (project.members && project.members.projectMembers) {
          allMembers = allMembers.concat(project.members.projectMembers);
        }
        if (project.tasks) {
          allTasks = allTasks.concat(project.tasks);
        }
      });
      
      setTeamMembers(allMembers);
      setTasks(allTasks);
      
      // Calculate stats
      setStats({
        totalProjects: leaderProjects.length,
        totalMembers: allMembers.length,
        completedTasks: allTasks.filter(t => t.status === 'completed').length,
        pendingTasks: allTasks.filter(t => t.status !== 'completed').length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleProjectCreated = () => {
    setShowProjectForm(false);
    loadData();
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    loadData();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary">Project Leader Dashboard</h2>
            <p className="text-secondary/70 mt-1">Lead your projects and track team performance</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowProjectForm(true)} 
              className="bg-primary hover:bg-secondary text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button 
              onClick={() => setShowTaskForm(true)} 
              className="bg-accent hover:bg-accent/80 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">My Projects</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalProjects}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600 font-medium">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-accent/20 rounded-lg group-hover:bg-accent/30 transition-colors">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">Team Members</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalMembers}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600 font-medium">Assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">Completed</p>
                    <p className="text-2xl font-bold text-primary">{stats.completedTasks}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600 font-medium">Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary/70">Pending</p>
                    <p className="text-2xl font-bold text-primary">{stats.pendingTasks}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-600 font-medium">Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="border-accent/20 mb-8 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Project Overview
              </CardTitle>
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
          </CardHeader>
          <CardContent>
            <ProjectList projects={myProjects} onUpdate={handleProjectCreated} />
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
              <Button
                onClick={() => setShowTaskForm(true)}
                variant="outline"
                size="sm"
                className="border-accent text-accent hover:bg-accent hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TaskList tasks={tasks} onUpdate={handleTaskCreated} user={user} />
          </CardContent>
        </Card>

        {/* Modal Forms */}
        {showProjectForm && (
          <ProjectForm onClose={() => setShowProjectForm(false)} onSuccess={handleProjectCreated} />
        )}
        {showTaskForm && (
          <TaskForm onClose={() => setShowTaskForm(false)} onSuccess={handleTaskCreated} projects={myProjects} />
        )}
      </div>
    </div>
  );
};

export default LeaderDashboard;
