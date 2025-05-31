import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Users, Target, TrendingUp, Calendar, ListChecks, BarChart3 } from 'lucide-react';

interface AdminStatsProps {
    users: any[];
    projects: any[];
    tasks: any[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminStats: React.FC<AdminStatsProps> = ({ users, projects, tasks }) => {
    // Use realistic data for overview statistics to match charts
    const totalUsers = Math.min(users.length, 15); // Increased team size
    const activeUsers = Math.min(users.filter(user => user.active).length, 13);

    // Updated realistic project data for 5 project leaders
    const totalProjects = 24; // Current year total created (2 projects per leader)
    const completedProjects = 20; // Current year completed (good completion rate)
    const inProgressProjects = 3; // Few in progress
    const notStartedProjects = 1; // One not started

    // Use realistic task data
    const totalTasks = 120; // About 5 tasks per project (24 projects * 5)
    const completedTasks = 100; // ~83% completion rate

    const projectStatusData = [
        { name: 'Completed', value: completedProjects },
        { name: 'In Progress', value: inProgressProjects },
        { name: 'Not Started', value: notStartedProjects },
    ];

    // Realistic user role data for team with more project leaders
    const userRoleData = [
        { name: 'Admin', value: 1 },
        { name: 'Project Leader', value: 3 },
        { name: 'Team Member', value: 9 },
    ];

    const taskCompletionData = [
        { name: 'Completed', value: completedTasks },
        { name: 'Outstanding', value: totalTasks - completedTasks },
    ];

    // Updated function for monthly data (current year 2025)
    const getProjectsByMonth = () => {
        const monthsData = [];
        const currentDate = new Date();

        // More realistic monthly data for 2025 with 5 project leaders
        // About 2 projects created per month, 1-2 completed per month
        const monthlyCreated = [2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 1, 1]; // Total: 24 projects
        const monthlyCompleted = [1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 1]; // Total: 20 projects

        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

            monthsData.push({
                month: monthName,
                completed: monthlyCompleted[11 - i],
                created: monthlyCreated[11 - i]
            });
        }
        return monthsData;
    };

    // Updated function for yearly data (2021-2025)
    const getProjectsByYear = () => {
        const yearsData = [
            { year: '2021', created: 18, completed: 15 },
            { year: '2022', created: 20, completed: 18 },
            { year: '2023', created: 22, completed: 20 },
            { year: '2024', created: 26, completed: 24 },
            { year: '2025', created: 24, completed: 20 }
        ];

        return yearsData;
    };

    const projectsByMonthData = getProjectsByMonth();
    const projectsByYearData = getProjectsByYear();

    // Debug: log the updated data
    console.log('AdminStats - Updated projectsByMonthData:', projectsByMonthData);
    console.log('AdminStats - Updated projectsByYearData:', projectsByYearData);

    // Updated performance statistics based on new data
    const departmentPerformance = {
        completionRate: Math.round((completedProjects / totalProjects) * 100), // 80%
        avgTasksPerProject: Math.round(totalTasks / totalProjects), // 5 tasks per project
        activeProjectsRatio: Math.round((inProgressProjects / totalProjects) * 100), // ~13%
    };

    // Task status data with realistic distribution
    const getTaskStatusData = () => {
        if (tasks.length === 0) {
            // Realistic fake data based on 120 total tasks
            return [
                { status: 'Terminées', count: 100 }, // ~83% completed
                { status: 'En Cours', count: 15 },   // 12% in progress
                { status: 'Annulées', count: 4 },  // 3% pending
                { status: 'En Retard', count: 1 }  // 1% in review
            ];
        }

        const statusCounts = tasks.reduce((acc: any, task: any) => {
            const status = task.taskStatus || 'PENDING';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(statusCounts).map(([status, count]) => ({
            status: status === 'COMPLETED' ? 'Terminées' :
                status === 'IN_PROGRESS' ? 'En Cours' :
                    status === 'PENDING' ? 'En Attente' :
                        status === 'REVIEW' ? 'En Révision' : status,
            count: count as number
        }));
    };

    // User workload data with realistic distribution
    const getUserWorkloadData = () => {
        if (users.length === 0 || tasks.length === 0) {
            // Realistic fake data for 8 team members with varied workloads
            return [
                { name: 'Alice Martin', completed: 12, active: 2, total: 14 },
                { name: 'Bob Dupont', completed: 8, active: 1, total: 9 },
                { name: 'Claire Moreau', completed: 15, active: 3, total: 18 },
                { name: 'David Leroy', completed: 6, active: 1, total: 7 },
                { name: 'Emma Bernard', completed: 10, active: 2, total: 12 },
                { name: 'François Petit', completed: 9, active: 1, total: 10 },
                { name: 'Gabrielle Roux', completed: 5, active: 0, total: 5 },
                { name: 'Henri Blanc', completed: 7, active: 1, total: 8 }
            ];
        }

        const userWorkload = users.map(user => {
            const userTasks = tasks.filter(task => task.assignedUserId === user.userId);
            const completedTasks = userTasks.filter(task => task.taskStatus === 'COMPLETED').length;
            const activeTasks = userTasks.filter(task => task.taskStatus === 'IN_PROGRESS').length;

            return {
                name: user.actualUsername || user.username || 'Utilisateur',
                completed: completedTasks,
                active: activeTasks,
                total: userTasks.length
            };
        }).filter(user => user.total > 0);

        return userWorkload.slice(0, 10);
    };

    const taskStatusData = getTaskStatusData();
    const userWorkloadData = getUserWorkloadData();

    return (
        <div className="space-y-6">
            {/* Project trend charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Projects by month */}
                <Card className="border-accent/20">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Projets par Mois (12 derniers mois)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={projectsByMonthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis allowDecimals={false}/>
                                    <Tooltip
                                        formatter={(value, name) => [`${value}`, name]}
                                        labelFormatter={(label) => `Mois: ${label}`}
                                        contentStyle={{
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="completed"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                                        name="Projets Terminés"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="created"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                        name="Projets Créés"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects by year */}
                <Card className="border-accent/20">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Projets par Année (5 dernières années)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={projectsByYearData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value, name) => [`${value}`, name]}
                                        labelFormatter={(label) => `Année: ${label}`}
                                        contentStyle={{
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="completed"
                                        stroke="#22c55e"
                                        strokeWidth={3}
                                        strokeDasharray="8 8"
                                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 6 }}
                                        name="Projets Terminés"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="created"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        strokeDasharray="8 8"
                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                                        name="Projets Créés"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task distribution by status */}
                <Card className="border-accent/20">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center">
                            <ListChecks className="w-5 h-5 mr-2" />
                            Répartition des Tâches par Statut (2025)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={taskStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ status, count, percent }) =>
                                            `${status}: ${count} (${(percent * 100).toFixed(1)}%)`
                                        }
                                        outerRadius={90}
                                        innerRadius={40}
                                        fill="#8884d8"
                                        dataKey="count"
                                        stroke="#fff"
                                        strokeWidth={2}
                                    >
                                        {taskStatusData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value} tâches`, name]}
                                        contentStyle={{
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution des Rôles des Utilisateurs */}
                <Card className="border-accent/20">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            Distribution des Rôles des Utilisateurs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userRoleData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => [`${value} utilisateurs`, 'Nombre']}
                                        labelFormatter={(label) => `Rôle: ${label}`}
                                        contentStyle={{
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#8884d8"
                                        radius={[4, 4, 0, 0]}
                                        stroke="#6366f1"
                                        strokeWidth={1}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Key Metrics Cards */}
            <Card className="border-accent/20">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Statistiques Principales (2025)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-accent/20">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-secondary/70">Total Users</p>
                                        {/*<p className="text-2xl font-bold text-primary">{totalUsers}</p>*/}
                                        <p className="text-2xl font-bold text-primary">9</p>

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
                                        {/*<p className="text-2xl font-bold text-primary">{activeUsers}</p>*/}
                                        <p className="text-2xl font-bold text-primary">9</p>

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