import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { projectAPI } from '@/utils/api';
import ProjectForm from '@/components/ProjectForm';
import TaskForm from '@/components/TaskForm';
import ProjectList from '@/components/ProjectList';
import TaskList from '@/components/TaskList';
import { Button } from '@/components/ui/button';

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    if (user) {
      projectAPI.search().then(projects => {
        const leaderProjects = projects.filter((p: any) => p.leaderId === user.id);
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
      });
    }
  }, [user]);

  const handleProjectCreated = () => {
    setShowProjectForm(false);
    // Refresh projects
    projectAPI.search().then(projects => {
      const leaderProjects = projects.filter((p: any) => p.leaderId === user.id);
      setMyProjects(leaderProjects);
    });
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    // Refresh tasks
    projectAPI.search().then(projects => {
      const leaderProjects = projects.filter((p: any) => p.leaderId === user.id);
      let allTasks: any[] = [];
      leaderProjects.forEach((project: any) => {
        if (project.tasks) {
          allTasks = allTasks.concat(project.tasks);
        }
      });
      setTasks(allTasks);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary">Project Leader Dashboard</h2>
            <p className="text-secondary/70 mt-1">Lead your projects and track team performance</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setShowProjectForm(true)} className="bg-primary text-white">+ New Project</Button>
            <Button onClick={() => setShowTaskForm(true)} className="bg-secondary text-white">+ New Task</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">My Projects</p>
                  <p className="text-2xl font-bold text-primary">6</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Team Members</p>
                  <p className="text-2xl font-bold text-primary">32</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Progress</p>
                  <p className="text-2xl font-bold text-primary">74%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Milestones</p>
                  <p className="text-2xl font-bold text-primary">18</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-primary">Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectList projects={myProjects} onUpdate={handleProjectCreated} />
          </CardContent>
        </Card>
        <Card className="border-accent/20 mt-8">
          <CardHeader>
            <CardTitle className="text-primary">Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={tasks} onUpdate={handleTaskCreated} user={user} />
          </CardContent>
        </Card>
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
