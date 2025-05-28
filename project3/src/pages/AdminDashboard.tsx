
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Settings, BarChart3, Shield, Search, Filter, UserPlus } from 'lucide-react';
import { apiRequest, projectAPI } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching users...');
        const usersData = await apiRequest('/api/v1/admin/users');
        console.log('Users data received:', usersData);
        setUsers(usersData);
        setFilteredUsers(usersData);
        
        const projectsData = await projectAPI.search();
        setProjects(projectsData);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load data');
        // Try to provide more helpful error information
        if (err.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else if (err.status === 404) {
          setError('Admin endpoints not found. Please check API configuration.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Filter users based on search term and role filter
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user =>
        user.roles && user.roles.some((role: any) => 
          (typeof role === 'string' ? role : role.role)?.toLowerCase().includes(roleFilter.toLowerCase())
        )
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleChangeLoading(userId);
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/role?role=${newRole}`, { method: 'PUT' });
      setUsers((prev) => prev.map((u) => 
        u.userId === userId ? { ...u, roles: [{ role: newRole }] } : u
      ));
      toast({
        title: "Success!",
        description: "User role updated successfully."
      });
    } catch (error: any) {
      console.error('Failed to change role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
    setRoleChangeLoading(null);
  };

  const handleActivationToggle = async (userId: string, active: boolean) => {
    setActivationLoading(userId);
    try {
      await apiRequest(`/api/v1/admin/users/${userId}/activate?active=${active ? 1 : 0}`, { method: 'PUT' });
      setUsers((prev) => prev.map((u) => 
        u.userId === userId ? { ...u, active } : u
      ));
      toast({
        title: "Success!",
        description: `User ${active ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error: any) {
      console.error('Failed to toggle activation:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
    setActivationLoading(null);
  };

  const getUserRoleDisplay = (user: any) => {
    if (!user.roles || user.roles.length === 0) return 'No Role';
    return user.roles.map((r: any) => 
      typeof r === 'string' ? r : r.role
    ).join(', ');
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Inactive</span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary">Admin Dashboard</h2>
          <p className="text-secondary/70 mt-1">Manage projects, users, and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-accent/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary/70">Total Users</p>
                  <p className="text-2xl font-bold text-primary">{users.length}</p>
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
                  <p className="text-2xl font-bold text-primary">{projects.length}</p>
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
                  <p className="text-sm font-medium text-secondary/70">Active Users</p>
                  <p className="text-2xl font-bold text-primary">
                    {users.filter(u => u.active).length}
                  </p>
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
                  <p className="text-sm font-medium text-secondary/70">Admins</p>
                  <p className="text-2xl font-bold text-primary">
                    {users.filter(u => u.roles?.some((r: any) => 
                      (typeof r === 'string' ? r : r.role)?.includes('ADMIN')
                    )).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="border-accent/20 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Management
              </CardTitle>
              <Button
                onClick={() => toast({ title: "Feature Coming Soon", description: "User creation will be available soon." })}
                className="bg-primary hover:bg-secondary text-white"
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-secondary/60" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-accent/30 focus:border-primary"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-secondary/60" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-accent/30 rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="project_leader">Project Leader</option>
                  <option value="team_member">Team Member</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-secondary/70">Loading users...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">Error Loading Users</p>
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-accent/20">
                      <th className="text-left py-3 px-2 font-medium text-secondary">User ID</th>
                      <th className="text-left py-3 px-2 font-medium text-secondary">Username</th>
                      <th className="text-left py-3 px-2 font-medium text-secondary">Email</th>
                      <th className="text-left py-3 px-2 font-medium text-secondary">Role</th>
                      <th className="text-left py-3 px-2 font-medium text-secondary">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.userId} className="border-b border-accent/10 hover:bg-accent/5 transition-colors">
                        <td className="py-3 px-2 text-secondary/80">{user.userId}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2">
                              <span className="text-primary text-xs font-medium">
                                {user.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-primary">{user.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-secondary/80">{user.email}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {getUserRoleDisplay(user)}
                          </span>
                        </td>
                        <td className="py-3 px-2">{getStatusBadge(user.active)}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-2">
                            <select
                              aria-label="Change user role"
                              value={user.roles && user.roles.length > 0 ? 
                                (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].role) : ''}
                              onChange={e => handleRoleChange(user.userId, e.target.value)}
                              disabled={roleChangeLoading === user.userId}
                              className="border border-accent/30 rounded px-2 py-1 text-xs focus:border-primary focus:outline-none"
                            >
                              <option value="ROLE_ADMIN">Admin</option>
                              <option value="ROLE_PROJECT_LEADER">Project Leader</option>
                              <option value="ROLE_TEAM_MEMBER">Team Member</option>
                            </select>
                            <Button
                              onClick={() => handleActivationToggle(user.userId, !user.active)}
                              disabled={activationLoading === user.userId}
                              size="sm"
                              variant={user.active ? "destructive" : "default"}
                              className="text-xs"
                            >
                              {activationLoading === user.userId ? '...' : (user.active ? 'Deactivate' : 'Activate')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-accent mx-auto mb-2" />
                    <p className="text-secondary/70">
                      {searchTerm || roleFilter !== 'all' ? 'No users match your search criteria' : 'No users found'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Overview */}
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-primary">Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card key={project.projectId} className="border-accent/10">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-primary mb-1">{project.title}</h4>
                      <p className="text-sm text-secondary/70 mb-2">
                        Leader: {project.leader?.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-secondary/70">
                        Status: <span className="capitalize">{project.status}</span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-secondary/70">No projects available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
