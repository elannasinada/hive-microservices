import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings, BarChart3, Shield } from 'lucide-react';
import { apiRequest, projectAPI } from '@/utils/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest('/api/v1/admin/users');
        setUsers(data);
        const projectsData = await projectAPI.search();
        setProjects(projectsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleChangeLoading(userId);
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/role?role=${newRole}`, { method: 'PUT' });
      setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, roles: [{ role: newRole }] } : u));
    } catch {}
    setRoleChangeLoading(null);
  };

  const handleActivationToggle = async (userId: string, active: boolean) => {
    setActivationLoading(userId);
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/activate?active=${active ? 1 : 0}`, { method: 'PUT' });
      setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, active } : u));
    } catch {}
    setActivationLoading(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary">Admin Dashboard</h2>
          <p className="text-secondary/70 mt-1">Manage projects, users, and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Total Users</p>
                  <p className="text-2xl font-bold text-primary">142</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Active Projects</p>
                  <p className="text-2xl font-bold text-primary">24</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Completion Rate</p>
                  <p className="text-2xl font-bold text-primary">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Settings className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Pending Reviews</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-primary">Admin Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary/70">Project management and user administration tools will appear here.</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 mt-8">
          <CardHeader>
            <CardTitle className="text-primary">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading users...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">ID</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Username</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Active</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId} className="border-b border-accent/10">
                      <td>{user.userId}</td>
                      <td>{user.email}</td>
                      <td>{user.username}</td>
                      <td>{user.roles && user.roles.length > 0 ? user.roles.map((r: any) => r.role).join(', ') : '-'}</td>
                      <td>{user.active ? 'Yes' : 'No'}</td>
                      <td>
                        <button className="text-blue-500 mr-2" onClick={() => alert('Edit user (coming soon)')}>Edit</button>
                        <select
                          aria-label="Change user role"
                          value={user.roles && user.roles.length > 0 ? user.roles[0].role : ''}
                          onChange={e => handleRoleChange(user.userId, e.target.value)}
                          disabled={roleChangeLoading === user.userId}
                          className="border rounded px-1 py-0.5 text-xs"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="PROJECT_LEADER">PROJECT_LEADER</option>
                          <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                        </select>
                        <button
                          className={`ml-2 px-2 py-0.5 rounded ${user.active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}
                          onClick={() => handleActivationToggle(user.userId, !user.active)}
                          disabled={activationLoading === user.userId}
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="border-accent/20 mt-8">
          <CardHeader>
            <CardTitle className="text-primary">Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.map((project) => (
              <div key={project.projectId} className="mb-4">
                <p className="text-sm font-medium text-secondary/70">Project: {project.title}</p>
                <p className="text-secondary/70">Leader: {project.leader.username}</p>
                <p className="text-secondary/70">Status: {project.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
