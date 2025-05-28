import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { projectAPI, taskAPI } from '@/utils/api';

const TeamDashboard = () => {
  const { user } = useAuth();
  const [activeProject, setActiveProject] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [dueToday, setDueToday] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      projectAPI.getActiveProjectForUser(user.id)
        .then(setActiveProject)
        .catch(err => {
          setActiveProject(null);
          console.error('Active project fetch failed:', err);
        });
      taskAPI.search({ assignedTo_UserId: user.id })
        .then(tasks => {
          setMyTasks(tasks);
          const today = new Date().toISOString().slice(0, 10);
          setDueToday(tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) === today && t.taskStatus !== 'completed'));
          setUpcomingTasks(tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) > today && t.taskStatus !== 'completed'));
          setCompletedTasks(tasks.filter((t: any) => t.taskStatus === 'completed'));
        });
      projectAPI.getCompletedProjectsForUser(user.id)
        .then(setHistory)
        .catch(err => {
          setHistory([]);
          console.error('Completed projects fetch failed:', err);
        });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary">Team Member Dashboard</h2>
          <p className="text-secondary/70 mt-1">View assigned tasks and collaborate with your team</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">My Tasks</p>
                  <p className="text-2xl font-bold text-primary">{myTasks.length}</p>
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
                  <p className="text-sm font-medium text-secondary/70">Due Today</p>
                  <p className="text-2xl font-bold text-primary">{dueToday.length}</p>
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
                  <p className="text-sm font-medium text-secondary/70">Active Projects</p>
                  <p className="text-2xl font-bold text-primary">{activeProject ? 1 : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/20 mb-8">
          <CardHeader>
            <CardTitle className="text-primary">Active Project</CardTitle>
          </CardHeader>
          <CardContent>
            {activeProject ? (
              <div>
                <p className="font-semibold text-lg">{activeProject.projectName}</p>
                <p className="text-secondary/70 mb-2">{activeProject.description}</p>
                <p className="text-xs text-secondary/60 mb-2">Start: {activeProject.startDate} | End: {activeProject.endDate}</p>
                {activeProject.teamMembers && activeProject.teamMembers.length > 0 ? (
                  <div className="mb-2">
                    <p className="font-semibold text-sm text-primary">My Team:</p>
                    <ul className="flex flex-wrap gap-2 mt-1">
                      {activeProject.teamMembers.map((member: any) => (
                        <li key={member.userId} className="bg-accent/20 px-2 py-1 rounded text-xs text-secondary/80">
                          {member.username || member.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-secondary/50">No teammates listed.</p>
                )}
              </div>
            ) : (
              <p className="text-secondary/70">No active project assigned.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-primary">Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              {dueToday.length > 0 ? (
                <ul className="space-y-2">
                  {dueToday.map((task: any) => (
                    <li key={task.taskId || task.id} className="text-sm flex flex-col gap-1">
                      <span className="font-semibold">{task.taskName}</span>
                      <span className="text-xs text-secondary/70">Due: {task.dueDate ? task.dueDate.slice(0, 10) : 'N/A'}</span>
                      <span className="inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs w-fit">{task.taskStatus}</span>
                      <span>{task.description}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-secondary/70 flex flex-col items-center">
                  <span className="text-2xl">🎉</span>
                  <span>No tasks due today.</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-primary">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingTasks.map((task: any) => (
                    <li key={task.taskId || task.id} className="text-sm flex flex-col gap-1">
                      <span className="font-semibold">{task.taskName}</span>
                      <span className="text-xs text-secondary/70">Due: {task.dueDate ? task.dueDate.slice(0, 10) : 'N/A'}</span>
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs w-fit">{task.taskStatus}</span>
                      <span>{task.description}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-secondary/70 flex flex-col items-center">
                  <span className="text-2xl">🚀</span>
                  <span>No upcoming tasks.</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="text-primary">Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {completedTasks.length > 0 ? (
                <ul className="space-y-2">
                  {completedTasks.map((task: any) => (
                    <li key={task.taskId || task.id} className="text-sm flex flex-col gap-1 line-through text-secondary/60">
                      <span className="font-semibold">{task.taskName}</span>
                      <span className="text-xs">Completed: {task.completionDate ? task.completionDate.slice(0, 10) : 'N/A'}</span>
                      <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs w-fit">{task.taskStatus}</span>
                      <span>{task.description}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-secondary/70 flex flex-col items-center">
                  <span className="text-2xl">✅</span>
                  <span>No completed tasks yet.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-primary">Project History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <ul className="space-y-2">
                {history.map((project: any) => (
                  <li key={project.projectId} className="text-sm">
                    <span className="font-semibold">{project.projectName}</span> - {project.description} (Completed: {project.endDate})
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-secondary/70 flex flex-col items-center">
                <span className="text-2xl">📚</span>
                <span>No completed projects yet.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamDashboard;
