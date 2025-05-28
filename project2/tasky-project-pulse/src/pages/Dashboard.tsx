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
import TeamDashboard from './TeamDashboard';
import LeaderDashboard from './LeaderDashboard';
import AdminDashboard from './AdminDashboard';

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
  const [activeProject, setActiveProject] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [dueToday, setDueToday] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [history, setHistory] = useState([]);

  // Only show New Project and New Task buttons for PROJECT_LEADER or ADMIN
  const canCreateProjectOrTask = user && (user.roles.includes('ADMIN') || user.roles.includes('PROJECT_LEADER'));

  useEffect(() => {
    console.log('Dashboard user:', user);
    loadDashboardData();
    if (user) {
      // Fetch active project for user
      projectAPI.getActiveProjectForUser(user.id)
        .then(res => {
          setActiveProject(res);
        })
        .catch(err => {
          setActiveProject(null);
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
        });
      // Fetch tasks assigned to user
      taskAPI.search({ assignedTo_UserId: user.id })
        .then(tasks => {
          setMyTasks(tasks);
          const today = new Date().toISOString().slice(0, 10);
          setDueToday(tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) === today && t.taskStatus !== 'completed'));
          setUpcomingTasks(tasks.filter(t => t.dueDate && t.dueDate.slice(0, 10) > today && t.taskStatus !== 'completed'));
          setCompletedTasks(tasks.filter(t => t.taskStatus === 'completed'));
        })
        .catch(err => {
          setMyTasks([]);
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
        });
      // Fetch completed projects
      projectAPI.getCompletedProjectsForUser(user.id)
        .then(setHistory)
        .catch(err => {
          setHistory([]);
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
        });
    }
  }, [user]);

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

  if (!user) return null;
  if (user.roles.includes('ADMIN')) return <AdminDashboard />;
  if (user.roles.includes('PROJECT_LEADER')) return <LeaderDashboard />;
  if (user.roles.includes('TEAM_MEMBER')) return <TeamDashboard />;
  return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">No valid role assigned. Please contact admin.</p></div>;
};

export default Dashboard;
