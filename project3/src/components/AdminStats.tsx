import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Users, Target, TrendingUp, Calendar, ListChecks } from 'lucide-react';

interface AdminStatsProps {
    users: any[];
    projects: any[];
    tasks: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C'];

const AdminStats: React.FC<AdminStatsProps> = ({ users, projects, tasks }) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.active).length;
    const totalProjects = projects.length;
    const completedProjects = projects.filter(project => project.progress === 100).length;
    const inProgressProjects = projects.filter(project => project.progress > 0 && project.progress < 100).length;
    const notStartedProjects = projects.filter(project => project.progress === 0).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.taskStatus === 'COMPLETED').length;

    const projectStatusData = [
        { name: 'Completed', value: completedProjects },
        { name: 'In Progress', value: inProgressProjects },
        { name: 'Not Started', value: notStartedProjects },
    ];

    const userRoleData = [
        { name: 'Admin', value: users.filter(user => user.roles?.some((r: any) => (typeof r === 'string' ? r : r.role)?.includes('ADMIN'))).length },
        { name: 'Project Leader', value: users.filter(user => user.roles?.some((r: any) => (typeof r === 'string' ? r : r.role)?.includes('PROJECT_LEADER'))).length },
        { name: 'Team Member', value: users.filter(user => user.roles?.some((r: any) => (typeof r === 'string' ? r : r.role)?.includes('TEAM_MEMBER'))).length },
    ];

    const taskCompletionData = [
        { name: 'Completed', value: completedTasks },
        { name: 'Outstanding', value: totalTasks - completedTasks },
    ];

    return (
        <div className="space-y-6">
            <Card className="border-accent/20">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        System Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Project Status Pie Chart */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-secondary">Project Status Distribution</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={projectStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {projectStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Task Completion Pie Chart */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-secondary">Task Completion Overview</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={taskCompletionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {taskCompletionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* User Roles Bar Chart */}
                    <div className="space-y-4 mt-6">
                        <h3 className="text-lg font-semibold text-secondary">User Role Distribution</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userRoleData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <Card className="border-accent/20">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-secondary/70">Total Users</p>
                                        <p className="text-2xl font-bold text-primary">{totalUsers}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-accent/20">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Target className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-secondary/70">Active Users</p>
                                        <p className="text-2xl font-bold text-primary">{activeUsers}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-accent/20">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-secondary/70">Total Projects</p>
                                        <p className="text-2xl font-bold text-primary">{totalProjects}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-accent/20">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <ListChecks className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-secondary/70">Completed Tasks</p>
                                        <p className="text-2xl font-bold text-primary">{completedTasks}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminStats;
