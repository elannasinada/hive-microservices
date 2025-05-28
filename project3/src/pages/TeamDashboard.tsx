
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CheckSquare, Calendar, Search, Clock, Star, MessageSquare, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { projectAPI, taskAPI } from '@/utils/api';

const TeamDashboard = () => {
  const { user } = useAuth();
  const [activeProject, setActiveProject] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [dueToday, setDueToday] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // Fetch active project
      projectAPI.getActiveProjectForUser(user.id)
        .then(project => {
          setActiveProject(project);
          if (project?.teamMembers) {
            setTeamMembers(project.teamMembers);
          }
        })
        .catch(err => {
          setActiveProject(null);
          console.error('Active project fetch failed:', err);
        });

      // Fetch tasks
      taskAPI.search({ assignedTo_UserId: user.id })
        .then(tasks => {
          setMyTasks(tasks);
          const today = new Date().toISOString().slice(0, 10);
          setDueToday(tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) === today && t.taskStatus !== 'completed'));
          setUpcomingTasks(tasks.filter((t: any) => t.dueDate && t.dueDate.slice(0, 10) > today && t.taskStatus !== 'completed'));
          setCompletedTasks(tasks.filter((t: any) => t.taskStatus === 'completed'));
        });

      // Fetch project history
      projectAPI.getCompletedProjectsForUser(user.id)
        .then(setHistory)
        .catch(err => {
          setHistory([]);
          console.error('Completed projects fetch failed:', err);
        });
    }
  }, [user]);

  const filteredTasks = myTasks.filter(task => {
    const matchesSearch = task.taskName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'due-today') return dueToday.includes(task) && matchesSearch;
    if (selectedFilter === 'upcoming') return upcomingTasks.includes(task) && matchesSearch;
    if (selectedFilter === 'completed') return completedTasks.includes(task) && matchesSearch;
    
    return matchesSearch;
  });

  const getTaskPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'to_do': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="border-accent/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-primary line-clamp-2">{task.taskName}</h3>
          <Badge className={`text-xs ${getTaskPriorityColor(task.priority)} ml-2`}>
            {task.priority || 'Medium'}
          </Badge>
        </div>
        
        <p className="text-sm text-secondary/70 mb-3 line-clamp-2">{task.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <Badge className={getStatusColor(task.taskStatus)}>
            {task.taskStatus?.replace('_', ' ') || 'To Do'}
          </Badge>
          <div className="flex items-center text-xs text-secondary/60">
            <Calendar className="w-3 h-3 mr-1" />
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-secondary/60" />
            <span className="text-xs text-secondary/60">3 comments</span>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TeamMemberCard = ({ member }: { member: any }) => (
    <Card className="border-accent/20 hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 text-center">
        <Avatar className="w-16 h-16 mx-auto mb-3">
          <AvatarImage src={member.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {(member.username || member.email)?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <h3 className="font-semibold text-primary mb-1">{member.username || member.email}</h3>
        <Badge variant="outline" className="text-xs mb-2">
          {member.role || 'Team Member'}
        </Badge>
        
        <div className="flex items-center justify-center space-x-1 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-secondary/60">Available</span>
        </div>
        
        <p className="text-xs text-secondary/60">2 active tasks</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-primary">Team Dashboard</h2>
              <p className="text-secondary/70 mt-1">Manage your tasks and collaborate with your team</p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary/60 w-4 h-4" />
                <Input
                  placeholder="Search tasks and projects..."
                  className="pl-10 w-full sm:w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select
                className="px-3 py-2 border border-accent/20 rounded-md text-sm bg-background"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Tasks</option>
                <option value="due-today">Due Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-md transition-shadow bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Today's Tasks</p>
                  <p className="text-2xl font-bold text-primary">{dueToday.length}</p>
                  <p className="text-xs text-secondary/60">of {myTasks.length} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow bg-gradient-to-br from-accent/20 to-accent/30">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-accent/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Upcoming</p>
                  <p className="text-2xl font-bold text-primary">{upcomingTasks.length}</p>
                  <p className="text-xs text-secondary/60">next 7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Completed</p>
                  <p className="text-2xl font-bold text-primary">{completedTasks.length}</p>
                  <p className="text-xs text-secondary/60">this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Team Size</p>
                  <p className="text-2xl font-bold text-primary">{teamMembers.length}</p>
                  <p className="text-xs text-secondary/60">active members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-96">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Active Project Overview */}
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Active Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeProject ? (
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-primary mb-2">{activeProject.projectName}</h3>
                        <p className="text-secondary/70 mb-3">{activeProject.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-secondary/60">
                          <span>Start: {activeProject.startDate}</span>
                          <span>•</span>
                          <span>End: {activeProject.endDate}</span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-secondary/70">Project Progress</span>
                        <span className="text-sm text-primary font-semibold">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>

                    {teamMembers.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-primary mb-3">Team Members ({teamMembers.length})</h4>
                        <div className="flex -space-x-2">
                          {teamMembers.slice(0, 6).map((member: any, index: number) => (
                            <Avatar key={index} className="w-8 h-8 border-2 border-background">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(member.username || member.email)?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {teamMembers.length > 6 && (
                            <div className="w-8 h-8 bg-accent/30 rounded-full border-2 border-background flex items-center justify-center text-xs text-secondary">
                              +{teamMembers.length - 6}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
                    <p className="text-secondary/70">No active project assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Task Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-primary text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-red-500" />
                    Due Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dueToday.length > 0 ? (
                    <div className="space-y-3">
                      {dueToday.slice(0, 3).map((task: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <span className="text-sm font-medium truncate">{task.taskName}</span>
                          <Badge className="bg-red-100 text-red-800 text-xs">Urgent</Badge>
                        </div>
                      ))}
                      {dueToday.length > 3 && (
                        <p className="text-xs text-secondary/60 text-center">+{dueToday.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-2xl">🎉</span>
                      <p className="text-sm text-secondary/60 mt-1">All caught up!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-primary text-lg flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingTasks.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingTasks.slice(0, 3).map((task: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium truncate">{task.taskName}</span>
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Active</Badge>
                        </div>
                      ))}
                      {upcomingTasks.length > 3 && (
                        <p className="text-xs text-secondary/60 text-center">+{upcomingTasks.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-2xl">📋</span>
                      <p className="text-sm text-secondary/60 mt-1">No active tasks</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-primary text-lg flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2 text-green-500" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedTasks.length > 0 ? (
                    <div className="space-y-3">
                      {completedTasks.slice(0, 3).map((task: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium truncate line-through text-secondary/60">{task.taskName}</span>
                          <Badge className="bg-green-100 text-green-800 text-xs">Done</Badge>
                        </div>
                      ))}
                      {completedTasks.length > 3 && (
                        <p className="text-xs text-secondary/60 text-center">+{completedTasks.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-2xl">✅</span>
                      <p className="text-sm text-secondary/60 mt-1">No completed tasks</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-primary">My Tasks</CardTitle>
                <p className="text-secondary/70">Manage and track your assigned tasks</p>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task: any, index: number) => (
                      <TaskCard key={index} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckSquare className="w-16 h-16 text-secondary/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">No tasks found</h3>
                    <p className="text-secondary/60">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-primary">Team Members</CardTitle>
                <p className="text-secondary/70">Collaborate with your project team</p>
              </CardHeader>
              <CardContent>
                {teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {teamMembers.map((member: any, index: number) => (
                      <TeamMemberCard key={index} member={member} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-secondary/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">No team members</h3>
                    <p className="text-secondary/60">You haven't been assigned to a project team yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="text-primary">Project History</CardTitle>
                <p className="text-secondary/70">View your completed and past projects</p>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((project: any, index: number) => (
                      <Card key={index} className="border-accent/10 bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-primary mb-1">{project.projectName}</h3>
                              <p className="text-sm text-secondary/70 mb-2">{project.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-secondary/60">
                                <span>Completed: {project.endDate}</span>
                                <span>•</span>
                                <span>Duration: 3 months</span>
                              </div>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-secondary/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">No project history</h3>
                    <p className="text-secondary/60">Your completed projects will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamDashboard;
